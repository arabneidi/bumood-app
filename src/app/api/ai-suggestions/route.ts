export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { generateAISuggestions, UserMoodProfile } from '@/lib/aiService';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    
    console.log('🤖 Fetching AI suggestions for user:', userId);
    
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
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

    // Debug period data
    console.log('🔍 Period Debug - Recent entries:', recentEntries.length);
    if (recentEntries.length > 0) {
      console.log('🔍 Period Debug - Most recent entry:', {
        onPeriod: recentEntries[0].onPeriod,
        periodDay: recentEntries[0].periodDay,
        createdAt: recentEntries[0].createdAt
      });
    }

    // Create user profile for AI suggestions
    const userProfile: UserMoodProfile = {
      currentMood: recentEntries.length > 0 ? {
        valence: recentEntries[0].valence,
        energy: recentEntries[0].energy,
        focus: recentEntries[0].focus,
        stress: recentEntries[0].stress,
        sleep: recentEntries[0].sleep || undefined
      } : {
        valence: 5,
        energy: 5,
        focus: 5,
        stress: 5,
        sleep: undefined
      },
      userInfo: {
        gender: user.gender || undefined,
        age: user.age || undefined,
        personality: personality || undefined,
        universityLevel: universityLevel || undefined,
        fieldOfStudy: fieldOfStudy || undefined,
        onPeriod: recentEntries.length > 0 ? recentEntries[0].onPeriod : false,
        periodDay: recentEntries.length > 0 ? recentEntries[0].periodDay : undefined
      },
      userPreferences: {
        interests,
        favoriteWriters: user.favoriteWriters ? (user.favoriteWriters.startsWith('[') ? JSON.parse(user.favoriteWriters) : user.favoriteWriters.split(',').map(s => s.trim())) : [],
        favoriteSportsFigures: user.favoriteSportsFigures ? (user.favoriteSportsFigures.startsWith('[') ? JSON.parse(user.favoriteSportsFigures) : user.favoriteSportsFigures.split(',').map(s => s.trim())) : [],
        favoriteMusicians: user.favoriteMusicians ? (user.favoriteMusicians.startsWith('[') ? JSON.parse(user.favoriteMusicians) : user.favoriteMusicians.split(',').map(s => s.trim())) : [],
        favoriteArtists: user.favoriteArtists ? (user.favoriteArtists.startsWith('[') ? JSON.parse(user.favoriteArtists) : user.favoriteArtists.split(',').map(s => s.trim())) : [],
        favoriteMovies: user.favoriteMovies ? (user.favoriteMovies.startsWith('[') ? JSON.parse(user.favoriteMovies) : user.favoriteMovies.split(',').map(s => s.trim())) : [],
        favoritePhilosophers: user.favoritePhilosophers ? (user.favoritePhilosophers.startsWith('[') ? JSON.parse(user.favoritePhilosophers) : user.favoritePhilosophers.split(',').map(s => s.trim())) : []
      },
      recentEntries: recentEntries,
      moodHistory: {
        avgValence: recentEntries.length > 0 ? recentEntries.reduce((sum, entry) => sum + entry.valence, 0) / recentEntries.length : 5,
        valenceTrend: 0,
        stressPattern: recentEntries.length > 0 ? recentEntries.reduce((sum, entry) => sum + entry.stress, 0) / recentEntries.length : 5,
        energyPattern: recentEntries.length > 0 ? recentEntries.reduce((sum, entry) => sum + entry.energy, 0) / recentEntries.length : 5,
        sleepPattern: recentEntries.length > 0 ? recentEntries.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / recentEntries.length : 8
      },
      successfulSolutions: [],
      commonActivities: recentActivities,
      timeOfDay: (() => {
        const hour = new Date().getHours();
        if ([5, 6, 7, 8, 9, 10].includes(hour)) return 'morning';
        if ([11, 12, 13, 14, 15, 16].includes(hour)) return 'midday';
        if ([17, 18, 19, 20, 21, 22].includes(hour)) return 'evening';
        return 'night'; // [23, 0, 1, 2, 3, 4]
      })(),
      activeGoals: activeGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description || undefined,
        category: goal.category,
        subcategory: goal.subcategory || undefined,
        targetValue: goal.targetValue || 0,
        currentValue: goal.currentValue,
        progressPercentage: (goal.targetValue || 0) > 0 ? Math.round((goal.currentValue / (goal.targetValue || 1)) * 100) : 0,
        difficulty: goal.difficulty,
        streak: goal.streak,
        completed: goal.completed
      }))
    };

    console.log('📊 User profile for AI suggestions:', {
      age: userProfile.userInfo?.age,
      gender: userProfile.userInfo?.gender,
      personality: userProfile.userInfo?.personality,
      onPeriod: userProfile.userInfo?.onPeriod,
      periodDay: userProfile.userInfo?.periodDay,
      interests: userProfile.userPreferences?.interests,
      recentActivities: userProfile.commonActivities,
      activeGoals: userProfile.activeGoals?.length || 0
    });

    const suggestions = await generateAISuggestions(userProfile, apiKey);
    console.log('✅ Generated AI suggestions:', suggestions.length);
    
    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json({ 
      error: 'Failed to generate AI suggestions',
      errorDetails: error instanceof Error ? error.message : 'Unknown error',
      suggestions: []
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = body as UserMoodProfile;
    const clientApiKey = body.apiKey; // Accept API key from client if provided

    // Try client-provided key first, then server env vars
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
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
      description: goal.description || undefined,
      category: goal.category,
      subcategory: goal.subcategory || undefined,
      targetValue: goal.targetValue || 0,
      currentValue: goal.currentValue,
      progressPercentage: (goal.targetValue || 0) > 0 ? Math.round((goal.currentValue / (goal.targetValue || 1)) * 100) : 0,
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

    // Pass API key to generateAISuggestions if provided from client
    const suggestions = await generateAISuggestions(profileWithGoals, apiKey);
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    console.error('AI suggestions API error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Failed to generate suggestions' }, { status: 500 });
  }
}


