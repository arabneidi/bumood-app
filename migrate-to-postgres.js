const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// SQLite connection
const sqliteDb = new sqlite3.Database(path.join(__dirname, 'prisma', 'dev.db'));

// PostgreSQL connection (will be set via DATABASE_URL)
const postgresDb = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...');
  
  try {
    // Migrate Users
    console.log('📊 Migrating Users...');
    const users = await getSqliteData('SELECT * FROM User');
    for (const user of users) {
      await postgresDb.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log(`✅ Migrated ${users.length} users`);

    // Migrate Mood Entries
    console.log('📊 Migrating Mood Entries...');
    const moodEntries = await getSqliteData('SELECT * FROM MoodEntry');
    for (const entry of moodEntries) {
      // Convert SQLite integer booleans to PostgreSQL booleans
      const processedEntry = {
        ...entry,
        onPeriod: Boolean(entry.onPeriod),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      };
      await postgresDb.moodEntry.create({
        data: processedEntry
      });
    }
    console.log(`✅ Migrated ${moodEntries.length} mood entries`);

    // Migrate Goals
    console.log('📊 Migrating Goals...');
    const goals = await getSqliteData('SELECT * FROM Goal');
    for (const goal of goals) {
      // Convert SQLite integer booleans to PostgreSQL booleans
      const processedGoal = {
        ...goal,
        completed: Boolean(goal.completed),
        createdAt: new Date(goal.createdAt),
        updatedAt: new Date(goal.updatedAt),
        completedAt: goal.completedAt ? new Date(goal.completedAt) : null
      };
      await postgresDb.goal.create({
        data: processedGoal
      });
    }
    console.log(`✅ Migrated ${goals.length} goals`);

    // Migrate Achievements
    console.log('📊 Migrating Achievements...');
    const achievements = await getSqliteData('SELECT * FROM Achievement');
    for (const achievement of achievements) {
      // Convert SQLite timestamps to PostgreSQL dates
      const processedAchievement = {
        ...achievement,
        unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : null,
        createdAt: new Date(achievement.createdAt)
      };
      await postgresDb.achievement.create({
        data: processedAchievement
      });
    }
    console.log(`✅ Migrated ${achievements.length} achievements`);

    // Migrate Daily Tracking
    console.log('📊 Migrating Daily Tracking...');
    const dailyTracking = await getSqliteData('SELECT * FROM DailyTracking');
    for (const tracking of dailyTracking) {
      // Convert SQLite integer booleans to PostgreSQL booleans
      const processedTracking = {
        ...tracking,
        exercise: Boolean(tracking.exercise),
        socialInteraction: Boolean(tracking.socialInteraction),
        meditation: Boolean(tracking.meditation),
        journaling: Boolean(tracking.journaling),
        medicationTaken: Boolean(tracking.medicationTaken),
        recoveryAction: Boolean(tracking.recoveryAction),
        date: new Date(tracking.date),
        createdAt: new Date(tracking.createdAt),
        updatedAt: new Date(tracking.updatedAt)
      };
      await postgresDb.dailyTracking.create({
        data: processedTracking
      });
    }
    console.log(`✅ Migrated ${dailyTracking.length} daily tracking entries`);

    // Migrate Predefined Activities
    console.log('📊 Migrating Predefined Activities...');
    const predefinedActivities = await getSqliteData('SELECT * FROM PredefinedActivity');
    for (const activity of predefinedActivities) {
      // Convert SQLite integer booleans to PostgreSQL booleans
      const processedActivity = {
        ...activity,
        isActive: Boolean(activity.isActive),
        createdAt: new Date(activity.createdAt),
        updatedAt: new Date(activity.updatedAt)
      };
      await postgresDb.predefinedActivity.create({
        data: processedActivity
      });
    }
    console.log(`✅ Migrated ${predefinedActivities.length} predefined activities`);

    // Migrate Predefined Goals
    console.log('📊 Migrating Predefined Goals...');
    const predefinedGoals = await getSqliteData('SELECT * FROM PredefinedGoal');
    for (const goal of predefinedGoals) {
      // Convert SQLite integer booleans to PostgreSQL booleans
      const processedGoal = {
        ...goal,
        isActive: Boolean(goal.isActive),
        createdAt: new Date(goal.createdAt),
        updatedAt: new Date(goal.updatedAt)
      };
      await postgresDb.predefinedGoal.create({
        data: processedGoal
      });
    }
    console.log(`✅ Migrated ${predefinedGoals.length} predefined goals`);

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await postgresDb.$disconnect();
    sqliteDb.close();
  }
}

function getSqliteData(query) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

migrateData();
