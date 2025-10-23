export interface MoodSuggestion {
  type: 'activity' | 'tip' | 'reminder' | 'encouragement' | 'challenge';
  title: string;
  description: string;
  action?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
}

// Smart AI suggestions based on mood patterns and trends
// In a real app, this would use OpenAI API or similar
export const generateMoodSuggestions = (moodData: {
  mood: number;
  energy: number;
  calmness: number;
  stress: number;
  sleep?: number;
  recentEntries: any[];
}): MoodSuggestion[] => {
  const suggestions: MoodSuggestion[] = [];
  const { mood, energy, calmness, stress, sleep, recentEntries } = moodData;

  // Analyze patterns from recent entries
  const hasRecentData = recentEntries && recentEntries.length > 0;
  const avgMood = hasRecentData ? 
    recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length : 
    mood;
  
  const avgStress = hasRecentData ? 
    recentEntries.reduce((sum, entry) => sum + entry.stress, 0) / recentEntries.length : 
    stress;

  const avgEnergy = hasRecentData ? 
    recentEntries.reduce((sum, entry) => sum + entry.energy, 0) / recentEntries.length : 
    energy;

  // Mood-based suggestions with smart analysis
  if (mood <= 3) {
    suggestions.push({
      type: 'activity',
      title: 'Mood Boost Challenge',
      description: 'Your mood is low today. Try a 5-minute gratitude practice or call someone you care about.',
      action: 'Write 3 things you\'re grateful for',
      priority: 'high',
      category: 'mood',
      icon: '😊'
    });
    
    if (energy > 5) {
      suggestions.push({
        type: 'activity',
        title: 'Energy to Mood Transfer',
        description: 'You have good energy but low mood. Channel that energy into something positive!',
        action: 'Do something creative or helpful',
        priority: 'high',
        category: 'mood',
        icon: '⚡'
      });
    }
  } else if (mood >= 8) {
    suggestions.push({
      type: 'encouragement',
      title: 'Mood Momentum',
      description: 'Excellent mood! Share this positivity or use it to tackle something challenging.',
      action: 'Help someone else feel good',
      priority: 'medium',
      category: 'mood',
      icon: '🌟'
    });
  }

  // Energy-based suggestions
  if (energy <= 3) {
    suggestions.push({
      type: 'activity',
      title: 'Energy Recharge',
      description: 'Low energy detected. Try a power nap, healthy snack, or gentle movement.',
      action: 'Take a 10-minute walk',
      priority: 'high',
      category: 'energy',
      icon: '🔋'
    });
    
    if (sleep && sleep < 7) {
      suggestions.push({
        type: 'reminder',
        title: 'Sleep Quality Alert',
        description: 'Low energy might be related to sleep. Aim for 7-9 hours tonight.',
        action: 'Set a bedtime reminder',
        priority: 'high',
        category: 'sleep',
        icon: '😴'
      });
    }
  } else if (energy >= 8) {
    suggestions.push({
      type: 'challenge',
      title: 'High Energy Opportunity',
      description: 'You\'re full of energy! Perfect time for exercise, learning, or tackling big projects.',
      action: 'Start a 30-minute workout',
      priority: 'medium',
      category: 'energy',
      icon: '💪'
    });
  }

  // Stress-based suggestions with pattern analysis
  if (stress >= 7) {
    suggestions.push({
      type: 'activity',
      title: 'Stress Relief Protocol',
      description: 'High stress detected. Try the 4-7-8 breathing technique or progressive muscle relaxation.',
      action: 'Practice 4-7-8 breathing',
      priority: 'high',
      category: 'stress',
      icon: '🧘'
    });
    
    if (hasRecentData && avgStress > 6) {
      suggestions.push({
        type: 'tip',
        title: 'Stress Pattern Alert',
        description: 'You\'ve been stressed lately. Consider what\'s causing this and make a plan.',
        action: 'Identify stress triggers',
        priority: 'high',
        category: 'stress',
        icon: '⚠️'
      });
    }
  } else if (stress <= 3) {
    suggestions.push({
      type: 'tip',
      title: 'Stress-Free Zone',
      description: 'Great stress management! Keep up whatever you\'re doing to stay calm.',
      action: 'Continue your current routine',
      priority: 'low',
      category: 'stress',
      icon: '😌'
    });
  }

  // Calmness-based suggestions
  if (calmness <= 3) {
    suggestions.push({
      type: 'activity',
      title: 'Calmness Restoration',
      description: 'Feeling restless? Try meditation, nature sounds, or gentle yoga.',
      action: 'Listen to nature sounds for 5 minutes',
      priority: 'high',
      category: 'calmness',
      icon: '🌿'
    });
  }

  // Sleep-based suggestions
  if (sleep !== undefined) {
    if (sleep < 6) {
      suggestions.push({
        type: 'reminder',
        title: 'Sleep Debt Alert',
        description: 'You need more sleep. Try going to bed 30 minutes earlier tonight.',
        action: 'Set an earlier bedtime',
        priority: 'high',
        category: 'sleep',
        icon: '🛌'
      });
    } else if (sleep > 9) {
      suggestions.push({
        type: 'tip',
        title: 'Oversleeping Notice',
        description: 'You slept a lot. Make sure you\'re not avoiding something or feeling depressed.',
        action: 'Check in with yourself',
        priority: 'medium',
        category: 'sleep',
        icon: '😴'
      });
    }
  }

  // Pattern-based suggestions
  if (hasRecentData) {
    const moodTrend = mood - avgMood;
    if (moodTrend > 2) {
      suggestions.push({
        type: 'tip',
        title: 'Mood Improvement',
        description: 'Your mood is better than usual! What changed? Keep doing it!',
        action: 'Reflect on what helped',
        priority: 'medium',
        category: 'mood',
        icon: '📈'
      });
    } else if (moodTrend < -2) {
      suggestions.push({
        type: 'activity',
        title: 'Mood Support',
        description: 'Your mood is lower than usual. Be gentle with yourself and reach out for support.',
        action: 'Talk to a friend or family member',
        priority: 'high',
        category: 'mood',
        icon: '🤗'
      });
    }
  }

  // Wellness suggestions based on overall state
  const overallScore = (mood + energy + (10 - stress) + calmness) / 4;
  
  if (overallScore < 5) {
    suggestions.push({
      type: 'challenge',
      title: 'Wellness Reset',
      description: 'Your overall wellness could use a boost. Try a complete wellness routine today.',
      action: 'Do 3 wellness activities',
      priority: 'high',
      category: 'wellness',
      icon: '🔄'
    });
  } else if (overallScore > 8) {
    suggestions.push({
      type: 'tip',
      title: 'Peak Performance',
      description: 'You\'re in great shape! Use this momentum to build positive habits.',
      action: 'Set a new personal goal',
      priority: 'medium',
      category: 'wellness',
      icon: '🏆'
    });
  }

  // Social suggestions
  if (mood > 6 && energy > 6) {
    suggestions.push({
      type: 'activity',
      title: 'Social Energy',
      description: 'Great mood and energy! Perfect time for social activities or helping others.',
      action: 'Plan a social activity',
      priority: 'low',
      category: 'social',
      icon: '👥'
    });
  }

  // Productivity suggestions
  if (energy > 6 && stress < 5) {
    suggestions.push({
      type: 'challenge',
      title: 'Productivity Window',
      description: 'Optimal conditions for focused work. Tackle your most important task now.',
      action: 'Work on your top priority',
      priority: 'medium',
      category: 'productivity',
      icon: '🎯'
    });
  }

  // General wellness suggestions
  suggestions.push({
    type: 'reminder',
    title: 'Stay Hydrated',
    description: 'Drinking enough water throughout the day can improve mood, energy, and overall wellbeing.',
    action: 'Drink a glass of water',
    priority: 'low',
    category: 'health',
    icon: '💧'
  });

  // Return suggestions sorted by priority and limit to 6
  return suggestions
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 6);
};

