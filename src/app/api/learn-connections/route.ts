export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, activity, outcome, isPositive, moodEntryId } = await request.json();

    if (!userId || !activity || !outcome || typeof isPositive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, activity, outcome, isPositive' },
        { status: 400 }
      );
    }

    // Find or create the connection
    let connection = await db.activityOutcomeConnection.findUnique({
      where: {
        userId_activity_outcome: {
          userId,
          activity,
          outcome
        }
      }
    });

    if (!connection) {
      // Create new connection
      connection = await db.activityOutcomeConnection.create({
        data: {
          userId,
          activity,
          outcome,
          strength: 1.0,
          positiveCount: isPositive ? 1 : 0,
          negativeCount: isPositive ? 0 : 1
        }
      });
    } else {
      // Update existing connection
      const newPositiveCount = connection.positiveCount + (isPositive ? 1 : 0);
      const newNegativeCount = connection.negativeCount + (isPositive ? 0 : 1);
      
      // Calculate new strength based on feedback ratio
      const totalFeedback = newPositiveCount + newNegativeCount;
      const positiveRatio = newPositiveCount / totalFeedback;
      
      // Strength ranges from 0.1 to 2.0
      // 0.5 ratio = 1.0 strength (neutral)
      // 1.0 ratio = 2.0 strength (very positive)
      // 0.0 ratio = 0.1 strength (very negative)
      const newStrength = Math.max(0.1, Math.min(2.0, 0.1 + (positiveRatio * 1.9)));

      connection = await db.activityOutcomeConnection.update({
        where: {
          id: connection.id
        },
        data: {
          positiveCount: newPositiveCount,
          negativeCount: newNegativeCount,
          strength: newStrength,
          lastUpdated: new Date()
        }
      });
    }

    // Also update the AI suggestion action if moodEntryId is provided
    if (moodEntryId) {
      await db.aISuggestionAction.updateMany({
        where: {
          userId,
          // We can match by mood entry context or other criteria
        },
        data: {
          helpful: isPositive,
          ratedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      connection: {
        activity: connection.activity,
        outcome: connection.outcome,
        strength: connection.strength,
        positiveCount: connection.positiveCount,
        negativeCount: connection.negativeCount
      }
    });

  } catch (error) {
    console.error('Error learning connection:', error);
    return NextResponse.json(
      { error: 'Failed to learn connection' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const connections = await db.activityOutcomeConnection.findMany({
      where: { userId },
      orderBy: { strength: 'desc' }
    });

    return NextResponse.json(connections);

  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}
