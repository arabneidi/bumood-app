const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const entry = await db.moodEntry.update({
    where: { id: "cmhbwpar4005d1205j92ym5jt" },
    data: {
      createdAt: new Date(2025, 8, 29, 12, 0, 0),
      updatedAt: new Date(2025, 8, 29, 12, 0, 0)
    }
  });
  const d = new Date(entry.createdAt);
  console.log("Updated September 29th entry:");
  console.log("UTC:", entry.createdAt.toISOString());
  console.log("Local date:", d.toLocaleDateString("en-US"));
  console.log("Local time:", d.toLocaleTimeString("en-US"));
  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
