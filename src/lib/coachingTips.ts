import { OpenAI } from 'openai';

export interface UserProfile {
  currentMood?: {
    valence: number;
    energy: number;
    focus: number;
    stress: number;
  };
  todayMoodAverages?: {
    valence: number;
    energy: number;
    focus: number;
    stress: number;
    sleep: number;
    entryCount: number;
  };
  powerHoursData?: {
    mostProductiveHours: Array<{
      day: string;
      hour: number;
      productivity: number;
    }>;
    bestDay: {
      day: string;
      productivity: number;
    } | null;
    bestDeepWorkHours: Array<{
      day: string;
      hour: number;
      avgMinutes: number;
      avgTasks: number;
      sessions: number;
    }>;
    recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: string;
    }>;
  };
  onPeriod?: boolean;
  waterIntake?: number;
  timeOfDay?: string;
  gender?: string;
  age?: number;
  interests?: string[];
  favoriteWriters?: string[];
  favoriteMusicians?: string[];
  favoriteSportsFigures?: string[];
  favoriteArtists?: string[];
  favoriteMovies?: string[];
  favoritePhilosophers?: string[];
  recentActivities?: string[];
  activeGoals?: {
    id: string;
    title: string;
    description?: string;
    category: string;
    subcategory?: string;
    targetValue: number;
    currentValue: number;
    progressPercentage: number;
    difficulty: string;
    streak: number;
    completed: boolean;
  }[];
  personality?: string;
  universityLevel?: string;
  fieldOfStudy?: string;
}

