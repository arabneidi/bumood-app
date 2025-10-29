const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const updates = [
    { id: "cmhbx0434005h12056jysc7lj", iso: "2025-09-30T03:00:00.000Z" },
    { id: "cmhbwpar4005d1205j92ym5jt", iso: "2025-09-29T03:00:00.000Z" }
  ];

  for (const u of updates) {
    const when = new Date(u.iso);
    const entry = await db.moodEntry.update({
      where: { id: u.id },
      data: { createdAt: when, updatedAt: when }
    });
    console.log(`Restored ${u.id} -> ${entry.createdAt.toISOString()}`);
  }

  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
