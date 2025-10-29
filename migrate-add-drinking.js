const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Migration: Add "Drinking" activity to entries with alcohol > 0 or existing drink-related tags
 * - Adds to activities array
 * - Adds to activityEntries at 12:00 local
 * - Idempotent: skips if already present for that day
 */
async function migrate() {
  try {
    console.log('🍺 Starting migration: Adding Drinking activity where alcohol>0 or drink tags present...');

    const entries = await prisma.moodEntry.findMany({
      where: {
        OR: [
          { alcohol: { gt: 0 } },
          { activities: { contains: 'drink', mode: 'insensitive' } },
          { activityEntries: { contains: 'drink', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        createdAt: true,
        activities: true,
        activityEntries: true,
        alcohol: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Candidates found: ${entries.length}`);

    let updated = 0, skipped = 0, errors = 0;

    for (const entry of entries) {
      try {
        let activities = [];
        let activityEntries = [];

        try {
          activities = entry.activities ? JSON.parse(entry.activities) : [];
          if (!Array.isArray(activities)) activities = [];
        } catch {
          activities = [];
        }
        try {
          activityEntries = entry.activityEntries ? JSON.parse(entry.activityEntries) : [];
          if (!Array.isArray(activityEntries)) activityEntries = [];
        } catch {
          activityEntries = [];
        }

        const hasDrinkingInActivities = activities.some(a => typeof a === 'string' && a.toLowerCase() === 'drinking');

        const entryDate = new Date(entry.createdAt);
        const y = entryDate.getFullYear();
        const m = String(entryDate.getMonth() + 1).padStart(2, '0');
        const d = String(entryDate.getDate()).padStart(2, '0');
        const exactTime = `${y}-${m}-${d}T12:00:00`;
        const hasDrinkingInEntries = activityEntries.some(e => e && e.activity === 'Drinking' && e.exactTime === exactTime);

        if (hasDrinkingInActivities && hasDrinkingInEntries) {
          skipped++;
          continue;
        }

        // If alcohol>0 or a drink-like tag exists, add Drinking
        const hasDrinkLikeTag = activities.some(a => typeof a === 'string' && /drink|alcohol|beer|wine|cocktail/i.test(a));
        const shouldAdd = (entry.alcohol || 0) > 0 || hasDrinkLikeTag;
        if (!shouldAdd) {
          skipped++;
          continue;
        }

        if (!hasDrinkingInActivities) activities.push('Drinking');
        if (!hasDrinkingInEntries) {
          const hour = 12;
          const timeSlot = hour < 12 ? `morning-${hour}` : hour < 17 ? `midday-${hour}` : hour < 22 ? `evening-${hour}` : `night-${hour}`;
          activityEntries.push({ activity: 'Drinking', exactTime, timeSlot, hour });
        }

        await prisma.moodEntry.update({
          where: { id: entry.id },
          data: {
            activities: JSON.stringify(activities),
            activityEntries: activityEntries.length > 0 ? JSON.stringify(activityEntries) : null
          }
        });
        updated++;
      } catch (e) {
        console.error(`❌ Error updating ${entry.id}:`, e.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary (Drinking):');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total processed: ${entries.length}`);
  } catch (e) {
    console.error('❌ Migration failed:', e);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

migrate()
  .then(() => { console.log('✅ Migration completed.'); process.exit(0); })
  .catch(() => process.exit(1));
