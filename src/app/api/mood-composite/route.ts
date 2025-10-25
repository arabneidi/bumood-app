import { NextRequest, NextResponse } from 'next/server';
import { calculateMoodComposite, getMoodCompositeTrends, getCurrentTimeBucket } from '@/lib/moodCompositeCalculator';

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
    
    // If requested, calculate MC for current time using latest mood values
    let currentMC = null;
    if (calculateCurrent && trends.moodComposites.length > 0) {
      // Get the most recent entry's mood values
      const { db } = require('@/lib/db');
      const latestEntry = await db.moodEntry.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      
      if (latestEntry) {
        const mcResult = await calculateMoodComposite(
          userId,
          latestEntry.valence,
          latestEntry.energy,
          latestEntry.focus,
          latestEntry.stress,
          new Date() // Current time
        );
        currentMC = mcResult.moodComposite;
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
