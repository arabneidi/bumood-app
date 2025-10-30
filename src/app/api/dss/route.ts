export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDSS, getDSSTrends, updateDSSForDay } from '@/lib/dssCalculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const date = searchParams.get('date');
    const days = parseInt(searchParams.get('days') || '30');

    if (date) {
      // Get DSS for specific date - try cache first
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const cached = await db.dailyTracking.findUnique({
        where: {
          userId_date: {
            userId,
            date: targetDate
          }
        }
      });

      if (cached && cached.dssScore !== null) {
        // Return cached DSS directly from database - no calculation needed
        return NextResponse.json({
          success: true,
          data: {
            dssScore: cached.dssScore,
            components: {
              learningMomentum: cached.learningMomentum || 0,
              recoveryIndex: cached.recoveryIndex || 0,
              connectionScore: cached.connectionScore || 0
            },
            zScores: {
              zLM: 0, // Not needed for cached value
              zRI: 0,
              zCN: 0
            },
            historicalData: {
              lmHistory: [],
              riHistory: [],
              cnHistory: []
            }
          }
        });
      }

      // Not cached - calculate (this should rarely happen if caching works)
      const dssResult = await calculateDSS(userId, targetDate);
      // Write-back cache so subsequent loads don't recalc after import
      try {
        await db.dailyTracking.upsert({
          where: { userId_date: { userId, date: targetDate } },
          update: {
            dssScore: dssResult.dssScore,
            learningMomentum: dssResult.components.learningMomentum,
            recoveryIndex: dssResult.components.recoveryIndex,
            connectionScore: dssResult.components.connectionScore
          },
          create: {
            userId,
            date: targetDate,
            dssScore: dssResult.dssScore,
            learningMomentum: dssResult.components.learningMomentum,
            recoveryIndex: dssResult.components.recoveryIndex,
            connectionScore: dssResult.components.connectionScore
          }
        });
      } catch (e) {
        console.log('⚠️ DSS write-back cache failed:', (e as Error).message);
      }
      return NextResponse.json({
        success: true,
        data: dssResult
      });
    } else {
      // Get DSS trends - use calculated DSS instead of stored values
      const trends = await getDSSTrends(userId, days);
      
      // Always recalculate current DSS for stats (do not use cached value)
      // Use EXACT same pattern as get-dss-today.ts
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDay = today.getDate();
      const currentDay = new Date(todayYear, todayMonth, todayDay);
      currentDay.setHours(0, 0, 0, 0);
      
      let currentDSS;
      // If there are no entries today (local), treat as no current DSS even if cache exists
      const tomorrow = new Date(currentDay);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const hasTodayEntries = await db.moodEntry.count({
        where: { userId, createdAt: { gte: currentDay, lt: tomorrow } }
      });

      const noCache = searchParams.get('noCache') === 'true';
      if (hasTodayEntries === 0) {
        currentDSS = null;
      } else {
        if (noCache) {
          // Always recalc for stats radar when noCache=true
          currentDSS = await calculateDSS(userId, currentDay);
        } else {
          // Prefer cached value if present to avoid recalculation on each refresh (dashboard)
          const cachedToday = await db.dailyTracking.findUnique({
            where: { userId_date: { userId, date: currentDay } }
          });
          if (cachedToday && cachedToday.dssScore != null) {
            // Recalculate only z-scores/historical for DSS Radar while keeping cached score/components
            const zcalc = await calculateDSS(userId, currentDay);
            currentDSS = {
              dssScore: cachedToday.dssScore,
              components: {
                learningMomentum: cachedToday.learningMomentum || 0,
                recoveryIndex: cachedToday.recoveryIndex || 0,
                connectionScore: cachedToday.connectionScore || 0
              },
              zScores: zcalc.zScores,
              historicalData: zcalc.historicalData
            } as any;
          } else {
          // Calculate and write-back cache for future reads
          currentDSS = await calculateDSS(userId, currentDay);
          try {
            await db.dailyTracking.upsert({
              where: { userId_date: { userId, date: currentDay } },
              update: {
                dssScore: currentDSS.dssScore,
                learningMomentum: currentDSS.components.learningMomentum,
                recoveryIndex: currentDSS.components.recoveryIndex,
                connectionScore: currentDSS.components.connectionScore
              },
              create: {
                userId,
                date: currentDay,
                dssScore: currentDSS.dssScore,
                learningMomentum: currentDSS.components.learningMomentum,
                recoveryIndex: currentDSS.components.recoveryIndex,
                connectionScore: currentDSS.components.connectionScore
              }
            });
          } catch (e) {
            console.log('⚠️ DSS write-back cache (today) failed:', (e as Error).message);
          }
        }
      }
      
      }
      
      return NextResponse.json({
        success: true,
        data: {
          ...trends,
          dssScore: currentDSS ? currentDSS.dssScore : null,
          currentDSS: currentDSS
        }
      });
    }
  } catch (error) {
    console.error('Error fetching DSS data:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch DSS data', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, deepworkMinutes, tasksCompleted, sleepHours, recoveryAction, positiveSocialTouchpoints } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const targetDate = date ? new Date(date) : new Date();
    
    // Update the daily tracking with new DSS component data
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const updatedTracking = await prisma.dailyTracking.upsert({
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      },
      update: {
        deepworkMinutes: deepworkMinutes || 0,
        tasksCompleted: tasksCompleted || 0,
        sleepHours: sleepHours || 0,
        recoveryAction: recoveryAction || false,
        positiveSocialTouchpoints: positiveSocialTouchpoints || 0
      },
      create: {
        userId,
        date: targetDate,
        deepworkMinutes: deepworkMinutes || 0,
        tasksCompleted: tasksCompleted || 0,
        sleepHours: sleepHours || 0,
        recoveryAction: recoveryAction || false,
        positiveSocialTouchpoints: positiveSocialTouchpoints || 0
      }
    });

    // Recalculate DSS scores
    await updateDSSForDay(userId, targetDate);

    // Get the updated DSS result
    const dssResult = await calculateDSS(userId, targetDate);

    return NextResponse.json({
      success: true,
      data: {
        tracking: updatedTracking,
        dss: dssResult
      }
    });
  } catch (error) {
    console.error('Error updating DSS data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update DSS data' },
      { status: 500 }
    );
  }
}
