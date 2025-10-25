const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanSlate() {
  try {
    console.log('🧹 Starting clean slate...');
    
    // Delete all user-specific data
    console.log('Deleting mood entries...');
    await prisma.moodEntry.deleteMany({});
    
    console.log('Deleting daily tracking...');
    await prisma.dailyTracking.deleteMany({});
    
    console.log('Deleting achievements...');
    await prisma.achievement.deleteMany({});
    
    console.log('Deleting goals...');
    await prisma.goal.deleteMany({});
    
    console.log('Deleting congratulations...');
    await prisma.congratulation.deleteMany({});
    
    console.log('Deleting AI suggestion actions...');
    await prisma.aISuggestionAction.deleteMany({});
    
    console.log('Deleting learn connections...');
    await prisma.activityOutcomeConnection.deleteMany({});
    
    console.log('Deleting period tracking...');
    await prisma.periodTracking.deleteMany({});
    
    console.log('Deleting habits and logs...');
    await prisma.habitLog.deleteMany({});
    await prisma.habit.deleteMany({});
    
    console.log('✅ All user data cleared!');
    console.log('📊 Profile and settings remain intact.');
    console.log('🎯 Predefined goals and activities remain intact.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanSlate();
