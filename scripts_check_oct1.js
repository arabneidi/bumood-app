const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
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
      periodDay: true
    }
  });
  
  console.log(`October 1st entries: ${entries.length}`);
  entries.forEach((e, i) => {
    console.log(`${i + 1}. Created: ${new Date(e.createdAt).toISOString()} | onPeriod: ${e.onPeriod} | periodDay: ${e.periodDay}`);
  });
  
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
