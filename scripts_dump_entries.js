const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const ids = [
    "cmhbqu0qi0001oocy41mrmi54",
    "cmhbr2o260001gckob9rw553a"
  ];
  const rows = await db.moodEntry.findMany({ where: { id: { in: ids } } });
  console.log(JSON.stringify(rows, null, 2));
  await db.$disconnect();
})().catch(async (e) => { console.error(e); process.exit(1); });
