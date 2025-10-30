import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateDSS } from '@/lib/dssCalculator';
import { calculateMoodComposite } from '@/lib/moodCompositeCalculator';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body?.userId || 'dummy-user';

    // Local midnight for today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all today's entries
    const todayEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
        createdAt: { gte: today, lt: tomorrow }
      },
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

    // DSS always uses local midnight like the chart
    const dssRes = await calculateDSS(userId, today);

    await prisma.dailyTracking.upsert({
      where: { userId_date: { userId, date: today } },
      update: {
        moodComposite: mcValue,
        dssScore: dssRes.dssScore,
        learningMomentum: dssRes.components.learningMomentum,
        recoveryIndex: dssRes.components.recoveryIndex,
        connectionScore: dssRes.components.connectionScore
      },
      create: {
        userId,
        date: today,
        moodComposite: mcValue,
        dssScore: dssRes.dssScore,
        learningMomentum: dssRes.components.learningMomentum,
        recoveryIndex: dssRes.components.recoveryIndex,
        connectionScore: dssRes.components.connectionScore
      }
    });

    return NextResponse.json({ success: true, data: { mc: mcValue, dss: dssRes } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to recalculate today' }, { status: 500 });
  }
}


