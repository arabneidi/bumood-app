import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json();
    
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Invalid entries data' },
        { status: 400 }
      );
    }

    const userId = 'dummy-user';
    
    // Create mood entries in the database with all fields
    const createdEntries = [];
    for (const entry of entries) {
      try {
        // Get entry date and set time bucket
        const entryDate = entry.date ? new Date(entry.date) : new Date();
        const timeBucket = entry.timeBucket || getTimeBucket(entryDate);
        
        const moodEntry = await db.moodEntry.create({
          data: {
            userId,
            valence: entry.valence || 5,
            energy: entry.energy || 5,
            focus: entry.focus || 5,
            stress: entry.stress || 5,
            sleep: entry.sleep || 7,
            notes: entry.notes || null,
            activities: JSON.stringify(entry.activities || []),
            selectedSubcategories: JSON.stringify(entry.selectedSubcategories || []),
            activityEntries: entry.activityEntries ? JSON.stringify(entry.activityEntries) : null,
            onPeriod: entry.onPeriod || false,
            periodDay: entry.periodDay || null,
            waterIntake: entry.waterIntake || null,
            mealsEaten: entry.mealsEaten || null,
            mealQuality: entry.mealQuality || null,
            caffeine: entry.caffeine || null,
            alcohol: entry.alcohol || null,
            timeBucket,
            moodComposite: entry.moodComposite || null,
            reflection: entry.reflection || null,
            selectedTimeSlots: entry.selectedSubcategories && entry.selectedSubcategories.length > 0 
              ? JSON.stringify(entry.selectedSubcategories.map(() => `${timeBucket}-${entryDate.getHours()}`))
              : null,
            createdAt: entryDate,
            updatedAt: entryDate
          }
        });
        createdEntries.push(moodEntry);
      } catch (error) {
        console.error('Error creating entry:', error);
        // Continue with other entries even if one fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Imported ${createdEntries.length} entries successfully`,
      count: createdEntries.length
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
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
