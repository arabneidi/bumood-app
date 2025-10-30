export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { calculateDSS } from '@/lib/dssCalculator';
import { calculateMoodComposite, getCurrentTimeBucket } from '@/lib/moodCompositeCalculator';

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
    
    // Pre-fetch all entries needed: requested range + 14 days historical context for calculations
    // This warms the database connection and ensures data is in memory
    const historicalStart = new Date(startDate);
    historicalStart.setDate(historicalStart.getDate() - 14);
    
    const [moodEntries] = await Promise.all([
      prisma.moodEntry.findMany({
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
      }),
      // Pre-fetch historical data that calculate functions will need (warm connection)
      prisma.moodEntry.findMany({
        where: {
          userId,
          createdAt: {
            gte: historicalStart,
            lt: startDate
          }
        },
        select: { id: true }, // Just fetch IDs to warm connection, not full data
        take: 1
      })
    ]);

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

    // Calculate MC and DSS for each day (last 7 days)
        const now = new Date();
        const currentBucket = getCurrentTimeBucket();
    
    // Build full list of local date keys from startDate..endDate (inclusive)
    const dateKeys: string[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, '0');
      const d = String(cursor.getDate()).padStart(2, '0');
      dateKeys.push(`${y}-${m}-${d}`);
      cursor.setDate(cursor.getDate() + 1);
    }

    // Calculate all days in parallel (MC and DSS for each day run in parallel)
    const trendDataPromises = dateKeys.map(async (dateKey) => {
      const entries = entriesByDate[dateKey] || [];
      
      // Create date object from YYYY-MM-DD string in local timezone
      const [year, month, day] = dateKey.split('-').map(Number);
      const currentDay = new Date(year, month - 1, day);
      currentDay.setHours(0, 0, 0, 0);

      // If no entries at all for this local day, return nulls so the chart shows no point
      if (entries.length === 0) {
        return { date: dateKey, mc: null, dss: null } as any;
      }
      
          // Filter entries to ONLY those that include at least one activity whose timeSlot prefix matches the current bucket
          const bucketEntries = entries.filter((e) => {
            if (!e?.activityEntries) return false;
            try {
              const arr = typeof (e as any).activityEntries === 'string' ? JSON.parse((e as any).activityEntries) : (e as any).activityEntries;
              if (!Array.isArray(arr)) return false;
              return arr.some((a: any) => {
                const ts = a?.timeSlot ? String(a.timeSlot) : '';
                // timeSlot example: "morning-7", "midday-12", etc.
                const bucket = ts.split('-')[0];
                return bucket === currentBucket;
              });
            } catch {
              return false;
            }
          });
          let mcValue: number | null = null;
          if (bucketEntries.length > 0) {
            // Average entries within the bucket
            const avgValence = bucketEntries.reduce((sum, e) => sum + e.valence, 0) / bucketEntries.length;
            const avgEnergy = bucketEntries.reduce((sum, e) => sum + e.energy, 0) / bucketEntries.length;
            const avgFocus = bucketEntries.reduce((sum, e) => sum + e.focus, 0) / bucketEntries.length;
            const avgStress = bucketEntries.reduce((sum, e) => sum + e.stress, 0) / bucketEntries.length;

            // For MC calculation: ensure the date passed is anchored in the SAME bucket on that day
            const mcDate = new Date(currentDay);
            if (currentBucket === 'morning') mcDate.setHours(8, 0, 0, 0);
            else if (currentBucket === 'midday') mcDate.setHours(13, 0, 0, 0);
            else if (currentBucket === 'evening') mcDate.setHours(19, 0, 0, 0);
            else mcDate.setHours(1, 0, 0, 0); // night

            const mcResult = await calculateMoodComposite(userId, avgValence, avgEnergy, avgFocus, avgStress, mcDate);
            mcValue = mcResult.moodComposite;
          }

          // DSS calculated only when there are entries for the day
          let dssScore: number | null = null;
          try {
            const dssResult = await calculateDSS(userId, currentDay);
            dssScore = dssResult?.dssScore ?? null;
          } catch (e) {
            console.error('DSS calc error for', dateKey, e);
          }
          
          return {
        date: dateKey,
            mc: mcValue,
        dss: dssScore
      };
    });

    const trendData = await Promise.all(trendDataPromises);
    trendData.reverse();

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
