import { NextRequest, NextResponse } from 'next/server';
import { generateAIMotivationalQuote } from '@/lib/inspirationalQuotes';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    
    console.log('🎯 Fetching personalized quote for user:', userId);
    
    // Get user profile data
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log('❌ User not found, using random quote');
      return NextResponse.json({ 
        quote: "Your mental wellness journey starts here.",
        source: "system"
      });
    }
    
    // Get recent mood entries for context
    const recentEntries = await db.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    // Get active goals for goal-oriented quotes
    const activeGoals = await db.goal.findMany({
      where: { 
        userId,
        completed: false
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get recent activities from the latest entry
    let recentActivities: string[] = [];
    if (recentEntries.length > 0 && recentEntries[0].activities) {
      try {
        recentActivities = JSON.parse(recentEntries[0].activities);
      } catch (error) {
        console.log('⚠️ Error parsing activities:', error);
      }
    }
    
    // Parse user preferences
    const interests = user.interests ? JSON.parse(user.interests) : [];
    const quoteStyle = user.quoteStyle ? JSON.parse(user.quoteStyle) : [];
    const favoriteWriters = user.favoriteWriters ? user.favoriteWriters.split(',').map(w => w.trim()).filter(Boolean) : [];
    const favoriteMusicians = user.favoriteMusicians ? user.favoriteMusicians.split(',').map(m => m.trim()).filter(Boolean) : [];
    const favoriteSportsFigures = user.favoriteSportsFigures ? user.favoriteSportsFigures.split(',').map(s => s.trim()).filter(Boolean) : [];
    const favoriteArtists = user.favoriteArtists ? user.favoriteArtists.split(',').map(a => a.trim()).filter(Boolean) : [];
    const favoriteMovies = user.favoriteMovies ? user.favoriteMovies.split(',').map(m => m.trim()).filter(Boolean) : [];
    const favoritePhilosophers = user.favoritePhilosophers ? user.favoritePhilosophers.split(',').map(p => p.trim()).filter(Boolean) : [];
    
    // Get current mood if available
    let currentMood = null;
    if (recentEntries.length > 0) {
      currentMood = {
        valence: recentEntries[0].valence,
        energy: recentEntries[0].energy,
        focus: recentEntries[0].focus,
        stress: recentEntries[0].stress,
        sleep: recentEntries[0].sleep
      };
    }
    
    // Create user profile for AI quote generation
    const userProfile = {
      currentMood,
      gender: user.gender,
      age: user.age,
      personality: user.personality,
      universityLevel: user.universityLevel,
      fieldOfStudy: user.fieldOfStudy,
      interests,
      quoteStyle: quoteStyle.join(', '), // Convert array to string
      favoriteWriters,
      favoriteMusicians,
      favoriteSportsFigures,
      favoriteArtists,
      favoriteMovies,
      favoritePhilosophers,
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
    
    console.log('📊 User profile for quote generation:', {
      age: userProfile.age,
      gender: userProfile.gender,
      quoteStyle: userProfile.quoteStyle,
      interests: userProfile.interests,
      recentActivities: userProfile.recentActivities,
      favoriteWriters: userProfile.favoriteWriters,
      favoriteMusicians: userProfile.favoriteMusicians,
      favoriteSportsFigures: userProfile.favoriteSportsFigures,
      favoriteArtists: userProfile.favoriteArtists,
      favoriteMovies: userProfile.favoriteMovies,
      favoritePhilosophers: userProfile.favoritePhilosophers
    });
    
    // Generate personalized quote
    const quote = await generateAIMotivationalQuote(userProfile);
    
    console.log('✅ Generated personalized quote:', quote);
    
    return NextResponse.json({ 
      quote,
      source: "ai",
      userPreferences: {
        quoteStyle: userProfile.quoteStyle,
        interests: userProfile.interests,
        recentActivities: userProfile.recentActivities
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating personalized quote:', error);
    return NextResponse.json({ 
      quote: "Your mental wellness journey starts here.",
      source: "fallback",
      error: "Failed to generate personalized quote"
    });
  }
}
