import { OpenAI } from 'openai';

export interface UserProfile {
  currentMood?: {
    valence: number;
    energy: number;
    stress: number;
  };
  onPeriod?: boolean;
  waterIntake?: number;
  timeOfDay?: string;
  gender?: string;
  age?: number;
  interests?: string[];
  quoteStyle?: string;
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

export async function generateCoachingTip(userProfile: UserProfile): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('🔑 OpenAI API Key available in coaching tips:', !!apiKey);
  console.log('📊 User profile for coaching tips:', JSON.stringify(userProfile, null, 2));
  
  if (!apiKey) {
    console.error('OpenAI API key not found');
    return "Focus on your goals and take one step forward today.";
  }

  const {
    currentMood, onPeriod, waterIntake, timeOfDay, gender, age, interests, quoteStyle, favoriteAuthors,
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
  
  if (quoteStyle) {
    prompt += `Preferred Style: ${quoteStyle}\n`;
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
    prompt += `\nCurrent Mood: Happiness ${currentMood.valence}/10, Energy ${currentMood.energy}/10, Stress ${currentMood.stress}/10\n`;
    
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
    prompt += `\nTime of day: ${timeOfDay}\n`;
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
      prompt += `- Time: ${new Date(todayActivities.moodEntry.time).toLocaleString()}\n`;
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
      const completedDate = new Date(goal.completedAt).toLocaleDateString();
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
      const unlockedDate = new Date(badge.unlockedAt).toLocaleDateString();
      prompt += `- ${badge.icon} "${badge.title}" (${badge.stars}⭐) - ${badge.type} - Unlocked ${unlockedDate}\n`;
      if (badge.description) {
        prompt += `  ${badge.description}\n`;
      }
    });
    prompt += `\nUse these badges to recognize the user's proven capabilities and encourage them!\n`;
  }

  // Add randomness and subtlety instructions
  prompt += `\n🎲 RANDOMNESS & SUBTLETY RULES:
- Only reference past achievements 30% of the time (not every coaching tip)
- When mentioning past successes, be subtle and natural
- Mix coaching approaches: sometimes focus on current goals, sometimes on capabilities, sometimes on fresh starts
- Vary the tone: sometimes encouraging, sometimes challenging, sometimes supportive
- Don't repeat the same achievement references in consecutive tips
- Use past achievements to build confidence when user seems stuck or demotivated
- Focus on current momentum when user is already progressing well
- Be random and unpredictable in your approach - surprise the user with variety`;

  prompt += `\nCOACHING TIP RULES:
1. **GOAL-FOCUSED COACHING**: Always relate to their active goals and progress
2. **ACTIONABLE ADVICE**: Provide specific, actionable steps for getting things done
3. **PROGRESS-ORIENTED**: Focus on moving forward, not just motivation
4. **TASK-SPECIFIC**: Give concrete steps for their specific goals
5. **COACHING TONE**: Be direct, practical, and results-focused
6. **POSITIVE REINFORCEMENT**: Reference their completed goals and achieved badges to build confidence
7. **CAPABILITY RECOGNITION**: Remind them of their past successes and proven abilities
8. **SUBTLE & RANDOM APPROACH**: Don't always mention past achievements - use them strategically and randomly
9. **VARIETY IN COACHING**: Mix between goal-focused, capability-focused, and fresh-start approaches

6. **GOAL-BASED COACHING TIPS:**
    ${activeGoals && activeGoals.length > 0 ? `
    Active Goals:
    ${activeGoals.map(goal => {
      const progressText = goal.completed ? 'COMPLETED!' : `${goal.progressPercentage}% complete`;
      const streakText = goal.streak > 0 ? ` (${goal.streak} day streak)` : '';
      return `- "${goal.title}" (${goal.category}${goal.subcategory ? ` - ${goal.subcategory}` : ''}) - ${progressText}${streakText}`;
    }).join('\n    ')}
    
    COACHING TIP RULES:
    - For goals with low progress (<30%): Give specific first steps, break down the goal, create momentum
    - For goals with medium progress (30-70%): Focus on consistency, maintaining progress, overcoming obstacles
    - For goals with high progress (>70%): Push to completion, final stretch strategies, finishing strong
    - For completed goals: Celebrate achievement and set next-level goals
    - For health goals: Give specific health actions and habit-building strategies
    - For learning goals: Provide study techniques, learning strategies, knowledge application
    - For habit goals: Give habit-stacking techniques, consistency strategies, accountability methods
    - **ALWAYS MENTION THE SPECIFIC GOAL BY NAME**
    - Give concrete, actionable steps they can take TODAY
    ` : ''}

7. **PERSONALITY-BASED COACHING:**
    - **INTJ**: Focus on systems, strategy, long-term planning, efficiency
    - **INTP**: Focus on learning, analysis, problem-solving, knowledge building
    - **ENTJ**: Focus on leadership, achievement, goal-setting, influence
    - **ENTP**: Focus on innovation, creativity, possibilities, change
    - **INFJ**: Focus on purpose, meaning, helping others, vision
    - **INFP**: Focus on values, authenticity, personal growth, creativity
    - **ENFJ**: Focus on inspiring others, community, leadership, impact
    - **ENFP**: Focus on passion, connection, enthusiasm, possibilities
    - **ISTJ**: Focus on structure, reliability, consistency, responsibility
    - **ISFJ**: Focus on service, helping others, care, support

8. **STUDENT-SPECIFIC COACHING:**
    - **UNDERGRADUATE**: Focus on study habits, time management, skill building, networking
    - **GRADUATE**: Focus on research methods, thesis writing, academic pressure, career prep
    - **PHD**: Focus on dissertation completion, academic writing, research methodology, mentorship
    - **COMPUTER SCIENCE**: Focus on coding practice, algorithm study, project building, tech skills
    - **PSYCHOLOGY**: Focus on research methods, clinical skills, theoretical understanding
    - **MEDICINE**: Focus on study techniques, clinical skills, medical knowledge, patient care
    - **ENGINEERING**: Focus on problem-solving, technical skills, project management, innovation
    - **BUSINESS**: Focus on networking, leadership, entrepreneurship, market analysis
    - **ARTS/HUMANITIES**: Focus on creative expression, critical thinking, cultural awareness

FORMAT:
Give a short, powerful COACHING TIP (not a quote) that is:
- Specific and actionable
- Goal-oriented
- Practical and results-focused
- Direct and coaching-style

Respond with ONLY the coaching tip, nothing else.`;

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
