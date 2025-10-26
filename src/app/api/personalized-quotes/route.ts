import { NextRequest, NextResponse } from 'next/server';
import { generateCoachingTip } from '@/lib/coachingTips';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    
    console.log('🎯 Fetching personalized quote for user:', userId);
    console.log('🔑 OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
    
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
      take: 3
    });

    // Get today's daily tracking data
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const dailyTracking = await db.dailyTracking.findFirst({
      where: { 
        userId,
        date: {
          gte: startOfToday,
          lt: endOfToday
        }
      }
    });

    // Get recent daily tracking data (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentDailyTracking = await db.dailyTracking.findMany({
      where: { 
        userId,
        date: {
          gte: sevenDaysAgo
        }
      },
      orderBy: { date: 'desc' }
    });

    // Get active goals for goal-oriented quotes
    const activeGoals = await db.goal.findMany({
      where: { 
        userId,
        completed: false
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get completed goals for positive reinforcement
    const completedGoals = await db.goal.findMany({
      where: { 
        userId,
        completed: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10 // Get last 10 completed goals
    });

    // Get achieved badges for capability recognition
    const achievedBadges = await db.achievement.findMany({
      where: { 
        userId
      },
      orderBy: { unlockedAt: 'desc' },
      take: 15 // Get last 15 achievements
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
    const favoriteWriters = user.favoriteWriters ? user.favoriteWriters.split(',').map(w => w.trim()).filter(Boolean) : [];
    const favoriteMusicians = user.favoriteMusicians ? user.favoriteMusicians.split(',').map(m => m.trim()).filter(Boolean) : [];
    const favoriteSportsFigures = user.favoriteSportsFigures ? user.favoriteSportsFigures.split(',').map(s => s.trim()).filter(Boolean) : [];
    const favoriteArtists = user.favoriteArtists ? user.favoriteArtists.split(',').map(a => a.trim()).filter(Boolean) : [];
    const favoriteMovies = user.favoriteMovies ? user.favoriteMovies.split(',').map(m => m.trim()).filter(Boolean) : [];
    const favoritePhilosophers = user.favoritePhilosophers ? user.favoritePhilosophers.split(',').map(p => p.trim()).filter(Boolean) : [];
    
    // Get current mood if available
    let currentMood = undefined;
    if (recentEntries.length > 0) {
      currentMood = {
        valence: recentEntries[0].valence,
        energy: recentEntries[0].energy,
        focus: recentEntries[0].focus,
        stress: recentEntries[0].stress
      };
    }

    // Get today's mood entries for average calculation
    const todayForMoods = new Date();
    const startOfTodayForMoods = new Date(todayForMoods.getFullYear(), todayForMoods.getMonth(), todayForMoods.getDate());
    const endOfTodayForMoods = new Date(todayForMoods.getFullYear(), todayForMoods.getMonth(), todayForMoods.getDate() + 1);
    
    const todayEntries = await db.moodEntry.findMany({
      where: { 
        userId,
        createdAt: {
          gte: startOfTodayForMoods,
          lt: endOfTodayForMoods
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate today's mood averages
    let todayMoodAverages = undefined;
    if (todayEntries.length > 0) {
      const totalEntries = todayEntries.length;
      todayMoodAverages = {
        valence: Math.round(todayEntries.reduce((sum, entry) => sum + entry.valence, 0) / totalEntries),
        energy: Math.round(todayEntries.reduce((sum, entry) => sum + entry.energy, 0) / totalEntries),
        focus: Math.round(todayEntries.reduce((sum, entry) => sum + entry.focus, 0) / totalEntries),
        stress: Math.round(todayEntries.reduce((sum, entry) => sum + entry.stress, 0) / totalEntries),
         sleep: Math.round(todayEntries.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / totalEntries),
        entryCount: totalEntries
      };
    }

    // Get Power Hours data for TODAY ONLY - using monthly window (same as dashboard)
    let powerHoursData = undefined;
    try {
      const powerHoursResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/power-hours?userId=${userId}&window=monthly`);
      if (powerHoursResponse.ok) {
        const powerHours = await powerHoursResponse.json();
        
        // Filter to only show today's power hours
        const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
        const todayPowerHours = powerHours.insights?.mostProductiveHours?.filter((hour: any) => hour.day === currentDay) || [];
        
        powerHoursData = {
          data: powerHours.data || [], // Full Power Hours data for all days
          mostProductiveHours: todayPowerHours,
          bestDay: powerHours.insights?.bestDay || null,
          bestDeepWorkHours: powerHours.insights?.bestDeepWorkHours || [],
          recommendations: powerHours.insights?.recommendations || [],
          currentDay: currentDay,
          hasTodayData: todayPowerHours.length > 0
        };
      }
    } catch (error) {
      console.log('⚠️ Error fetching Power Hours data:', error);
    }
    
    // Create user profile for AI quote generation
    const userProfile = {
      currentMood,
      todayMoodAverages, // Today's mood averages
      powerHoursData, // Power Hours insights
      gender: user.gender || undefined,
      age: user.age || undefined,
      personality: user.personality || undefined,
      universityLevel: user.universityLevel || undefined,
      fieldOfStudy: user.fieldOfStudy || undefined,
      interests,
      favoriteWriters,
      favoriteMusicians,
      favoriteSportsFigures,
      favoriteArtists,
      favoriteMovies,
      favoritePhilosophers,
      recentActivities: recentActivities,
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
      })),
      completedGoals: completedGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        subcategory: goal.subcategory,
        targetValue: goal.targetValue,
        completedAt: goal.updatedAt,
        difficulty: goal.difficulty,
        finalStreak: goal.streak
      })),
      achievedBadges: achievedBadges.map(badge => ({
        id: badge.id,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        stars: badge.stars,
        type: badge.type,
        unlockedAt: badge.unlockedAt
      })),
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening',
      
      // Enhanced data for better AI coaching
      sleepData: {
        today: dailyTracking ? {
          sleepHours: dailyTracking.sleepHours,
        } : null,
        recent: recentDailyTracking.map(day => ({
          date: day.date,
          sleepHours: day.sleepHours,
        }))
      },
      
      hydrationData: {
        today: dailyTracking ? {
          waterIntake: dailyTracking.waterIntake,
        } : null,
        recent: recentDailyTracking.map(day => ({
          date: day.date,
          waterIntake: day.waterIntake,
        }))
      },
      
      exerciseData: {
        today: dailyTracking ? {
          exerciseType: dailyTracking.exerciseType,
          steps: dailyTracking.steps
        } : null,
        recent: recentDailyTracking.map(day => ({
          date: day.date,
          exerciseType: day.exerciseType,
          steps: day.steps
        }))
      },
      
      periodData: user.gender === 'female' ? {
        symptoms: []
      } : null,
      
      moodTrends: {
        recent: recentEntries.map(entry => ({
          date: entry.createdAt.toISOString().split('T')[0],
          valence: entry.valence,
          energy: entry.energy,
          stress: entry.stress,
          sleep: entry.sleep,
          activities: entry.activities ? JSON.parse(entry.activities) : []
        })),
        average: recentEntries.length > 0 ? {
          valence: Math.round(recentEntries.reduce((sum, entry) => sum + entry.valence, 0) / recentEntries.length),
          energy: Math.round(recentEntries.reduce((sum, entry) => sum + entry.energy, 0) / recentEntries.length),
          stress: Math.round(recentEntries.reduce((sum, entry) => sum + entry.stress, 0) / recentEntries.length),
          sleep: Math.round(recentEntries.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / recentEntries.length)
        } : null
      },
      
      dssScore: dailyTracking ? dailyTracking.dssScore : null,
      
      // Today's specific activities and progress
      todayActivities: {
        moodEntry: recentEntries.length > 0 ? {
          time: recentEntries[0].createdAt.toISOString(),
          valence: recentEntries[0].valence,
          energy: recentEntries[0].energy,
          stress: recentEntries[0].stress,
          sleep: recentEntries[0].sleep,
          activities: recentEntries[0].activities ? JSON.parse(recentEntries[0].activities) : [],
          notes: recentEntries[0].notes
        } : null,
        dailyTracking: dailyTracking ? {
          sleepHours: dailyTracking.sleepHours,
          waterIntake: dailyTracking.waterIntake,
          steps: dailyTracking.steps,
          dssScore: dailyTracking.dssScore
        } : null,
        goalsProgress: activeGoals.map(goal => ({
          title: goal.title,
          progress: `${goal.currentValue}/${goal.targetValue}`,
          streak: goal.streak
        }))
      }
    };
    
    console.log('📊 User profile for quote generation:', {
      age: userProfile.age,
      gender: userProfile.gender,
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
    console.log('🎯 About to call generateCoachingTip with profile:', JSON.stringify(userProfile, null, 2));
    const quote = await generateCoachingTip(userProfile);
    console.log('✅ Generated personalized quote:', quote);
    
    return NextResponse.json({ 
      quote,
      source: "ai",
      userPreferences: {
        interests: userProfile.interests,
        recentActivities: userProfile.recentActivities
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating personalized quote:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ 
      quote: "Your mental wellness journey starts here.",
      source: "fallback",
      error: `Failed to generate personalized quote: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