export async function generateCoachingTip(userProfile: UserProfile, providedApiKey?: string): Promise<string> {
  // Use provided key first, then check environment variables
  const apiKey = providedApiKey || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  console.log('🔑 OpenAI API Key available in coaching tips:', !!apiKey);
  console.log('📊 User profile for coaching tips:', JSON.stringify(userProfile, null, 2));
  
  if (!apiKey) {
    console.error('OpenAI API key not found');
    return "Focus on your goals and take one step forward today.";
  }

  const {
    currentMood, todayMoodAverages, powerHoursData, onPeriod, waterIntake, timeOfDay, gender, age, interests, favoriteAuthors,
    favoriteWriters, favoriteSportsFigures, favoriteMusicians, favoriteArtists, favoriteMovies, favoritePhilosophers,
    recentActivities, activeGoals, completedGoals, achievedBadges, personality, universityLevel, fieldOfStudy, sleepData, hydrationData, 
    exerciseData, periodData, moodTrends, dssScore, dssAnalysis, todayActivities
  } = userProfile;
  
  // Create personalized prompt
  let prompt = `Generate ONE short, powerful COACHING TIP focused on GETTING THINGS DONE for someone with this profile:

`;

  // User demographics and preferences
  if (age) {
    prompt += `Age: ${age} years old\n`;
  }
  
  if (gender) {
    prompt += `Gender: ${gender}\n`;
  }
  
  if (personality) {
    prompt += `Personality Type: ${personality}\n`;
  }
  
  if (universityLevel) {
    prompt += `University Level: ${universityLevel}\n`;
  }
  
  if (fieldOfStudy) {
    prompt += `Field of Study: ${fieldOfStudy}\n`;
  }
  
  if (interests && interests.length > 0) {
    prompt += `Interests: ${interests.join(', ')}\n`;
  }

  // Current mood averages
  if (todayMoodAverages) {
    prompt += `\nToday's Mood Averages:\n`;
    prompt += `- Valence: ${todayMoodAverages.valence}/10\n`;
    prompt += `- Energy: ${todayMoodAverages.energy}/10\n`;
    prompt += `- Focus: ${todayMoodAverages.focus}/10\n`;
    prompt += `- Stress: ${todayMoodAverages.stress}/10\n`;
    prompt += `- Sleep: ${todayMoodAverages.sleep}/10\n`;
    prompt += `- Entries Today: ${todayMoodAverages.entryCount}\n`;
  }

  // Today's activities with times
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = userProfile.recentEntries.filter((entry: any) => {
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
  if (activeGoals && activeGoals.length > 0) {
    prompt += `\nActive Goals:\n`;
    activeGoals.forEach(goal => {
      prompt += `- ${goal.title}: ${goal.currentValue}/${goal.targetValue} (${goal.progressPercentage}%)\n`;
    });
  }

  // Activity drivers (helpful/harmful)
  try {
    const driversResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/drivers?userId=dummy-user`);
    if (driversResponse.ok) {
      const driversData = await driversResponse.json();
      
      if (driversData.helpful && driversData.helpful.length > 0) {
        prompt += `\nHelpful Activities:\n`;
        driversData.helpful.forEach(activity => {
          prompt += `- ${activity.tag}: +${activity.overallEffect.toFixed(2)} overall effect (DSS: +${activity.dssEffect.toFixed(2)}, MC: +${activity.mcEffect.toFixed(2)})\n`;
        });
      }
      
      if (driversData.harmful && driversData.harmful.length > 0) {
        prompt += `\nHarmful Activities:\n`;
        driversData.harmful.forEach(activity => {
          prompt += `- ${activity.tag}: ${activity.overallEffect.toFixed(2)} overall effect (DSS: ${activity.dssEffect.toFixed(2)}, MC: ${activity.mcEffect.toFixed(2)})\n`;
        });
      }
    }
  } catch (error) {
    console.log('⚠️ Could not fetch activity drivers:', error);
  }
  
  
  if (favoriteWriters && favoriteWriters.length > 0) {
    prompt += `Favorite Writers: ${favoriteWriters.join(', ')}\n`;
  }
  
  if (favoriteMusicians && favoriteMusicians.length > 0) {
    prompt += `Favorite Musicians: ${favoriteMusicians.join(', ')}\n`;
  }
  
  if (favoriteSportsFigures && favoriteSportsFigures.length > 0) {
    prompt += `Favorite Athletes: ${favoriteSportsFigures.join(', ')}\n`;
  }
  
  if (favoriteArtists && favoriteArtists.length > 0) {
    prompt += `Favorite Artists: ${favoriteArtists.join(', ')}\n`;
  }
  
  if (favoriteMovies && favoriteMovies.length > 0) {
    prompt += `Favorite Movies: ${favoriteMovies.join(', ')}\n`;
  }
  
  if (favoritePhilosophers && favoritePhilosophers.length > 0) {
    prompt += `Favorite Philosophers: ${favoritePhilosophers.join(', ')}\n`;
  }
  
  // Recent activities
  if (recentActivities && Array.isArray(recentActivities) && recentActivities.length > 0) {
    prompt += `Recent activities: ${recentActivities.join(', ')}\n`;
  } else if (recentActivities && typeof recentActivities === 'string') {
    prompt += `Recent activities: ${recentActivities}\n`;
  }

  // Current mood and state
  if (currentMood) {
    prompt += `\nCurrent Mood: Valence ${currentMood.valence}/10, Energy ${currentMood.energy}/10, Focus ${currentMood.focus || 5}/10, Stress ${currentMood.stress}/10\n`;
    
    if (currentMood.valence < 4) {
      prompt += `⚠️ User is feeling low - focus on actionable steps to improve mood\n`;
    }
    if (currentMood.energy < 4) {
      prompt += `⚠️ User has low energy - suggest energy-boosting activities\n`;
    }
    if (currentMood.stress > 7) {
      prompt += `⚠️ User is stressed - provide stress-reduction strategies\n`;
    }
  }

  // Today's mood averages for better context
  if (todayMoodAverages) {
    prompt += `\nToday's Mood Averages (${todayMoodAverages.entryCount} entries):\n`;
    prompt += `- Happiness: ${todayMoodAverages.valence}/10\n`;
    prompt += `- Energy: ${todayMoodAverages.energy}/10\n`;
    prompt += `- Focus: ${todayMoodAverages.focus}/10\n`;
    prompt += `- Stress: ${todayMoodAverages.stress}/10\n`;
    prompt += `- Sleep Quality: ${todayMoodAverages.sleep}/10\n`;
    
    // Add insights based on today's averages
    if (todayMoodAverages.energy < 5) {
      prompt += `⚠️ Low energy today - suggest energy-boosting activities\n`;
    }
    if (todayMoodAverages.stress > 6) {
      prompt += `⚠️ High stress today - suggest stress management\n`;
    }
    if (todayMoodAverages.focus > 7) {
      prompt += `✅ High focus today - suggest deep work tasks\n`;
    }
  }

        // Power Hours data for optimal timing - CURRENT DAY ONLY
        if (powerHoursData) {
          prompt += `\n📊 TODAY'S POWER HOURS ANALYSIS:\n`;
          
          // Get current day and hour
          const currentHour = new Date().getHours();
          const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
          
          // Process Power Hours data for TODAY ONLY
          const allPowerHours = powerHoursData.data || [];
          const todayPowerHours = allPowerHours
            .filter(item => item.day === currentDay && item.mcValue !== null)
            .sort((a, b) => b.mcValue - a.mcValue);
          
          // Just show current day info, AI will analyze the 24 hours data
          prompt += `\n📅 TODAY (${currentDay}): Complete 24-hour MC data provided below for analysis.\n`;
          
          // Calculate min/max for normalization (same as Power Hours chart)
          const todayMCValues = allPowerHours
            .filter(item => item.day === currentDay && item.mcValue !== null)
            .map(item => item.mcValue);
          
          let minMC = 0, maxMC = 0, rangeMC = 0;
          if (todayMCValues.length > 0) {
            minMC = Math.min(...todayMCValues);
            maxMC = Math.max(...todayMCValues);
            rangeMC = maxMC - minMC;
          }
          
          const normalizeMC = (mc: number) => {
            if (rangeMC === 0) return 0.5;
            return Math.max(0, Math.min(1, (mc - minMC) / rangeMC));
          };
          
          const getColorLabel = (normalizedMC: number) => {
            if (normalizedMC < 0.33) return 'White (Low)';
            if (normalizedMC < 0.66) return 'Light Red (Medium)';
            return 'Intense Red (High)';
          };
          
          // Add all 24 hours with raw MC data for AI analysis
          prompt += `\n📊 ALL 24 HOURS TODAY (${currentDay}) - MC Data:\n`;
          prompt += `Hour | MC Value\n`;
          prompt += `-----|--------\n`;
          
          for (let hour = 0; hour < 24; hour++) {
            const hourData = allPowerHours.find(item => item.day === currentDay && item.hour === hour && item.mcValue !== null);
            const mcValue = hourData ? hourData.mcValue : null;
            
            if (mcValue !== null) {
              prompt += `${hour.toString().padStart(2, '0')}:00 | ${mcValue.toFixed(2)}\n`;
            } else {
              prompt += `${hour.toString().padStart(2, '0')}:00 | No data\n`;
            }
          }
        }
  
  if (onPeriod) {
    prompt += `\n⚠️ User is on their period - consider this in suggestions\n`;
  }
  
  if (waterIntake !== undefined) {
    prompt += `\nWater intake today: ${waterIntake} glasses\n`;
    if (waterIntake < 6) {
      prompt += `⚠️ Low hydration - suggest water intake\n`;
    }
  }
  
  if (timeOfDay) {
    prompt += `\nTime of day: ${timeOfDay}
Current time: ${new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}\n`;
  }

  // Enhanced data for better coaching
  if (sleepData && sleepData.today) {
    prompt += `\nSleep Data (Today):\n`;
    prompt += `- Sleep Hours: ${sleepData.today.sleepHours || 'Not tracked'}\n`;
    prompt += `- Sleep Quality: ${sleepData.today.sleepQuality || 'Not tracked'}\n`;
    prompt += `- Bedtime: ${sleepData.today.bedtime || 'Not tracked'}\n`;
    prompt += `- Wake Time: ${sleepData.today.wakeTime || 'Not tracked'}\n`;
    
    if (sleepData.recent && sleepData.recent.length > 0) {
      const avgSleep = sleepData.recent.reduce((sum, day) => sum + (day.sleepHours || 0), 0) / sleepData.recent.length;
      prompt += `- Average Sleep (7 days): ${avgSleep.toFixed(1)} hours\n`;
    }
  }

  if (hydrationData && hydrationData.today) {
    prompt += `\nHydration Data (Today):\n`;
    prompt += `- Water Intake: ${hydrationData.today.waterIntake || 'Not tracked'} glasses\n`;
    prompt += `- Hydration Level: ${hydrationData.today.hydrationLevel || 'Not tracked'}\n`;
    
    if (hydrationData.recent && hydrationData.recent.length > 0) {
      const avgWater = hydrationData.recent.reduce((sum, day) => sum + (day.waterIntake || 0), 0) / hydrationData.recent.length;
      prompt += `- Average Water Intake (7 days): ${avgWater.toFixed(1)} glasses\n`;
    }
  }

  if (exerciseData && exerciseData.today) {
    prompt += `\nExercise Data (Today):\n`;
    prompt += `- Exercise Minutes: ${exerciseData.today.exerciseMinutes || 'Not tracked'}\n`;
    prompt += `- Exercise Type: ${exerciseData.today.exerciseType || 'Not tracked'}\n`;
    prompt += `- Steps: ${exerciseData.today.steps || 'Not tracked'}\n`;
  }

  if (periodData && periodData.onPeriod) {
    prompt += `\nPeriod Data:\n`;
    prompt += `- On Period: Yes\n`;
    prompt += `- Cycle Day: ${periodData.cycleDay || 'Not tracked'}\n`;
    if (periodData.symptoms && periodData.symptoms.length > 0) {
      prompt += `- Symptoms: ${periodData.symptoms.join(', ')}\n`;
    }
  }

  if (moodTrends && moodTrends.average) {
    prompt += `\nMood Trends (Recent Average):\n`;
    prompt += `- Happiness: ${moodTrends.average.valence}/10\n`;
    prompt += `- Energy: ${moodTrends.average.energy}/10\n`;
    prompt += `- Stress: ${moodTrends.average.stress}/10\n`;
    prompt += `- Sleep Quality: ${moodTrends.average.sleep}/10\n`;
  }

  if (dssScore !== null && dssScore !== undefined) {
    prompt += `\nDaily Success Score: ${dssScore}\n`;
  }

  if (dssAnalysis) {
    prompt += `\nDSS Analysis: ${dssAnalysis}\n`;
  }

  // Today's activities and what user has been doing
  if (moodTrends && moodTrends.recent && moodTrends.recent.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = moodTrends.recent.find(entry => entry.date === today);
    
    if (todayEntry) {
      prompt += `\nToday's Activities & Progress:\n`;
      prompt += `- Mood Entry: Happiness ${todayEntry.valence}/10, Energy ${todayEntry.energy}/10, Stress ${todayEntry.stress}/10, Sleep ${todayEntry.sleep}/10\n`;
      if (todayEntry.activities && Array.isArray(todayEntry.activities) && todayEntry.activities.length > 0) {
        prompt += `- Activities Done Today: ${todayEntry.activities.join(', ')}\n`;
      } else if (todayEntry.activities && typeof todayEntry.activities === 'string') {
        prompt += `- Activities Done Today: ${todayEntry.activities}\n`;
      }
    }
  }

  // Recent activities from mood entries
  if (recentActivities && Array.isArray(recentActivities) && recentActivities.length > 0) {
    prompt += `\nRecent Activities (Last Entry): ${recentActivities.join(', ')}\n`;
  } else if (recentActivities && typeof recentActivities === 'string') {
    prompt += `\nRecent Activities (Last Entry): ${recentActivities}\n`;
  }

  // Today's comprehensive activities and progress
  if (todayActivities) {
    prompt += `\n📅 TODAY'S COMPREHENSIVE ACTIVITIES & PROGRESS:\n`;
    
    if (todayActivities.moodEntry) {
      prompt += `\nMood Entry Today:\n`;
      prompt += `- Time: ${new Date(todayActivities.moodEntry.time).toISOString().split('T')[0]}\n`;
      prompt += `- Mood: Happiness ${todayActivities.moodEntry.valence}/10, Energy ${todayActivities.moodEntry.energy}/10, Stress ${todayActivities.moodEntry.stress}/10, Sleep ${todayActivities.moodEntry.sleep}/10\n`;
      if (todayActivities.moodEntry.activities && Array.isArray(todayActivities.moodEntry.activities) && todayActivities.moodEntry.activities.length > 0) {
        prompt += `- Activities Done: ${todayActivities.moodEntry.activities.join(', ')}\n`;
      } else if (todayActivities.moodEntry.activities && typeof todayActivities.moodEntry.activities === 'string') {
        prompt += `- Activities Done: ${todayActivities.moodEntry.activities}\n`;
      }
      if (todayActivities.moodEntry.notes) {
        prompt += `- Notes: ${todayActivities.moodEntry.notes}\n`;
      }
    }
    
    if (todayActivities.dailyTracking) {
      prompt += `\nDaily Tracking Today:\n`;
      prompt += `- Sleep: ${todayActivities.dailyTracking.sleepHours || 'Not tracked'} hours\n`;
      prompt += `- Water: ${todayActivities.dailyTracking.waterIntake || 'Not tracked'} glasses\n`;
      prompt += `- Exercise: ${todayActivities.dailyTracking.exerciseMinutes || 'Not tracked'} minutes\n`;
      prompt += `- Steps: ${todayActivities.dailyTracking.steps || 'Not tracked'}\n`;
      prompt += `- DSS Score: ${todayActivities.dailyTracking.dssScore || 'Not calculated'}\n`;
    }
    
    if (todayActivities.goalsProgress && todayActivities.goalsProgress.length > 0) {
      prompt += `\nGoals Progress Today:\n`;
      todayActivities.goalsProgress.forEach(goal => {
        prompt += `- "${goal.title}": ${goal.progress} (${goal.percentage}%) - ${goal.streak} day streak\n`;
      });
    }
  }

  // Completed goals for positive reinforcement
  if (completedGoals && completedGoals.length > 0) {
    prompt += `\n🏆 COMPLETED GOALS (Past Achievements):\n`;
    completedGoals.forEach(goal => {
      const completedDate = new Date(goal.completedAt).toISOString().split('T')[0];
      prompt += `- "${goal.title}" (${goal.category}${goal.subcategory ? ` - ${goal.subcategory}` : ''}) - Completed ${completedDate}\n`;
      if (goal.description) {
        prompt += `  Description: ${goal.description}\n`;
      }
      if (goal.finalStreak > 0) {
        prompt += `  Final Streak: ${goal.finalStreak} days\n`;
      }
    });
    prompt += `\nUse these past achievements to remind the user of their capabilities and build confidence!\n`;
  }

  // Achieved badges for capability recognition
  if (achievedBadges && achievedBadges.length > 0) {
    prompt += `\n🎖️ ACHIEVED BADGES (Capabilities & Milestones):\n`;
    achievedBadges.forEach(badge => {
      const unlockedDate = new Date(badge.unlockedAt).toISOString().split('T')[0];
      prompt += `- ${badge.icon} "${badge.title}" (${badge.stars}⭐) - ${badge.type} - Unlocked ${unlockedDate}\n`;
      if (badge.description) {
        prompt += `  ${badge.description}\n`;
      }
    });
    prompt += `\nUse these badges to recognize the user's proven capabilities and encourage them!\n`;
  }

  prompt += `\nCOACHING TIP RULES:
10. **POWER HOURS INTEGRATION**: Use their Power Hours data to give timing-specific advice:
    - If in HIGH PRODUCTIVITY window: Suggest important, challenging tasks
    - If in LOWER PRODUCTIVITY window: Suggest lighter tasks, planning, or self-care
    - If near productive hours: Suggest preparing for upcoming productive time
    - Always consider their current time vs. their optimal hours

Focus on timing and Power Hours data. Give ONE short, actionable tip based on their current time and productivity patterns.

Respond with ONLY the tip text - no formatting, no "Coaching Tip:" prefix, no extra text.`;

  console.log('🎯 Generating AI coaching tip...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a personal coach focused on helping people achieve their goals through specific, actionable advice. Be direct, practical, and results-oriented. Always focus on getting things done, not just motivation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1.4,
      max_tokens: 200,
      seed: Math.floor(Math.random() * 1000000)
    })
  });

  if (!response.ok) {
    console.error('OpenAI API error:', response.status, response.statusText);
    return "Focus on your goals and take one step forward today.";
  }

  const data = await response.json();
  const coachingTip = data.choices[0]?.message?.content?.trim();
  
  if (!coachingTip) {
    console.error('No coaching tip generated');
    return "Focus on your goals and take one step forward today.";
  }

  console.log('✅ Generated coaching tip:', coachingTip);
  return coachingTip;
}
