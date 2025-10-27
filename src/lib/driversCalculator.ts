import { PrismaClient } from '@prisma/client';
import { MoodEntry } from '@prisma/client';
import { calculateDSS } from './dssCalculator';
import { calculateMoodComposite } from './moodCompositeCalculator';

const prisma = new PrismaClient();

export interface DriverResult {
  tag: string;
  occurrences: number;
  presentDays: number;
  absentDays: number;
  dssEffect: number;
  mcEffect: number;
  overallEffect: number;
  isHelpful: boolean;
}

export interface DriversAnalysis {
  helpful: DriverResult[];
  harmful: DriverResult[];
  lastCalculated: Date;
}

/**
 * Calculate activity drivers based on proper DSS methodology
 * STEP 1: Calculate DSS for each day of last 4 weeks (exactly like DSS vs MC chart)
 * STEP 2: Filter by activities and compare DSS of present vs absent days
 */
export async function calculateDrivers(moodEntries: MoodEntry[]): Promise<DriversAnalysis> {
  // Filter entries from last 4 weeks (28 days)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  
  const recentEntries = moodEntries.filter(entry => 
    new Date(entry.createdAt) >= fourWeeksAgo
  );

  if (recentEntries.length < 5) {
    return {
      helpful: [],
      harmful: [],
      lastCalculated: new Date()
    };
  }

  // STEP 1: Calculate DSS for each day (exactly like DSS vs MC chart)
  const entriesByDate = new Map<string, MoodEntry[]>();
  
  // Group entries by date
  recentEntries.forEach(entry => {
    const dateKey = new Date(entry.createdAt).toISOString().split('T')[0];
    if (!entriesByDate.has(dateKey)) {
      entriesByDate.set(dateKey, []);
    }
    entriesByDate.get(dateKey)!.push(entry);
  });

  // Calculate DSS for each day (EXACT logic from DSS vs MC chart)
  const dailyDSS = new Map<string, number>();
  const sortedDates = Array.from(entriesByDate.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const now = new Date(); // Current time for MC calculation
  
  for (const dateKey of sortedDates) {
    const entries = entriesByDate.get(dateKey)!;
    
    try {
      // Create date object from YYYY-MM-DD string in local timezone
      const [year, month, day] = dateKey.split('-').map(Number);
      
      // Calculate DSS for this day (use noon for DSS) - EXACT from DSS vs MC chart
      const dssDate = new Date(year, month - 1, day, 12, 0, 0);
      const dssResult = await calculateDSS(entries[0].userId, dssDate);
      
      dailyDSS.set(dateKey, dssResult.dssScore);
    } catch (error) {
      // Skip this day if DSS calculation fails
    }
  }

  // STEP 2: Extract activities and map to days
  const activityCounts = new Map<string, number>();
  const activityDays = new Map<string, Set<string>>(); // activity -> set of dates when present
  
  recentEntries.forEach(entry => {
    const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
    
    // Parse activities from JSON string
    let activities = [];
    try {
      activities = JSON.parse(entry.activities || '[]');
    } catch (error) {
      activities = [];
    }
    
    activities.forEach(activity => {
      activityCounts.set(activity, (activityCounts.get(activity) || 0) + 1);
      if (!activityDays.has(activity)) {
        activityDays.set(activity, new Set());
      }
      activityDays.get(activity)!.add(entryDate);
    });
  });

  // Filter activities with at least 3 occurrences
  const qualifyingActivities = Array.from(activityCounts.entries())
    .filter(([_, count]) => count >= 3)
    .map(([activity, _]) => activity);

  const drivers: DriverResult[] = [];

  // STEP 3: For each activity, compare DSS of present vs absent days
  for (const activity of qualifyingActivities) {
    const presentDates = activityDays.get(activity)!;
    const presentDays = Array.from(presentDates);
    const allDaysWithDSS = Array.from(dailyDSS.keys());
    const absentDays = allDaysWithDSS.filter(date => !presentDates.has(date));

    // Ensure we have enough data points for comparison
    if (presentDays.length < 2 || absentDays.length < 2) continue;

    // Get DSS values for present and absent days
    const presentDSSValues = presentDays
      .map(day => dailyDSS.get(day))
      .filter(dss => dss !== undefined) as number[];
    
    const absentDSSValues = absentDays
      .map(day => dailyDSS.get(day))
      .filter(dss => dss !== undefined) as number[];

    if (presentDSSValues.length === 0 || absentDSSValues.length === 0) continue;

    // Calculate means
    const presentDSSMean = presentDSSValues.reduce((sum, val) => sum + val, 0) / presentDSSValues.length;
    const absentDSSMean = absentDSSValues.reduce((sum, val) => sum + val, 0) / absentDSSValues.length;

    // Calculate effect size (difference of means)
    const dssEffect = presentDSSMean - absentDSSMean;

    // Calculate MC effect for this activity using EXACT logic from DSS vs MC chart
    let mcEffect = 0;
    try {
      // Get MC values for present and absent days
      const presentMCValues: number[] = [];
      const absentMCValues: number[] = [];
      
      // Calculate MC for present days - EXACT copy from DSS vs MC chart
      for (const dayKey of presentDays) {
        const entries = entriesByDate.get(dayKey)!;
        
        // Average all entries for this day (same as DSS vs MC chart logic)
        const avgValence = entries.reduce((sum, e) => sum + e.valence, 0) / entries.length;
        const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / entries.length;
        const avgFocus = entries.reduce((sum, e) => sum + e.focus, 0) / entries.length;
        const avgStress = entries.reduce((sum, e) => sum + e.stress, 0) / entries.length;

        // For MC calculation - EXACTLY like DSS vs MC chart:
        // Always use new Date() (current time) to determine the time bucket
        // This ensures the same bucket is used for historical data filtering
        const mcDate = now;
        
        const mcResult = await calculateMoodComposite(
          entries[0].userId,
          avgValence,
          avgEnergy,
          avgFocus,
          avgStress,
          mcDate
        );
        
        presentMCValues.push(mcResult.moodComposite);
      }

      // Calculate MC for absent days - EXACT copy from DSS vs MC chart
      for (const dayKey of absentDays) {
        const entries = entriesByDate.get(dayKey)!;
        
        // Average all entries for this day (same as DSS vs MC chart logic)
        const avgValence = entries.reduce((sum, e) => sum + e.valence, 0) / entries.length;
        const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / entries.length;
        const avgFocus = entries.reduce((sum, e) => sum + e.focus, 0) / entries.length;
        const avgStress = entries.reduce((sum, e) => sum + e.stress, 0) / entries.length;

        // For MC calculation - EXACTLY like DSS vs MC chart:
        // Always use new Date() (current time) to determine the time bucket
        // This ensures the same bucket is used for historical data filtering
        const mcDate = now;
        
        const mcResult = await calculateMoodComposite(
          entries[0].userId,
          avgValence,
          avgEnergy,
          avgFocus,
          avgStress,
          mcDate
        );
        
        absentMCValues.push(mcResult.moodComposite);
      }

      // Calculate MC effect (difference of means)
      if (presentMCValues.length > 0 && absentMCValues.length > 0) {
        const presentMCMean = presentMCValues.reduce((sum, val) => sum + val, 0) / presentMCValues.length;
        const         absentMCMean = absentMCValues.reduce((sum, val) => sum + val, 0) / absentMCValues.length;
        mcEffect = presentMCMean - absentMCMean;
      }
    } catch (error) {
      mcEffect = 0;
    }

    drivers.push({
      tag: activity,
      occurrences: activityCounts.get(activity)!,
      presentDays: presentDays.length,
      absentDays: absentDays.length,
      dssEffect,
      mcEffect,
      overallEffect: (dssEffect + mcEffect) / 2, // Average of DSS and MC effects
      isHelpful: (dssEffect + mcEffect) / 2 > 0
    });
  }

  // Sort by absolute effect size and take top 5
  const sortedDrivers = drivers.sort((a, b) => Math.abs(b.overallEffect) - Math.abs(a.overallEffect));
  
  const helpful = sortedDrivers
    .filter(driver => driver.isHelpful)
    .slice(0, 5);
  
  const harmful = sortedDrivers
    .filter(driver => !driver.isHelpful)
    .slice(0, 5);

  return {
    helpful,
    harmful,
    lastCalculated: new Date()
  };
}