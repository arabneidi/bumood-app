import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMoodComposite, getTimeBucket } from "@/lib/moodCompositeCalculator";
import { calculateAchievements } from "@/lib/achievementCalculator";

// Helper functions for achievement rollback validation
async function checkConsecutiveDays(moodEntries: any[], requiredDays: number): Promise<boolean> {
  if (moodEntries.length < requiredDays) return false;

  // Sort entries by date (newest first)
  const sortedEntries = moodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  let consecutiveDays = 1;
  let currentDate = new Date(sortedEntries[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      consecutiveDays++;
      currentDate = entryDate;
    } else if (dayDiff > 1) {
      break; // Gap in consecutive days
    }
  }

  return consecutiveDays >= requiredDays;
}

async function checkConsecutiveMood(moodEntries: any[], moodType: string, minValue: number, requiredDays: number): Promise<boolean> {
  if (moodEntries.length < requiredDays) return false;

  // Sort entries by date (newest first)
  const sortedEntries = moodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  let consecutiveDays = 0;
  let currentDate = new Date(sortedEntries[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0 || dayDiff === 1) {
      if (sortedEntries[i][moodType] >= minValue) {
        consecutiveDays++;
        if (consecutiveDays >= requiredDays) return true;
      } else {
        consecutiveDays = 0; // Reset streak
      }
      currentDate = entryDate;
    } else if (dayDiff > 1) {
      break; // Gap in consecutive days
    }
  }

  return false;
}

