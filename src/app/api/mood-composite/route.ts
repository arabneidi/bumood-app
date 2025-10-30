export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { calculateMoodComposite, getMoodCompositeTrends, getCurrentTimeBucket, getTimeBucket } from '@/lib/moodCompositeCalculator';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const days = parseInt(searchParams.get('days') || '14'); // Dashboard MC uses 14-day window
    const calculateCurrent = searchParams.get('calculateCurrent') === 'true';
    const currentHourParam = searchParams.get('currentHour');

    // Get Mood Composite trends
    const trends = await getMoodCompositeTrends(userId, days);
    
    // logs removed for cleanliness
    
    // If requested, get MC for current time - align bucket with client hour when provided
    let currentMC: number | null = null;
    if (calculateCurrent) {
      // ALWAYS recompute current MC (no cache) to keep parity with MC–DSS chart
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      {
        // Compute using CHART LOGIC and upsert cache
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayEntries = await db.moodEntry.findMany({
          where: {
            userId,
            createdAt: { gte: today, lt: tomorrow }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Use entries that have at least one activity whose timeSlot prefix matches the current time bucket.
        // Fallbacks: selectedTimeSlots prefix; finally timeBucket column if neither available.
        // Use explicit Date for time bucket (chart-style)
        let currentBucket = getTimeBucket(new Date());
        const bucketEntries = todayEntries.filter((e: any) => {
          // activityEntries first
          if (e?.activityEntries) {
            try {
              const arr = typeof e.activityEntries === 'string' ? JSON.parse(e.activityEntries) : e.activityEntries;
              if (Array.isArray(arr) && arr.some((a: any) => String(a?.timeSlot||'').split('-')[0] === currentBucket)) {
                return true;
              }
            } catch {}
          }
          // selectedTimeSlots next
          if (e?.selectedTimeSlots) {
            try {
              const slots = typeof e.selectedTimeSlots === 'string' ? JSON.parse(e.selectedTimeSlots) : e.selectedTimeSlots;
              if (Array.isArray(slots) && slots.some((ts: any) => String(ts||'').split('-')[0] === currentBucket)) {
                return true;
              }
            } catch {}
          }
          // fallback to timeBucket
          return e?.timeBucket === currentBucket;
        });
        if (bucketEntries.length > 0) {
          // Group by timeSlot (e.g., morning-7) within the bucket, compute per-slot MC, then average across slots
          const slotToEntries = new Map<string, any[]>();
          for (const e of bucketEntries as any[]) {
            try {
              const arr = typeof e.activityEntries === 'string' ? JSON.parse(e.activityEntries) : e.activityEntries;
              if (Array.isArray(arr)) {
                for (const a of arr) {
                  const ts: string = String(a?.timeSlot || '');
                  const bucket = ts.split('-')[0];
                  if (bucket !== currentBucket) continue;
                  if (!slotToEntries.has(ts)) slotToEntries.set(ts, []);
                  slotToEntries.get(ts)!.push(e);
                }
              }
            } catch {}
          }
          const slotKeys = Array.from(slotToEntries.keys());
          if (slotKeys.length > 0) {
            const perSlotMC: number[] = [];
            for (const ts of slotKeys) {
              const entriesInSlot = slotToEntries.get(ts)!;
              const avgValence = entriesInSlot.reduce((s: number, e: any) => s + e.valence, 0) / entriesInSlot.length;
              const avgEnergy = entriesInSlot.reduce((s: number, e: any) => s + e.energy, 0) / entriesInSlot.length;
              const avgFocus = entriesInSlot.reduce((s: number, e: any) => s + e.focus, 0) / entriesInSlot.length;
              const avgStress = entriesInSlot.reduce((s: number, e: any) => s + e.stress, 0) / entriesInSlot.length;
              const hourMatch = ts.match(/-(\d{1,2})$/);
              const slotHour = hourMatch ? parseInt(hourMatch[1]) : (currentBucket === 'morning' ? 8 : currentBucket === 'midday' ? 13 : currentBucket === 'evening' ? 19 : 1);
              const mcDate = new Date();
              mcDate.setHours(slotHour, 0, 0, 0);
              const mcResult = await calculateMoodComposite(userId, avgValence, avgEnergy, avgFocus, avgStress, mcDate);
              perSlotMC.push(mcResult.moodComposite);
            }
            currentMC = perSlotMC.reduce((s, v) => s + v, 0) / perSlotMC.length;
          } else {
            // Fallback to averaging entries when no explicit timeSlots exist
            const avgValence = bucketEntries.reduce((s: number, e: any) => s + e.valence, 0) / bucketEntries.length;
            const avgEnergy = bucketEntries.reduce((s: number, e: any) => s + e.energy, 0) / bucketEntries.length;
            const avgFocus = bucketEntries.reduce((s: number, e: any) => s + e.focus, 0) / bucketEntries.length;
            const avgStress = bucketEntries.reduce((s: number, e: any) => s + e.stress, 0) / bucketEntries.length;
            const mcDate = new Date();
            const fallbackHour = currentBucket === 'morning' ? 8 : currentBucket === 'midday' ? 13 : currentBucket === 'evening' ? 19 : 1;
            mcDate.setHours(fallbackHour, 0, 0, 0);
            const mcResult = await calculateMoodComposite(userId, avgValence, avgEnergy, avgFocus, avgStress, mcDate);
            currentMC = mcResult.moodComposite;
          }

          await db.dailyTracking.upsert({
            where: { userId_date: { userId, date: today } },
            update: { moodComposite: currentMC },
            create: { userId, date: today, moodComposite: currentMC }
          });
        } else {
          currentMC = null; // no data in current time bucket → N/A on dashboard
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        trends,
        currentTimeBucket: getTimeBucket(new Date()),
        currentMC
      }
    });
  } catch (error) {
    console.error('Error fetching Mood Composite data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Mood Composite data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, valence, energy, focus, stress, date } = body;

    if (!userId || valence === undefined || energy === undefined || focus === undefined || stress === undefined) {
      return NextResponse.json(
        { success: false, error: 'User ID and all mood values (valence, energy, focus, stress) are required' },
        { status: 400 }
      );
    }

    const targetDate = date ? new Date(date) : new Date();
    
    // Calculate Mood Composite
    const mcResult = await calculateMoodComposite(userId, valence, energy, focus, stress, targetDate);

    return NextResponse.json({
      success: true,
      data: mcResult
    });
  } catch (error) {
    console.error('Error calculating Mood Composite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate Mood Composite' },
      { status: 500 }
    );
  }
}
