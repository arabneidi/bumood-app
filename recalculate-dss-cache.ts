import { PrismaClient } from '@prisma/client';
import { calculateDSS } from './src/lib/dssCalculator';

const prisma = new PrismaClient();

async function main() {
  const userId = 'dummy-user';
  
  // Create date object exactly like get-dss-today.ts (today at midnight)
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const currentDay = new Date(todayYear, todayMonth, todayDay);
  currentDay.setHours(0, 0, 0, 0);
  
  console.log(`\n📅 Recalculating DSS for today (${currentDay.toISOString()})`);
  console.log(`User ID: ${userId}\n`);
  
  try {
    const result = await calculateDSS(userId, currentDay);
    
    console.log(`\n✅ Calculated DSS Score: ${result.dssScore}`);
    console.log(`\nComponents:`);
    console.log(`  - Learning Momentum: ${result.components.learningMomentum}`);
    console.log(`  - Recovery Index: ${result.components.recoveryIndex}`);
    console.log(`  - Connection Score: ${result.components.connectionScore}`);
    
    // Update cache in database
    await prisma.dailyTracking.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: currentDay
        }
      },
      update: {
        dssScore: result.dssScore,
        learningMomentum: result.components.learningMomentum,
        recoveryIndex: result.components.recoveryIndex,
        connectionScore: result.components.connectionScore
      },
      create: {
        userId: userId,
        date: currentDay,
        dssScore: result.dssScore,
        learningMomentum: result.components.learningMomentum,
        recoveryIndex: result.components.recoveryIndex,
        connectionScore: result.components.connectionScore
      }
    });
    
    console.log(`\n✅ Cache updated in database!`);
    
  } catch (error) {
    console.error('❌ Error recalculating DSS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

