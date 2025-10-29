import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    
    // Create mood entries in the test database with all fields
    const createdEntries = [];
    const errors = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        // Use createdAt if provided (from import), otherwise use entry.date or current time
        // createdAt should be a Date object with the correct millisecond timestamp
        const entryCreatedAt = entry.createdAt ? new Date(entry.createdAt) : (entry.date ? new Date(entry.date) : new Date());
        const entryUpdatedAt = entry.updatedAt ? new Date(entry.updatedAt) : entryCreatedAt;
        const timeBucket = entry.timeBucket || getTimeBucket(entryCreatedAt);
        
        const data = {
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
          createdAt: entryCreatedAt,
          updatedAt: entryUpdatedAt,
        };

        const moodEntry = entry.id
          ? await db.moodEntry.upsert({
              where: { id: entry.id },
              update: data,
              create: { id: entry.id, ...data },
            })
          : await db.moodEntry.create({
              data,
            });
        createdEntries.push(moodEntry);
      } catch (error: any) {
        console.error(`Error creating entry ${i}:`, error?.message || error);
        errors.push({ index: i, error: error?.message || String(error) });
      }
    }
    
    console.log(`Imported ${createdEntries.length}/${entries.length} entries. Errors: ${errors.length}`);
    
    // Using shared Prisma client from lib/db (no explicit disconnect)
    
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
