import { MoodEntry } from '@prisma/client';
import { db } from '@/lib/db';

// Optimized DSS calculation that accepts pre-fetched data
export async function calculateDSSOptimized(
  userId: string,
  date: Date,
  allEntriesByDate: Map<string, MoodEntry[]>,
  activitiesCache: Map<string, string>,
  goalsCache?: Array<{ dssComponent: string | null; currentValue: number | null }>
): Promise<{ dssScore: number }> {
  // Match original logic: use date at midnight (today)
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  const dateKey = today.toISOString().split('T')[0];
  
  // Get last 14 days of data (including today) - matches original: gte: fourteenDaysAgo, lt: tomorrow
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get entries for the last 14 days from pre-fetched data (including today)
  const historicalEntries: MoodEntry[] = [];
  const sortedDateKeys = Array.from(allEntriesByDate.keys())
    .filter(key => {
      const [year, month, day] = key.split('-').map(Number);
      const entryDateLocal = new Date(year, month - 1, day, 0, 0, 0);
      return entryDateLocal >= fourteenDaysAgo && entryDateLocal < tomorrow;
    })
    .sort();
  
  sortedDateKeys.forEach(key => {
    const entries = allEntriesByDate.get(key) || [];
    historicalEntries.push(...entries);
  });

  // Group by date for daily processing
  const dailyData = new Map<string, any>();
  historicalEntries.forEach(entry => {
    const entryDate = new Date(entry.createdAt);
    const key = entryDate.toISOString().split('T')[0];
    if (!dailyData.has(key)) {
      dailyData.set(key, {
        date: entryDate,
        entries: [],
        deepworkMinutes: 0,
        tasksCompleted: 0,
        sleepHours: 0,
        recoveryAction: false,
        positiveSocialTouchpoints: 0
      });
    }
    dailyData.get(key)!.entries.push(entry);
  });

  // Process each day to calculate DSS components (using cached activities)
  // Match original: use totals per day, then set to dayData
  for (const [dayKey, dayData] of dailyData) {
    let totalDeepWorkMinutes = 0;
    let totalTasksCompleted = 0;
    let totalSocialTouchpoints = 0;
    let maxSleepHours = 0;
    let hasRecoveryAction = false;
    
    for (const entry of dayData.entries) {
      // Calculate deep work from selected time slots (sum across all entries)
      if (entry.selectedTimeSlots) {
        try {
          const timeSlots = JSON.parse(entry.selectedTimeSlots);
          if (Array.isArray(timeSlots)) {
            totalDeepWorkMinutes += [...new Set(timeSlots)].length * 60;
          }
        } catch {}
      }

      // Calculate tasks completed using cached activities (match original: exact name match)
      if (entry.activityEntries) {
        try {
          const activityEntries = JSON.parse(entry.activityEntries);
          if (Array.isArray(activityEntries)) {
            for (const activityEntry of activityEntries) {
              const activityName = activityEntry.activity;
              if (!activityName) continue;
              // Try exact match first, then lowercase match
              const dssComponent = activitiesCache.get(activityName) || activitiesCache.get(activityName.toLowerCase());
              if (dssComponent === 'LM') {
                totalTasksCompleted += 1;
              }
            }
          }
        } catch {}
      }

      // Calculate social touchpoints using cached activities (match original: exact name match)
      if (entry.activityEntries) {
        try {
          const activityEntries = JSON.parse(entry.activityEntries);
          if (Array.isArray(activityEntries)) {
            for (const activityEntry of activityEntries) {
              const activityName = activityEntry.activity;
              if (!activityName) continue;
              // Try exact match first, then lowercase match
              const dssComponent = activitiesCache.get(activityName) || activitiesCache.get(activityName.toLowerCase());
              if (dssComponent === 'Connection') {
                totalSocialTouchpoints += 1;
              }
            }
          }
        } catch {}
      }

      // Sleep and recovery (match original: max sleep, recovery = sleep > 7 OR Menstruation)
      if (entry.sleep) {
        maxSleepHours = Math.max(maxSleepHours, entry.sleep);
      }
      if (entry.sleep && entry.sleep > 7) {
        hasRecoveryAction = true;
      }
      
      // Check for recovery activities (RI component) - Menstruation excluded from DSS
      if (entry.activityEntries) {
        try {
          const activityEntries = JSON.parse(entry.activityEntries);
          if (Array.isArray(activityEntries)) {
            for (const activityEntry of activityEntries) {
              const activityName = activityEntry.activity;
              if (!activityName) continue;
              
              // Skip Menstruation - it doesn't contribute to DSS, only MC
              if (activityName === 'Menstruation') {
                continue;
              }
              
              // Check cache for RI component
              const dssComponent = activitiesCache.get(activityName) || activitiesCache.get(activityName.toLowerCase());
              if (dssComponent === 'RI') {
                hasRecoveryAction = true;
                break;
              }
            }
          }
        } catch {}
      }
      
      // Also check activities array for RI component (Menstruation excluded)
      if (entry.activities) {
        try {
          const activities = Array.isArray(entry.activities) ? entry.activities : JSON.parse(entry.activities || '[]');
          if (Array.isArray(activities)) {
            for (const activityName of activities) {
              // Skip Menstruation - it doesn't contribute to DSS, only MC
              if (activityName === 'Menstruation') {
                continue;
              }
              
              // Check cache for RI component
              const dssComponent = activitiesCache.get(activityName) || activitiesCache.get(activityName.toLowerCase());
              if (dssComponent === 'RI') {
                hasRecoveryAction = true;
                break;
              }
            }
          }
        } catch {}
      }
    }

    // Set calculated values for this day (match original structure)
    dayData.deepworkMinutes = totalDeepWorkMinutes;
    dayData.tasksCompleted = totalTasksCompleted;
    dayData.positiveSocialTouchpoints = totalSocialTouchpoints;
    dayData.sleepHours = maxSleepHours;
    dayData.recoveryAction = hasRecoveryAction;
  }

  // Convert to array and sort (newest first) - match original logic
  const historicalData = Array.from(dailyData.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Get today's data (most recent day) - match original: historicalData[0]
  const todayData = historicalData[0];
  
  // Calculate today's components (using cached goals if available) - match original calculateLearningMomentum etc.
  let todayLM = 0, todayRI = 0, todayCN = 0;

  if (todayData) {
    // LM = deepwork_minutes + 10*tasks_completed + goal_progress
    todayLM = todayData.deepworkMinutes + (10 * todayData.tasksCompleted);
    if (goalsCache) {
      const lmGoals = goalsCache.filter(g => g.dssComponent === 'LM');
      todayLM += lmGoals.reduce((sum, g) => sum + (g.currentValue || 0) * 2, 0);
    }

    // RI = sleep_hours + (recovery_action ? 1 : 0) + goal_progress
    todayRI = todayData.sleepHours + (todayData.recoveryAction ? 1 : 0);
    if (goalsCache) {
      const riGoals = goalsCache.filter(g => g.dssComponent === 'RI');
      todayRI += riGoals.reduce((sum, g) => sum + (g.currentValue || 0) * 1.5, 0);
    }

    // CN = positive_social_touchpoints + goal_progress
    todayCN = todayData.positiveSocialTouchpoints;
    if (goalsCache) {
      const cnGoals = goalsCache.filter(g => g.dssComponent === 'Connection');
      todayCN += cnGoals.reduce((sum, g) => sum + (g.currentValue || 0), 0);
    }
  }

  // Calculate historical components (past 13 days, excluding today) - match original: slice(1)
  const pastData = historicalData.slice(1);
  // Include goals in historical calculation to match original
  const lmHistory = pastData.map(dayData => {
    let lm = dayData.deepworkMinutes + (10 * dayData.tasksCompleted);
    if (goalsCache) {
      const lmGoals = goalsCache.filter(g => g.dssComponent === 'LM');
      lm += lmGoals.reduce((sum, g) => sum + (g.currentValue || 0) * 2, 0);
    }
    return lm;
  });
  const riHistory = pastData.map(dayData => {
    let ri = dayData.sleepHours + (dayData.recoveryAction ? 1 : 0);
    if (goalsCache) {
      const riGoals = goalsCache.filter(g => g.dssComponent === 'RI');
      ri += riGoals.reduce((sum, g) => sum + (g.currentValue || 0) * 1.5, 0);
    }
    return ri;
  });
  const cnHistory = pastData.map(dayData => {
    let cn = dayData.positiveSocialTouchpoints;
    if (goalsCache) {
      const cnGoals = goalsCache.filter(g => g.dssComponent === 'Connection');
      cn += cnGoals.reduce((sum, g) => sum + (g.currentValue || 0), 0);
    }
    return cn;
  });

  // Calculate z-scores
  let zLM = 0, zRI = 0, zCN = 0, dssScore = 0;

  if (lmHistory.length >= 5 && riHistory.length >= 5 && cnHistory.length >= 5) {
    zLM = calculateZScore(todayLM, lmHistory);
    zRI = calculateZScore(todayRI, riHistory);
    zCN = calculateZScore(todayCN, cnHistory);
    dssScore = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN;
  } else {
    const maxLM = Math.max(todayLM, ...lmHistory, 1);
    const maxRI = Math.max(todayRI, ...riHistory, 1);
    const maxCN = Math.max(todayCN, ...cnHistory, 1);
    zLM = todayLM / maxLM;
    zRI = todayRI / maxRI;
    zCN = todayCN / maxCN;
    dssScore = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN;
  }

  return { dssScore };
}

function calculateZScore(value: number, history: number[]): number {
  if (history.length === 0) return 0;
  const validHistory = history.filter(h => h !== null && h !== undefined && !isNaN(h));
  if (validHistory.length === 0) return 0;
  
  const mean = validHistory.reduce((sum, val) => sum + val, 0) / validHistory.length;
  const variance = validHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validHistory.length;
  const stdDev = Math.sqrt(variance);
  const sigmaFloor = 0.5;
  const adjustedStdDev = Math.max(stdDev, sigmaFloor);
  
  return (value - mean) / adjustedStdDev;
}

