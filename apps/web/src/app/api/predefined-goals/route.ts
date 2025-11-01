export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const predefinedGoals = await db.predefinedGoal.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { subcategory: 'asc' },
        { title: 'asc' }
      ]
    });

    // Group goals by category and subcategory for frontend
    const groupedGoals = predefinedGoals.reduce((acc, goal) => {
      if (!acc[goal.category]) {
        acc[goal.category] = {};
      }
      if (!acc[goal.category][goal.subcategory]) {
        acc[goal.category][goal.subcategory] = [];
      }
      acc[goal.category][goal.subcategory].push(goal);
      return acc;
    }, {} as Record<string, Record<string, any[]>>);

    return NextResponse.json({
      success: true,
      goals: predefinedGoals,
      groupedGoals,
      total: predefinedGoals.length
    });
  } catch (error) {
    console.error('Error fetching predefined goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predefined goals' },
      { status: 500 }
    );
  }
}
