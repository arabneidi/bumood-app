import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';

    // Get all mood entries for the user, ordered by date
    const moodEntries = await db.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        waterIntake: true
      }
    });

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    
    if (moodEntries.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Group entries by date
      const entriesByDate = new Map<string, boolean>();
      moodEntries.forEach(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        entriesByDate.set(entryDate.toISOString(), true);
      });
      
      // Calculate current streak (consecutive days with at least 1 entry)
      let checkDate = new Date(today);
      while (entriesByDate.has(checkDate.toISOString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Calculate best streak
      const sortedDates = Array.from(entriesByDate.keys()).sort();
      let consecutiveDays = 1;
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) continue;
        const prevDate = new Date(sortedDates[i-1]);
        const currDate = new Date(sortedDates[i]);
        const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 1) {
          consecutiveDays++;
          bestStreak = Math.max(bestStreak, consecutiveDays);
        } else {
          consecutiveDays = 1;
        }
      }
      
      if (bestStreak === 0 && sortedDates.length > 0) {
        bestStreak = 1; // At least 1 entry means streak of 1
      }
    }
    
    // Calculate today's water intake
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
    
    const waterIntakeToday = todayEntries.reduce((sum, entry) => {
      return sum + (entry.waterIntake || 0);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        currentStreak,
        bestStreak,
        waterIntakeToday,
        totalEntries: moodEntries.length
      }
    });

  } catch (error: any) {
    console.error('Error calculating streak:', error);
    return NextResponse.json(
      { error: 'Failed to calculate streak', details: error?.message },
      { status: 500 }
    );
  }
}
