const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const startDate = new Date("2025-10-01T00:00:00Z");
  const endDate = new Date("2025-10-02T00:00:00Z");
  
  // Find all entries for October 1st
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
      onPeriod: true
    }
  });
  
  console.log(`Found ${entries.length} entries on October 1st:`);
  entries.forEach((e, i) => {
    console.log(`${i + 1}. ID: ${e.id} | ${new Date(e.createdAt).toISOString()} | onPeriod: ${e.onPeriod}`);
  });
  
  if (entries.length > 0) {
    const ids = entries.map(e => e.id);
    await db.moodEntry.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    console.log(`\n✅ Deleted ${entries.length} entries from October 1st`);
  } else {
    console.log("\n⚠️ No entries found for October 1st");
  }
  
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
