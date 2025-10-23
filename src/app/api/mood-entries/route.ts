import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMoodComposite, getTimeBucket } from "@/lib/moodCompositeCalculator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating mood entry with data:', JSON.stringify(body, null, 2));
    const { 
      valence, energy, focus, stress, sleep, 
      notes, activities, selectedTimeSlots, selectedSubcategories, dssAnalysis, reflection, voiceNote, aiSuggestion,
      onPeriod, waterIntake, mealsEaten, mealQuality, caffeine, alcohol 
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

    // Calculate Mood Composite
    const currentDate = new Date();
    const timeBucket = getTimeBucket(currentDate);
    console.log('🧮 Calculating Mood Composite...');
    const mcResult = await calculateMoodComposite(
      dummyUserId,
      parseInt(valence),
      parseInt(energy),
      parseInt(focus),
      parseInt(stress),
      currentDate
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
        dssAnalysis: dssAnalysis ? (typeof dssAnalysis === 'string' ? dssAnalysis : JSON.stringify(dssAnalysis)) : null,
        reflection: reflection || null,
        voiceNote: voiceNote || null,
        aiSuggestion: aiSuggestion || null,
        timeBucket: timeBucket,
        moodComposite: mcResult.moodComposite,
        onPeriod: onPeriod || false,
        waterIntake: waterIntake ? parseInt(waterIntake) : null,
        mealsEaten: mealsEaten ? parseInt(mealsEaten) : null,
        mealQuality: mealQuality || null,
        caffeine: caffeine ? parseInt(caffeine) : null,
        alcohol: alcohol ? parseInt(alcohol) : null,
      },
    });
    console.log('✅ Mood entry created successfully:', moodEntry.id);

    // Auto-create/update DailyTracking record based on mood entry data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse activities and DSS analysis to extract DSS components
    const activitiesList = activities || [];
    const dssAnalysisData = dssAnalysis ? (typeof dssAnalysis === 'string' ? JSON.parse(dssAnalysis) : dssAnalysis) : {};
    
    // Calculate DSS components from mood entry data
    let learningMomentum = 0;
    let recoveryIndex = sleep ? parseFloat(sleep) : 0; // Sleep hours contribute to RI
    let connectionScore = 0;
    
    // Check if any activity contributes to DSS components
    for (const activity of activitiesList) {
      const activityDSS = dssAnalysisData[activity];
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
          date: today
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
        date: today,
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
