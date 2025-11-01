export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { generateCoachingTip } from '@/lib/coachingTips';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';

    // Fetch user data
    const userResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user?userId=${userId}`);
    const userData = await userResponse.json();

    // Fetch recent mood entries
    const entriesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mood-entries?userId=${userId}&limit=20`);
    const entriesData = await entriesResponse.json();

    // Fetch Power Hours data (monthly window)
    const powerHoursResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/power-hours?userId=${userId}&window=monthly`);
    const powerHoursData = await powerHoursResponse.json();

    // Fetch activity drivers
    const driversResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/drivers?userId=${userId}`);
    const driversData = await driversResponse.json();

    // Get current time
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Construct user profile exactly like personalized-quotes API
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const todayPowerHours = powerHoursData.insights?.mostProductiveHours?.filter((hour: any) => hour.day === currentDay) || [];
    
    const powerHoursDataForCoaching = {
      data: powerHoursData.data || [], // Full Power Hours data for all days
      mostProductiveHours: todayPowerHours,
      bestDay: powerHoursData.insights?.bestDay || null,
      bestDeepWorkHours: powerHoursData.insights?.bestDeepWorkHours || [],
      recommendations: powerHoursData.insights?.recommendations || [],
      currentDay: currentDay,
      hasTodayData: todayPowerHours.length > 0
    };

    // Calculate today's mood averages
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entriesData.filter((entry: any) => {
      const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
      return entryDate === today;
    });

    const todayMoodAverages = todayEntries.length > 0 ? {
      valence: todayEntries.reduce((sum: number, entry: any) => sum + (entry.valence || 0), 0) / todayEntries.length,
      energy: todayEntries.reduce((sum: number, entry: any) => sum + (entry.energy || 0), 0) / todayEntries.length,
      focus: todayEntries.reduce((sum: number, entry: any) => sum + (entry.focus || 0), 0) / todayEntries.length,
      stress: todayEntries.reduce((sum: number, entry: any) => sum + (entry.stress || 0), 0) / todayEntries.length,
      sleep: todayEntries.reduce((sum: number, entry: any) => sum + (entry.sleep || 0), 0) / todayEntries.length,
      entryCount: todayEntries.length
    } : null;

    // Get recent activities from latest entry
    const recentActivities = entriesData[0]?.activities ? 
      (Array.isArray(entriesData[0].activities) ? entriesData[0].activities : entriesData[0].activities.split(', ')) : 
      [];

    const userProfile = {
      currentMood: {
        valence: entriesData[0]?.valence || 0,
        energy: entriesData[0]?.energy || 0,
        focus: entriesData[0]?.focus || 0,
        stress: entriesData[0]?.stress || 0,
        sleep: entriesData[0]?.sleep || 0
      },
      recentEntries: entriesData.slice(0, 10),
      moodHistory: {
        averageValence: entriesData.reduce((sum: number, entry: any) => sum + (entry.valence || 0), 0) / entriesData.length,
        averageEnergy: entriesData.reduce((sum: number, entry: any) => sum + (entry.energy || 0), 0) / entriesData.length,
        averageStress: entriesData.reduce((sum: number, entry: any) => sum + (entry.stress || 0), 0) / entriesData.length,
        averageSleep: entriesData.reduce((sum: number, entry: any) => sum + (entry.sleep || 0), 0) / entriesData.length
      },
      successfulSolutions: [],
      commonActivities: [],
      userPreferences: {
        interests: userData.interests ? JSON.parse(userData.interests) : [],
        favoriteWriters: userData.favoriteWriters ? userData.favoriteWriters.split(', ') : [],
        favoriteMovies: userData.favoriteMovies ? userData.favoriteMovies.split(', ') : []
      },
      userInfo: {
        gender: userData.gender || 'unknown',
        age: userData.age || 25,
        personality: userData.personality || 'unknown',
        universityLevel: userData.universityLevel || 'unknown',
        fieldOfStudy: userData.fieldOfStudy || 'unknown',
        onPeriod: entriesData[0]?.onPeriod || false,
        periodDay: entriesData[0]?.periodDay || 0
      },
      activeGoals: [],
      powerHoursData: powerHoursDataForCoaching,
      currentTime: currentTime,
      todayMoodAverages: todayMoodAverages,
      recentActivities: recentActivities
    };

    // Temporarily modify generateCoachingTip to return the prompt
    const originalGenerateCoachingTip = generateCoachingTip;
    
    // Create a mock version that returns the prompt
    const mockGenerateCoachingTip = async (profile: any) => {
      // Manually construct the prompt exactly like coachingTips.ts
      let prompt = `Generate ONE short, powerful COACHING TIP focused on GETTING THINGS DONE for someone with this profile:

`;

      // User demographics and preferences
      if (profile.userInfo.age) {
        prompt += `Age: ${profile.userInfo.age} years old\n`;
      }
      
      if (profile.userInfo.gender) {
        prompt += `Gender: ${profile.userInfo.gender}\n`;
      }
      
      if (profile.userInfo.personality) {
        prompt += `Personality Type: ${profile.userInfo.personality}\n`;
      }
      
      if (profile.userInfo.universityLevel) {
        prompt += `University Level: ${profile.userInfo.universityLevel}\n`;
      }
      
      if (profile.userInfo.fieldOfStudy) {
        prompt += `Field of Study: ${profile.userInfo.fieldOfStudy}\n`;
      }
      
      if (profile.userPreferences.interests && profile.userPreferences.interests.length > 0) {
        prompt += `Interests: ${profile.userPreferences.interests.join(', ')}\n`;
      }

      // Current mood averages
      if (profile.todayMoodAverages) {
        prompt += `\nToday's Mood Averages:\n`;
        prompt += `- Valence: ${profile.todayMoodAverages.valence.toFixed(1)}/10\n`;
        prompt += `- Energy: ${profile.todayMoodAverages.energy.toFixed(1)}/10\n`;
        prompt += `- Focus: ${profile.todayMoodAverages.focus.toFixed(1)}/10\n`;
        prompt += `- Stress: ${profile.todayMoodAverages.stress.toFixed(1)}/10\n`;
        prompt += `- Sleep: ${profile.todayMoodAverages.sleep.toFixed(1)}/10\n`;
        prompt += `- Entries Today: ${profile.todayMoodAverages.entryCount}\n`;
      }

      // Today's activities with times
      const today = new Date().toISOString().split('T')[0];
      const todayEntries = profile.recentEntries.filter((entry: any) => {
        const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
        return entryDate === today && entry.activities && entry.activities.length > 0;
      });

      if (todayEntries.length > 0) {
        prompt += `\nToday's Activities:\n`;
        todayEntries.forEach((entry: any) => {
          const time = new Date(entry.createdAt).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const activities = Array.isArray(entry.activities) ? entry.activities.join(', ') : entry.activities;
          prompt += `- ${time}: ${activities}\n`;
        });
      } else {
        prompt += `\nToday's Activities: None logged yet\n`;
      }

      // Active goals
      if (profile.activeGoals && profile.activeGoals.length > 0) {
        prompt += `\nActive Goals:\n`;
        profile.activeGoals.forEach((goal: any) => {
          prompt += `- ${goal.title}: ${goal.currentValue}/${goal.targetValue} (${goal.progressPercentage}%)\n`;
        });
      }

      // Activity drivers (helpful/harmful)
      if (driversData.helpful && driversData.helpful.length > 0) {
        prompt += `\nHelpful Activities:\n`;
        driversData.helpful.forEach((activity: any) => {
          prompt += `- ${activity.tag}: +${activity.overallEffect.toFixed(2)} overall effect (DSS: +${activity.dssEffect.toFixed(2)}, MC: +${activity.mcEffect.toFixed(2)})\n`;
        });
      }
      
      if (driversData.harmful && driversData.harmful.length > 0) {
        prompt += `\nHarmful Activities:\n`;
        driversData.harmful.forEach((activity: any) => {
          prompt += `- ${activity.tag}: ${activity.overallEffect.toFixed(2)} overall effect (DSS: ${activity.dssEffect.toFixed(2)}, MC: ${activity.mcEffect.toFixed(2)})\n`;
        });
      }
      
      if (profile.userPreferences.favoriteWriters && profile.userPreferences.favoriteWriters.length > 0) {
        prompt += `Favorite Writers: ${profile.userPreferences.favoriteWriters.join(', ')}\n`;
      }

      if (profile.userPreferences.favoriteMovies && profile.userPreferences.favoriteMovies.length > 0) {
        prompt += `Favorite Movies/TV: ${profile.userPreferences.favoriteMovies.join(', ')}\n`;
      }

      // Current mood
      prompt += `\nCurrent Mood: Valence ${profile.currentMood.valence}/10, Energy ${profile.currentMood.energy}/10, Focus ${profile.currentMood.focus}/10, Stress ${profile.currentMood.stress}/10\n`;

      // Power Hours data
      if (profile.powerHoursData && profile.powerHoursData.data && profile.powerHoursData.data.length > 0) {
        prompt += `\n📊 TODAY'S POWER HOURS ANALYSIS:\n`;
        
        const allPowerHours = profile.powerHoursData.data;
        const currentDay = profile.powerHoursData.currentDay;
        
        // Just show current day info, AI will analyze the 24 hours data
        prompt += `\n📅 TODAY (${currentDay}): Complete 24-hour MC data provided below for analysis.\n`;
        
        // Add all 24 hours with raw MC data for AI analysis
        prompt += `\n📊 ALL 24 HOURS TODAY (${currentDay}) - MC Data:\n`;
        prompt += `Hour | MC Value\n`;
        prompt += `-----|--------\n`;
        
        for (let hour = 0; hour < 24; hour++) {
          const hourData = allPowerHours.find((item: any) => item.day === currentDay && item.hour === hour && item.mcValue !== null);
          const mcValue = hourData ? hourData.mcValue : null;
          
          if (mcValue !== null) {
            prompt += `${hour.toString().padStart(2, '0')}:00 | ${mcValue.toFixed(2)}\n`;
          } else {
            prompt += `${hour.toString().padStart(2, '0')}:00 | No data\n`;
          }
        }
      }

      if (profile.userInfo.onPeriod) {
        prompt += `\n⚠️ User is on their period - consider this in suggestions\n`;
      }
      
      if (profile.currentTime) {
        prompt += `\nTime of day: ${profile.currentTime}
Current time: ${profile.currentTime}\n`;
      }

      // Add the rest of the coaching rules
      prompt += `\nCOACHING TIP RULES:
10. **POWER HOURS INTEGRATION**: Use their Power Hours data to give timing-specific advice:
    - If in HIGH PRODUCTIVITY window: Suggest important, challenging tasks
    - If in LOWER PRODUCTIVITY window: Suggest lighter tasks, planning, or self-care
    - If near productive hours: Suggest preparing for upcoming productive time
    - Always consider their current time vs. their optimal hours

Focus on timing and Power Hours data. Give ONE short, actionable tip based on their current time and productivity patterns.

Respond with ONLY the tip text - no formatting, no "Coaching Tip:" prefix, no extra text.`;

      return prompt;
    };

    // Generate the prompt
    const prompt = await mockGenerateCoachingTip(userProfile);

    return NextResponse.json({
      success: true,
      prompt: prompt
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
