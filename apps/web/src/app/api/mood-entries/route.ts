export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMoodComposite, getTimeBucket } from "@/lib/moodCompositeCalculator";
import { calculateDSS } from "@/lib/dssCalculator";
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

    // Determine authoritative local timestamp for this entry
    // Priority:
    // 1) Latest activityEntries[].exactTime (local) if provided
    // 2) If customDate provided without specific timeslots/activities, use local current time on that date
    // 3) Otherwise use local now
    const nowLocal = new Date();
    const todayLocalStr = new Date().toISOString().split('T')[0];
    let chosenCreatedAt: Date | null = null;

    // From activityEntries - use exact local time from activities (format: 2025-09-28T11:00:00, no Z)
    if (activityEntries && Array.isArray(activityEntries) && activityEntries.length > 0) {
      try {
        const parsed = typeof activityEntries === 'string' ? JSON.parse(activityEntries) : activityEntries;
        // Find the latest exactTime (already in local format like "2025-09-28T11:00:00")
        const latestExactTime = parsed
          .map((e: any) => e?.exactTime)
          .filter((t: string | undefined) => t && typeof t === 'string')
          .sort((a: string, b: string) => {
            // Compare as strings (YYYY-MM-DDTHH:mm:ss format, local time)
            return b.localeCompare(a);
          })[0];
        
        if (latestExactTime) {
          // Parse as local time (format: "2025-09-28T11:00:00" - no Z means local)
          // Extract date components to create a proper local Date object
          const [datePart, timePart] = latestExactTime.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
          chosenCreatedAt = new Date(year, month - 1, day, hour, minute, second || 0);
        }
      } catch {}
    }

    // From customDate without activities
    if (!chosenCreatedAt && customDate) {
      if (customDate === todayLocalStr) {
        chosenCreatedAt = nowLocal; // current local time
      } else {
        // Use the actual local time when the entry is being created, applied to the custom date
        const hh = String(nowLocal.getHours()).padStart(2, '0');
        const mm = String(nowLocal.getMinutes()).padStart(2, '0');
        chosenCreatedAt = new Date(`${customDate}T${hh}:${mm}:00`); // local wall-clock on chosen day
      }
    }

    if (!chosenCreatedAt) {
      chosenCreatedAt = nowLocal;
    }
    
    console.log('📅 Chosen createdAt (local):', chosenCreatedAt);
    
    // If onPeriod is true, add "Menstruation" activity at 12pm
    let finalActivities: string[] = [];
    let finalActivityEntries: any[] = [];
    
    try {
      finalActivities = Array.isArray(activities) ? activities : (activities ? JSON.parse(activities) : []);
      if (!Array.isArray(finalActivities)) finalActivities = [];
    } catch {
      finalActivities = [];
    }
    
    // If alcohol > 0, add "Drinking" activity at 12pm (MC-only, no DSS)
    if (alcohol && Number(alcohol) > 0 && !finalActivities.includes('Drinking')) {
      console.log('🍺 Adding Drinking activity for alcohol day');
      finalActivities.push('Drinking');
      const entryDate2 = new Date(chosenCreatedAt);
      const y2 = entryDate2.getFullYear();
      const m2 = String(entryDate2.getMonth() + 1).padStart(2, '0');
      const d2 = String(entryDate2.getDate()).padStart(2, '0');
      const exactTime2 = `${y2}-${m2}-${d2}T12:00:00`;
      const hour2 = 12;
      const timeSlot2 = hour2 < 12 ? `morning-${hour2}` : hour2 < 17 ? `midday-${hour2}` : hour2 < 22 ? `evening-${hour2}` : `night-${hour2}`;
      const drinkingEntry = {
        activity: 'Drinking',
        exactTime: exactTime2,
        timeSlot: timeSlot2,
        hour: hour2
      };
      const hasDrinking = finalActivityEntries.some((e: any) => e?.activity === 'Drinking' && e?.exactTime === exactTime2);
      if (!hasDrinking) finalActivityEntries.push(drinkingEntry);
    }

    try {
      finalActivityEntries = Array.isArray(activityEntries) ? activityEntries : (activityEntries ? JSON.parse(activityEntries) : []);
      if (!Array.isArray(finalActivityEntries)) finalActivityEntries = [];
    } catch {
      finalActivityEntries = [];
    }
    
    if (onPeriod === true && !finalActivities.includes('Menstruation')) {
      console.log('🩸 Adding Menstruation activity for period day');
      
      // Add to activities array
      finalActivities.push('Menstruation');
      
      // Add to activityEntries with exactTime at 12pm on the entry date
      const entryDate = new Date(chosenCreatedAt);
      const year = entryDate.getFullYear();
      const month = String(entryDate.getMonth() + 1).padStart(2, '0');
      const day = String(entryDate.getDate()).padStart(2, '0');
      const exactTime = `${year}-${month}-${day}T12:00:00`;
      const hour = 12;
      const timeSlot = hour < 12 ? `morning-${hour}` : hour < 17 ? `midday-${hour}` : hour < 22 ? `evening-${hour}` : `night-${hour}`;
      
      const menstruationEntry = {
        activity: 'Menstruation',
        exactTime: exactTime,
        timeSlot: timeSlot,
        hour: hour
      };
      
      // Only add if not already present
      const hasMenstruation = finalActivityEntries.some((e: any) => 
        e?.activity === 'Menstruation' && e?.exactTime === exactTime
      );
      if (!hasMenstruation) {
        finalActivityEntries.push(menstruationEntry);
      }
    }
    
    // Calculate Mood Composite
    const timeBucket = getTimeBucket(chosenCreatedAt);
    console.log('🧮 Calculating Mood Composite...');
    const mcResult = await calculateMoodComposite(
      dummyUserId,
      parseInt(valence),
      parseInt(energy),
      parseInt(focus),
      parseInt(stress),
      chosenCreatedAt
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
        sleep: sleep !== null && sleep !== undefined ? parseFloat(sleep) : null,
        notes: notes || null,
        activities: JSON.stringify(finalActivities),
        selectedTimeSlots: selectedTimeSlots ? JSON.stringify(selectedTimeSlots) : null,
        selectedSubcategories: selectedSubcategories ? JSON.stringify(selectedSubcategories) : null,
        activityEntries: finalActivityEntries.length > 0 ? JSON.stringify(finalActivityEntries) : null,
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
        createdAt: chosenCreatedAt,
        updatedAt: chosenCreatedAt,
      },
    });
    console.log('✅ Mood entry created successfully:', moodEntry.id);

    // Kick off post-save tasks in background to keep response fast
    ;(async () => {
      // Update MC and DSS cache after new entry is saved
      // Use EXACT same logic as get-dss-today.ts script
      try {
      const entryDate = new Date(chosenCreatedAt);
      
      // EXACT same pattern as get-dss-today.ts (lines 10-15):
      // Create date object exactly like the chart does (entry date at midnight)
      const todayYear = entryDate.getFullYear();
      const todayMonth = entryDate.getMonth();
      const todayDay = entryDate.getDate();
      const currentDay = new Date(todayYear, todayMonth, todayDay);
      currentDay.setHours(0, 0, 0, 0);
      
      // Get all entries for this day (includes the new entry we just saved)
      const tomorrow = new Date(currentDay);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayEntries = await db.moodEntry.findMany({
        where: {
          userId: dummyUserId,
          createdAt: {
            gte: currentDay,
            lt: tomorrow
          }
        }
      });

      if (todayEntries.length > 0) {
        // EXACT same calculation as MC vs DSS chart for a single day:
        // Average all entries for this day (same as chart logic line 84-87)
        const avgValence = todayEntries.reduce((sum, e) => sum + e.valence, 0) / todayEntries.length;
        const avgEnergy = todayEntries.reduce((sum, e) => sum + e.energy, 0) / todayEntries.length;
        const avgFocus = todayEntries.reduce((sum, e) => sum + e.focus, 0) / todayEntries.length;
        const avgStress = todayEntries.reduce((sum, e) => sum + e.stress, 0) / todayEntries.length;

        // Calculate MC and DSS in parallel
        const now = new Date();
        const [mcResult, dssResult] = await Promise.all([
          calculateMoodComposite(
            dummyUserId,
            avgValence,
            avgEnergy,
            avgFocus,
            avgStress,
            now
          ),
          calculateDSS(dummyUserId, currentDay)
        ]);

        // Save to cache
        await db.dailyTracking.upsert({
          where: {
            userId_date: {
              userId: dummyUserId,
              date: currentDay
            }
          },
          update: {
            moodComposite: mcResult.moodComposite,
            dssScore: dssResult.dssScore,
            learningMomentum: dssResult.components.learningMomentum,
            recoveryIndex: dssResult.components.recoveryIndex,
            connectionScore: dssResult.components.connectionScore
          },
          create: {
            userId: dummyUserId,
            date: currentDay,
            moodComposite: mcResult.moodComposite,
            dssScore: dssResult.dssScore,
            learningMomentum: dssResult.components.learningMomentum,
            recoveryIndex: dssResult.components.recoveryIndex,
            connectionScore: dssResult.components.connectionScore
          }
        });
      }
      } catch (cacheError) {
        console.error('⚠️ Error updating cache:', cacheError);
      }

    // Update user's recent activities with specific subcategories
    if (selectedSubcategories && selectedSubcategories.length > 0) {
      try {
        // Get current user's recent activities
        const user = await db.user.findUnique({
          where: { id: dummyUserId },
          select: { recentActivities: true }
        });
        
        let recentActivities = [];
        if (user?.recentActivities) {
          try {
            recentActivities = JSON.parse(user.recentActivities);
          } catch (error) {
            console.log('⚠️ Could not parse recentActivities, starting fresh');
            recentActivities = [];
          }
        }
        
        // Add new subcategories to the beginning of the list
        const newSubcategories = Array.isArray(selectedSubcategories) ? selectedSubcategories : [];
        recentActivities = [...newSubcategories, ...recentActivities];
        
        // Remove duplicates while preserving order
        const uniqueRecentActivities = recentActivities.filter((item, index, self) => 
          self.indexOf(item) === index
        );
        
        // Keep only the last 10 activities
        const trimmedRecentActivities = uniqueRecentActivities.slice(0, 10);
        
        // Update user's recent activities
        await db.user.update({
          where: { id: dummyUserId },
          data: {
            recentActivities: JSON.stringify(trimmedRecentActivities)
          }
        });
        
        console.log('✅ Updated recent activities:', trimmedRecentActivities);
      } catch (error) {
        console.error('❌ Error updating recent activities:', error);
      }
    }

    // Invalidate AI drivers cache when new entry is created
    try {
      await db.aISuggestionAction.deleteMany({
        where: {
          userId: dummyUserId,
          type: 'drivers_analysis'
        }
      });
      console.log('🗑️ AI drivers cache invalidated due to new mood entry');
    } catch (cacheError) {
      console.error('❌ Error invalidating AI drivers cache:', cacheError);
    }

    // Auto-create/update DailyTracking record based on mood entry data
    const trackingDate = new Date(chosenCreatedAt);
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
    
    // ============================================================================
    // DSS COMPONENT CALCULATION (DO NOT MODIFY - FOLLOWS EXACT FORMULA)
    // ============================================================================
    // LM (Learning Momentum) = deepwork_minutes + 10 * tasks_completed
    // RI (Recovery Index) = sleep_hours + (recovery_action ? 1 : 0)
    // CN (Connection) = positive_social_touchpoints
    // 
    // Z-score normalization over 14 days, then:
    // DSS = 0.5 × zLM + 0.3 × zRI + 0.2 × zCN
    // ============================================================================
    
    let deepworkMinutes = 0;
    let recoveryIndex = sleep !== null && sleep !== undefined ? parseFloat(sleep) : 0; // Sleep hours contribute to RI
    let connectionScore = 0;
    
    // Calculate actual deep work minutes from selected time slots
    // Each selected time slot = 1 hour = 60 minutes of deep work
    // Example: If you selected 1 hour (11 PM), you did 60 minutes of deep work
    if (selectedTimeSlots && selectedTimeSlots.length > 0) {
      const timeSlotsArray = typeof selectedTimeSlots === 'string' 
        ? JSON.parse(selectedTimeSlots) 
        : selectedTimeSlots;
      deepworkMinutes = timeSlotsArray.length * 60; // Convert hours to minutes
    }
    
    // Calculate tasks completed based on activities with LM component
    // Each activity with primaryComponent='LM' counts as 1 completed task
    let tasksCompleted = 0;
    for (const activity of activitiesList) {
      const activityDSS = (dssAnalysisData as any)[activity];
      if (activityDSS) {
        if (activityDSS.primaryComponent === 'LM') {
          tasksCompleted += 1; // Each LM activity = 1 completed task
        } else if (activityDSS.primaryComponent === 'CN') {
          connectionScore += 1; // Social interaction contribution
        }
      }
    }
    
    // Calculate Learning Momentum according to formula: LM = deepwork_minutes + 10 * tasks_completed
    const learningMomentum = deepworkMinutes + (10 * tasksCompleted);
    
    // Add recovery action if sleep is good (8+ hours)
    if (sleep !== null && sleep !== undefined && parseFloat(sleep) >= 8) {
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
        // Sync water and nutrition data from mood entry
        waterIntake: waterIntake || 0,
        mealsEaten: mealsEaten || 0,
        mealQuality: mealQuality || null,
        caffeine: caffeine || 0,
        alcohol: alcohol || 0,
        // Sync exercise data
        exercise: activitiesList.length > 0,
        exerciseType: activitiesList.length > 0 ? 'general' : null,
        exerciseDuration: activitiesList.length > 0 ? 30 : 0, // Default 30 minutes
        // DSS calculations - using actual deep work minutes and tasks
        deepworkMinutes: deepworkMinutes,
        tasksCompleted: tasksCompleted,
        sleepHours: sleep !== null && sleep !== undefined ? parseFloat(sleep) : 0,
        recoveryAction: sleep !== null && sleep !== undefined && parseFloat(sleep) >= 8,
        positiveSocialTouchpoints: connectionScore,
        // Update DSS component fields only; DSS score is computed via calculateDSS and saved elsewhere
        learningMomentum: learningMomentum,
        recoveryIndex: recoveryIndex,
        connectionScore: connectionScore
      },
      create: {
        userId: dummyUserId,
        date: trackingDate,
        // Sync water and nutrition data from mood entry
        waterIntake: waterIntake || 0,
        mealsEaten: mealsEaten || 0,
        mealQuality: mealQuality || null,
        caffeine: caffeine || 0,
        alcohol: alcohol || 0,
        // Sync exercise data
        exercise: activitiesList.length > 0,
        exerciseType: activitiesList.length > 0 ? 'general' : null,
        exerciseDuration: activitiesList.length > 0 ? 30 : 0, // Default 30 minutes
        // DSS calculations - using actual deep work minutes and tasks
        deepworkMinutes: deepworkMinutes,
        tasksCompleted: tasksCompleted,
        sleepHours: sleep !== null && sleep !== undefined ? parseFloat(sleep) : 0,
        recoveryAction: sleep !== null && sleep !== undefined && parseFloat(sleep) >= 8,
        positiveSocialTouchpoints: connectionScore,
        // Do not set dssScore here; it is computed by calculateDSS later
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
        
        // Set flag to regenerate Pro Tips when new badge is achieved
        // This will be picked up by the frontend to trigger AI regeneration
        console.log('🏆 New badge achieved - Pro Tips will regenerate');

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
      }
    })();

    // Return immediately; background tasks are running
    console.log('📝 Mood entry created - background updates started');

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, onPeriod, periodDay } = body;
    
    console.log('📝 Updating mood entry period status:', { id, onPeriod, periodDay });
    
    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const dummyUserId = "dummy-user";
    
    // Update the mood entry
    const updatedEntry = await db.moodEntry.update({
      where: { 
        id: id,
        userId: dummyUserId 
      },
      data: {
        onPeriod: onPeriod || false,
        periodDay: periodDay ? parseInt(periodDay) : null,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Mood entry period status updated:', updatedEntry.id);
    
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating mood entry:", error);
    return NextResponse.json(
      { error: "Failed to update mood entry", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    
    const moodEntries = await db.moodEntry.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      take: 100, // Last 100 entries to include more historical data
    });

    const entriesWithActivities = moodEntries.map(entry => {
      const d = new Date(entry.createdAt);
      // Local-friendly fields (do not mutate createdAt)
      const localKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const localCreatedAt = `${localKey}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      return {
        ...entry,
        activities: entry.activities ? JSON.parse(entry.activities) : [],
        selectedSubcategories: entry.selectedSubcategories ? JSON.parse(entry.selectedSubcategories) : [],
        activityEntries: entry.activityEntries ? JSON.parse(entry.activityEntries) : [],
        localCreatedAt, // e.g., 2025-10-15T08:00:00 (local wall-clock)
        localDate: localKey   // e.g., 2025-10-15
      };
    });

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
