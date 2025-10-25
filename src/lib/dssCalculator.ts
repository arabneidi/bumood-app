import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  // Get today's tracking data
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  const todayTracking = await prisma.dailyTracking.findFirst({
    where: {
      userId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  });


  // If no tracking data for today, return zero DSS
  if (!todayTracking) {
    return {
      dssScore: 0,
      components: {
        learningMomentum: 0,
        recoveryIndex: 0,
        connectionScore: 0
      },
      zScores: {
        zLM: 0,
        zRI: 0,
        zCN: 0
      },
      historicalData: {
        lmHistory: [],
        riHistory: [],
        cnHistory: []
      }
    };
  }

  // Calculate today's components
  const todayLM = await calculateLearningMomentum(todayTracking, userId, today);
  const todayRI = await calculateRecoveryIndex(todayTracking, userId, today);
  const todayCN = await calculateConnectionScore(todayTracking, userId, today);

  // Get last 14 days of data for z-score calculation
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const historicalData = await prisma.dailyTracking.findMany({
    where: {
      userId,
      date: {
        gte: fourteenDaysAgo,
        lt: today
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Calculate historical components
  const lmHistory = await Promise.all(historicalData.map(async entry => 
    await calculateLearningMomentum(entry, userId, entry.date)
  ));
  const riHistory = await Promise.all(historicalData.map(async entry => 
    await calculateRecoveryIndex(entry, userId, entry.date)
  ));
  const cnHistory = await Promise.all(historicalData.map(async entry => 
    await calculateConnectionScore(entry, userId, entry.date)
  ));

  // Calculate z-scores only if we have enough historical data
  let zLM = 0, zRI = 0, zCN = 0;
  let dssScore = 0;
  
  // If we have less than 5 days of historical data, use raw scores instead of z-scores
  if (lmHistory.length >= 5 && riHistory.length >= 5 && cnHistory.length >= 5) {
    zLM = calculateZScore(todayLM, lmHistory);
    zRI = calculateZScore(todayRI, riHistory);
    zCN = calculateZScore(todayCN, cnHistory);
    dssScore = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN;
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
 * Calculate Learning Momentum: LM = deepwork_minutes + 10*tasks_completed + goal_progress
 */
async function calculateLearningMomentum(tracking: any, userId: string, date: Date): Promise<number> {
  if (!tracking) return 0;
  
  const deepworkMinutes = tracking.deepworkMinutes || 0;
  const tasksCompleted = tracking.tasksCompleted || 0;
  
  // Get goal progress for LM goals (Learning Momentum)
  const lmGoals = await prisma.goal.findMany({
    where: {
      userId: userId,
      dssComponent: 'LM',
      completed: false
    }
  });
  
  // Calculate goal progress contribution
  let goalProgress = 0;
  for (const goal of lmGoals) {
    // Each +1 on goal progress contributes to LM
    const progressValue = goal.currentValue || 0;
    goalProgress += progressValue * 2; // Each goal progress point = 2 LM points
  }
  
  return deepworkMinutes + (10 * tasksCompleted) + goalProgress;
}

/**
 * Calculate Recovery Index: RI = sleep_hours + (recovery_action ? 1 : 0) + goal_progress
 */
async function calculateRecoveryIndex(tracking: any, userId: string, date: Date): Promise<number> {
  if (!tracking) return 0;
  
  const sleepHours = tracking.sleepHours || 0;
  const recoveryAction = tracking.recoveryAction || false;
  
  // Get goal progress for RI goals (Recovery Index)
  const riGoals = await prisma.goal.findMany({
    where: {
      userId: userId,
      dssComponent: 'RI',
      completed: false
    }
  });
  
  // Calculate goal progress contribution
  let goalProgress = 0;
  for (const goal of riGoals) {
    // Each +1 on goal progress contributes to RI
    const progressValue = goal.currentValue || 0;
    goalProgress += progressValue * 1.5; // Each goal progress point = 1.5 RI points
  }
  
  return sleepHours + (recoveryAction ? 1 : 0) + goalProgress;
}

/**
 * Calculate Connection Score: CN = positive_social_touchpoints + goal_progress
 */
async function calculateConnectionScore(tracking: any, userId: string, date: Date): Promise<number> {
  if (!tracking) return 0;
  
  const socialTouchpoints = tracking.positiveSocialTouchpoints || 0;
  
  // Get goal progress for Connection goals
  const connectionGoals = await prisma.goal.findMany({
    where: {
      userId: userId,
      dssComponent: 'Connection',
      completed: false
    }
  });
  
  // Calculate goal progress contribution
  let goalProgress = 0;
  for (const goal of connectionGoals) {
    // Each +1 on goal progress contributes to Connection
    const progressValue = goal.currentValue || 0;
    goalProgress += progressValue * 1; // Each goal progress point = 1 Connection point
  }
  
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
  
  return (value - mean) / adjustedStdDev;
}

/**
 * Update DSS scores for a specific day
 */
export async function updateDSSForDay(userId: string, date: Date): Promise<void> {
  const dssResult = await calculateDSS(userId, date);
  
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  
  await prisma.dailyTracking.upsert({
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
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trackingData = await prisma.dailyTracking.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  return {
    dates: trackingData.map(entry => entry.date.toISOString().split('T')[0]),
    dssScores: trackingData.map(entry => entry.dssScore || 0),
    learningMomentum: trackingData.map(entry => entry.learningMomentum || 0),
    recoveryIndex: trackingData.map(entry => entry.recoveryIndex || 0),
    connectionScore: trackingData.map(entry => entry.connectionScore || 0)
  };
}
