export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const predefinedActivities = await db.predefinedActivity.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group activities by category for frontend
    const groupedActivities = predefinedActivities.reduce((acc, activity) => {
      if (!acc[activity.category]) {
        acc[activity.category] = [];
      }
      acc[activity.category].push(activity);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      activities: predefinedActivities,
      groupedActivities,
      total: predefinedActivities.length
    });
  } catch (error) {
    console.error('Error fetching predefined activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predefined activities' },
      { status: 500 }
    );
  }
}
