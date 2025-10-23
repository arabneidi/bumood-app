import { db } from "./db";

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

  // Get user's goals
  const goals = await db.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Get existing achievements to avoid duplicates
  const existingAchievements = await db.achievement.findMany({
    where: { userId },
  });

  const existingTitles = new Set(existingAchievements.map(a => a.title));

  // Calculate achievements based on mood entries
  if (moodEntries.length > 0) {
    const totalEntries = moodEntries.length;
    const avgValence = moodEntries.reduce((sum, entry) => sum + entry.valence, 0) / totalEntries;
    const avgEnergy = moodEntries.reduce((sum, entry) => sum + entry.energy, 0) / totalEntries;
    const avgSleep = moodEntries.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / totalEntries;

    // First Entry Achievement
    if (totalEntries >= 1 && !existingTitles.has("First Steps")) {
      achievements.push({
        id: `first-entry-${Date.now()}`,
        type: "milestone",
        title: "First Steps",
        description: "Logged your first mood entry!",
        icon: "🎯",
        stars: 1,
        unlockedAt: new Date(),
      });
    }

    // Consistency Achievements
    if (totalEntries >= 7 && !existingTitles.has("Week Warrior")) {
      achievements.push({
        id: `week-warrior-${Date.now()}`,
        type: "streak",
        title: "Week Warrior",
        description: "Logged mood for 7 consecutive days!",
        icon: "🔥",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    if (totalEntries >= 30 && !existingTitles.has("Monthly Master")) {
      achievements.push({
        id: `monthly-master-${Date.now()}`,
        type: "streak",
        title: "Monthly Master",
        description: "Logged mood for 30 days!",
        icon: "📅",
        stars: 3,
        unlockedAt: new Date(),
      });
    }

    // Mood Quality Achievements
    if (avgValence >= 8 && totalEntries >= 5 && !existingTitles.has("Sunshine Soul")) {
      achievements.push({
        id: `sunshine-soul-${Date.now()}`,
        type: "quality",
        title: "Sunshine Soul",
        description: "Maintained high positive mood (8+ average)!",
        icon: "☀️",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    if (avgEnergy >= 8 && totalEntries >= 5 && !existingTitles.has("Energizer Bunny")) {
      achievements.push({
        id: `energizer-bunny-${Date.now()}`,
        type: "quality",
        title: "Energizer Bunny",
        description: "Maintained high energy levels (8+ average)!",
        icon: "⚡",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    if (avgSleep >= 7 && totalEntries >= 5 && !existingTitles.has("Sleep Champion")) {
      achievements.push({
        id: `sleep-champion-${Date.now()}`,
        type: "quality",
        title: "Sleep Champion",
        description: "Maintained healthy sleep (7+ hours average)!",
        icon: "😴",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Stress Management Achievement
    const avgStress = moodEntries.reduce((sum, entry) => sum + entry.stress, 0) / totalEntries;
    if (avgStress <= 3 && totalEntries >= 5 && !existingTitles.has("Zen Master")) {
      achievements.push({
        id: `zen-master-${Date.now()}`,
        type: "quality",
        title: "Zen Master",
        description: "Maintained low stress levels (3 or below average)!",
        icon: "🧘",
        stars: 3,
        unlockedAt: new Date(),
      });
    }

    // Activity Achievements
    const allActivities = moodEntries.flatMap(entry => {
      try {
        return JSON.parse(entry.activities || '[]');
      } catch {
        return [];
      }
    });

    const activityCounts = allActivities.reduce((acc, activity) => {
      acc[activity] = (acc[activity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Most active activity
    const topActivity = Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (topActivity && topActivity[1] >= 5 && !existingTitles.has("Activity Enthusiast")) {
      achievements.push({
        id: `activity-enthusiast-${Date.now()}`,
        type: "activity",
        title: "Activity Enthusiast",
        description: `Tracked "${topActivity[0]}" activity 5+ times!`,
        icon: "🏃",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Creative New Badges inspired by the images
    // Study/Learning Badges
    const studyActivities = allActivities.filter(activity => 
      ['reading', 'studying', 'learning', 'research'].some(study => 
        activity.toLowerCase().includes(study)
      )
    );
    if (studyActivities.length >= 5 && !existingTitles.has("Nerd Hero")) {
      achievements.push({
        id: `nerd-hero-${Date.now()}`,
        type: "study",
        title: "Nerd Hero",
        description: "Studied or learned 5+ times!",
        icon: "🤓",
        stars: 3,
        unlockedAt: new Date(),
      });
    }

    // Habit Tracking Badges
    const habitEntries = moodEntries.filter(entry => 
      entry.waterIntake && entry.waterIntake >= 8
    );
    if (habitEntries.length >= 3 && !existingTitles.has("Hydration Guardian")) {
      achievements.push({
        id: `hydration-guardian-${Date.now()}`,
        type: "health",
        title: "Hydration Guardian",
        description: "Drank 8+ glasses of water for 3 days!",
        icon: "💧",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Mindfulness Badges
    const mindfulnessActivities = allActivities.filter(activity => 
      ['meditation', 'breathing', 'mindfulness', 'yoga'].some(mind => 
        activity.toLowerCase().includes(mind)
      )
    );
    if (mindfulnessActivities.length >= 5 && !existingTitles.has("Calm Mind")) {
      achievements.push({
        id: `calm-mind-${Date.now()}`,
        type: "mindfulness",
        title: "Calm Mind",
        description: "Practiced mindfulness 5+ times!",
        icon: "🧘",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Entertainment Badges
    const watchingActivities = allActivities.filter(activity => 
      ['watching', 'movies', 'tv', 'shows'].some(watch => 
        activity.toLowerCase().includes(watch)
      )
    );
    if (watchingActivities.length >= 3 && !existingTitles.has("Movie Buff")) {
      achievements.push({
        id: `movie-buff-${Date.now()}`,
        type: "entertainment",
        title: "Movie Buff",
        description: "Watched 3+ curated titles!",
        icon: "🎬",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Art/Creativity Badges
    const artActivities = allActivities.filter(activity => 
      ['art', 'drawing', 'painting', 'creative', 'writing'].some(art => 
        activity.toLowerCase().includes(art)
      )
    );
    if (artActivities.length >= 3 && !existingTitles.has("Colorful Life")) {
      achievements.push({
        id: `colorful-life-${Date.now()}`,
        type: "creativity",
        title: "Colorful Life",
        description: "Engaged in creative activities 3+ times!",
        icon: "🎨",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Social Badges
    const socialActivities = allActivities.filter(activity => 
      ['social', 'friends', 'family', 'meeting', 'call'].some(social => 
        activity.toLowerCase().includes(social)
      )
    );
    if (socialActivities.length >= 5 && !existingTitles.has("Good Group")) {
      achievements.push({
        id: `good-group-${Date.now()}`,
        type: "social",
        title: "Good Group",
        description: "Had 5+ social interactions!",
        icon: "👥",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Communication Badges
    if (socialActivities.length >= 3 && !existingTitles.has("Ring Ring")) {
      achievements.push({
        id: `ring-ring-${Date.now()}`,
        type: "communication",
        title: "Ring Ring",
        description: "Made 3+ phone calls or video chats!",
        icon: "📞",
        stars: 1,
        unlockedAt: new Date(),
      });
    }

    // Photography/Memory Badges
    const photoActivities = allActivities.filter(activity => 
      ['photo', 'picture', 'camera', 'memory'].some(photo => 
        activity.toLowerCase().includes(photo)
      )
    );
    if (photoActivities.length >= 3 && !existingTitles.has("Paparazzi")) {
      achievements.push({
        id: `paparazzi-${Date.now()}`,
        type: "photography",
        title: "Paparazzi",
        description: "Captured 3+ special moments!",
        icon: "📸",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Style/Fashion Badges
    const styleActivities = allActivities.filter(activity => 
      ['fashion', 'style', 'outfit', 'dress'].some(style => 
        activity.toLowerCase().includes(style)
      )
    );
    if (styleActivities.length >= 2 && !existingTitles.has("You Have Style")) {
      achievements.push({
        id: `you-have-style-${Date.now()}`,
        type: "fashion",
        title: "You Have Style",
        description: "Expressed your personal style 2+ times!",
        icon: "✍️",
        stars: 1,
        unlockedAt: new Date(),
      });
    }

    // Intelligence/Learning Badges
    if (studyActivities.length >= 10 && !existingTitles.has("Smart")) {
      achievements.push({
        id: `smart-${Date.now()}`,
        type: "intelligence",
        title: "Smart",
        description: "Engaged in learning 10+ times!",
        icon: "💡",
        stars: 3,
        unlockedAt: new Date(),
      });
    }

    // Safety/Wellness Badges
    const safetyActivities = allActivities.filter(activity => 
      ['safety', 'protection', 'wellness', 'health'].some(safety => 
        activity.toLowerCase().includes(safety)
      )
    );
    if (safetyActivities.length >= 2 && !existingTitles.has("Playing Safe")) {
      achievements.push({
        id: `playing-safe-${Date.now()}`,
        type: "safety",
        title: "Playing Safe",
        description: "Prioritized safety and wellness 2+ times!",
        icon: "🛡️",
        stars: 1,
        unlockedAt: new Date(),
      });
    }

    // Hero/Achievement Badges
    if (totalEntries >= 50 && !existingTitles.has("Our Hero")) {
      achievements.push({
        id: `our-hero-${Date.now()}`,
        type: "hero",
        title: "Our Hero",
        description: "Logged 50+ mood entries!",
        icon: "🦸",
        stars: 3,
        unlockedAt: new Date(),
      });
    }

    // Complex Person Badge (for diverse activities)
    const uniqueActivities = new Set(allActivities);
    if (uniqueActivities.size >= 10 && !existingTitles.has("Complex Person")) {
      achievements.push({
        id: `complex-person-${Date.now()}`,
        type: "diversity",
        title: "Complex Person",
        description: "Engaged in 10+ different activities!",
        icon: "🎭",
        stars: 3,
        unlockedAt: new Date(),
      });
    }

    // Busy Bee Badge (for high activity)
    if (allActivities.length >= 20 && !existingTitles.has("Busy Bee")) {
      achievements.push({
        id: `busy-bee-${Date.now()}`,
        type: "activity",
        title: "Busy Bee",
        description: "Tracked 20+ activities!",
        icon: "🏃‍♀️",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Dedicated Badge (for consistency)
    if (totalEntries >= 14 && !existingTitles.has("Dedicated")) {
      achievements.push({
        id: `dedicated-${Date.now()}`,
        type: "dedication",
        title: "Dedicated",
        description: "Logged mood for 14+ days!",
        icon: "🏅",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    // Hat-trick Badge (for three consecutive achievements)
    if (totalEntries >= 21 && !existingTitles.has("Hat-trick")) {
      achievements.push({
        id: `hat-trick-${Date.now()}`,
        type: "streak",
        title: "Hat-trick",
        description: "Maintained consistency for 21+ days!",
        icon: "🎩",
        stars: 3,
        unlockedAt: new Date(),
      });
    }
  }

  // Goal-based achievements
  if (goals.length > 0) {
    const completedGoals = goals.filter(goal => goal.completed);
    const bestStreak = Math.max(...goals.map(goal => goal.bestStreak), 0);

    if (completedGoals.length >= 1 && !existingTitles.has("Goal Getter")) {
      achievements.push({
        id: `goal-getter-${Date.now()}`,
        type: "goal",
        title: "Goal Getter",
        description: "Completed your first goal!",
        icon: "🎯",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    if (completedGoals.length >= 3 && !existingTitles.has("Goal Crusher")) {
      achievements.push({
        id: `goal-crusher-${Date.now()}`,
        type: "goal",
        title: "Goal Crusher",
        description: "Completed 3 goals!",
        icon: "💪",
        stars: 3,
        unlockedAt: new Date(),
      });
    }

    if (bestStreak >= 7 && !existingTitles.has("Streak Star")) {
      achievements.push({
        id: `streak-star-${Date.now()}`,
        type: "streak",
        title: "Streak Star",
        description: "Maintained a 7+ day streak on any goal!",
        icon: "⭐",
        stars: 2,
        unlockedAt: new Date(),
      });
    }

    if (bestStreak >= 30 && !existingTitles.has("Streak Legend")) {
      achievements.push({
        id: `streak-legend-${Date.now()}`,
        type: "streak",
        title: "Streak Legend",
        description: "Maintained a 30+ day streak on any goal!",
        icon: "👑",
        stars: 3,
        unlockedAt: new Date(),
      });
    }
  }

  // Save new achievements to database
  for (const achievement of achievements) {
    await db.achievement.create({
      data: {
        userId,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        stars: achievement.stars,
        unlockedAt: achievement.unlockedAt,
      },
    });
  }

  // Return all achievements (existing + new)
  const allAchievements = await db.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "desc" },
  });

  return allAchievements.map(achievement => ({
    id: achievement.id,
    type: achievement.type,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    stars: achievement.stars,
    unlockedAt: achievement.unlockedAt,
  }));
}
