export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, clearProfile } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🧹 Starting clean slate for user:', userId, clearProfile ? '(including profile)' : '(preserving profile)');

    // Delete all mood entries
    const moodEntriesDeleted = await db.moodEntry.deleteMany({
      where: { userId }
    });
    console.log('✅ Deleted', moodEntriesDeleted.count, 'mood entries');

    // Delete all daily tracking data
    const dailyTrackingDeleted = await db.dailyTracking.deleteMany({
      where: { userId }
    });
    console.log('✅ Deleted', dailyTrackingDeleted.count, 'daily tracking entries');

    // Delete all goals
    const goalsDeleted = await db.goal.deleteMany({
      where: { userId }
    });
    console.log('✅ Deleted', goalsDeleted.count, 'goals');

    // Delete all achievements (this removes achieved badges)
    const achievementsDeleted = await db.achievement.deleteMany({
      where: { userId }
    });
    console.log('✅ Deleted', achievementsDeleted.count, 'achievements (achieved badges)');

    // Note: Some models may not exist in the current schema
    // We'll handle them gracefully by checking if they exist
    let aiActionsDeleted = { count: 0 };
    let aiPreferencesDeleted = { count: 0 };
    let aiSuggestionsDeleted = { count: 0 };
    let learnConnectionsDeleted = { count: 0 };

    try {
      // Try to delete AI actions if the model exists
      aiActionsDeleted = await db.aiAction.deleteMany({
        where: { userId }
      });
      console.log('✅ Deleted', aiActionsDeleted.count, 'AI actions');
    } catch (error) {
      console.log('⚠️  AI actions model not found, skipping');
    }

    try {
      // Try to delete AI preferences if the model exists
      aiPreferencesDeleted = await db.aiPreference.deleteMany({
        where: { userId }
      });
      console.log('✅ Deleted', aiPreferencesDeleted.count, 'AI preferences');
    } catch (error) {
      console.log('⚠️  AI preferences model not found, skipping');
    }

    try {
      // Try to delete AI suggestions if the model exists
      aiSuggestionsDeleted = await db.aiSuggestion.deleteMany({
        where: { userId }
      });
      console.log('✅ Deleted', aiSuggestionsDeleted.count, 'AI suggestions');
    } catch (error) {
      console.log('⚠️  AI suggestions model not found, skipping');
    }

    try {
      // Try to delete learn connections if the model exists
      learnConnectionsDeleted = await db.learnConnection.deleteMany({
        where: { userId }
      });
      console.log('✅ Deleted', learnConnectionsDeleted.count, 'learn connections');
    } catch (error) {
      console.log('⚠️  Learn connections model not found, skipping');
    }

    // Reset user data
    if (clearProfile) {
      // Clear all profile data except ID
      await db.user.update({
        where: { id: userId },
        data: {
          name: null,
          email: null,
          emailVerified: null,
          image: null,
          gender: null,
          age: null,
          height: null,
          weight: null,
          timezone: null,
          personality: null,
          universityLevel: null,
          fieldOfStudy: null,
          interests: null,
          quoteStyle: null,
          favoriteAuthors: null,
          favoriteWriters: null,
          favoriteSportsFigures: null,
          favoriteMusicians: null,
          favoriteArtists: null,
          favoriteMovies: null,
          favoritePhilosophers: null,
          customFavorites: null,
          recentActivities: null,
        }
      });
      console.log('✅ Cleared all user profile data');
    } else {
      // Reset user activity-related data while preserving profile info
      await db.user.update({
        where: { id: userId },
        data: {
          recentActivities: JSON.stringify([]),
          // Keep all profile fields: name, email, gender, age, height, weight, 
          // timezone, personality, universityLevel, fieldOfStudy, interests, 
          // quoteStyle, favoriteAuthors, favoriteWriters, favoriteSportsFigures, 
          // favoriteMusicians, favoriteArtists, favoriteMovies, favoritePhilosophers, 
          // customFavorites - these are preserved
        }
      });
      console.log('✅ Reset user activity data while preserving profile');
    }

    // Verify cleanup
    const remainingMoodEntries = await db.moodEntry.count({
      where: { userId }
    });
    const remainingDailyTracking = await db.dailyTracking.count({
      where: { userId }
    });
    const remainingGoals = await db.goal.count({
      where: { userId }
    });
    const remainingAchievements = await db.achievement.count({
      where: { userId }
    });

    const isClean = remainingMoodEntries === 0 && 
                   remainingDailyTracking === 0 && 
                   remainingGoals === 0 && 
                   remainingAchievements === 0;

    console.log('📊 Cleanup verification:');
    console.log('Mood entries remaining:', remainingMoodEntries);
    console.log('Daily tracking remaining:', remainingDailyTracking);
    console.log('Goals remaining:', remainingGoals);
    console.log('Achievements remaining:', remainingAchievements);

    return NextResponse.json({
      success: true,
      message: 'Clean slate completed successfully - all entries, goals, and achieved badges removed',
      data: {
        deleted: {
          moodEntries: moodEntriesDeleted.count,
          dailyTracking: dailyTrackingDeleted.count,
          goals: goalsDeleted.count,
          achievements: achievementsDeleted.count, // Achieved badges removed
          aiActions: aiActionsDeleted.count,
          aiPreferences: aiPreferencesDeleted.count,
          aiSuggestions: aiSuggestionsDeleted.count,
          learnConnections: learnConnectionsDeleted.count
        },
        verification: {
          isClean,
          remaining: {
            moodEntries: remainingMoodEntries,
            dailyTracking: remainingDailyTracking,
            goals: remainingGoals,
            achievements: remainingAchievements
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Error during clean slate:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform clean slate',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
