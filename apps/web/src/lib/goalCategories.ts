export interface GoalCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subcategories: GoalSubcategory[];
}

export interface GoalSubcategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  targetValue: number;
  unit: string;
}

export const goalCategories: GoalCategory[] = [
  {
    id: 'challenges',
    name: 'Challenges',
    description: 'Break bad habits and overcome personal challenges',
    icon: '🎯',
    color: 'bg-red-100 text-red-800',
    subcategories: [
      {
        id: 'break-bad-habits',
        name: 'Break Bad Habits',
        description: 'Overcome negative habits that hold you back',
        examples: ['Quit smoking', 'Stop drinking alcohol', 'Reduce social media', 'Stop nail biting'],
        difficulty: 'hard',
        targetValue: 30,
        unit: 'days'
      },
      {
        id: 'get-fit',
        name: 'Get Fit',
        description: 'Build physical fitness and strength',
        examples: ['Run 5K', 'Complete 30-day yoga challenge', 'Bike to work', 'Swim regularly'],
        difficulty: 'medium',
        targetValue: 30,
        unit: 'days'
      },
      {
        id: 'build-habits',
        name: 'Build Good Habits',
        description: 'Establish positive daily routines',
        examples: ['Brush teeth twice daily', 'Take morning shower', 'Wake up early', 'Face care routine'],
        difficulty: 'easy',
        targetValue: 21,
        unit: 'days'
      }
    ]
  },
  {
    id: 'health',
    name: 'Live Healthier',
    description: 'Improve your physical health and nutrition',
    icon: '🥗',
    color: 'bg-green-100 text-green-800',
    subcategories: [
      {
        id: 'nutrition',
        name: 'Better Nutrition',
        description: 'Improve your eating habits and nutrition',
        examples: ['No soda for 30 days', 'Eat 5 fruits daily', 'Drink 8 glasses water', 'No sweets'],
        difficulty: 'medium',
        targetValue: 30,
        unit: 'days'
      },
      {
        id: 'sleep',
        name: 'Better Sleep',
        description: 'Establish healthy sleep patterns',
        examples: ['No coffee after 2pm', 'No screens 1hr before bed', 'Sleep 8 hours', 'Consistent bedtime'],
        difficulty: 'medium',
        targetValue: 30,
        unit: 'days'
      }
    ]
  },
  {
    id: 'growth',
    name: 'Self Growth',
    description: 'Learn new skills and expand your knowledge',
    icon: '📚',
    color: 'bg-blue-100 text-blue-800',
    subcategories: [
      {
        id: 'learning',
        name: 'Learning & Skills',
        description: 'Develop new skills and knowledge',
        examples: ['Read 1 book per month', 'Learn a new language', 'Learn an instrument', 'Take online course'],
        difficulty: 'medium',
        targetValue: 30,
        unit: 'days'
      },
      {
        id: 'mindfulness',
        name: 'Mindfulness & Stress',
        description: 'Reduce stress and improve mental wellbeing',
        examples: ['Daily meditation', 'Gratitude journaling', 'Outdoor time', 'Deep breathing exercises'],
        difficulty: 'easy',
        targetValue: 21,
        unit: 'days'
      }
    ]
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Strengthen your personal relationships',
    icon: '💕',
    color: 'bg-pink-100 text-pink-800',
    subcategories: [
      {
        id: 'couple',
        name: 'Happy Couple',
        description: 'Strengthen your romantic relationship',
        examples: ['Weekly date night', 'Give surprise gifts', 'Quality time together', 'Express appreciation'],
        difficulty: 'easy',
        targetValue: 30,
        unit: 'days'
      },
      {
        id: 'family',
        name: 'Focus on Family',
        description: 'Spend quality time with family members',
        examples: ['Family dinner time', 'Visit grandparents', 'Movie night together', 'Family game night'],
        difficulty: 'easy',
        targetValue: 30,
        unit: 'days'
      }
    ]
  },
  {
    id: 'custom',
    name: 'Custom Goals',
    description: 'Your personal goals and habits',
    icon: '⭐',
    color: 'bg-purple-100 text-purple-800',
    subcategories: [
      {
        id: 'personal',
        name: 'Personal Goals',
        description: 'Your own custom goals and challenges',
        examples: ['Learn a new language', 'Master a skill', 'Complete a project', 'Achieve a milestone'],
        difficulty: 'medium',
        targetValue: 30,
        unit: 'days'
      }
    ]
  }
];

export const getCategoryById = (id: string): GoalCategory | undefined => {
  return goalCategories.find(category => category.id === id);
};

export const getSubcategoryById = (categoryId: string, subcategoryId: string): GoalSubcategory | undefined => {
  const category = getCategoryById(categoryId);
  return category?.subcategories.find(sub => sub.id === subcategoryId);
};