// Weather-based suggestions (mock implementation)
export const getWeatherSuggestions = (weather: string): MoodSuggestion[] => {
  const suggestions: MoodSuggestion[] = [];
  
  if (weather === 'rainy') {
    suggestions.push({
      type: 'activity',
      title: 'Cozy Indoor Day',
      description: 'Perfect weather for reading, cooking, or catching up on indoor hobbies.',
      action: 'Plan indoor activities',
      category: 'weather',
      priority: 'medium',
      icon: '🌧️'
    });
  } else if (weather === 'sunny') {
    suggestions.push({
      type: 'activity',
      title: 'Sunny Day Energy',
      description: 'Great day for outdoor activities! Vitamin D from sunlight can boost your mood.',
      action: 'Go outside',
      category: 'weather',
      priority: 'medium',
      icon: '☀️'
    });
  }
  
  return suggestions;
};

// Time-based suggestions
export const getTimeBasedSuggestions = (hour: number): MoodSuggestion[] => {
  const suggestions: MoodSuggestion[] = [];
  
  if (hour >= 6 && hour < 9) {
    suggestions.push({
      type: 'tip',
      title: 'Morning Routine',
      description: 'Start your day with intention. A few minutes of meditation or journaling can set a positive tone.',
      action: 'Morning meditation',
      category: 'routine',
      priority: 'medium',
      icon: '🌅'
    });
  } else if (hour >= 18 && hour < 22) {
    suggestions.push({
      type: 'tip',
      title: 'Evening Wind-down',
      description: 'Time to relax and prepare for rest. Avoid screens and try gentle stretching or reading.',
      action: 'Evening routine',
      category: 'routine',
      priority: 'medium',
      icon: '🌙'
    });
  }
  
  return suggestions;
};
