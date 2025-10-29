export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { calculateMoodComposite, getMoodCompositeTrends, getCurrentTimeBucket } from '@/lib/moodCompositeCalculator';

export const dynamic = 'force-dynamic';

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
    
    // If requested, calculate MC for current time using averaged mood values from all entries today
    let currentMC = null;
    if (calculateCurrent && trends.moodComposites.length > 0) {
      const { db } = require('@/lib/db');
      
      // Get start and end of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get all entries from today
      const todayEntries = await db.moodEntry.findMany({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (todayEntries.length > 0) {
        // Average all entries from today
        const avgValence = todayEntries.reduce((sum, e) => sum + e.valence, 0) / todayEntries.length;
        const avgEnergy = todayEntries.reduce((sum, e) => sum + e.energy, 0) / todayEntries.length;
        const avgFocus = todayEntries.reduce((sum, e) => sum + e.focus, 0) / todayEntries.length;
        const avgStress = todayEntries.reduce((sum, e) => sum + e.stress, 0) / todayEntries.length;
        
        console.log(`🔵 Using ${todayEntries.length} entries from today, averaged values: V=${avgValence.toFixed(2)}, E=${avgEnergy.toFixed(2)}, F=${avgFocus.toFixed(2)}, S=${avgStress.toFixed(2)}`);
        
        const mcResult = await calculateMoodComposite(
          userId,
          avgValence,
          avgEnergy,
          avgFocus,
          avgStress,
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
