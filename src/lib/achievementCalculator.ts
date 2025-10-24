import { db } from "./db";
import { achievementDefinitions } from "./achievements";

export interface AchievementData {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  stars: number;
  unlockedAt: Date | null;
}

export async function calculateAchievements(userId: string): Promise<AchievementData[]> {
  const achievements: AchievementData[] = [];

  // Get user's mood entries
  const moodEntries = await db.moodEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Get existing achievements to avoid duplicates
  const existingAchievements = await db.achievement.findMany({
    where: { userId },
  });

  const existingTitles = new Set(existingAchievements.map(a => a.title));

  // Check each achievement definition
  for (const achievementDef of achievementDefinitions) {
    // Skip if already unlocked
    if (existingTitles.has(achievementDef.title)) {
      continue;
    }

    let isUnlocked = false;

    switch (achievementDef.condition.type) {
      case 'count':
        if (achievementDef.id === 'first-entry') {
          isUnlocked = moodEntries.length >= 1;
        } else if (achievementDef.id === 'century-club') {
          isUnlocked = moodEntries.length >= 100;
        } else if (achievementDef.id === 'activity-explorer') {
          // Count unique activities
          const uniqueActivities = new Set();
          moodEntries.forEach(entry => {
            if (entry.activities) {
              const activities = JSON.parse(entry.activities);
              if (Array.isArray(activities)) {
                activities.forEach((activity: string) => uniqueActivities.add(activity));
              }
            }
          });
          isUnlocked = uniqueActivities.size >= 10;
        } else if (achievementDef.id === 'reflection-master') {
          // Count entries with reflections
          const reflectionCount = moodEntries.filter(entry => entry.reflection && entry.reflection.trim() !== '').length;
          isUnlocked = reflectionCount >= 25;
        } else if (achievementDef.id === 'early-bird') {
          // Count entries logged before 9 AM
          const earlyEntries = moodEntries.filter(entry => {
            const hour = new Date(entry.createdAt).getHours();
            return hour < 9;
          });
          isUnlocked = earlyEntries.length >= 7;
        }
        break;

      case 'streak':
        if (achievementDef.id === 'week-streak') {
          isUnlocked = await checkConsecutiveDays(moodEntries, 7);
        } else if (achievementDef.id === 'month-streak') {
          isUnlocked = await checkConsecutiveDays(moodEntries, 30);
        }
        break;

      case 'mood':
        if (achievementDef.id === 'happy-week') {
          isUnlocked = await checkConsecutiveMood(moodEntries, 'valence', 8, 7);
        } else if (achievementDef.id === 'energy-master') {
          isUnlocked = await checkConsecutiveMood(moodEntries, 'energy', 8, 14);
        }
        break;

      case 'habit_streak':
        if (achievementDef.id === 'sleep-champion') {
          isUnlocked = await checkConsecutiveSleep(moodEntries, 8, 7);
        }
        break;
    }

    if (isUnlocked) {
      achievements.push({
        id: `${achievementDef.id}-${Date.now()}`,
        type: achievementDef.type,
        title: achievementDef.title,
        description: achievementDef.description,
        icon: achievementDef.icon,
        stars: achievementDef.stars,
        unlockedAt: new Date(),
      });
    }
  }

  return achievements;
}

// Helper function to check consecutive days
async function checkConsecutiveDays(moodEntries: any[], requiredDays: number): Promise<boolean> {
  if (moodEntries.length < requiredDays) return false;

  // Sort entries by date (newest first)
  const sortedEntries = moodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  let consecutiveDays = 1;
  let currentDate = new Date(sortedEntries[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      consecutiveDays++;
      currentDate = entryDate;
    } else if (dayDiff > 1) {
      break; // Gap in entries
    }
  }

  return consecutiveDays >= requiredDays;
}

// Helper function to check consecutive mood quality
async function checkConsecutiveMood(moodEntries: any[], moodType: string, minValue: number, requiredDays: number): Promise<boolean> {
  if (moodEntries.length < requiredDays) return false;

  // Sort entries by date (newest first)
  const sortedEntries = moodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  let consecutiveDays = 0;
  let currentDate = new Date(sortedEntries[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) {
      // Same day, check if mood meets criteria
      if (entry[moodType] >= minValue) {
        consecutiveDays++;
      } else {
        break; // Mood doesn't meet criteria
      }
    } else if (dayDiff === 1) {
      // Next day, check if mood meets criteria
      if (entry[moodType] >= minValue) {
        consecutiveDays++;
        currentDate = entryDate;
      } else {
        break; // Mood doesn't meet criteria
      }
    } else {
      break; // Gap in entries
    }
  }

  return consecutiveDays >= requiredDays;
}

// Helper function to check consecutive sleep quality
async function checkConsecutiveSleep(moodEntries: any[], minHours: number, requiredDays: number): Promise<boolean> {
  if (moodEntries.length < requiredDays) return false;

  // Sort entries by date (newest first)
  const sortedEntries = moodEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  let consecutiveDays = 0;
  let currentDate = new Date(sortedEntries[0].createdAt);
  currentDate.setHours(0, 0, 0, 0);

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.createdAt);
    entryDate.setHours(0, 0, 0, 0);
    
    const dayDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 0) {
      // Same day, check if sleep meets criteria
      if (entry.sleep && entry.sleep >= minHours) {
        consecutiveDays++;
      } else {
        break; // Sleep doesn't meet criteria
      }
    } else if (dayDiff === 1) {
      // Next day, check if sleep meets criteria
      if (entry.sleep && entry.sleep >= minHours) {
        consecutiveDays++;
        currentDate = entryDate;
      } else {
        break; // Sleep doesn't meet criteria
      }
    } else {
      break; // Gap in entries
    }
  }

  return consecutiveDays >= requiredDays;
}