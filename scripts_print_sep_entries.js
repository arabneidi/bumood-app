const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const startDate = new Date("2025-09-29T00:00:00Z");
  const endDate = new Date("2025-10-01T00:00:00Z");
  
  const entries = await db.moodEntry.findMany({
    where: {
      userId: "dummy-user",
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  
  console.log(`Found ${entries.length} entries for September 29-30 (UTC range):\n`);
  
  entries.forEach((e, i) => {
    const d = new Date(e.createdAt);
    const utcDate = d.toISOString();
    const localDate = d.toLocaleDateString("en-US");
    const localTime = d.toLocaleTimeString("en-US");
    
    console.log(`Entry ${i + 1}:`);
    console.log(`  ID: ${e.id}`);
    console.log(`  createdAt (UTC): ${utcDate}`);
    console.log(`  createdAt (Local): ${localDate} ${localTime}`);
    console.log(`  updatedAt: ${e.updatedAt.toISOString()}`);
    console.log(`  valence: ${e.valence}`);
    console.log(`  energy: ${e.energy}`);
    console.log(`  focus: ${e.focus}`);
    console.log(`  stress: ${e.stress}`);
    console.log(`  sleep: ${e.sleep}`);
    console.log(`  onPeriod: ${e.onPeriod}`);
    console.log(`  periodDay: ${e.periodDay}`);
    console.log(`  waterIntake: ${e.waterIntake}`);
    console.log(`  mealsEaten: ${e.mealsEaten}`);
    console.log(`  mealQuality: ${e.mealQuality}`);
    console.log(`  caffeine: ${e.caffeine}`);
    console.log(`  alcohol: ${e.alcohol}`);
    console.log(`  notes: ${e.notes || "(null)"}`);
    console.log(`  activities: ${e.activities || "(null)"}`);
    console.log(`  activityEntries: ${e.activityEntries || "(null)"}`);
    console.log(`  timeBucket: ${e.timeBucket}`);
    console.log(`  moodComposite: ${e.moodComposite}`);
    console.log(`  selectedTimeSlots: ${e.selectedTimeSlots || "(null)"}`);
    console.log(`  selectedSubcategories: ${e.selectedSubcategories || "(null)"}`);
    console.log(`  dssAnalysis: ${e.dssAnalysis ? "(exists)" : "(null)"}`);
    console.log(`  reflection: ${e.reflection || "(null)"}`);
    console.log(`  voiceNote: ${e.voiceNote || "(null)"}`);
    console.log(`  aiSuggestion: ${e.aiSuggestion || "(null)"}`);
    console.log();
  });
  
  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
