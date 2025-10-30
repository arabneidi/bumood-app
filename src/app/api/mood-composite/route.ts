export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { calculateMoodComposite, getMoodCompositeTrends, getCurrentTimeBucket } from '@/lib/moodCompositeCalculator';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const days = parseInt(searchParams.get('days') || '14'); // Dashboard MC uses 14-day window
    const calculateCurrent = searchParams.get('calculateCurrent') === 'true';

    // Get Mood Composite trends
    const trends = await getMoodCompositeTrends(userId, days);
    
    console.log('📊 Mood Composite API response:', {
      moodCompositesCount: trends.moodComposites.length,
      lastMC: trends.moodComposites[trends.moodComposites.length - 1],
      allMCs: trends.moodComposites
    });
    
    // If requested, get MC for current time - try cache first
    let currentMC: number | null = null;
    if (calculateCurrent) {
      // Try to get from cache first
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const cached = await db.dailyTracking.findUnique({
        where: {
          userId_date: {
            userId,
            date: today
          }
        }
      });

      if (cached && cached.moodComposite !== null) {
        // Use cached value
        currentMC = cached.moodComposite;
      } else {
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

        // Use only entries from the current time bucket
        const currentBucket = getCurrentTimeBucket();
        const bucketEntries = todayEntries.filter(e => e.timeBucket === currentBucket);
        if (bucketEntries.length > 0) {
          const avgValence = todayEntries.reduce((s, e) => s + e.valence, 0) / todayEntries.length;
          const avgEnergy = todayEntries.reduce((s, e) => s + e.energy, 0) / todayEntries.length;
          const avgFocus = todayEntries.reduce((s, e) => s + e.focus, 0) / todayEntries.length;
          const avgStress = todayEntries.reduce((s, e) => s + e.stress, 0) / todayEntries.length;

          const mcResult = await calculateMoodComposite(userId, avgValence, avgEnergy, avgFocus, avgStress, new Date());
          currentMC = mcResult.moodComposite;

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
        currentTimeBucket: getCurrentTimeBucket(),
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
