import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TimeBucket = 'morning' | 'midday' | 'evening' | 'night';

export interface MoodCompositeResult {
  moodComposite: number;
  zScores: {
    zV: number; // Valence
    zE: number; // Energy
    zF: number; // Focus
    zS: number; // Stress
  };
  historicalData: {
    valenceHistory: number[];
    energyHistory: number[];
    focusHistory: number[];
    stressHistory: number[];
  };
  timeBucket: TimeBucket;
}

/**
 * Determine time bucket based on current time
 */
export function getTimeBucket(date: Date): TimeBucket {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Calculate Mood Composite (MC) based on the formula:
 * MC = 0.4*zV + 0.3*zE + 0.2*zF - 0.2*zS
 * 
 * Where z-scores are calculated from the last ~14 days within the same time bucket
 */
export async function calculateMoodComposite(
  userId: string, 
  valence: number, 
  energy: number, 
  focus: number, 
  stress: number,
  date: Date = new Date()
): Promise<MoodCompositeResult> {
  const timeBucket = getTimeBucket(date);
  
  // Get last 14 days of data for the same time bucket
  const fourteenDaysAgo = new Date(date);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const historicalData = await prisma.moodEntry.findMany({
    where: {
      userId,
      timeBucket,
      createdAt: {
        gte: fourteenDaysAgo,
        lt: date
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Extract historical values
  const valenceHistory = historicalData.map(entry => entry.valence);
  const energyHistory = historicalData.map(entry => entry.energy);
  const focusHistory = historicalData.map(entry => entry.focus);
  const stressHistory = historicalData.map(entry => entry.stress);

  // Calculate z-scores
  const zV = calculateZScore(valence, valenceHistory);
  const zE = calculateZScore(energy, energyHistory);
  const zF = calculateZScore(focus, focusHistory);
  const zS = calculateZScore(stress, stressHistory);

  // Calculate Mood Composite
  const moodComposite = 0.4 * zV + 0.3 * zE + 0.2 * zF - 0.2 * zS;

  return {
    moodComposite,
    zScores: { zV, zE, zF, zS },
    historicalData: {
      valenceHistory,
      energyHistory,
      focusHistory,
      stressHistory
    },
    timeBucket
  };
}

/**
 * Calculate z-score: (value - mean) / stdDev
 * Uses sigma floor of 0.5 to prevent division by zero
 * If fewer than 5 historical entries, treat missing z-scores as 0
 */
function calculateZScore(value: number, history: number[]): number {
  // Filter out null/undefined values
  const validHistory = history.filter(h => h !== null && h !== undefined && !isNaN(h));
  
  // If fewer than 5 historical entries, return 0 to avoid unstable swings
  // This means we need at least 5 historical data points before we can calculate z-scores
  if (validHistory.length < 5) {
    return 0;
  }
  
  const mean = validHistory.reduce((sum, val) => sum + val, 0) / validHistory.length;
  const variance = validHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validHistory.length;
  const stdDev = Math.sqrt(variance);
  
  // Apply sigma floor of 0.5
  const adjustedStdDev = Math.max(stdDev, 0.5);
  
  return (value - mean) / adjustedStdDev;
}

/**
 * Update Mood Composite for a specific mood entry
 */
export async function updateMoodCompositeForEntry(entryId: string): Promise<void> {
  const entry = await prisma.moodEntry.findUnique({
    where: { id: entryId }
  });

  if (!entry) return;

  const mcResult = await calculateMoodComposite(
    entry.userId,
    entry.valence,
    entry.energy,
    entry.focus,
    entry.stress,
    entry.createdAt
  );

  await prisma.moodEntry.update({
    where: { id: entryId },
    data: {
      moodComposite: mcResult.moodComposite,
      timeBucket: mcResult.timeBucket
    }
  });
}

/**
 * Get Mood Composite trends over time
 */
export async function getMoodCompositeTrends(
  userId: string, 
  days: number = 30
): Promise<{
  dates: string[];
  moodComposites: number[];
  timeBuckets: string[];
}> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const entries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      moodComposite: {
        not: null
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return {
    dates: entries.map(entry => entry.createdAt.toISOString().split('T')[0]),
    moodComposites: entries.map(entry => entry.moodComposite || 0),
    timeBuckets: entries.map(entry => entry.timeBucket)
  };
}

/**
 * Get current time bucket for display
 */
export function getCurrentTimeBucket(): TimeBucket {
  return getTimeBucket(new Date());
}

/**
 * Get time bucket display name
 */
export function getTimeBucketDisplayName(bucket: TimeBucket): string {
  const names = {
    morning: 'Morning',
    midday: 'Midday', 
    evening: 'Evening',
    night: 'Night'
  };
  return names[bucket];
}
