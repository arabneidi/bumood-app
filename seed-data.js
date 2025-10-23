// Quick seed script to restore sample data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  console.log('🌱 Seeding sample data...');

  // Create a user (using the same ID as the API expects)
  try {
    const user = await prisma.user.create({
      data: {
        id: 'dummy-user',
        name: 'Demo User',
        email: 'demo@example.com'
      }
    });
    console.log('✅ User created');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ User already exists');
    } else {
      throw error;
    }
  }

  // Create sample mood entries
  const moodEntries = [
    {
      userId: 'dummy-user',
      valence: 7,
      energy: 6,
      focus: 8,
      stress: 4,
      sleep: 7.5,
      notes: 'Feeling good today, had a productive morning',
      activities: JSON.stringify(['running', 'meditation', 'work']),
      reflection: 'Great day overall, feeling motivated'
    },
    {
      userId: 'dummy-user',
      valence: 5,
      energy: 4,
      focus: 6,
      stress: 7,
      sleep: 6,
      notes: 'Stressed about work deadlines',
      activities: JSON.stringify(['work', 'coffee']),
      reflection: 'Need to manage stress better'
    },
    {
      userId: 'dummy-user',
      valence: 8,
      energy: 7,
      focus: 9,
      stress: 2,
      sleep: 8,
      notes: 'Amazing day! Completed all goals',
      activities: JSON.stringify(['running', 'reading', 'family time']),
      reflection: 'Perfect balance of work and personal time'
    },
    {
      userId: 'dummy-user',
      valence: 6,
      energy: 5,
      focus: 7,
      stress: 5,
      sleep: 7,
      notes: 'Average day, nothing special',
      activities: JSON.stringify(['work', 'walking']),
      reflection: 'Steady progress on projects'
    },
    {
      userId: 'dummy-user',
      valence: 9,
      energy: 8,
      focus: 8,
      stress: 1,
      sleep: 8.5,
      notes: 'Fantastic day! Got promoted at work!',
      activities: JSON.stringify(['celebration', 'dinner', 'calling family']),
      reflection: 'Hard work finally paid off!'
    }
  ];

  for (const entry of moodEntries) {
    await prisma.moodEntry.create({
      data: entry
    });
  }

  // Create sample achievements
  const achievements = [
    {
      userId: 'dummy-user',
      type: 'streak',
      title: 'First Steps',
      description: 'Logged your first mood entry!',
      icon: '👶',
      stars: 1,
      unlockedAt: new Date()
    },
    {
      userId: 'dummy-user',
      type: 'streak',
      title: 'Week Warrior',
      description: 'Logged mood for 7 consecutive days!',
      icon: '🔥',
      stars: 2,
      unlockedAt: new Date()
    },
    {
      userId: 'dummy-user',
      type: 'mood',
      title: 'Sunshine Soul',
      description: 'Achieved valence score of 8+ for 3 days!',
      icon: '☀️',
      stars: 2,
      unlockedAt: new Date()
    },
    {
      userId: 'dummy-user',
      type: 'activity',
      title: 'Activity Enthusiast',
      description: 'Tracked running activity 5+ times!',
      icon: '🏃',
      stars: 3,
      unlockedAt: new Date()
    }
  ];

  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement
    });
  }

  // Create sample goals
  const goals = [
    {
      userId: 'dummy-user',
      title: 'Daily Meditation',
      description: 'Practice mindfulness for 10 minutes daily',
      targetValue: 30,
      currentValue: 12,
      unit: 'days',
      category: 'wellness',
      subcategory: 'meditation',
      difficulty: 'medium',
      streak: 5,
      bestStreak: 8
    },
    {
      userId: 'dummy-user',
      title: 'Morning Exercise',
      description: 'Go for a 30-minute run every morning',
      targetValue: 21,
      currentValue: 15,
      unit: 'days',
      category: 'health',
      subcategory: 'exercise',
      difficulty: 'hard',
      streak: 3,
      bestStreak: 7
    },
    {
      userId: 'dummy-user',
      title: 'Stress Management',
      description: 'Keep daily stress levels below 5/10',
      targetValue: 14,
      currentValue: 8,
      unit: 'days',
      category: 'stress',
      subcategory: 'management',
      difficulty: 'medium',
      streak: 2,
      bestStreak: 5
    }
  ];

  for (const goal of goals) {
    await prisma.goal.create({
      data: goal
    });
  }

  console.log('✅ Sample data seeded successfully!');
  console.log(`📊 Created: ${moodEntries.length} mood entries, ${achievements.length} achievements, ${goals.length} goals`);
}

seedData()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
