export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Bulk upsert GoalProgressDaily items for import testing
export async function POST(request: NextRequest) {
  try {
    const items = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected array' }, { status: 400 });
    }

    let count = 0;
    for (const item of items) {
      const userId = item.userId || 'dummy-user';
      const goalId = item.goalId;
      const date = item.date ? new Date(item.date) : new Date();
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const value = typeof item.value === 'number' ? item.value : parseInt(item.value || '0');

      if (!goalId) continue;

      await db.goalProgressDaily.upsert({
        where: { goalId_date: { goalId, date: localDate } },
        update: { value },
        create: { userId, goalId, date: localDate, value }
      });
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('Error importing GoalProgressDaily:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import GoalProgressDaily', details: error?.message },
      { status: 500 }
    );
  }
}


