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

    // Define window: past 14 days excluding today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 14);
    const end = new Date(today); // exclusive upper bound

    const [entries, predefined] = await Promise.all([
      db.moodEntry.findMany({
        where: { userId, createdAt: { gte: start, lt: end } },
        select: { id: true, createdAt: true, activityEntries: true },
        orderBy: { createdAt: 'asc' }
      }),
      db.predefinedActivity.findMany({ where: { isActive: true }, select: { name: true, dssComponent: true } })
    ]);

    const activityToComponent = new Map<string, string>();
    for (const p of predefined) activityToComponent.set(String(p.name).toLowerCase(), p.dssComponent);

    // Aggregate per day
    const dayToActivities = new Map<string, Map<string, { name: string; component: string; count: number }>>();

    for (const e of entries) {
      const dateKey = fmtDateKey(new Date(e.createdAt));
      if (!dayToActivities.has(dateKey)) dayToActivities.set(dateKey, new Map());
      const bucket = dayToActivities.get(dateKey)!;

      if (e.activityEntries) {
        try {
          const arr = typeof e.activityEntries === 'string' ? JSON.parse(e.activityEntries) : e.activityEntries;
          if (Array.isArray(arr)) {
            for (const a of arr) {
              const raw = a?.activity || a?.name;
              if (!raw) continue;
              const key = String(raw).toLowerCase();
              const comp = activityToComponent.get(key) || 'unknown';
              const existing = bucket.get(key) || { name: String(raw), component: comp, count: 0 };
              existing.count += 1;
              existing.component = comp; // ensure latest mapping
              bucket.set(key, existing);
            }
          }
        } catch {}
      }
    }

    // Build ordered list by date
    const out: Array<{ date: string; activities: Array<{ name: string; component: string; count: number }> }> = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const dk = fmtDateKey(cursor);
      const items = Array.from((dayToActivities.get(dk) || new Map()).values()).sort((a, b) => a.name.localeCompare(b.name));
      out.push({ date: dk, activities: items });
      cursor.setDate(cursor.getDate() + 1);
    }

    return NextResponse.json({ days: out });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


