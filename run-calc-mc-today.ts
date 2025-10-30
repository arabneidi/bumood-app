import { PrismaClient } from '@prisma/client';
import { calculateMoodComposite } from './src/lib/moodCompositeCalculator';

const prisma = new PrismaClient();

async function main() {
  const userId = 'dummy-user';

  // Today range
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  // Fetch today's entries
  const entries = await prisma.moodEntry.findMany({
    where: {
      userId,
      createdAt: { gte: start, lt: end }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (entries.length === 0) {
    console.log('No entries today');
    await prisma.$disconnect();
    return;
  }

  const avgValence = entries.reduce((s, e) => s + e.valence, 0) / entries.length;
  const avgEnergy = entries.reduce((s, e) => s + e.energy, 0) / entries.length;
  const avgFocus = entries.reduce((s, e) => s + e.focus, 0) / entries.length;
  const avgStress = entries.reduce((s, e) => s + e.stress, 0) / entries.length;

  // Same as chart: use current time to pick the time bucket
  const res = await calculateMoodComposite(userId, avgValence, avgEnergy, avgFocus, avgStress, new Date());
  console.log(res.moodComposite);
}

main().finally(() => prisma.$disconnect());
