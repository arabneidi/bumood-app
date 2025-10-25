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
 * Calculate Mood Composite for DASHBOARD (MC) based on the formula:
 * MC = 0.4*zV + 0.3*zE + 0.2*zF - 0.2*zS
 * 
 * Where z-scores are calculated from the last 14 days within the same time bucket
 * Uses 4 time buckets: morning, midday, evening, night
 */
export async function calculateMoodComposite(
  userId: string, 
  valence: number, 
  energy: number, 
  focus: number, 
  stress: number,
  date: Date = new Date()
): Promise<MoodCompositeResult> {
  console.log(`🔵 Calculating DASHBOARD MC for date: ${date.toISOString()}`);
  const timeBucket = getTimeBucket(date);
  console.log(`🔵 Time bucket: ${timeBucket} (morning/midday/evening/night)`);
  
  // Get last 14 days of data for the same time bucket ONLY
  const fourteenDaysAgo = new Date(date);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  console.log(`🔵 Historical range: ${fourteenDaysAgo.toISOString()} to ${date.toISOString()}`);

  // For Dashboard MC, we need to find entries that:
  // 1. Were created in the current time bucket, OR
  // 2. Have activities in the current time bucket (stored in selectedTimeSlots or activityEntries)
  // Since selectedTimeSlots is a JSON string, we'll fetch all entries and filter in code
  const allEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: {
        gte: fourteenDaysAgo,
        lt: date
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Filter to entries that belong to the current time bucket
  // Dashboard MC uses ACTIVITY TIME, not creation time
  const historicalData = allEntries.filter(entry => {
    // Check if it has activities in the current time bucket (based on activity time, not creation time)
    if (entry.selectedTimeSlots) {
      try {
        const slots = JSON.parse(entry.selectedTimeSlots);
        // Check if any slot matches the current time bucket (e.g., "evening-18" for evening bucket)
        const bucketPrefix = timeBucket + '-';
        const hasActivitiesInBucket = Array.isArray(slots) && slots.some((slot: string) => slot.startsWith(bucketPrefix));
        
        if (hasActivitiesInBucket) {
          console.log(`🔵 Entry match: Created in ${entry.timeBucket}, has activities in ${timeBucket} bucket:`, slots.filter((s: string) => s.startsWith(bucketPrefix)));
        }
        
        return hasActivitiesInBucket;
      } catch (e) {
        // If parsing fails, skip this entry
        return false;
      }
    }
    
    return false;
  });

  console.log(`🔵 Found ${historicalData.length} historical entries for time bucket '${timeBucket}'`);
  
  // Group by date and average multiple entries on same day
  const dailyAverages = new Map<string, { valence: number, energy: number, focus: number, stress: number, count: number }>();
  
  historicalData.forEach(entry => {
    const dateKey = entry.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyAverages.has(dateKey)) {
      dailyAverages.set(dateKey, { valence: 0, energy: 0, focus: 0, stress: 0, count: 0 });
    }
    
    const dayData = dailyAverages.get(dateKey)!;
    dayData.valence += entry.valence;
    dayData.energy += entry.energy;
    dayData.focus += entry.focus;
    dayData.stress += entry.stress;
    dayData.count += 1;
  });
  
  // Calculate daily averages
  const averagedData = Array.from(dailyAverages.values()).map(dayData => ({
    valence: dayData.valence / dayData.count,
    energy: dayData.energy / dayData.count,
    focus: dayData.focus / dayData.count,
    stress: dayData.stress / dayData.count
  }));
  
  console.log(`🔵 Averaged to ${averagedData.length} unique days (from ${historicalData.length} entries)`);
  
  // Print historical data for debugging
  if (averagedData.length > 0) {
    console.log(`🔵 Historical data for ${timeBucket}:`, averagedData);
  } else {
    console.log(`🔵 No historical data found for time bucket '${timeBucket}'`);
  }

  // Extract historical values
  const valenceHistory = averagedData.map(entry => entry.valence);
  const energyHistory = averagedData.map(entry => entry.energy);
  const focusHistory = averagedData.map(entry => entry.focus);
  const stressHistory = averagedData.map(entry => entry.stress);

  // Calculate z-scores
  const zV = calculateZScore(valence, valenceHistory);
  const zE = calculateZScore(energy, energyHistory);
  const zF = calculateZScore(focus, focusHistory);
  const zS = calculateZScore(stress, stressHistory);

  // Calculate Mood Composite
  const moodComposite = 0.4 * zV + 0.3 * zE + 0.2 * zF - 0.2 * zS;

  console.log(`🔵 Dashboard MC calculated: ${moodComposite.toFixed(3)}, z-scores: V=${zV.toFixed(3)}, E=${zE.toFixed(3)}, F=${zF.toFixed(3)}, S=${zS.toFixed(3)}`);

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
 * Calculate Mood Composite for POWER HOURS with exact hour matching
 * 
 * DIFFERENT from Dashboard MC:
 * - Uses EXACT 24 hours (0-23), not 4 time buckets
 * - Supports weekly/monthly/yearly windows (not fixed 14 days)
 * - Filters by exact hour in activityEntries/selectedTimeSlots
 */
export async function calculateMoodCompositeForPowerHours(
  userId: string,
  valence: number,
  energy: number,
  focus: number,
  stress: number,
  targetHour: number, // Exact hour (0-23)
  window: 'weekly' | 'monthly' | 'yearly' = 'weekly',
  currentDate: Date = new Date()
): Promise<MoodCompositeResult> {
  console.log(`🧮 Calculating MC for Power Hours: hour=${targetHour}, window=${window}`);
  
  // Determine historical data range based on window
  let startDate: Date;
  let endDate: Date = new Date(currentDate);
  
  switch (window) {
    case 'weekly':
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      break;
  }
  
  console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // Get ALL entries in the window (not just same time bucket)
  const allEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    },
    select: {
      createdAt: true,
      valence: true,
      energy: true,
      focus: true,
      stress: true,
      activityEntries: true,
      selectedTimeSlots: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`📊 Found ${allEntries.length} total entries in window`);
  
  // Filter entries that have the exact target hour
  const entriesForHour = allEntries.filter(entry => {
    // Check activityEntries first (more accurate)
    if (entry.activityEntries) {
      try {
        const activityEntries = typeof entry.activityEntries === 'string' 
          ? JSON.parse(entry.activityEntries) 
          : entry.activityEntries;
        
        if (activityEntries && activityEntries.length > 0) {
          return activityEntries.some((activity: any) => activity.hour === targetHour);
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
    
    // Fallback to selectedTimeSlots
    if (entry.selectedTimeSlots) {
      try {
        const timeSlots = typeof entry.selectedTimeSlots === 'string' 
          ? JSON.parse(entry.selectedTimeSlots) 
          : entry.selectedTimeSlots;
        
        if (timeSlots && timeSlots.length > 0) {
          return timeSlots.some((timeSlotStr: string) => {
            const hourMatch = timeSlotStr.match(/[-]?(\d+)/);
            if (hourMatch) {
              const parsedHour = parseInt(hourMatch[1]);
              return !isNaN(parsedHour) && parsedHour === targetHour;
            }
            return false;
          });
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
    
    return false;
  });
  
  console.log(`🎯 Found ${entriesForHour.length} entries for hour ${targetHour}`);
  
  // Group by date and average multiple entries on same day
  const dailyAverages = new Map<string, { valence: number, energy: number, focus: number, stress: number, count: number }>();
  
  entriesForHour.forEach(entry => {
    const dateKey = entry.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyAverages.has(dateKey)) {
      dailyAverages.set(dateKey, { valence: 0, energy: 0, focus: 0, stress: 0, count: 0 });
    }
    
    const dayData = dailyAverages.get(dateKey)!;
    dayData.valence += entry.valence;
    dayData.energy += entry.energy;
    dayData.focus += entry.focus;
    dayData.stress += entry.stress;
    dayData.count += 1;
  });
  
  // Calculate daily averages
  const historicalData = Array.from(dailyAverages.values()).map(dayData => ({
    valence: dayData.valence / dayData.count,
    energy: dayData.energy / dayData.count,
    focus: dayData.focus / dayData.count,
    stress: dayData.stress / dayData.count
  }));
  
  console.log(`📈 Historical data points: ${historicalData.length}`);
  
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
  
  console.log(`✅ MC calculated: ${moodComposite}, z-scores: V=${zV.toFixed(3)}, E=${zE.toFixed(3)}, F=${zF.toFixed(3)}, S=${zS.toFixed(3)}`);
  
  return {
    moodComposite,
    zScores: { zV, zE, zF, zS },
    historicalData: {
      valenceHistory,
      energyHistory,
      focusHistory,
      stressHistory
    },
    timeBucket: getTimeBucket(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), targetHour))
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
