import { MoodEntry } from '@prisma/client';

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

export async function calculateDrivers(moodEntries: MoodEntry[]): Promise<DriversAnalysis> {
  // Filter entries from last 2-4 weeks (28 days)
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

  // Extract all unique tags and count occurrences
  const tagCounts = new Map<string, number>();
  const tagDays = new Map<string, Set<string>>(); // tag -> set of dates when present
  
  recentEntries.forEach(entry => {
    const entryDate = new Date(entry.createdAt).toDateString();
    entry.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      if (!tagDays.has(tag)) {
        tagDays.set(tag, new Set());
      }
      tagDays.get(tag)!.add(entryDate);
    });
  });

  // Filter tags with at least 3 occurrences
  const qualifyingTags = Array.from(tagCounts.entries())
    .filter(([_, count]) => count >= 3)
    .map(([tag, _]) => tag);

  const drivers: DriverResult[] = [];

  for (const tag of qualifyingTags) {
    const presentDates = tagDays.get(tag)!;
    const presentDays = Array.from(presentDates);
    const absentDays = recentEntries
      .map(entry => new Date(entry.createdAt).toDateString())
      .filter(date => !presentDates.has(date));

    // Get entries for present and absent days
    const presentEntries = recentEntries.filter(entry => 
      presentDays.includes(new Date(entry.createdAt).toDateString())
    );
    const absentEntries = recentEntries.filter(entry => 
      absentDays.includes(new Date(entry.createdAt).toDateString())
    );

    if (presentEntries.length < 2 || absentEntries.length < 2) continue;

    // Calculate DSS and MC for present days
    const presentDSS = presentEntries.map(entry => {
      // Simple DSS calculation: (valence + energy + focus - stress) / 4 * 10
      return (entry.valence + entry.energy + entry.focus - entry.stress) / 4 * 10;
    });
    const presentMC = presentEntries.map(entry => {
      // Simple MC calculation: (valence + energy + focus - stress) / 4 * 10
      return (entry.valence + entry.energy + entry.focus - entry.stress) / 4 * 10;
    });

    // Calculate DSS and MC for absent days
    const absentDSS = absentEntries.map(entry => {
      return (entry.valence + entry.energy + entry.focus - entry.stress) / 4 * 10;
    });
    const absentMC = absentEntries.map(entry => {
      return (entry.valence + entry.energy + entry.focus - entry.stress) / 4 * 10;
    });

    // Calculate means
    const presentDSSMean = presentDSS.reduce((sum, val) => sum + val, 0) / presentDSS.length;
    const absentDSSMean = absentDSS.reduce((sum, val) => sum + val, 0) / absentDSS.length;
    const presentMCMean = presentMC.reduce((sum, val) => sum + val, 0) / presentMC.length;
    const absentMCMean = absentMC.reduce((sum, val) => sum + val, 0) / absentMC.length;

    // Calculate effect sizes (difference of means)
    const dssEffect = presentDSSMean - absentDSSMean;
    const mcEffect = presentMCMean - absentMCMean;
    const overallEffect = (dssEffect + mcEffect) / 2;

    drivers.push({
      tag,
      occurrences: tagCounts.get(tag)!,
      presentDays: presentDays.length,
      absentDays: absentDays.length,
      dssEffect,
      mcEffect,
      overallEffect,
      isHelpful: overallEffect > 0
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
