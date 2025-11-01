export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  stars: 1 | 2 | 3;
  type: 'streak' | 'goal' | 'special' | 'mood' | 'habit';
  condition: {
    type: 'streak' | 'count' | 'mood' | 'goal_completion' | 'habit_streak';
    value: number;
    period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  };
  category: string;
}

export const achievementDefinitions: AchievementDefinition[] = [
  // Entry Streaks
  {
    id: 'first-entry',
    title: 'Getting Started',
    description: 'Log your first mood entry',
    icon: '🌟',
    stars: 1,
    type: 'streak',
    condition: { type: 'count', value: 1 },
    category: 'streak'
  },
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Log mood for 7 consecutive days',
    icon: '🔥',
    stars: 2,
    type: 'streak',
    condition: { type: 'streak', value: 7 },
    category: 'streak'
  },
  {
    id: 'month-streak',
    title: 'Monthly Master',
    description: 'Log mood for 30 consecutive days',
    icon: '💎',
    stars: 3,
    type: 'streak',
    condition: { type: 'streak', value: 30 },
    category: 'streak'
  },

  // Mood Quality
  {
    id: 'happy-week',
    title: 'Sunshine Week',
    description: 'Have 7 consecutive days with valence 8+',
    icon: '☀️',
    stars: 2,
    type: 'mood',
    condition: { type: 'mood', value: 8, period: 'daily' },
    category: 'mood'
  },
  {
    id: 'energy-master',
    title: 'Energizer',
    description: 'Maintain energy 8+ for 14 days',
    icon: '⚡',
    stars: 3,
    type: 'mood',
    condition: { type: 'mood', value: 8, period: 'daily' },
    category: 'mood'
  },

  // Sleep & Recovery
  {
    id: 'sleep-champion',
    title: 'Sleep Champion',
    description: 'Log 8+ hours sleep for 7 consecutive days',
    icon: '😴',
    stars: 2,
    type: 'habit',
    condition: { type: 'habit_streak', value: 7 },
    category: 'recovery'
  },

  // Activity & Engagement
  {
    id: 'activity-explorer',
    title: 'Activity Explorer',
    description: 'Log 10 different activities',
    icon: '🎯',
    stars: 2,
    type: 'special',
    condition: { type: 'count', value: 10 },
    category: 'activities'
  },
  {
    id: 'reflection-master',
    title: 'Reflection Master',
    description: 'Complete 25 micro-reflections',
    icon: '💭',
    stars: 2,
    type: 'special',
    condition: { type: 'count', value: 25 },
    category: 'reflection'
  },

  // Consistency
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Log mood before 9 AM for 7 days',
    icon: '🐦',
    stars: 2,
    type: 'special',
    condition: { type: 'count', value: 7 },
    category: 'consistency'
  },
  {
    id: 'century-club',
    title: 'Century Club',
    description: 'Log 100 total mood entries',
    icon: '🏆',
    stars: 3,
    type: 'streak',
    condition: { type: 'count', value: 100 },
    category: 'milestone'
  }
];