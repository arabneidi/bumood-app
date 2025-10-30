export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json();
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'entries must be an array' }, { status: 400 });
    }

    const userId = 'dummy-user';
    let count = 0;
    for (const e of entries) {
      try {
        // createdAt may be ISO string or Date
        const createdAt = e.createdAt ? new Date(e.createdAt) : new Date();
        const activities = Array.isArray(e.activities) ? JSON.stringify(e.activities) : (typeof e.activities === 'string' ? e.activities : '[]');
        const selectedSubcategories = Array.isArray(e.selectedSubcategories) ? JSON.stringify(e.selectedSubcategories) : (typeof e.selectedSubcategories === 'string' ? e.selectedSubcategories : '[]');
        const selectedTimeSlots = Array.isArray(e.selectedTimeSlots) ? JSON.stringify(e.selectedTimeSlots) : (typeof e.selectedTimeSlots === 'string' ? e.selectedTimeSlots : '[]');
        const activityEntries = Array.isArray(e.activityEntries) ? JSON.stringify(e.activityEntries) : (typeof e.activityEntries === 'string' ? e.activityEntries : null);

        await db.moodEntry.create({
          data: {
            userId,
            valence: parseInt(e.valence ?? 5),
            energy: parseInt(e.energy ?? 5),
            focus: parseInt(e.focus ?? 5),
            stress: parseInt(e.stress ?? 5),
            sleep: e.sleep != null ? parseFloat(e.sleep) : null,
            notes: e.notes || null,
            activities,
            selectedTimeSlots,
            selectedSubcategories,
            activityEntries,
            dssAnalysis: e.dssAnalysis || null,
            reflection: e.reflection || null,
            voiceNote: e.voiceNote || null,
            aiSuggestion: e.aiSuggestion || null,
            timeBucket: e.timeBucket || 'morning',
            onPeriod: !!e.onPeriod,
            periodDay: e.periodDay != null ? parseInt(e.periodDay) : null,
            waterIntake: e.waterIntake != null ? parseInt(e.waterIntake) : null,
            mealsEaten: e.mealsEaten != null ? parseInt(e.mealsEaten) : null,
            mealQuality: e.mealQuality || null,
            caffeine: e.caffeine != null ? parseInt(e.caffeine) : null,
            alcohol: e.alcohol != null ? parseInt(e.alcohol) : null,
            moodComposite: e.moodComposite != null ? parseFloat(e.moodComposite) : null,
            createdAt,
            updatedAt: createdAt
          }
        });
        count++;
      } catch (err) {
        console.error('Import mood entry failed:', err);
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('Error importing mood entries:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to import' }, { status: 500 });
  }
}


