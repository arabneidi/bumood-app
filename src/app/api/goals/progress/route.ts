import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateDSS } from '@/lib/dssCalculator';
import { calculateMoodComposite } from '@/lib/moodCompositeCalculator';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Record daily per-goal progress increments
// Body: { userId: string, goalId: string, value: number, date?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, goalId, value, date } = body || {};

    if (!userId || !goalId || typeof value !== 'number') {
      return NextResponse.json({ success: false, error: 'Missing userId, goalId or value' }, { status: 400 });
    }

    const day = date ? new Date(date) : new Date();
    day.setHours(0, 0, 0, 0);

    const result = await prisma.goalProgressDaily.upsert({
      where: { goalId_date: { goalId, date: day } as any },
      update: { value },
      create: { userId, goalId, date: day, value }
    });

    // After updating daily goal progress, recalculate today's MC/DSS and update cache
    const tomorrow = new Date(day);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntries = await prisma.moodEntry.findMany({
      where: { userId, createdAt: { gte: day, lt: tomorrow } },
      orderBy: { createdAt: 'desc' }
    });

    let mcValue: number | null = null;
    if (todayEntries.length > 0) {
      const avgValence = todayEntries.reduce((s, e) => s + e.valence, 0) / todayEntries.length;
      const avgEnergy = todayEntries.reduce((s, e) => s + e.energy, 0) / todayEntries.length;
      const avgFocus = todayEntries.reduce((s, e) => s + e.focus, 0) / todayEntries.length;
      const avgStress = todayEntries.reduce((s, e) => s + e.stress, 0) / todayEntries.length;
      const mcRes = await calculateMoodComposite(userId, avgValence, avgEnergy, avgFocus, avgStress, new Date());
      mcValue = mcRes.moodComposite;
    }

    const dssRes = await calculateDSS(userId, day);

    await prisma.dailyTracking.upsert({
      where: { userId_date: { userId, date: day } },
      update: {
        moodComposite: mcValue,
        dssScore: dssRes.dssScore,
        learningMomentum: dssRes.components.learningMomentum,
        recoveryIndex: dssRes.components.recoveryIndex,
        connectionScore: dssRes.components.connectionScore
      },
      create: {
        userId,
        date: day,
        moodComposite: mcValue,
        dssScore: dssRes.dssScore,
        learningMomentum: dssRes.components.learningMomentum,
        recoveryIndex: dssRes.components.recoveryIndex,
        connectionScore: dssRes.components.connectionScore
      }
    });

    return NextResponse.json({ success: true, data: { progress: result, cache: { mc: mcValue, dss: dssRes } } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to record progress' }, { status: 500 });
  }
}

