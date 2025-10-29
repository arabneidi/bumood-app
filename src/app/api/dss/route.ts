export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { calculateDSS, getDSSTrends, updateDSSForDay } from '@/lib/dssCalculator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const date = searchParams.get('date');
    const days = parseInt(searchParams.get('days') || '30');

    if (date) {
      // Get DSS for specific date
      const targetDate = new Date(date);
      const dssResult = await calculateDSS(userId, targetDate);
      
      return NextResponse.json({
        success: true,
        data: dssResult
      });
    } else {
      // Get DSS trends - use calculated DSS instead of stored values
      const trends = await getDSSTrends(userId, days);
      
      // Calculate current DSS score using the new calculation method
      const currentDSS = await calculateDSS(userId, new Date());
      
      return NextResponse.json({
        success: true,
        data: {
          ...trends,
          dssScore: currentDSS.dssScore, // Use calculated z-score instead of stored raw score
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
