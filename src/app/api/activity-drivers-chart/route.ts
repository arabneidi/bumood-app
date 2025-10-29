import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activity = searchParams.get('activity');
    const userId = searchParams.get('userId') || 'dummy-user';
    
    if (!activity) {
      return NextResponse.json(
        { error: 'Activity parameter is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching chart data for activity: ${activity}`);

    // Get mood entries from the last 30 days (full month)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const moodEntries = await db.moodEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${moodEntries.length} mood entries in last 30 days`);

    // Create chart data for each day
    const chartData = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Find entries for this date
      const dayEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
        return entryDate === dateString;
      });

      if (dayEntries.length > 0) {
        // Calculate average DSS and MC for the day
        const avgDSS = dayEntries.reduce((sum, entry) => {
          return sum + (entry.valence + entry.energy + entry.focus - entry.stress) / 4 * 10;
        }, 0) / dayEntries.length;

        const avgMC = dayEntries.reduce((sum, entry) => {
          return sum + (entry.valence + entry.energy + entry.focus - entry.stress) / 4 * 10;
        }, 0) / dayEntries.length;

        // Check if activity was present on this day
        const hasActivity = dayEntries.some(entry => {
          const activities = JSON.parse(entry.activities || '[]');
          return activities.includes(activity);
        });

        // Get the most recent entry's mood scores for the day
        const latestEntry = dayEntries[dayEntries.length - 1];

        chartData.push({
          date: dateString,
          dss: Math.max(0, Math.min(10, avgDSS)),
          mc: Math.max(0, Math.min(10, avgMC)),
          hasActivity,
          valence: latestEntry.valence,
          energy: latestEntry.energy,
          focus: latestEntry.focus,
          stress: latestEntry.stress
        });
      } else {
        // No entries for this day
        chartData.push({
          date: dateString,
          dss: 0,
          mc: 0,
          hasActivity: false,
          valence: 0,
          energy: 0,
          focus: 0,
          stress: 0
        });
      }
    }

    console.log(`📊 Generated chart data for ${activity}:`, {
      totalDays: chartData.length,
      daysWithActivity: chartData.filter(d => d.hasActivity).length,
      avgDSSWithActivity: chartData.filter(d => d.hasActivity).reduce((sum, d) => sum + d.dss, 0) / Math.max(1, chartData.filter(d => d.hasActivity).length),
      avgDSSWithoutActivity: chartData.filter(d => !d.hasActivity).reduce((sum, d) => sum + d.dss, 0) / Math.max(1, chartData.filter(d => !d.hasActivity).length)
    });

    return NextResponse.json({
      success: true,
      chartData,
      activity,
      period: {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: new Date().toISOString(),
        days: 30
      }
    });

  } catch (error) {
    console.error('❌ Error fetching activity chart data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity chart data' },
      { status: 500 }
    );
  }
}
