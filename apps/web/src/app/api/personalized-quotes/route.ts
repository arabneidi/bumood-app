export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { generateCoachingTip } from '@/lib/coachingTips';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const clientApiKey = searchParams.get('apiKey'); // Accept API key from query param
    const forceRegenerate = searchParams.get('forceRegenerate') === 'true'; // Force regeneration
    
    console.log('🎯 API called - userId:', userId, 'forceRegenerate:', forceRegenerate);
    console.log('🔍 Prisma client has proTip model:', typeof (db as any).proTip !== 'undefined');
    
    // Check for API key (from client or server environment)
    // Server env var takes priority for global access
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
    console.log('🔑 OpenAI API Key available:', !!apiKey);
    
    if (!apiKey && forceRegenerate) {
      console.error('❌ No API key available for Pro Tip generation');
      // Try to return existing Pro Tip from database
      const existingProTip = await db.proTip.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });
      
      if (existingProTip && existingProTip.tip !== "Your mental wellness journey starts here.") {
        console.log('✅ No API key - returning existing Pro Tip from database');
        return NextResponse.json({ 
          quote: existingProTip.tip,
          source: existingProTip.source,
          cached: true
        });
      }
      
      return NextResponse.json({ 
        quote: "Your mental wellness journey starts here.",
        source: "fallback",
        error: "No API key available for Pro Tip generation"
      });
    }
    
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
    
    // Simple: Check database for existing Pro Tip (unless forcing regeneration)
    if (!forceRegenerate) {
      try {
        // Check if Prisma client has the model
        if (typeof (db as any).proTip === 'undefined') {
          console.log('⚠️ Prisma client does not have proTip model - server needs restart');
          return NextResponse.json({ 
            quote: "Your mental wellness journey starts here.",
            source: "fallback",
            error: "Prisma client needs restart"
          });
        }
        
        console.log('🔍 Checking database for existing Pro Tip...');
        const existingProTip = await db.proTip.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' }
        });
        
        if (existingProTip) {
          console.log('📦 Found Pro Tip in database:', { 
            hasTip: !!existingProTip.tip, 
            tipLength: existingProTip.tip?.length || 0,
            source: existingProTip.source 
          });
          
          if (existingProTip.tip && existingProTip.tip !== "Your mental wellness journey starts here.") {
            console.log('✅ Returning saved Pro Tip from database');
            return NextResponse.json({ 
              quote: existingProTip.tip,
              source: existingProTip.source,
              cached: true
            });
          } else {
            console.log('⚠️ Pro Tip in database is fallback - will generate new one');
          }
        } else {
          console.log('📭 No Pro Tip found in database');
        }
      } catch (dbError) {
        console.error('❌ Error reading Pro Tip:', dbError instanceof Error ? dbError.message : String(dbError));
        console.error('❌ Error stack:', dbError instanceof Error ? dbError.stack?.substring(0, 200) : 'No stack');
        return NextResponse.json({ 
          quote: "Your mental wellness journey starts here.",
          source: "fallback",
          error: dbError instanceof Error ? dbError.message : "Database read failed"
        });
      }
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
      recentEntries: todayEntries, // Add today's entries for activity filtering
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
    console.log('🎯 About to call generateCoachingTip with profile');
    console.log('🔑 API Key available:', !!apiKey, 'Length:', apiKey?.length || 0);
    let quote: string;
    try {
      if (!apiKey) {
        throw new Error('No API key provided for Pro Tip generation');
      }
      quote = await generateCoachingTip(userProfile, apiKey);
      console.log('✅ Generated personalized quote:', quote?.substring(0, 100) + '...');
      
      // Validate quote is not empty
      if (!quote || quote.trim().length === 0) {
        console.error('❌ Generated quote is empty, using fallback');
        quote = "Your mental wellness journey starts here.";
      }
    } catch (genError) {
      console.error('❌ Error in generateCoachingTip:', genError);
      if (genError instanceof Error) {
        console.error('Error message:', genError.message);
        console.error('Error stack:', genError.stack?.substring(0, 200));
      }
      quote = "Your mental wellness journey starts here.";
    }
    
    // Save Pro Tip to database (upsert - update if exists, create if not)
    // Only save if it's not the fallback quote
    let savedToDB = false;
    if (quote && quote !== "Your mental wellness journey starts here." && quote.trim().length > 0) {
      try {
        // Check if Prisma client has ProTip model
        if (!db.proTip) {
          console.error('❌ Prisma client does not have ProTip model - server needs restart');
          console.log('⚠️ Pro Tip generated but cannot save to database until server restarts');
          savedToDB = false;
        } else {
          const existingProTip = await db.proTip.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
          });
          
          if (existingProTip) {
            // Update existing Pro Tip
            await db.proTip.update({
              where: { id: existingProTip.id },
              data: {
                tip: quote,
                source: "ai",
                updatedAt: new Date()
              }
            });
            savedToDB = true;
            console.log('💾 Updated existing Pro Tip in database:', quote.substring(0, 50) + '...');
          } else {
            // Create new Pro Tip
            await db.proTip.create({
              data: {
                userId,
                tip: quote,
                source: "ai"
              }
            });
            savedToDB = true;
            console.log('💾 Created new Pro Tip in database:', quote.substring(0, 50) + '...');
          }
        }
      } catch (error) {
        console.error('⚠️ Error saving Pro Tip to database:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          if (error.message.includes('findFirst') || error.message.includes('proTip')) {
            console.log('⚠️ Prisma client needs restart to access ProTip model');
          }
        }
        savedToDB = false;
        // Continue even if save fails
      }
    } else {
      console.log('⚠️ Skipping save - quote is fallback or empty');
      savedToDB = false;
    }
    
    // Determine source based on whether quote was actually generated
    const isFallback = quote === "Your mental wellness journey starts here.";
    const response = { 
      quote,
      source: isFallback ? "fallback" : "ai",
      cached: false,
      savedToDB: savedToDB,
      userPreferences: {
        interests: userProfile.interests,
        recentActivities: userProfile.recentActivities
      }
    };
    console.log('📤 Returning Pro Tip response:', { 
      quote: quote.substring(0, 100) + '...', 
      source: response.source, 
      cached: response.cached,
      savedToDB: response.savedToDB
    });
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Error generating personalized quote:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    // Try to return existing Pro Tip from database even on error
    try {
      if (db.proTip) {
        const existingProTip = await db.proTip.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' }
        });
        
        if (existingProTip && existingProTip.tip !== "Your mental wellness journey starts here.") {
          console.log('✅ Returning existing Pro Tip from database despite error');
          return NextResponse.json({ 
            quote: existingProTip.tip,
            source: existingProTip.source,
            cached: true
          });
        }
      }
    } catch (dbError) {
      console.error('❌ Error fetching existing Pro Tip:', dbError);
    }
    
    return NextResponse.json({ 
      quote: "Your mental wellness journey starts here.",
      source: "fallback",
      error: `Failed to generate personalized quote: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
