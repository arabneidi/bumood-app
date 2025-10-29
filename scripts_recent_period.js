const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const entries = await db.moodEntry.findMany({
    where: { userId: "dummy-user" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      onPeriod: true,
      periodDay: true
    }
  });
  console.log(`Total entries found: ${entries.length}\n`);
  console.log("Most recent entries with onPeriod data:");
  entries.forEach((e, i) => {
    const d = new Date(e.createdAt);
    const dateStr = d.toISOString().split("T")[0];
    const timeStr = d.toISOString().split("T")[1]?.split(".")[0] || "";
    console.log(`${i + 1}. Date: ${dateStr} ${timeStr} | onPeriod: ${e.onPeriod} | periodDay: ${e.periodDay || "null"}`);
  });
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
