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
    
    // Create mood entries in the database
    const createdEntries = [];
    for (const entry of entries) {
      try {
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
            selectedSubcategories: JSON.stringify(entry.subcategories || []),
            createdAt: entry.date ? new Date(entry.date) : new Date(),
            selectedTimeSlots: null
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
