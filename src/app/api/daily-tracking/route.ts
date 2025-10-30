export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function toLocalMidnight(d: Date) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const dateParam = searchParams.get('date');
    const date = toLocalMidnight(dateParam ? new Date(dateParam) : new Date());

    const row = await db.dailyTracking.findUnique({
      where: { userId_date: { userId, date } }
    });

    return NextResponse.json(row ?? null);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch DailyTracking' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: bodyUserId, date: bodyDate } = await request.json().catch(() => ({}));
    const { searchParams } = new URL(request.url);
    const userId = bodyUserId || searchParams.get('userId') || 'dummy-user';
    const dateParam = bodyDate || searchParams.get('date');
    const date = toLocalMidnight(dateParam ? new Date(dateParam) : new Date());

    const result = await db.dailyTracking.deleteMany({ where: { userId, date } });
    return NextResponse.json({ success: true, deleted: result.count, userId, date });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed to clear DailyTracking' }, { status: 500 });
  }
}

