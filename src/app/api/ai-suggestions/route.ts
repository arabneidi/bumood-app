import { NextRequest, NextResponse } from 'next/server';
import { generateAISuggestions, UserMoodProfile } from '@/lib/aiService';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = body as UserMoodProfile;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 });
    }

    // Fetch active goals and add to profile
    const activeGoals = await db.goal.findMany({
      where: { 
        userId: 'dummy-user',
        completed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    const goalsWithProgress = activeGoals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      subcategory: goal.subcategory,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      progressPercentage: goal.targetValue > 0 ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0,
      difficulty: goal.difficulty,
      streak: goal.streak,
      completed: goal.completed
    }));

    // Add goals to profile
    const profileWithGoals = {
      ...profile,
      activeGoals: goalsWithProgress
    };

    console.log('🎯 Active goals for AI suggestions:', goalsWithProgress);

    const suggestions = await generateAISuggestions(profileWithGoals);
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    console.error('AI suggestions API error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Failed to generate suggestions' }, { status: 500 });
  }
}


