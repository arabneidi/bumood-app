const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  // Check October 1st in UTC and local timezone
  const startDate = new Date("2025-10-01T00:00:00Z");
  const endDate = new Date("2025-10-02T00:00:00Z");
  
  const entries = await db.moodEntry.findMany({
    where: {
      userId: "dummy-user",
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    },
    select: {
      id: true,
      createdAt: true,
      onPeriod: true,
      periodDay: true,
      valence: true,
      energy: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  
  console.log(`October 1st entries (UTC range): ${entries.length}`);
  entries.forEach((e, i) => {
    const d = new Date(e.createdAt);
    const localDate = d.toLocaleDateString();
    const localTime = d.toLocaleTimeString();
    console.log(`${i + 1}. ID: ${e.id.substring(0, 20)}...`);
    console.log(`   Created: ${e.createdAt} (Local: ${localDate} ${localTime})`);
    console.log(`   onPeriod: ${e.onPeriod}, periodDay: ${e.periodDay}`);
    console.log(`   Mood: V=${e.valence} E=${e.energy}`);
    console.log();
  });
  
  // Also check recent entries to see date patterns
  const recent = await db.moodEntry.findMany({
    where: { userId: "dummy-user" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      onPeriod: true,
      periodDay: true
    }
  });
  
  console.log(nMost