async function checkConsecutiveSleep(moodEntries: any[], minValue: number, requiredDays: number): Promise<boolean> {
  if (moodEntries.length < requiredDays) return false;

  // Sort entries by date (newest first)
  const sortedEntries = moodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  let consecutiveDays = 0;
  let currentDate = new Date(sortedEntries[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0 || dayDiff === 1) {
      if (sortedEntries[i].sleep >= minValue) {
        consecutiveDays++;
        if (consecutiveDays >= requiredDays) return true;
      } else {
        consecutiveDays = 0; // Reset streak
      }
      currentDate = entryDate;
    } else if (dayDiff > 1) {
      break; // Gap in consecutive days
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating mood entry with data:', JSON.stringify(body, null, 2));
    const { 
      valence, energy, focus, stress, sleep, 
      notes, activities, selectedTimeSlots, selectedSubcategories, activityEntries, dssAnalysis, reflection, voiceNote, aiSuggestion,
      onPeriod, periodDay, waterIntake, mealsEaten, mealQuality, caffeine, alcohol,
      customDate
    } = body;
    
    console.log('🔍 dssAnalysis type:', typeof dssAnalysis);
    console.log('🔍 dssAnalysis value:', dssAnalysis);
    console.log('🔍 dssAnalysis JSON.stringify:', JSON.stringify(dssAnalysis));

    // For now, we'll use a dummy user ID since we don't have auth set up
    const dummyUserId = "dummy-user";

    // Create user if doesn't exist (for demo purposes)
    await db.user.upsert({
      where: { id: dummyUserId },
      update: {},
      create: {
        id: dummyUserId,
        name: "Demo User",
        email: "demo@example.com",
      },
    });

    // Use custom date if provided, otherwise use current date
    const entryDate = customDate 
      ? new Date(`${customDate}T12:00:00`) // Use noon as default time
      : new Date();
    
    console.log('📅 Entry date:', entryDate.toISOString());
    
    // Calculate Mood Composite
    const timeBucket = getTimeBucket(entryDate);
    console.log('🧮 Calculating Mood Composite...');
    const mcResult = await calculateMoodComposite(
      dummyUserId,
      parseInt(valence),
      parseInt(energy),
      parseInt(focus),
      parseInt(stress),
      entryDate
    );
    console.log('✅ Mood Composite calculated:', mcResult.moodComposite);

    console.log('💾 Creating mood entry in database...');
    const moodEntry = await db.moodEntry.create({
      data: {
        userId: dummyUserId,
        valence: parseInt(valence),
        energy: parseInt(energy),
        focus: parseInt(focus),
        stress: parseInt(stress),
        sleep: sleep ? parseFloat(sleep) : null,
        notes: notes || null,
        activities: JSON.stringify(activities),
        selectedTimeSlots: selectedTimeSlots ? JSON.stringify(selectedTimeSlots) : null,
        selectedSubcategories: selectedSubcategories ? JSON.stringify(selectedSubcategories) : null,
        activityEntries: activityEntries ? JSON.stringify(activityEntries) : null,
        dssAnalysis: dssAnalysis ? (typeof dssAnalysis === 'string' ? dssAnalysis : JSON.stringify(dssAnalysis)) : null,
        reflection: reflection || null,
        voiceNote: voiceNote || null,
        aiSuggestion: aiSuggestion || null,
        timeBucket: timeBucket,
        moodComposite: mcResult.moodComposite,
        onPeriod: onPeriod || false,
        periodDay: periodDay ? parseInt(periodDay) : null,
        waterIntake: waterIntake ? parseInt(waterIntake) : null,
        mealsEaten: mealsEaten ? parseInt(mealsEaten) : null,
        mealQuality: mealQuality || null,
        caffeine: caffeine ? parseInt(caffeine) : null,
        alcohol: alcohol ? parseInt(alcohol) : null,
        // Use custom date/time if provided
        createdAt: entryDate,
        updatedAt: entryDate,
      },
    });
    console.log('✅ Mood entry created successfully:', moodEntry.id);

    // Auto-create/update DailyTracking record based on mood entry data
    const trackingDate = new Date(entryDate);
    trackingDate.setHours(0, 0, 0, 0);
    
    // Parse activities and DSS analysis to extract DSS components
    const activitiesList = activities || [];
    let dssAnalysisData = {};
    if (dssAnalysis) {
      if (typeof dssAnalysis === 'string') {
        try {
          dssAnalysisData = JSON.parse(dssAnalysis);
        } catch (error) {
          console.log('⚠️ Could not parse dssAnalysis as JSON:', dssAnalysis);
          dssAnalysisData = {};
        }
      } else {
        dssAnalysisData = dssAnalysis;
      }
    }
    
    // Calculate DSS components from mood entry data
    let learningMomentum = 0;
    let recoveryIndex = sleep ? parseFloat(sleep) : 0; // Sleep hours contribute to RI
    let connectionScore = 0;
    
    // Check if any activity contributes to DSS components
    for (const activity of activitiesList) {
      const activityDSS = (dssAnalysisData as any)[activity];
      if (activityDSS) {
        if (activityDSS.primaryComponent === 'LM') {
          learningMomentum += 10; // Basic contribution for LM activities
        } else if (activityDSS.primaryComponent === 'CN') {
          connectionScore += 1; // Social interaction contribution
        }
        // RI is already set from sleep hours
      }
    }
    
    // Add recovery action if sleep is good (8+ hours)
    if (sleep && parseFloat(sleep) >= 8) {
      recoveryIndex += 1; // Bonus for good sleep
    }

    // Create or update DailyTracking record
    await db.dailyTracking.upsert({
      where: {
        userId_date: {
          userId: dummyUserId,
          date: trackingDate
        }
      },
      update: {
        deepworkMinutes: Math.max(0, learningMomentum), // Use LM as deep work proxy
        tasksCompleted: Math.floor(learningMomentum / 10), // Convert LM to tasks
        sleepHours: sleep ? parseFloat(sleep) : 0,
        recoveryAction: sleep && parseFloat(sleep) >= 8,
        positiveSocialTouchpoints: connectionScore,
        // Update DSS scores
        dssScore: 0.5 * learningMomentum + 0.3 * recoveryIndex + 0.2 * connectionScore,
        learningMomentum: learningMomentum,
        recoveryIndex: recoveryIndex,
        connectionScore: connectionScore
      },
      create: {
        userId: dummyUserId,
        date: trackingDate,
        deepworkMinutes: Math.max(0, learningMomentum),
        tasksCompleted: Math.floor(learningMomentum / 10),
        sleepHours: sleep ? parseFloat(sleep) : 0,
        recoveryAction: sleep && parseFloat(sleep) >= 8,
        positiveSocialTouchpoints: connectionScore,
        dssScore: 0.5 * learningMomentum + 0.3 * recoveryIndex + 0.2 * connectionScore,
        learningMomentum: learningMomentum,
        recoveryIndex: recoveryIndex,
        connectionScore: connectionScore
      }
    });

    // Learn from user activities and subcategories
    console.log('🧠 Learning from user activities...');
    try {
      const learnResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/learn-user-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dummyUserId,
          activities: activitiesList,
          subcategories: selectedSubcategories ? JSON.parse(selectedSubcategories) : [],
          moodData: {
            valence: parseInt(valence),
            energy: parseInt(energy),
            focus: parseInt(focus),
            stress: parseInt(stress)
          }
        })
      });
      
      if (learnResponse.ok) {
        const learnData = await learnResponse.json();
        console.log('✅ User preferences learned:', learnData.updates);
      } else {
        console.log('⚠️ Learning preferences failed, but mood entry was saved');
      }
    } catch (learnError) {
      console.error('⚠️ Error learning preferences:', learnError);
      // Don't fail the mood entry creation if learning fails
    }

    // Check and unlock achievements after creating the mood entry
    console.log('🏆 Checking achievements...');
    try {
      const newAchievements = await calculateAchievements(dummyUserId);
      console.log(`✅ Found ${newAchievements.length} new achievements`);
      
      // Save new achievements to database and create congratulations
      for (const achievement of newAchievements) {
        await db.achievement.create({
          data: {
            userId: dummyUserId,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            stars: achievement.stars,
            type: achievement.type,
            unlockedAt: new Date()
          }
        });
        console.log(`🎉 Unlocked: ${achievement.title}`);

        // Create congratulation for achievement unlock
        try {
          const congratulationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/congratulations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: dummyUserId,
              type: 'achievement_unlocked',
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              stars: achievement.stars
            })
          });

          if (congratulationResponse.ok) {
            const congratulation = await congratulationResponse.json();
            console.log('✅ Achievement congratulation created:', congratulation.congratulation.title);
          }
        } catch (congratulationError) {
          console.error('⚠️ Error creating achievement congratulation:', congratulationError);
          // Don't fail the achievement creation if congratulation fails
        }
      }
    } catch (achievementError) {
      console.error('⚠️ Error calculating achievements:', achievementError);
      // Don't fail the mood entry creation if achievement calculation fails
    }

    // Signal dashboard to regenerate AI suggestions and Pro Tips
    // This will be picked up by the dashboard's useEffect
    console.log('📝 Mood entry created - signaling dashboard for regeneration');

    return NextResponse.json(moodEntry);
  } catch (error) {
    console.error("Error creating mood entry:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to create mood entry", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const dummyUserId = "dummy-user";
    
    const moodEntries = await db.moodEntry.findMany({
      where: { userId: dummyUserId },
      orderBy: { createdAt: "desc" },
      take: 30, // Last 30 entries
    });

    const entriesWithActivities = moodEntries.map(entry => ({
      ...entry,
      activities: entry.activities ? JSON.parse(entry.activities) : [],
    }));

    return NextResponse.json(entriesWithActivities);
  } catch (error) {
    console.error("Error fetching mood entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch mood entries" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    
    console.log('🗑️ DELETE request for entry ID:', entryId);
    
    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const dummyUserId = "dummy-user";
    
    // First, get the entry to find its date for rollback calculations
    console.log('🔍 Looking for entry with ID:', entryId, 'and userId:', dummyUserId);
    const entry = await db.moodEntry.findUnique({
      where: { id: entryId, userId: dummyUserId }
    });

    console.log('🔍 Entry found:', entry);

    if (!entry) {
      // Let's also check if the entry exists without userId filter
      const anyEntry = await db.moodEntry.findUnique({
        where: { id: entryId }
      });
      console.log('🔍 Entry without userId filter:', anyEntry);
      
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    const entryDate = new Date(entry.createdAt);
    const dateString = entryDate.toISOString().split('T')[0];
    
    // Create proper DateTime objects for the date range
    const startOfDay = new Date(entryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(entryDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`🗑️ Deleting mood entry ${entryId} for date ${dateString}`);

    // Start transaction for complete rollback
    const result = await db.$transaction(async (tx) => {
      // 1. Delete the mood entry
      await tx.moodEntry.delete({
        where: { id: entryId }
      });

      // 2. Delete related DailyTracking record for this date
      await tx.dailyTracking.deleteMany({
        where: {
          userId: dummyUserId,
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // 3. Delete related AI suggestions for this date
      await tx.aISuggestionAction.deleteMany({
        where: {
          userId: dummyUserId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // 4. Check and rollback achievements that might be affected by this entry deletion
      console.log('🔍 Checking for achievements to rollback...');
      
      // Get all achievements for this user
      const userAchievements = await tx.achievement.findMany({
        where: { userId: dummyUserId },
        orderBy: { unlockedAt: 'desc' }
      });
      
      console.log(`📊 Found ${userAchievements.length} total achievements for user`);
      
      // Get current mood entries (excluding the one being deleted)
      const remainingEntries = await tx.moodEntry.findMany({
        where: { 
          userId: dummyUserId,
          id: { not: entryId }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`📊 Found ${remainingEntries.length} remaining mood entries after deletion`);
      
      // Check each achievement to see if it should be rolled back
      const achievementsToRollback = [];
      
      for (const achievement of userAchievements) {
        let shouldRollback = false;
        
        // Check streak-based achievements
        if (achievement.type === 'streak') {
          if (achievement.id.includes('daily-logging')) {
            // Check if we still have consecutive daily entries
            const consecutiveDays = await checkConsecutiveDays(remainingEntries, 1);
            if (!consecutiveDays) {
              shouldRollback = true;
              console.log(`🔄 Rolling back daily logging streak achievement: ${achievement.title}`);
            }
          } else if (achievement.id.includes('week')) {
            // Check if we still have 7 consecutive days
            const consecutiveDays = await checkConsecutiveDays(remainingEntries, 7);
            if (!consecutiveDays) {
              shouldRollback = true;
              console.log(`🔄 Rolling back week streak achievement: ${achievement.title}`);
            }
          } else if (achievement.id.includes('month')) {
            // Check if we still have 30 consecutive days
            const consecutiveDays = await checkConsecutiveDays(remainingEntries, 30);
            if (!consecutiveDays) {
              shouldRollback = true;
              console.log(`🔄 Rolling back month streak achievement: ${achievement.title}`);
            }
          }
        }
        
        // Check mood-based achievements
        if (achievement.type === 'mood_consistency') {
          if (achievement.id.includes('happy-week')) {
            // Check if we still have 7 consecutive days with valence >= 8
            const happyWeek = await checkConsecutiveMood(remainingEntries, 'valence', 8, 7);
            if (!happyWeek) {
              shouldRollback = true;
              console.log(`🔄 Rolling back happy week achievement: ${achievement.title}`);
            }
          } else if (achievement.id.includes('energy-master')) {
            // Check if we still have 14 consecutive days with energy >= 8
            const energyMaster = await checkConsecutiveMood(remainingEntries, 'energy', 8, 14);
            if (!energyMaster) {
              shouldRollback = true;
              console.log(`🔄 Rolling back energy master achievement: ${achievement.title}`);
            }
          }
        }
        
        // Check habit-based achievements
        if (achievement.type === 'habit_streak') {
          if (achievement.id.includes('sleep-champion')) {
            // Check if we still have 7 consecutive days with sleep >= 8
            const sleepChampion = await checkConsecutiveSleep(remainingEntries, 8, 7);
            if (!sleepChampion) {
              shouldRollback = true;
              console.log(`🔄 Rolling back sleep champion achievement: ${achievement.title}`);
            }
          }
        }
        
        if (shouldRollback) {
          achievementsToRollback.push(achievement);
        }
      }
      
      // Delete achievements that should be rolled back
      if (achievementsToRollback.length > 0) {
        console.log(`🗑️ Rolling back ${achievementsToRollback.length} achievements`);
        await tx.achievement.deleteMany({
          where: {
            id: { in: achievementsToRollback.map(a => a.id) }
          }
        });
        
        // Also delete related congratulations for these achievements
        await tx.congratulation.deleteMany({
          where: {
            userId: dummyUserId,
            type: 'achievement_unlocked',
            title: { in: achievementsToRollback.map(a => a.title) }
          }
        });
      }

      // 5. Delete related power hours data for this date
      // (Power hours are calculated from mood entries, so removing the entry will affect calculations)

      // 6. Delete related congratulations for this date
      await tx.congratulation.deleteMany({
        where: {
          userId: dummyUserId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      // 7. Delete related activity outcome connections for this date
      await tx.activityOutcomeConnection.deleteMany({
        where: {
          userId: dummyUserId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      console.log(`✅ Complete rollback completed for entry ${entryId}`);
      
      return { 
        success: true, 
        achievementsRolledBack: achievementsToRollback.length,
        rolledBackAchievements: achievementsToRollback.map(a => a.title)
      };
    });

    let message = "Entry and all related data deleted successfully";
    if (result.achievementsRolledBack > 0) {
      message += `. ${result.achievementsRolledBack} achievement(s) were rolled back: ${result.rolledBackAchievements.join(', ')}`;
    }

    return NextResponse.json({ 
      success: true, 
      message,
      achievementsRolledBack: result.achievementsRolledBack,
      rolledBackAchievements: result.rolledBackAchievements
    });

  } catch (error) {
    console.error("Error deleting mood entry:", error);
    return NextResponse.json(
      { error: "Failed to delete mood entry", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
