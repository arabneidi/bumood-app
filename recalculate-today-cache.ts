import { PrismaClient } from '@prisma/client';
import { calculateDSS } from './src/lib/dssCalculator';
import { calculateMoodComposite } from './src/lib/moodCompositeCalculator';

const prisma = new PrismaClient();

async function main() {
  const userId = 'dummy-user';

  // Build today's date exactly like the chart (midnight local)
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const currentDay = new Date(y, m, d);
  currentDay.setHours(0, 0, 0, 0);

  console.log(`\n📅 Recalculating cache for today (${currentDay.toISOString()})`);

  // Fetch all of today's entries
  const tomorrow = new Date(currentDay);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEntries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: { gte: currentDay, lt: tomorrow }
    },
    orderBy: { createdAt: 'desc' }
  });

  let mcValue = 0;
  if (todayEntries.length > 0) {
    const avgValence = todayEntries.reduce((s, e) => s + e.valence, 0) / todayEntries.length;
    const avgEnergy = todayEntries.reduce((s, e) => s + e.energy, 0) / todayEntries.length;
    const avgFocus = todayEntries.reduce((s, e) => s + e.focus, 0) / todayEntries.length;
    const avgStress = todayEntries.reduce((s, e) => s + e.stress, 0) / todayEntries.length;

    // MC calculation: same as chart — use current time for time bucket
    const mcRes = await calculateMoodComposite(userId, avgValence, avgEnergy, avgFocus, avgStress, new Date());
    mcValue = mcRes.moodComposite;
    console.log(`✅ Calculated MC: ${mcValue}`);
  } else {
    console.log('⚠️ No entries for today; MC will remain 0 unless cached previously');
  }

  // DSS calculation: same as chart — use midnight currentDay
  const dssRes = await calculateDSS(userId, currentDay);
  console.log(`✅ Calculated DSS: ${dssRes.dssScore}`);

  // Upsert into DailyTracking cache
  await prisma.dailyTracking.upsert({
    where: { userId_date: { userId, date: currentDay } },
    update: {
      moodComposite: mcValue,
      dssScore: dssRes.dssScore,
      learningMomentum: dssRes.components.learningMomentum,
      recoveryIndex: dssRes.components.recoveryIndex,
      connectionScore: dssRes.components.connectionScore
    },
    create: {
      userId,
      date: currentDay,
      moodComposite: mcValue,
      dssScore: dssRes.dssScore,
      learningMomentum: dssRes.components.learningMomentum,
      recoveryIndex: dssRes.components.recoveryIndex,
      connectionScore: dssRes.components.connectionScore
    }
  });

  console.log('\n✅ Cache updated successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
