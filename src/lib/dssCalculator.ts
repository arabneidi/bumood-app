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

  // Check if there are any mood entries for today
  const todayMoodEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  });

  // If no mood entries for today, return zero DSS
  if (todayMoodEntries.length === 0) {
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
  const todayLM = calculateLearningMomentum(todayTracking);
  const todayRI = calculateRecoveryIndex(todayTracking);
  const todayCN = calculateConnectionScore(todayTracking);

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
  const lmHistory = historicalData.map(entry => calculateLearningMomentum(entry));
  const riHistory = historicalData.map(entry => calculateRecoveryIndex(entry));
  const cnHistory = historicalData.map(entry => calculateConnectionScore(entry));

  // Calculate z-scores
  const zLM = calculateZScore(todayLM, lmHistory);
  const zRI = calculateZScore(todayRI, riHistory);
  const zCN = calculateZScore(todayCN, cnHistory);

  // Calculate DSS score
  const dssScore = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN;

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
 * Calculate Learning Momentum: LM = deepwork_minutes + 10*tasks_completed
 */
function calculateLearningMomentum(tracking: any): number {
  if (!tracking) return 0;
  
  const deepworkMinutes = tracking.deepworkMinutes || 0;
  const tasksCompleted = tracking.tasksCompleted || 0;
  
  return deepworkMinutes + (10 * tasksCompleted);
}

/**
 * Calculate Recovery Index: RI = sleep_hours + (recovery_action ? 1 : 0)
 */
function calculateRecoveryIndex(tracking: any): number {
  if (!tracking) return 0;
  
  const sleepHours = tracking.sleepHours || 0;
  const recoveryAction = tracking.recoveryAction || false;
  
  return sleepHours + (recoveryAction ? 1 : 0);
}

/**
 * Calculate Connection Score: CN = positive_social_touchpoints
 */
function calculateConnectionScore(tracking: any): number {
  if (!tracking) return 0;
  
  return tracking.positiveSocialTouchpoints || 0;
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
