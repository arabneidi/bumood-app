const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const latest = await db.moodEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id:true, createdAt:true, onPeriod:true, periodDay:true, userId:true }
  });
  const user = await db.user.findUnique({ where: { id: "dummy-user" }, select: { id:true, gender:true } });
  console.log(JSON.stringify({ user, latest }, null, 2));
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
