export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDSS } from '@/lib/dssCalculator';
import { calculateMoodComposite } from '@/lib/moodCompositeCalculator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const days = parseInt(searchParams.get('days') || '7'); // Default to 7 days

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1)); // Include today (days - 1 days ago)
    startDate.setHours(0, 0, 0, 0); // Start of day
    
    const moodEntries = await db.moodEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📊 MC-DSS API - Date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalEntries: moodEntries.length,
      sampleEntry: moodEntries[0] ? { createdAt: moodEntries[0].createdAt, date: new Date(moodEntries[0].createdAt).toISOString() } : null
    });

    // Group entries by date (using local time, not UTC)
    const entriesByDate = moodEntries.reduce((acc, entry) => {
      const entryDate = new Date(entry.createdAt);
      // Get local date string (not ISO which is UTC)
      const year = entryDate.getFullYear();
      const month = String(entryDate.getMonth() + 1).padStart(2, '0');
      const day = String(entryDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, typeof moodEntries>);

    console.log('📊 MC-DSS API - Date groups:', {
      dates: Object.keys(entriesByDate),
      entriesPerDate: Object.entries(entriesByDate).map(([date, entries]) => ({ date, count: entries.length }))
    });

    // Calculate MC and DSS for each day (last 7 days)
    const trendData = [];
    const now = new Date(); // Current time for today's bucket
    
    // Sort dates from oldest to newest
    const sortedDates = Object.keys(entriesByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    for (const dateKey of sortedDates) {
      const entries = entriesByDate[dateKey];
      
      // Create date object from YYYY-MM-DD string in local timezone
      const [year, month, day] = dateKey.split('-').map(Number);
      const currentDay = new Date(year, month - 1, day);
      currentDay.setHours(0, 0, 0, 0);
      
      // Check if this is today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isToday = currentDay.getTime() === today.getTime();
      
      // Average all entries for this day (same as dashboard MC logic)
      const avgValence = entries.reduce((sum, e) => sum + e.valence, 0) / entries.length;
      const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / entries.length;
      const avgFocus = entries.reduce((sum, e) => sum + e.focus, 0) / entries.length;
      const avgStress = entries.reduce((sum, e) => sum + e.stress, 0) / entries.length;

      // For MC calculation - EXACTLY like dashboard:
      // Always use new Date() (current time) to determine the time bucket
      // This ensures the same bucket is used for historical data filtering
      const mcDate = now;
      
      const mcResult = await calculateMoodComposite(
        userId,
        avgValence,
        avgEnergy,
        avgFocus,
        avgStress,
        mcDate
      );

      // Calculate DSS for this day (use noon for DSS)
      const dssDate = new Date(year, month - 1, day, 12, 0, 0);
      const dssResult = await calculateDSS(userId, dssDate);

      trendData.push({
        date: dateKey,
        mc: mcResult.moodComposite,
        dss: dssResult.dssScore
      });
    }
    
    // Reverse to get newest first
    trendData.reverse();

    console.log('📊 MC-DSS Trends API response:', {
      totalDays: trendData.length,
      data: trendData
    });

    return NextResponse.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('❌ Error fetching MC-DSS trends:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch MC-DSS trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
