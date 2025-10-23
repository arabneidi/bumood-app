// Simple script to create sample data
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createData() {
  try {
    console.log('Creating sample data...');

    // Create user (or use existing)
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

    // Create mood entries
    const entries = [
      { valence: 7, energy: 6, focus: 8, stress: 4, sleep: 7.5, notes: 'Feeling good today', activities: '["running", "meditation"]', reflection: 'Great day overall' },
      { valence: 5, energy: 4, focus: 6, stress: 7, sleep: 6, notes: 'Stressed about work', activities: '["work", "coffee"]', reflection: 'Need to manage stress' },
      { valence: 8, energy: 7, focus: 9, stress: 2, sleep: 8, notes: 'Amazing day!', activities: '["running", "reading"]', reflection: 'Perfect balance' },
      { valence: 6, energy: 5, focus: 7, stress: 5, sleep: 7, notes: 'Average day', activities: '["work", "walking"]', reflection: 'Steady progress' },
      { valence: 9, energy: 8, focus: 8, stress: 1, sleep: 8.5, notes: 'Fantastic day!', activities: '["celebration", "dinner"]', reflection: 'Hard work paid off!' }
    ];

    for (const entry of entries) {
      await prisma.moodEntry.create({
        data: {
          userId: 'dummy-user',
          ...entry
        }
      });
    }
    console.log('✅ Mood entries created');

    // Create achievements
    const achievements = [
      { type: 'streak', title: 'First Steps', description: 'Logged your first mood entry!', icon: '👶', stars: 1, unlockedAt: new Date() },
      { type: 'streak', title: 'Week Warrior', description: 'Logged mood for 7 consecutive days!', icon: '🔥', stars: 2, unlockedAt: new Date() },
      { type: 'mood', title: 'Sunshine Soul', description: 'Achieved valence score of 8+ for 3 days!', icon: '☀️', stars: 2, unlockedAt: new Date() },
      { type: 'activity', title: 'Activity Enthusiast', description: 'Tracked running activity 5+ times!', icon: '🏃', stars: 3, unlockedAt: new Date() }
    ];

    for (const achievement of achievements) {
      await prisma.achievement.create({
        data: {
          userId: 'dummy-user',
          ...achievement
        }
      });
    }
    console.log('✅ Achievements created');

    console.log('🎉 All data created successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createData();
