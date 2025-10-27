import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json();
    
    console.log('Import-test API called with entries:', entries?.length);
    
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Invalid entries data' },
        { status: 400 }
      );
    }

    const userId = 'dummy-user';
    
    // Create a PrismaClient with absolute path to dev.db (test database)
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const db = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    });
    
    // Verify testDb connection by checking database URL
    console.log('Test database URL (dev.db):', `file:${dbPath}`);
    
    // Create mood entries in the test database with all fields
    const createdEntries = [];
    const errors = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        // Get entry date and set time bucket
        const entryDate = entry.date ? new Date(entry.date) : new Date();
        const timeBucket = entry.timeBucket || getTimeBucket(entryDate);
        
        const moodEntry = await db.moodEntry.create({
          data: {
            id: entry.id, // Use the ID from CSV
            userId,
            valence: entry.valence || 5,
            energy: entry.energy || 5,
            focus: entry.focus || 5,
            stress: entry.stress || 5,
            sleep: entry.sleep || 7,
            notes: entry.notes || null,
            activities: JSON.stringify(entry.activities || []),
            selectedTimeSlots: entry.selectedTimeSlots ? JSON.stringify(entry.selectedTimeSlots) : null,
            selectedSubcategories: JSON.stringify(entry.selectedSubcategories || []),
            activityEntries: entry.activityEntries ? JSON.stringify(entry.activityEntries) : null,
            dssAnalysis: entry.dssAnalysis || null,
            reflection: entry.reflection || null,
            onPeriod: entry.onPeriod || false,
            periodDay: entry.periodDay || null,
            waterIntake: entry.waterIntake || null,
            mealsEaten: entry.mealsEaten || null,
            mealQuality: entry.mealQuality || null,
            caffeine: entry.caffeine || null,
            alcohol: entry.alcohol || null,
            timeBucket,
            moodComposite: entry.moodComposite || null,
            createdAt: entryDate,
            updatedAt: entryDate
          }
        });
        createdEntries.push(moodEntry);
      } catch (error: any) {
        console.error(`Error creating entry ${i}:`, error?.message || error);
        errors.push({ index: i, error: error?.message || String(error) });
      }
    }
    
    console.log(`Imported ${createdEntries.length}/${entries.length} entries. Errors: ${errors.length}`);
    
    // Close the Prisma client
    await db.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: `Imported ${createdEntries.length} entries successfully to TEST database`,
      count: createdEntries.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data', details: error?.message },
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
