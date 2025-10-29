import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { 
      userData, 
      goals, 
      achievements, 
      periodTracking, 
      congratulations, 
      dailyTracking, 
      moodEntries 
    } = await request.json();
    
    const userId = 'dummy-user';
    const results = {
      user: 0,
      goals: 0,
      achievements: 0,
      periodTracking: 0,
      congratulations: 0,
      dailyTracking: 0,
      moodEntries: 0,
      errors: []
    };

    // Ensure user exists first
    if (userData) {
      try {
        await db.user.upsert({
          where: { id: userData.id || userId },
          update: {
            name: userData.name,
            email: userData.email,
            gender: userData.gender,
            age: userData.age ? Number(userData.age) : null,
            height: userData.height ? Number(userData.height) : null,
            weight: userData.weight ? Number(userData.weight) : null,
            personality: userData.personality,
            universityLevel: userData.universityLevel,
            fieldOfStudy: userData.fieldOfStudy,
            interests: userData.interests,
            favoriteWriters: userData.favoriteWriters,
            favoriteMovies: userData.favoriteMovies,
            favoritePhilosophers: userData.favoritePhilosophers,
            recentActivities: userData.recentActivities
          },
          create: {
            id: userData.id || userId,
            name: userData.name || 'Demo User',
            email: userData.email || 'demo@example.com',
            gender: userData.gender,
            age: userData.age ? Number(userData.age) : null,
            height: userData.height ? Number(userData.height) : null,
            weight: userData.weight ? Number(userData.weight) : null,
            personality: userData.personality,
            universityLevel: userData.universityLevel,
            fieldOfStudy: userData.fieldOfStudy,
            interests: userData.interests,
            favoriteWriters: userData.favoriteWriters,
            favoriteMovies: userData.favoriteMovies,
            favoritePhilosophers: userData.favoritePhilosophers,
            recentActivities: userData.recentActivities
          }
        });
        results.user = 1;
      } catch (error) {
        results.errors.push({ table: 'user', error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Import Goals
    if (goals && Array.isArray(goals)) {
      for (const goal of goals) {
        try {
          await db.goal.upsert({
            where: { id: goal.id },
            update: {
              title: goal.title,
              description: goal.description,
              targetValue: goal.targetValue ? Number(goal.targetValue) : null,
              currentValue: goal.currentValue ? Number(goal.currentValue) : 0,
              unit: goal.unit,
              category: goal.category,
              subcategory: goal.subcategory,
              difficulty: goal.difficulty,
              streak: goal.streak ? Number(goal.streak) : 0,
              bestStreak: goal.bestStreak ? Number(goal.bestStreak) : 0,
              completed: Boolean(goal.completed),
              completedAt: goal.completedAt ? new Date(Number(goal.completedAt) * 1000) : null,
              dssComponent: goal.dssComponent,
              createdAt: goal.createdAt ? new Date(Number(goal.createdAt) * 1000) : new Date(),
              updatedAt: goal.updatedAt ? new Date(Number(goal.updatedAt) * 1000) : new Date()
            },
            create: {
              id: goal.id,
              userId: goal.userId || userId,
              title: goal.title,
              description: goal.description,
              targetValue: goal.targetValue ? Number(goal.targetValue) : null,
              currentValue: goal.currentValue ? Number(goal.currentValue) : 0,
              unit: goal.unit,
              category: goal.category,
              subcategory: goal.subcategory,
              difficulty: goal.difficulty,
              streak: goal.streak ? Number(goal.streak) : 0,
              bestStreak: goal.bestStreak ? Number(goal.bestStreak) : 0,
              completed: Boolean(goal.completed),
              completedAt: goal.completedAt ? new Date(Number(goal.completedAt) * 1000) : null,
              dssComponent: goal.dssComponent,
              createdAt: goal.createdAt ? new Date(Number(goal.createdAt) * 1000) : new Date(),
              updatedAt: goal.updatedAt ? new Date(Number(goal.updatedAt) * 1000) : new Date()
            }
          });
          results.goals++;
        } catch (error) {
          results.errors.push({ table: 'goal', id: goal.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    // Import Achievements
    if (achievements && Array.isArray(achievements)) {
      for (const achievement of achievements) {
        try {
          await db.achievement.upsert({
            where: { id: achievement.id },
            update: {
              type: achievement.type,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              stars: achievement.stars ? Number(achievement.stars) : 1,
              unlockedAt: achievement.unlockedAt ? new Date(Number(achievement.unlockedAt) * 1000) : null,
              createdAt: achievement.createdAt ? new Date(Number(achievement.createdAt) * 1000) : new Date()
            },
            create: {
              id: achievement.id,
              userId: achievement.userId || userId,
              type: achievement.type,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              stars: achievement.stars ? Number(achievement.stars) : 1,
              unlockedAt: achievement.unlockedAt ? new Date(Number(achievement.unlockedAt) * 1000) : null,
              createdAt: achievement.createdAt ? new Date(Number(achievement.createdAt) * 1000) : new Date()
            }
          });
          results.achievements++;
        } catch (error) {
          results.errors.push({ table: 'achievement', id: achievement.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    // Import Period Tracking
    if (periodTracking && Array.isArray(periodTracking)) {
      for (const period of periodTracking) {
        try {
          await db.periodTracking.upsert({
            where: { id: period.id },
            update: {
              startDate: period.startDate ? new Date(Number(period.startDate) * 1000) : new Date(),
              endDate: period.endDate ? new Date(Number(period.endDate) * 1000) : null,
              flowIntensity: period.flowIntensity,
              symptoms: period.symptoms,
              notes: period.notes,
              createdAt: period.createdAt ? new Date(Number(period.createdAt) * 1000) : new Date(),
              updatedAt: period.updatedAt ? new Date(Number(period.updatedAt) * 1000) : new Date()
            },
            create: {
              id: period.id,
              userId: period.userId || userId,
              startDate: period.startDate ? new Date(Number(period.startDate) * 1000) : new Date(),
              endDate: period.endDate ? new Date(Number(period.endDate) * 1000) : null,
              flowIntensity: period.flowIntensity,
              symptoms: period.symptoms,
              notes: period.notes,
              createdAt: period.createdAt ? new Date(Number(period.createdAt) * 1000) : new Date(),
              updatedAt: period.updatedAt ? new Date(Number(period.updatedAt) * 1000) : new Date()
            }
          });
          results.periodTracking++;
        } catch (error) {
          results.errors.push({ table: 'periodTracking', id: period.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    // Import Congratulations
    if (congratulations && Array.isArray(congratulations)) {
      for (const congratulation of congratulations) {
        try {
          await db.congratulation.upsert({
            where: { id: congratulation.id },
            update: {
              type: congratulation.type,
              title: congratulation.title,
              message: congratulation.message,
              actionMessage: congratulation.actionMessage,
              icon: congratulation.icon,
              stars: congratulation.stars ? Number(congratulation.stars) : 1,
              isRead: Boolean(congratulation.isRead),
              createdAt: congratulation.createdAt ? new Date(Number(congratulation.createdAt) * 1000) : new Date()
            },
            create: {
              id: congratulation.id,
              userId: congratulation.userId || userId,
              type: congratulation.type,
              title: congratulation.title,
              message: congratulation.message,
              actionMessage: congratulation.actionMessage,
              icon: congratulation.icon,
              stars: congratulation.stars ? Number(congratulation.stars) : 1,
              isRead: Boolean(congratulation.isRead),
              createdAt: congratulation.createdAt ? new Date(Number(congratulation.createdAt) * 1000) : new Date()
            }
          });
          results.congratulations++;
        } catch (error) {
          results.errors.push({ table: 'congratulation', id: congratulation.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    // Import Daily Tracking
    if (dailyTracking) {
      try {
        await db.dailyTracking.upsert({
          where: { id: dailyTracking.id },
          update: {
            date: dailyTracking.date ? new Date(Number(dailyTracking.date) * 1000) : new Date(),
            waterIntake: dailyTracking.waterIntake ? Number(dailyTracking.waterIntake) : 0,
            mealsEaten: dailyTracking.mealsEaten ? Number(dailyTracking.mealsEaten) : 0,
            mealQuality: dailyTracking.mealQuality,
            caffeine: dailyTracking.caffeine ? Number(dailyTracking.caffeine) : 0,
            alcohol: dailyTracking.alcohol ? Number(dailyTracking.alcohol) : 0,
            exercise: Boolean(dailyTracking.exercise),
            exerciseType: dailyTracking.exerciseType,
            exerciseDuration: dailyTracking.exerciseDuration ? Number(dailyTracking.exerciseDuration) : 0,
            steps: dailyTracking.steps ? Number(dailyTracking.steps) : 0,
            socialInteraction: Boolean(dailyTracking.socialInteraction),
            screenTime: dailyTracking.screenTime ? Number(dailyTracking.screenTime) : 0,
            outdoorTime: dailyTracking.outdoorTime ? Number(dailyTracking.outdoorTime) : 0,
            meditation: Boolean(dailyTracking.meditation),
            meditationDuration: dailyTracking.meditationDuration ? Number(dailyTracking.meditationDuration) : 0,
            journaling: Boolean(dailyTracking.journaling),
            readingTime: dailyTracking.readingTime ? Number(dailyTracking.readingTime) : 0,
            medicationTaken: Boolean(dailyTracking.medicationTaken),
            supplements: dailyTracking.supplements,
            symptoms: dailyTracking.symptoms,
            deepworkMinutes: dailyTracking.deepworkMinutes ? Number(dailyTracking.deepworkMinutes) : 0,
            tasksCompleted: dailyTracking.tasksCompleted ? Number(dailyTracking.tasksCompleted) : 0,
            sleepHours: dailyTracking.sleepHours ? Number(dailyTracking.sleepHours) : 0,
            recoveryAction: Boolean(dailyTracking.recoveryAction),
            positiveSocialTouchpoints: dailyTracking.positiveSocialTouchpoints ? Number(dailyTracking.positiveSocialTouchpoints) : 0,
            dssScore: dailyTracking.dssScore ? Number(dailyTracking.dssScore) : 0,
            learningMomentum: dailyTracking.learningMomentum ? Number(dailyTracking.learningMomentum) : 0,
            recoveryIndex: dailyTracking.recoveryIndex ? Number(dailyTracking.recoveryIndex) : 0,
            connectionScore: dailyTracking.connectionScore ? Number(dailyTracking.connectionScore) : 0,
            notes: dailyTracking.notes,
            createdAt: dailyTracking.createdAt ? new Date(Number(dailyTracking.createdAt) * 1000) : new Date(),
            updatedAt: dailyTracking.updatedAt ? new Date(Number(dailyTracking.updatedAt) * 1000) : new Date()
          },
          create: {
            id: dailyTracking.id,
            userId: dailyTracking.userId || userId,
            date: dailyTracking.date ? new Date(Number(dailyTracking.date) * 1000) : new Date(),
            waterIntake: dailyTracking.waterIntake ? Number(dailyTracking.waterIntake) : 0,
            mealsEaten: dailyTracking.mealsEaten ? Number(dailyTracking.mealsEaten) : 0,
            mealQuality: dailyTracking.mealQuality,
            caffeine: dailyTracking.caffeine ? Number(dailyTracking.caffeine) : 0,
            alcohol: dailyTracking.alcohol ? Number(dailyTracking.alcohol) : 0,
            exercise: Boolean(dailyTracking.exercise),
            exerciseType: dailyTracking.exerciseType,
            exerciseDuration: dailyTracking.exerciseDuration ? Number(dailyTracking.exerciseDuration) : 0,
            steps: dailyTracking.steps ? Number(dailyTracking.steps) : 0,
            socialInteraction: Boolean(dailyTracking.socialInteraction),
            screenTime: dailyTracking.screenTime ? Number(dailyTracking.screenTime) : 0,
            outdoorTime: dailyTracking.outdoorTime ? Number(dailyTracking.outdoorTime) : 0,
            meditation: Boolean(dailyTracking.meditation),
            meditationDuration: dailyTracking.meditationDuration ? Number(dailyTracking.meditationDuration) : 0,
            journaling: Boolean(dailyTracking.journaling),
            readingTime: dailyTracking.readingTime ? Number(dailyTracking.readingTime) : 0,
            medicationTaken: Boolean(dailyTracking.medicationTaken),
            supplements: dailyTracking.supplements,
            symptoms: dailyTracking.symptoms,
            deepworkMinutes: dailyTracking.deepworkMinutes ? Number(dailyTracking.deepworkMinutes) : 0,
            tasksCompleted: dailyTracking.tasksCompleted ? Number(dailyTracking.tasksCompleted) : 0,
            sleepHours: dailyTracking.sleepHours ? Number(dailyTracking.sleepHours) : 0,
            recoveryAction: Boolean(dailyTracking.recoveryAction),
            positiveSocialTouchpoints: dailyTracking.positiveSocialTouchpoints ? Number(dailyTracking.positiveSocialTouchpoints) : 0,
            dssScore: dailyTracking.dssScore ? Number(dailyTracking.dssScore) : 0,
            learningMomentum: dailyTracking.learningMomentum ? Number(dailyTracking.learningMomentum) : 0,
            recoveryIndex: dailyTracking.recoveryIndex ? Number(dailyTracking.recoveryIndex) : 0,
            connectionScore: dailyTracking.connectionScore ? Number(dailyTracking.connectionScore) : 0,
            notes: dailyTracking.notes,
            createdAt: dailyTracking.createdAt ? new Date(Number(dailyTracking.createdAt) * 1000) : new Date(),
            updatedAt: dailyTracking.updatedAt ? new Date(Number(dailyTracking.updatedAt) * 1000) : new Date()
          }
        });
        results.dailyTracking = 1;
      } catch (error) {
        results.errors.push({ table: 'dailyTracking', id: dailyTracking.id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Import Mood Entries
    if (moodEntries && Array.isArray(moodEntries)) {
      for (const entry of moodEntries) {
        try {
          const entryCreatedAt = entry.createdAt ? new Date(Number(entry.createdAt) * 1000) : (entry.date ? new Date(entry.date) : new Date());
          const entryUpdatedAt = entry.updatedAt ? new Date(Number(entry.updatedAt) * 1000) : entryCreatedAt;
          const timeBucket = entry.timeBucket || getTimeBucket(entryCreatedAt);
          
          await db.moodEntry.upsert({
            where: { id: entry.id },
            update: {
              valence: Number(entry.valence ?? 5),
              energy: Number(entry.energy ?? 5),
              focus: Number(entry.focus ?? 5),
              stress: Number(entry.stress ?? 5),
              sleep: entry.sleep != null ? Number(entry.sleep) : 7,
              notes: entry.notes || null,
              activities: JSON.stringify(entry.activities || []),
              selectedTimeSlots: entry.selectedTimeSlots ? JSON.stringify(entry.selectedTimeSlots) : null,
              selectedSubcategories: JSON.stringify(entry.selectedSubcategories || []),
              activityEntries: entry.activityEntries ? JSON.stringify(entry.activityEntries) : null,
              dssAnalysis: entry.dssAnalysis ? (typeof entry.dssAnalysis === 'string' ? entry.dssAnalysis : JSON.stringify(entry.dssAnalysis)) : null,
              reflection: entry.reflection || null,
              voiceNote: entry.voiceNote || null,
              aiSuggestion: entry.aiSuggestion || null,
              timeBucket,
              onPeriod: Boolean(entry.onPeriod),
              periodDay: entry.periodDay != null ? Number(entry.periodDay) : null,
              waterIntake: entry.waterIntake != null ? Number(entry.waterIntake) : null,
              mealsEaten: entry.mealsEaten != null ? Number(entry.mealsEaten) : null,
              mealQuality: entry.mealQuality || null,
              caffeine: entry.caffeine != null ? Number(entry.caffeine) : null,
              alcohol: entry.alcohol != null ? Number(entry.alcohol) : null,
              moodComposite: entry.moodComposite != null ? Number(entry.moodComposite) : null,
              createdAt: entryCreatedAt,
              updatedAt: entryUpdatedAt
            },
            create: {
              id: entry.id,
              userId: entry.userId || userId,
              valence: Number(entry.valence ?? 5),
              energy: Number(entry.energy ?? 5),
              focus: Number(entry.focus ?? 5),
              stress: Number(entry.stress ?? 5),
              sleep: entry.sleep != null ? Number(entry.sleep) : 7,
              notes: entry.notes || null,
              activities: JSON.stringify(entry.activities || []),
              selectedTimeSlots: entry.selectedTimeSlots ? JSON.stringify(entry.selectedTimeSlots) : null,
              selectedSubcategories: JSON.stringify(entry.selectedSubcategories || []),
              activityEntries: entry.activityEntries ? JSON.stringify(entry.activityEntries) : null,
              dssAnalysis: entry.dssAnalysis ? (typeof entry.dssAnalysis === 'string' ? entry.dssAnalysis : JSON.stringify(entry.dssAnalysis)) : null,
              reflection: entry.reflection || null,
              voiceNote: entry.voiceNote || null,
              aiSuggestion: entry.aiSuggestion || null,
              timeBucket,
              onPeriod: Boolean(entry.onPeriod),
              periodDay: entry.periodDay != null ? Number(entry.periodDay) : null,
              waterIntake: entry.waterIntake != null ? Number(entry.waterIntake) : null,
              mealsEaten: entry.mealsEaten != null ? Number(entry.mealsEaten) : null,
              mealQuality: entry.mealQuality || null,
              caffeine: entry.caffeine != null ? Number(entry.caffeine) : null,
              alcohol: entry.alcohol != null ? Number(entry.alcohol) : null,
              moodComposite: entry.moodComposite != null ? Number(entry.moodComposite) : null,
              createdAt: entryCreatedAt,
              updatedAt: entryUpdatedAt
            }
          });
          results.moodEntries++;
        } catch (error) {
          results.errors.push({ table: 'moodEntry', id: entry.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed successfully`,
      results,
      totalImported: results.user + results.goals + results.achievements + results.periodTracking + results.congratulations + results.dailyTracking + results.moodEntries
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to determine time bucket
function getTimeBucket(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}
