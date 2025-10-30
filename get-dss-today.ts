import { PrismaClient } from '@prisma/client';
import { calculateDSS } from './src/lib/dssCalculator';

const prisma = new PrismaClient();

async function main() {
  const userId = 'dummy-user';
  
  // Create date object exactly like the chart does (today at midnight)
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const currentDay = new Date(todayYear, todayMonth, todayDay);
  currentDay.setHours(0, 0, 0, 0);
  
  console.log(`\n📅 Calculating DSS for today (${currentDay.toISOString()})`);
  console.log(`User ID: ${userId}\n`);
  
  try {
    const result = await calculateDSS(userId, currentDay);
    
    console.log(`\n✅ DSS Score: ${result.dssScore}`);
    console.log(`\nComponents:`);
    console.log(`  - Learning Momentum: ${result.components.learningMomentum}`);
    console.log(`  - Recovery Index: ${result.components.recoveryIndex}`);
    console.log(`  - Connection Score: ${result.components.connectionScore}`);
    console.log(`\nZ-Scores:`);
    console.log(`  - zLM: ${result.zScores.zLM}`);
    console.log(`  - zRI: ${result.zScores.zRI}`);
    console.log(`  - zCN: ${result.zScores.zCN}`);
    
  } catch (error) {
    console.error('❌ Error calculating DSS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

