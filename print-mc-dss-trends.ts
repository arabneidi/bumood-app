import { PrismaClient } from '@prisma/client';
import { calculateDSS } from './src/lib/dssCalculator';
import { calculateMoodComposite, getCurrentTimeBucket } from './src/lib/moodCompositeCalculator';

const prisma = new PrismaClient();

async function main() {
  const userId = 'dummy-user';
  const days = 7;

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const moodEntries = await prisma.moodEntry.findMany({
    where: { userId, createdAt: { gte: startDate, lte: endDate } },
    orderBy: { createdAt: 'desc' }
  });

  const entriesByDate: Record<string, any[]> = {};
  for (const entry of moodEntries) {
    const d = new Date(entry.createdAt);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${da}`;
    (entriesByDate[key] ||= []).push(entry);
  }

  const currentBucket = getCurrentTimeBucket();

  const results: any[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const da = String(cursor.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${da}`;

    const dailyEntries = entriesByDate[key] || [];
    const dayMidnight = new Date(y, cursor.getMonth(), cursor.getDate(), 0, 0, 0, 0);

    let mc: number | null = null;
    const bucketEntries = dailyEntries.filter((e) => e.timeBucket === currentBucket);
    if (bucketEntries.length > 0) {
      const avgVal = bucketEntries.reduce((s, e) => s + e.valence, 0) / bucketEntries.length;
      const avgEn = bucketEntries.reduce((s, e) => s + e.energy, 0) / bucketEntries.length;
      const avgFo = bucketEntries.reduce((s, e) => s + e.focus, 0) / bucketEntries.length;
      const avgSt = bucketEntries.reduce((s, e) => s + e.stress, 0) / bucketEntries.length;
      const mcRes = await calculateMoodComposite(userId, avgVal, avgEn, avgFo, avgSt, new Date());
      mc = mcRes.moodComposite;
    }

    let dss: number | null = null;
    if (dailyEntries.length > 0) {
      const dssRes = await calculateDSS(userId, dayMidnight);
      dss = dssRes.dssScore;
    }

    results.push({ date: key, mc, dss });
    cursor.setDate(cursor.getDate() + 1);
  }

  console.log(JSON.stringify(results, null, 2));
}

main().finally(() => prisma.$disconnect());


