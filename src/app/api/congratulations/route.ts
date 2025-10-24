import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, description, icon, stars } = await request.json();

    if (!userId || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title' },
        { status: 400 }
      );
    }

    // Get user name for personalization
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });

    const userName = user?.name || 'there';

    // Create congratulation message based on type
    let congratulationMessage = '';
    let actionMessage = '';

    if (type === 'goal_completed') {
      congratulationMessage = `🎉 Congratulations ${userName}! You've successfully completed your goal: "${title}"!`;
      actionMessage = `Your dedication and hard work have paid off. This achievement shows your commitment to personal growth and self-improvement.`;
    } else if (type === 'achievement_unlocked') {
      const starText = stars === 1 ? '⭐' : stars === 2 ? '⭐⭐' : '⭐⭐⭐';
      congratulationMessage = `🏆 Amazing work ${userName}! You've earned the "${title}" badge! ${starText}`;
      actionMessage = description || 'Your consistent efforts and dedication have been recognized. Keep up the fantastic work!';
    } else if (type === 'streak_milestone') {
      congratulationMessage = `🔥 Fantastic ${userName}! You've reached a ${title} streak!`;
      actionMessage = `Your consistency and commitment to your wellness journey is truly inspiring. You're building powerful habits!`;
    } else if (type === 'progress_milestone') {
      congratulationMessage = `📈 Great progress ${userName}! You've reached ${title} on your goal!`;
      actionMessage = `You're making excellent progress toward your objectives. Every step forward counts!`;
    }

    // Create congratulation record
    const congratulation = await db.congratulation.create({
      data: {
        userId,
        type,
        title,
        message: congratulationMessage,
        actionMessage,
        icon: icon || '🎉',
        stars: stars || 1,
        isRead: false,
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      congratulation: {
        id: congratulation.id,
        type: congratulation.type,
        title: congratulation.title,
        message: congratulation.message,
        actionMessage: congratulation.actionMessage,
        icon: congratulation.icon,
        stars: congratulation.stars,
        isRead: congratulation.isRead,
        createdAt: congratulation.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating congratulation:', error);
    return NextResponse.json(
      { error: 'Failed to create congratulation' },
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

    const congratulations = await db.congratulation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10 // Last 10 congratulations
    });

    return NextResponse.json(congratulations);

  } catch (error) {
    console.error('Error fetching congratulations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch congratulations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, isRead } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const updatedCongratulation = await db.congratulation.update({
      where: { id },
      data: { isRead }
    });

    return NextResponse.json(updatedCongratulation);

  } catch (error) {
    console.error('Error updating congratulation:', error);
    return NextResponse.json(
      { error: 'Failed to update congratulation' },
      { status: 500 }
    );
  }
}
