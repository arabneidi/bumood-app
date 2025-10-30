export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';

    // Get all mood entries for the user, ordered by date
    const moodEntries = await db.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        waterIntake: true
      }
    });

    // Helpers for stable local date keys
    const toLocalKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };
    const addDaysKey = (key: string, delta: number) => {
      const [yy, mm, dd] = key.split('-').map(Number);
      const nd = new Date(yy, (mm - 1), dd);
      nd.setDate(nd.getDate() + delta);
      nd.setHours(0, 0, 0, 0);
      return toLocalKey(nd);
    };

    // Calculate streaks using stable local-day keys
    let currentStreak = 0;
    let bestStreak = 0;

    if (moodEntries.length > 0) {
      // Build unique local-day keys
      const daySet = new Set<string>();
      for (const entry of moodEntries) {
        const d = new Date(entry.createdAt);
        d.setHours(0, 0, 0, 0);
        daySet.add(toLocalKey(d));
      }

      // Determine latest day with an entry
      const keys = Array.from(daySet.values()).sort();
      const latestKey = keys[keys.length - 1];

      // Start current streak from latest day if it's today or yesterday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = toLocalKey(today);
      const yesterdayKey = addDaysKey(todayKey, -1);
      const startKey = (latestKey === todayKey || latestKey === yesterdayKey) ? latestKey : '';

      if (startKey) {
        let k = startKey;
        while (daySet.has(k)) {
          currentStreak += 1;
          k = addDaysKey(k, -1);
        }
      } else {
        currentStreak = 0;
      }

      // Best streak across all days
      if (keys.length > 0) {
        let run = 1;
        bestStreak = 1;
        for (let i = 1; i < keys.length; i++) {
          const prev = keys[i - 1];
          const expected = addDaysKey(prev, 1);
          if (keys[i] === expected) {
            run += 1;
          } else {
            run = 1;
          }
          if (run > bestStreak) bestStreak = run;
        }
      }
    }
    
    // Calculate today's water intake
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = toLocalKey(today);
    const todayEntries = moodEntries.filter(entry => {
      const d = new Date(entry.createdAt);
      d.setHours(0, 0, 0, 0);
      return toLocalKey(d) === todayKey;
    });
    
    const waterIntakeToday = todayEntries.reduce((sum, entry) => {
      return sum + (entry.waterIntake || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        currentStreak,
        bestStreak,
        waterIntakeToday,
        totalEntries: moodEntries.length
      }
    });

  } catch (error: any) {
    console.error('Error calculating streak:', error);
    return NextResponse.json(
      { error: 'Failed to calculate streak', details: error?.message },
      { status: 500 }
    );
  }
}
