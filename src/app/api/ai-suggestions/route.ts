import { NextRequest, NextResponse } from 'next/server';
import { generateAISuggestions, UserMoodProfile } from '@/lib/aiService';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    
    console.log('🤖 Fetching AI suggestions for user:', userId);
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 });
    }

    // Get user profile data
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent mood entries
    const recentEntries = await db.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get active goals
    const activeGoals = await db.goal.findMany({
      where: { 
        userId,
        completed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    // Parse user preferences
    const interests = user.interests ? JSON.parse(user.interests) : [];
    const personality = user.personality;
    const universityLevel = user.universityLevel;
    const fieldOfStudy = user.fieldOfStudy;
    
    // Get recent activities from the latest entry
    let recentActivities: string[] = [];
    if (recentEntries.length > 0 && recentEntries[0].activities) {
      try {
        recentActivities = JSON.parse(recentEntries[0].activities);
      } catch (error) {
        console.log('⚠️ Error parsing activities:', error);
      }
    }

    // Create user profile for AI suggestions
    const userProfile: UserMoodProfile = {
      currentMood: recentEntries.length > 0 ? {
        valence: recentEntries[0].valence,
        energy: recentEntries[0].energy,
        focus: recentEntries[0].focus,
        stress: recentEntries[0].stress,
        sleep: recentEntries[0].sleep
      } : null,
      gender: user.gender,
      age: user.age,
      personality,
      universityLevel,
      fieldOfStudy,
      interests,
      recentActivities,
      activeGoals: activeGoals.map(goal => ({
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
      })),
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'
    };

    console.log('📊 User profile for AI suggestions:', {
      age: userProfile.age,
      gender: userProfile.gender,
      personality: userProfile.personality,
      interests: userProfile.interests,
      recentActivities: userProfile.recentActivities,
      activeGoals: userProfile.activeGoals?.length || 0
    });

    const suggestions = await generateAISuggestions(userProfile);
    console.log('✅ Generated AI suggestions:', suggestions.length);
    
    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI suggestions',
      suggestions: []
    }, { status: 500 });
  }
}

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


