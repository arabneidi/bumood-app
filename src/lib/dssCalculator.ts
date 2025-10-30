import { db } from '@/lib/db';

export interface DSSComponents {
  learningMomentum: number;
  recoveryIndex: number;
  connectionScore: number;
}

export interface DSSResult {
  dssScore: number;
  components: DSSComponents;
  zScores: {
    zLM: number;
    zRI: number;
    zCN: number;
  };
  historicalData: {
    lmHistory: number[];
    riHistory: number[];
    cnHistory: number[];
  };
}

/**
 * Calculate Daily Success Score (DSS) based on the formula:
 * DSS = 0.5*zLM + 0.3*zRI + 0.2*zCN
 * 
 * Where:
 * - LM (Learning Momentum) = deepwork_minutes + 10*tasks_completed
 * - RI (Recovery Index) = sleep_hours + (recovery_action ? 1 : 0)
 * - CN (Connection) = positive_social_touchpoints
 */
export async function calculateDSS(userId: string, date: Date): Promise<DSSResult> {
  // Get today's date
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  // Calculate today's components from mood entries (will be calculated below)
  let todayLM = 0;
  let todayRI = 0;
  let todayCN = 0;

  // Get last 14 days of data for z-score calculation using ACTIVITY TIME
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Get mood entries from last 14 days (using creation time for date range)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const moodEntries = await db.moodEntry.findMany({
    where: {
      userId,
      createdAt: {
        gte: fourteenDaysAgo,
        lt: tomorrow
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Group mood entries by date and calculate DSS components for each day
  const dailyData = new Map<string, any>();
  
  for (const entry of moodEntries) {
    const entryDate = new Date(entry.createdAt);
    // Use LOCAL date key (not UTC) to bucket entries by your local day
    const y = entryDate.getFullYear();
    const m = String(entryDate.getMonth() + 1).padStart(2, '0');
    const d = String(entryDate.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, {
        date: entryDate,
        entries: [],
        deepworkMinutes: 0,
        tasksCompleted: 0,
        sleepHours: 0,
        recoveryAction: false,
        positiveSocialTouchpoints: 0
      });
    }
    
    const dayData = dailyData.get(dateKey);
    dayData.entries.push(entry);
  }

  // Process each day's entries to calculate DSS components
  for (const [dateKey, dayData] of dailyData) {
    console.log(`🔵 Processing ${dayData.entries.length} entries for ${dateKey}`);
    
    // Calculate deep work from ALL entries (sum all time slots)
    let totalDeepWorkMinutes = 0;
    let totalTasksCompleted = 0;
    let totalSocialTouchpoints = 0;
    let maxSleepHours = 0;
    let hasRecoveryAction = false;

    for (const entry of dayData.entries) {
      // Calculate deep work from selected time slots (activity time)
      if (entry.selectedTimeSlots) {
        try {
          const timeSlots = JSON.parse(entry.selectedTimeSlots);
          if (Array.isArray(timeSlots)) {
            const uniqueSlots = [...new Set(timeSlots)]; // Remove duplicates
            totalDeepWorkMinutes += uniqueSlots.length * 60; // Each slot = 60 minutes
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }
      
      // Calculate tasks completed from activities with LM component
      if (entry.activityEntries) {
        try {
          const activityEntries = JSON.parse(entry.activityEntries);
          if (Array.isArray(activityEntries)) {
            for (const activityEntry of activityEntries) {
              const activityName = activityEntry.activity;
              const predefinedActivity = await db.predefinedActivity.findFirst({
                where: {
                  name: activityName,
                  dssComponent: 'LM',
                  isActive: true
                }
              });
              if (predefinedActivity) {
                totalTasksCompleted += 1; // Count each time slot with LM activity
              }
            }
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }
      
      // Calculate social touchpoints from activities with Connection component
      if (entry.activityEntries) {
        try {
          const activityEntries = JSON.parse(entry.activityEntries);
          if (Array.isArray(activityEntries)) {
            for (const activityEntry of activityEntries) {
              const activityName = activityEntry.activity;
              const predefinedActivity = await db.predefinedActivity.findFirst({
                where: {
                  name: activityName,
                  dssComponent: 'Connection',
                  isActive: true
                }
              });
              if (predefinedActivity) {
                totalSocialTouchpoints += 1; // Count each time slot with Connection activity
                console.log(`🔵 Found Connection activity: ${activityName} -> +1 social touchpoint`);
              } else {
                console.log(`🔵 No Connection activity found for: ${activityName}`);
              }
            }
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }
      
      // Use max sleep hours from all entries
      if (entry.sleep) {
        maxSleepHours = Math.max(maxSleepHours, entry.sleep);
      }
      
      // Recovery action: sleep > 7 hours OR activities with RI component (EXCLUDE Menstruation)
      if (entry.sleep && entry.sleep > 7) {
        hasRecoveryAction = true;
      }
      
      // Check for recovery activities (RI component) in activityEntries - Menstruation excluded from DSS
      if (entry.activityEntries) {
        try {
          const activityEntries = JSON.parse(entry.activityEntries);
          if (Array.isArray(activityEntries)) {
            for (const activityEntry of activityEntries) {
              const activityName = activityEntry.activity;
              
              // Skip Menstruation - it doesn't contribute to DSS, only MC
              if (activityName === 'Menstruation') {
                continue;
              }
              
              // Check database for RI component
              const predefinedActivity = await db.predefinedActivity.findFirst({
                where: {
                  name: activityName,
                  dssComponent: 'RI',
                  isActive: true
                }
              });
              
              if (predefinedActivity) {
                hasRecoveryAction = true;
                console.log(`🔵 Found RI activity: ${activityName} -> recovery action for RI`);
                break;
              }
            }
          }
        } catch (e) {
          // Skip if parsing fails
        }
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
              
              // Check database for RI component
              const predefinedActivity = await prisma.predefinedActivity.findFirst({
                where: {
                  name: activityName,
                  dssComponent: 'RI',
                  isActive: true
                }
              });
              
              if (predefinedActivity) {
                hasRecoveryAction = true;
                console.log(`🔵 Found RI activity in activities array: ${activityName} -> recovery action for RI`);
                break;
              }
            }
          }
        } catch (e) {
          // Skip if parsing fails
        }
      }
    }

    // Set the calculated values for this day
    dayData.deepworkMinutes = totalDeepWorkMinutes;
    dayData.tasksCompleted = totalTasksCompleted;
    dayData.positiveSocialTouchpoints = totalSocialTouchpoints;
    dayData.sleepHours = maxSleepHours;
    dayData.recoveryAction = hasRecoveryAction;

    console.log(`🔵 ${dateKey}: DeepWork=${totalDeepWorkMinutes}min, Tasks=${totalTasksCompleted}, Social=${totalSocialTouchpoints}, Sleep=${maxSleepHours}h`);
    console.log(`🔵 ${dateKey} entries:`, dayData.entries.map(e => ({
      selectedTimeSlots: e.selectedTimeSlots,
      activityEntries: e.activityEntries,
      sleep: e.sleep
    })));
  }

  // Convert to array and calculate historical components
  const historicalData = Array.from(dailyData.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  
  console.log(`🔵 DSS using ACTIVITY TIME - Found ${moodEntries.length} mood entries from last 14 days`);
  console.log(`🔵 DSS grouped into ${historicalData.length} unique days with activity data`);
  
  // Get today's data (most recent day)
  const todayData = historicalData[0];
  if (todayData) {
    todayLM = await calculateLearningMomentum(todayData, userId, todayData.date);
    todayRI = await calculateRecoveryIndex(todayData, userId, todayData.date);
    todayCN = await calculateConnectionScore(todayData, userId, todayData.date);
    console.log(`🔵 Today's components: LM=${todayLM}, RI=${todayRI}, CN=${todayCN}`);
    console.log(`🔵 Today's data:`, JSON.stringify(todayData, null, 2));
  } else {
    console.log(`🔵 No today's data found in historical data`);
  }
  
  // Use 14 days PRIOR to today for historical calculation (exclude today from z-score)
  const pastData = historicalData.slice(1); // Remove today (first element) for historical calculation
  
  const lmHistory = await Promise.all(pastData.map(async dayData => 
    await calculateLearningMomentum(dayData, userId, dayData.date)
  ));
  const riHistory = await Promise.all(pastData.map(async dayData => 
    await calculateRecoveryIndex(dayData, userId, dayData.date)
  ));
  const cnHistory = await Promise.all(pastData.map(async dayData => 
    await calculateConnectionScore(dayData, userId, dayData.date)
  ));

  // Calculate z-scores only if we have enough historical data
  let zLM = 0, zRI = 0, zCN = 0;
  let dssScore = 0;
  
  console.log(`🔵 Historical data for 14-day z-score calculation:`);
  console.log(`🔵 LM History (${lmHistory.length} days):`, lmHistory.slice(0, 5), '...');
  console.log(`🔵 RI History (${riHistory.length} days):`, riHistory.slice(0, 5), '...');
  console.log(`🔵 CN History (${cnHistory.length} days):`, cnHistory.slice(0, 5), '...');
  
  // If we have less than 5 days of historical data, use raw scores instead of z-scores
  if (lmHistory.length >= 5 && riHistory.length >= 5 && cnHistory.length >= 5) {
    zLM = calculateZScore(todayLM, lmHistory);
    zRI = calculateZScore(todayRI, riHistory);
    zCN = calculateZScore(todayCN, cnHistory);
    dssScore = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN;
    console.log(`🔵 Z-scores: zLM=${zLM.toFixed(3)}, zRI=${zRI.toFixed(3)}, zCN=${zCN.toFixed(3)}`);
    console.log(`🔵 DSS = 0.5×${zLM.toFixed(3)} + 0.3×${zRI.toFixed(3)} + 0.2×${zCN.toFixed(3)} = ${dssScore.toFixed(3)}`);
  } else {
    // For new users with insufficient data, use normalized raw scores
    const maxLM = Math.max(todayLM, ...lmHistory);
    const maxRI = Math.max(todayRI, ...riHistory);
    const maxCN = Math.max(todayCN, ...cnHistory);
    
    zLM = maxLM > 0 ? todayLM / maxLM : 0;
    zRI = maxRI > 0 ? todayRI / maxRI : 0;
    zCN = maxCN > 0 ? todayCN / maxCN : 0;
    
    dssScore = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN;
  }

  return {
    dssScore,
    components: {
      learningMomentum: todayLM,
      recoveryIndex: todayRI,
      connectionScore: todayCN
    },
    zScores: {
      zLM,
      zRI,
      zCN
    },
    historicalData: {
      lmHistory,
      riHistory,
      cnHistory
    }
  };
}

/**
 * Dedicated DSS calculator for the DSS Radar.
 * Currently mirrors calculateDSS, but isolated so we can evolve radar-specific
 * behavior independently (e.g., logging/off, different history windows, etc.).
 */
export async function calculateDSSForRadar(userId: string, date: Date): Promise<DSSResult> {
  return calculateDSS(userId, date);
}

/**
 * Calculate Learning Momentum: LM = deepwork_minutes + 10*tasks_completed + goal_progress
 */
async function calculateLearningMomentum(tracking: any, userId: string, date: Date): Promise<number> {
  if (!tracking) return 0;
  
  const deepworkMinutes = tracking.deepworkMinutes || 0;
  const tasksCompleted = tracking.tasksCompleted || 0;
  
  // Use ONLY today's per-goal progress (not cumulative)
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);

  const [lmGoals, todaysProgress] = await Promise.all([
    db.goal.findMany({
      where: {
        userId: userId,
        dssComponent: 'LM',
        completed: false
      },
      select: { id: true }
    }),
    db.goalProgressDaily.findMany({
      where: {
        userId: userId,
        date: { gte: dayStart, lt: nextDay }
      },
      select: { goalId: true, value: true }
    })
  ]);

  const lmGoalIds = new Set(lmGoals.map(g => g.id));
  const goalProgress = todaysProgress
    .filter(p => lmGoalIds.has(p.goalId))
    .reduce((sum, p) => sum + (p.value || 0) * 2, 0); // Each goal progress point = 2 LM points
  
  const result = deepworkMinutes + (10 * tasksCompleted) + goalProgress;
  console.log(`🔵 calculateLearningMomentum: deepwork=${deepworkMinutes}, tasks=${tasksCompleted}, goals=${goalProgress}, result=${result}`);
  return result;
}

/**
 * Calculate Recovery Index: RI = sleep_hours + (recovery_action ? 1 : 0) + goal_progress
 */
async function calculateRecoveryIndex(tracking: any, userId: string, date: Date): Promise<number> {
  if (!tracking) return 0;
  
  const sleepHours = tracking.sleepHours || 0;
  const recoveryAction = tracking.recoveryAction || false;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);

  const [riGoals, todaysProgress] = await Promise.all([
    db.goal.findMany({
      where: {
        userId: userId,
        dssComponent: 'RI',
        completed: false
      },
      select: { id: true }
    }),
    db.goalProgressDaily.findMany({
      where: {
        userId: userId,
        date: { gte: dayStart, lt: nextDay }
      },
      select: { goalId: true, value: true }
    })
  ]);

  const riGoalIds = new Set(riGoals.map(g => g.id));
  const goalProgress = todaysProgress
    .filter(p => riGoalIds.has(p.goalId))
    .reduce((sum, p) => sum + (p.value || 0) * 1.5, 0); // Each point = 1.5 RI points
  
  return sleepHours + (recoveryAction ? 1 : 0) + goalProgress;
}

/**
 * Calculate Connection Score: CN = positive_social_touchpoints + goal_progress
 */
async function calculateConnectionScore(tracking: any, userId: string, date: Date): Promise<number> {
  if (!tracking) return 0;
  
  const socialTouchpoints = tracking.positiveSocialTouchpoints || 0;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);

  const [connectionGoals, todaysProgress] = await Promise.all([
    db.goal.findMany({
      where: {
        userId: userId,
        dssComponent: 'Connection',
        completed: false
      },
      select: { id: true }
    }),
    db.goalProgressDaily.findMany({
      where: {
        userId: userId,
        date: { gte: dayStart, lt: nextDay }
      },
      select: { goalId: true, value: true }
    })
  ]);

  const connGoalIds = new Set(connectionGoals.map(g => g.id));
  const goalProgress = todaysProgress
    .filter(p => connGoalIds.has(p.goalId))
    .reduce((sum, p) => sum + (p.value || 0) * 1, 0); // Each point = 1 Connection point
  
  return socialTouchpoints + goalProgress;
}

/**
 * Calculate z-score: (value - mean) / stdDev
 * Uses sigma floor of 0.5 to prevent division by zero
 */
function calculateZScore(value: number, history: number[]): number {
  if (history.length === 0) return 0;
  
  // Filter out null/undefined values
  const validHistory = history.filter(h => h !== null && h !== undefined && !isNaN(h));
  
  if (validHistory.length === 0) return 0;
  
  const mean = validHistory.reduce((sum, val) => sum + val, 0) / validHistory.length;
  const variance = validHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validHistory.length;
  const stdDev = Math.sqrt(variance);
  
  // Apply sigma floor of 0.5
  const adjustedStdDev = Math.max(stdDev, 0.5);
  
  const zScore = (value - mean) / adjustedStdDev;
  
  console.log(`🔵 calculateZScore: value=${value}, mean=${mean.toFixed(3)}, stdDev=${stdDev.toFixed(3)}, adjustedStdDev=${adjustedStdDev.toFixed(3)}, zScore=${zScore.toFixed(3)}`);
  
  return zScore;
}

/**
 * Update DSS scores for a specific day
 */
export async function updateDSSForDay(userId: string, date: Date): Promise<void> {
  const dssResult = await calculateDSS(userId, date);
  
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  await db.dailyTracking.upsert({
    where: {
      userId_date: {
        userId,
        date: today
      }
    },
    update: {
      dssScore: dssResult.dssScore,
      learningMomentum: dssResult.components.learningMomentum,
      recoveryIndex: dssResult.components.recoveryIndex,
      connectionScore: dssResult.components.connectionScore
    },
    create: {
      userId,
      date: today,
      dssScore: dssResult.dssScore,
      learningMomentum: dssResult.components.learningMomentum,
      recoveryIndex: dssResult.components.recoveryIndex,
      connectionScore: dssResult.components.connectionScore
    }
  });
}

/**
 * Get DSS trends over time
 */
export async function getDSSTrends(userId: string, days: number = 30): Promise<{
  dates: string[];
  dssScores: number[];
  learningMomentum: number[];
  recoveryIndex: number[];
  connectionScore: number[];
}> {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  const dates: string[] = [];
  const dssScores: number[] = [];
  const learningMomentum: number[] = [];
  const recoveryIndex: number[] = [];
  const connectionScore: number[] = [];

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    dates.push(dateKey);

    const dayStart = new Date(cursor);
    const nextDay = new Date(cursor);
    nextDay.setDate(nextDay.getDate() + 1);

    const hasEntries = await db.moodEntry.count({ where: { userId, createdAt: { gte: dayStart, lt: nextDay } } });

    if (hasEntries === 0) {
      dssScores.push(0);
      learningMomentum.push(0);
      recoveryIndex.push(0);
      connectionScore.push(0);
    } else {
      const res = await calculateDSS(userId, dayStart);
      dssScores.push(res.dssScore || 0);
      learningMomentum.push(res.components.learningMomentum || 0);
      recoveryIndex.push(res.components.recoveryIndex || 0);
      connectionScore.push(res.components.connectionScore || 0);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return { dates, dssScores, learningMomentum, recoveryIndex, connectionScore };
}
