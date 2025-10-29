const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const userId = "dummy-user";
  // Load recent entries to infer last start
  const recent = await db.moodEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, createdAt: true, onPeriod: true }
  });
  // Find last start date (transition false->true)
  let lastStartDate = null;
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i-1];
    const cur = recent[i];
    if (!prev.onPeriod && cur.onPeriod) {
      lastStartDate = new Date(cur.createdAt);
    }
  }
  if (!lastStartDate) {
    // fallback: first onPeriod true
    const firstOn = recent.find(e => e.onPeriod);
    if (firstOn) lastStartDate = new Date(firstOn.createdAt);
  }

  // Find all entries that are LOCAL 2025-09-30
  const entries = await db.moodEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });
  const targets = entries.filter(e => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === 2025 && d.getMonth() === 8 && d.getDate() === 30; // Sept (8)
  });

  if (targets.length === 0) {
    console.log("No entries found for local 2025-09-30.");
    await db.$disconnect();
    return;
  }

  // Compute periodDay for 2025-09-30 if lastStartDate exists
  let periodDay = 1;
  if (lastStartDate) {
    const dateOnly = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const startOnly = dateOnly(lastStartDate);
    const day = new Date(2025, 8, 30);
    const dayOnly = dateOnly(day);
    const diffDays = Math.floor((dayOnly - startOnly) / (1000*60*60*24));
    periodDay = Math.max(1, diffDays + 1);
  }

  for (const t of targets) {
    const updated = await db.moodEntry.update({
      where: { id: t.id },
      data: { onPeriod: true, periodDay, updatedAt: new Date() }
    });
    console.log(`Updated ${updated.id}: onPeriod=${updated.onPeriod}, periodDay=${updated.periodDay}`);
  }

  await db.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
