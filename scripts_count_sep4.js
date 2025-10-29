const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const start = new Date("2025-09-04T00:00:00");
  const end = new Date("2025-09-05T00:00:00");
  const rows = await db.moodEntry.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      userId: "dummy-user"
    },
    select: { id: true, createdAt: true, onPeriod: true }
  });
  console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
