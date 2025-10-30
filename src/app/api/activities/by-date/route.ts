export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function fmtDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const dateStr = searchParams.get('date'); // YYYY-MM-DD local
    if (!dateStr) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

    const [y, m, d] = dateStr.split('-').map(Number);
    const dayStart = new Date(y as number, (m as number) - 1, d as number, 0, 0, 0, 0);
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);

    // fetch entries spanning the day (use createdAt for coarse range), then filter by exactTime per activity
    const entries = await db.moodEntry.findMany({
      where: { userId, createdAt: { gte: dayStart, lt: nextDay } },
      select: { id: true, createdAt: true, activityEntries: true, timeBucket: true },
      orderBy: { createdAt: 'asc' }
    });

    const out: Array<{ name: string; hour: number | null; exactTime: string | null; timeBucket: string | null }> = [];
    for (const e of entries) {
      if (!e.activityEntries) continue;
      try {
        const arr = typeof e.activityEntries === 'string' ? JSON.parse(e.activityEntries) : e.activityEntries;
        if (Array.isArray(arr)) {
          for (const a of arr) {
            const effective = a?.exactTime ? new Date(a.exactTime) : new Date(e.createdAt);
            const key = fmtDateKey(effective);
            if (key !== dateStr) continue;
            out.push({ name: a?.activity || a?.name || 'unknown', hour: typeof a?.hour === 'number' ? a.hour : null, exactTime: a?.exactTime || null, timeBucket: e.timeBucket || null });
          }
        }
      } catch {}
    }

    out.sort((a, b) => String(a.exactTime || '').localeCompare(String(b.exactTime || '')) || (a.hour ?? -1) - (b.hour ?? -1) || a.name.localeCompare(b.name));
    return NextResponse.json({ date: dateStr, activities: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


