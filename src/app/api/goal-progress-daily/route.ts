export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';

    const items = await db.goalProgressDaily.findMany({
      where: { userId },
      orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }]
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching GoalProgressDaily:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GoalProgressDaily', details: error?.message },
      { status: 500 }
    );
  }
}


