import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to record progress' }, { status: 500 });
  }
}

