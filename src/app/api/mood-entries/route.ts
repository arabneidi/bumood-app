import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMoodComposite, getTimeBucket } from "@/lib/moodCompositeCalculator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      valence, energy, focus, stress, sleep, 
      notes, activities, selectedTimeSlots, reflection, voiceNote, aiSuggestion,
      onPeriod, waterIntake, mealsEaten, mealQuality, caffeine, alcohol 
    } = body;

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
    const mcResult = await calculateMoodComposite(
      dummyUserId,
      parseInt(valence),
      parseInt(energy),
      parseInt(focus),
      parseInt(stress),
      currentDate
    );

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

    return NextResponse.json(moodEntry);
  } catch (error) {
    console.error("Error creating mood entry:", error);
    return NextResponse.json(
      { error: "Failed to create mood entry" },
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
