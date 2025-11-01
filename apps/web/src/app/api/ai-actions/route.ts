export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch AI suggestion actions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user'; // Default to dummy-user if not provided
    
    const actions = await db.aISuggestionAction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error('Error fetching AI actions:', error);
    return NextResponse.json({ error: 'Failed to fetch AI actions' }, { status: 500 });
  }
}

// POST - Create a new AI suggestion action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      suggestionId,
      title,
      description,
      action,
      type,
      priority,
      category,
      icon,
      reasoning
    } = body;

    if (!userId || !suggestionId || !title || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure user exists (create if not)
    try {
      await db.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          name: 'Demo User',
          email: `demo-${userId}@example.com` // Make email unique per user ID
        }
      });
    } catch (userError) {
      console.log('User already exists or created:', userError);
    }

    const aiAction = await db.aISuggestionAction.create({
      data: {
        userId,
        suggestionId,
        title,
        description: description || '',
        action,
        type: type || 'tip',
        priority: priority || 'medium',
        category: category || 'general',
        icon: icon || '💡',
        reasoning: reasoning || ''
      }
    });

    return NextResponse.json(aiAction);
  } catch (error) {
    console.error('Error creating AI action:', error);
    return NextResponse.json({ error: 'Failed to create AI action' }, { status: 500 });
  }
}
