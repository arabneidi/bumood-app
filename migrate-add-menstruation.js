const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Migration script to add "Menstruation" activity to existing mood entries where onPeriod is true
 * This is a careful one-time migration - it does not overwrite existing data, only adds
 */
async function migrate() {
  try {
    console.log('🩸 Starting migration: Adding Menstruation activity to period entries...');
    
    // Get all entries where onPeriod is true
    const periodEntries = await prisma.moodEntry.findMany({
      where: {
        onPeriod: true
      },
      select: {
        id: true,
        activities: true,
        activityEntries: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${periodEntries.length} entries with onPeriod=true`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const entry of periodEntries) {
      try {
        // Parse existing data
        let activities = [];
        let activityEntries = [];
        
        try {
          activities = entry.activities ? JSON.parse(entry.activities) : [];
          if (!Array.isArray(activities)) activities = [];
        } catch (e) {
          console.warn(`⚠️ Could not parse activities for ${entry.id}:`, e.message);
          activities = [];
        }
        
        try {
          activityEntries = entry.activityEntries ? JSON.parse(entry.activityEntries) : [];
          if (!Array.isArray(activityEntries)) activityEntries = [];
        } catch (e) {
          console.warn(`⚠️ Could not parse activityEntries for ${entry.id}:`, e.message);
          activityEntries = [];
        }
        
        // Check if Menstruation already exists
        const hasMenstruationInActivities = activities.includes('Menstruation');
        const entryDate = new Date(entry.createdAt);
        const year = entryDate.getFullYear();
        const month = String(entryDate.getMonth() + 1).padStart(2, '0');
        const day = String(entryDate.getDate()).padStart(2, '0');
        const exactTime = `${year}-${month}-${day}T12:00:00`;
        const hasMenstruationInEntries = activityEntries.some((e) => 
          e && e.activity === 'Menstruation' && e.exactTime === exactTime
        );
        
        if (hasMenstruationInActivities && hasMenstruationInEntries) {
          console.log(`⏭️  Entry ${entry.id} already has Menstruation, skipping`);
          skipped++;
          continue;
        }
        
        // Add Menstruation to activities if not present
        if (!hasMenstruationInActivities) {
          activities.push('Menstruation');
        }
        
        // Add Menstruation to activityEntries if not present
        if (!hasMenstruationInEntries) {
          const hour = 12;
          const timeSlot = hour < 12 ? `morning-${hour}` : hour < 17 ? `midday-${hour}` : hour < 22 ? `evening-${hour}` : `night-${hour}`;
          
          activityEntries.push({
            activity: 'Menstruation',
            exactTime: exactTime,
            timeSlot: timeSlot,
            hour: hour
          });
        }
        
        // Update entry
        await prisma.moodEntry.update({
          where: { id: entry.id },
          data: {
            activities: JSON.stringify(activities),
            activityEntries: activityEntries.length > 0 ? JSON.stringify(activityEntries) : null
          }
        });
        
        console.log(`✅ Updated entry ${entry.id} (${year}-${month}-${day})`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating entry ${entry.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already had Menstruation): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total processed: ${periodEntries.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

