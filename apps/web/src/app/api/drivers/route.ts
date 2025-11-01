export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDrivers } from '@/lib/driversCalculator';

export async function GET(request: NextRequest) {
  try {
    // For now, use a dummy user ID - in production, get from auth
    const dummyUserId = 'dummy-user';
    
    // Fetch mood entries from the last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const moodEntries = await db.moodEntry.findMany({
      where: {
        userId: dummyUserId,
        createdAt: {
          gte: fourWeeksAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (moodEntries.length < 5) {
      return NextResponse.json({
        helpful: [],
        harmful: [],
        lastCalculated: new Date(),
        message: 'Not enough data for driver analysis (need at least 5 entries in last 4 weeks)'
      });
    }

    // Calculate drivers
    const driversAnalysis = await calculateDrivers(moodEntries);

    return NextResponse.json(driversAnalysis);
  } catch (error) {
    console.error('Error calculating drivers:', error);
    return NextResponse.json(
      { error: 'Failed to calculate drivers' },
      { status: 500 }
    );
  }
}
