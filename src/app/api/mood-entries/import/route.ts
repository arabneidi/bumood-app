export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
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
        // Determine authoritative local timestamp for this entry
        // 1) latest activityEntries[].exactTime
        // 2) entry.entryDate (YYYY-MM-DD) + current local time
        // 3) entry.date (legacy) or local now
        const nowLocal = new Date();
        const todayLocalStr = new Date().toISOString().split('T')[0];
        let chosenCreatedAt: Date | null = null;

        // Try activityEntries
        if (entry.activityEntries) {
          try {
            const parsed = Array.isArray(entry.activityEntries) ? entry.activityEntries : JSON.parse(entry.activityEntries);
            const latest = parsed
              .map((e: any) => (e?.exactTime ? new Date(e.exactTime) : null))
              .filter((d: Date | null) => d instanceof Date && !isNaN((d as Date).getTime()))
              .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
            if (latest) chosenCreatedAt = latest;
          } catch {}
        }

        // Try entryDate (preferred) or date (legacy) if no activities
        const srcDate = entry.entryDate || entry.date;
        if (!chosenCreatedAt && srcDate) {
          const ds = String(srcDate).slice(0, 10);
          if (ds === todayLocalStr) {
            chosenCreatedAt = nowLocal;
          } else {
            const hh = String(nowLocal.getHours()).padStart(2, '0');
            const mm = String(nowLocal.getMinutes()).padStart(2, '0');
            chosenCreatedAt = new Date(`${ds}T${hh}:${mm}:00`);
          }
        }

        if (!chosenCreatedAt) chosenCreatedAt = nowLocal;

        const timeBucket = entry.timeBucket || getTimeBucket(chosenCreatedAt);
        
        // If onPeriod is true, add "Menstruation" activity at 12pm
        // If alcohol > 0, add "Drinking" activity at 12pm
        let finalActivities: string[] = [];
        let finalActivityEntries: any[] = [];
        
        try {
          finalActivities = Array.isArray(entry.activities) ? entry.activities : (entry.activities ? JSON.parse(entry.activities) : []);
          if (!Array.isArray(finalActivities)) finalActivities = [];
        } catch {
          finalActivities = [];
        }
        
        try {
          finalActivityEntries = Array.isArray(entry.activityEntries) ? entry.activityEntries : (entry.activityEntries ? JSON.parse(entry.activityEntries) : []);
          if (!Array.isArray(finalActivityEntries)) finalActivityEntries = [];
        } catch {
          finalActivityEntries = [];
        }
        
        if (entry.onPeriod === true && !finalActivities.includes('Menstruation')) {
          console.log(`🩸 Adding Menstruation activity for imported period entry`);
          
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

        // Drinking based on alcohol > 0
        if ((entry.alcohol || 0) > 0 && !finalActivities.includes('Drinking')) {
          console.log(`🍺 Adding Drinking activity for imported alcohol day`);
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
        
        const moodEntry = await db.moodEntry.create({
          data: {
            userId,
            valence: entry.valence || 5,
            energy: entry.energy || 5,
            focus: entry.focus || 5,
            stress: entry.stress || 5,
            sleep: entry.sleep || 7,
            notes: entry.notes || null,
            activities: JSON.stringify(finalActivities),
            selectedSubcategories: JSON.stringify(entry.selectedSubcategories || []),
            activityEntries: finalActivityEntries.length > 0 ? JSON.stringify(finalActivityEntries) : null,
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
            selectedTimeSlots: entry.selectedTimeSlots ? JSON.stringify(entry.selectedTimeSlots) : null,
            createdAt: chosenCreatedAt,
            updatedAt: chosenCreatedAt
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
