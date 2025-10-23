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
  // Streak Achievements
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
  {
    id: 'hundred-days',
    title: 'Century Club',
    description: 'Log mood for 100 consecutive days',
    icon: '🏆',
    stars: 3,
    type: 'streak',
    condition: { type: 'streak', value: 100 },
    category: 'streak'
  },

  // Mood Achievements
  {
    id: 'happy-week',
    title: 'Sunshine Week',
    description: 'Have 7 consecutive days with mood 8+',
    icon: '☀️',
    stars: 2,
    type: 'mood',
    condition: { type: 'mood', value: 8, period: 'daily' },
    category: 'mood'
  },
  {
    id: 'calm-master',
    title: 'Zen Master',
    description: 'Maintain calmness 9+ for 14 days',
    icon: '🧘',
    stars: 3,
    type: 'mood',
    condition: { type: 'mood', value: 9, period: 'daily' },
    category: 'mood'
  },

  // Goal Achievements
  {
    id: 'first-goal',
    title: 'Goal Setter',
    description: 'Complete your first goal',
    icon: '🎯',
    stars: 1,
    type: 'goal',
    condition: { type: 'goal_completion', value: 1 },
    category: 'goals'
  },
  {
    id: 'goal-master',
    title: 'Goal Master',
    description: 'Complete 10 goals',
    icon: '👑',
    stars: 3,
    type: 'goal',
    condition: { type: 'goal_completion', value: 10 },
    category: 'goals'
  },

  // Habit Achievements
  {
    id: 'habit-builder',
    title: 'Habit Builder',
    description: 'Complete a habit for 21 days',
    icon: '🔗',
    stars: 2,
    type: 'habit',
    condition: { type: 'habit_streak', value: 21 },
    category: 'habits'
  },
  {
    id: 'habit-master',
    title: 'Habit Master',
    description: 'Complete a habit for 100 days',
    icon: '💪',
    stars: 3,
    type: 'habit',
    condition: { type: 'habit_streak', value: 100 },
    category: 'habits'
  },

  // Special Achievements
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Log mood before 8 AM for 7 days',
    icon: '🐦',
    stars: 2,
    type: 'special',
    condition: { type: 'count', value: 7 },
    category: 'special'
  },
  {
    id: 'reflection-master',
    title: 'Reflection Master',
    description: 'Complete 50 micro-reflections',
    icon: '💭',
    stars: 2,
    type: 'special',
    condition: { type: 'count', value: 50 },
    category: 'special'
  },
  {
    id: 'voice-user',
    title: 'Voice of Reason',
    description: 'Use voice entry 10 times',
    icon: '🎤',
    stars: 1,
    type: 'special',
    condition: { type: 'count', value: 10 },
    category: 'special'
  }
];

export const getAchievementById = (id: string): AchievementDefinition | undefined => {
  return achievementDefinitions.find(achievement => achievement.id === id);
};

export const getAchievementsByCategory = (category: string): AchievementDefinition[] => {
  return achievementDefinitions.filter(achievement => achievement.category === category);
};

export const getAchievementsByType = (type: string): AchievementDefinition[] => {
  return achievementDefinitions.filter(achievement => achievement.type === type);
};



