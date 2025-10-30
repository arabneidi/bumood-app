import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = 'dummy-user';
  
  // Get today's date at midnight
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const currentDay = new Date(todayYear, todayMonth, todayDay);
  currentDay.setHours(0, 0, 0, 0);
  
  console.log(`\n📅 Checking DSS cache for date: ${currentDay.toISOString()}`);
  console.log(`User ID: ${userId}\n`);
  
  try {
    const cached = await prisma.dailyTracking.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: currentDay
        }
      }
    });
    
    if (cached) {
      console.log(`✅ Found cached DSS in database:`);
      console.log(`  - DSS Score: ${cached.dssScore}`);
      console.log(`  - Learning Momentum: ${cached.learningMomentum}`);
      console.log(`  - Recovery Index: ${cached.recoveryIndex}`);
      console.log(`  - Connection Score: ${cached.connectionScore}`);
      console.log(`  - Date: ${cached.date.toISOString()}`);
      console.log(`  - Updated At: ${cached.updatedAt.toISOString()}`);
    } else {
      console.log(`❌ No cached DSS found for today`);
    }
    
    // Also check recent cached entries
    console.log(`\n📊 Recent cached entries (last 7 days):`);
    const sevenDaysAgo = new Date(currentDay);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCache = await prisma.dailyTracking.findMany({
      where: {
        userId: userId,
        date: {
          gte: sevenDaysAgo,
          lte: currentDay
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    recentCache.forEach(entry => {
      console.log(`  ${entry.date.toISOString().split('T')[0]}: DSS=${entry.dssScore}, LM=${entry.learningMomentum}, RI=${entry.recoveryIndex}, CN=${entry.connectionScore}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

