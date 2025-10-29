const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const startDate = new Date("2025-09-30T00:00:00Z");
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
    },
    select: {
      id: true,
      createdAt: true,
      onPeriod: true,
      periodDay: true,
      valence: true,
      energy: true,
      focus: true,
      stress: true,
      activities: true,
      activityEntries: true
    }
  });
  
  console.log(`September 30th entries (UTC range 2025-09-30): ${entries.length}\n`);
  
  entries.forEach((e, i) => {
    const d = new Date(e.createdAt);
    const utcDate = d.toISOString();
    const localYear = d.getFullYear();
    const localMonth = d.getMonth() + 1;
    const localDay = d.getDate();
    const localDateStr = `${localYear}-${String(localMonth).padStart(2, "0")}-${String(localDay).padStart(2, "0")}`;
    
    console.log(`Entry ${i + 1}:`);
    console.log(`  ID: ${e.id}`);
    console.log(`  createdAt (UTC): ${utcDate}`);
    console.log(`  Local date: ${localDateStr} ${d.toLocaleTimeString("en-US")}`);
    console.log(`  onPeriod: ${e.onPeriod}`);
    console.log(`  periodDay: ${e.periodDay}`);
    console.log(`  Mood: V=${e.valence} E=${e.energy} F=${e.focus} S=${e.stress}`);
    if (e.activityEntries) {
      try {
        const parsed = typeof e.activityEntries === "string" ? JSON.parse(e.activityEntries) : e.activityEntries;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const exactTimes = parsed.map(a => a.exactTime).filter(Boolean);
          console.log(`  Activity exactTimes: ${exactTimes.join(", ")}`);
          const latestExactTime = exactTimes.sort().reverse()[0];
          if (latestExactTime) {
            const exactTimeDate = new Date(latestExactTime);
            const exactLocalDate = `${exactTimeDate.getFullYear()}-${String(exactTimeDate.getMonth() + 1).padStart(2, "0")}-${String(exactTimeDate.getDate()).padStart(2, "0")}`;
            console.log(`  Latest activity local date: ${exactLocalDate}`);
          }
        }
      } catch (err) {}
    }
    console.log("");
  });
  
  // Check what the calendar would see - entries that show as Sept 30 locally
  const allEntries = await db.moodEntry.findMany({
    where: { userId: "dummy-user" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, createdAt: true, onPeriod: true }
  });
  
  const sep30Local = allEntries.filter(e => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === 2025 && d.getMonth() === 8 && d.getDate() === 30;
  });
  
  console.log(`\nEntries showing as September 30th in local time: ${sep30Local.length}`);
  sep30Local.forEach((e, i) => {
    const d = new Date(e.createdAt);
    console.log(`  ${i + 1}. ID: ${e.id.substring(0, 25)}... | UTC: ${d.toISOString()} | Local: ${d.toLocaleDateString("en-US")} ${d.toLocaleTimeString("en-US")} | onPeriod: ${e.onPeriod}`);
  });
  
  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
