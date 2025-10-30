const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calculateDSS(userId, targetDate) {
  // Import the calculateDSS function from the library
  // Since it's TypeScript, we'll need to replicate the logic or use tsx
  console.log(`Calculating DSS for userId: ${userId}, date: ${targetDate}`);
  
  // For now, let's use a simpler approach - read from the API or database
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  console.log(`Today date (midnight): ${today.toISOString()}`);
  
  // Check if we have cached value
  const cached = await prisma.dailyTracking.findUnique({
    where: {
      userId_date: {
        userId: userId,
        date: today
      }
    }
  });
  
  if (cached && cached.dssScore !== null) {
    console.log(`\n✅ DSS Score from cache: ${cached.dssScore}`);
    console.log(`Components:`);
    console.log(`  - Learning Momentum: ${cached.learningMomentum || 0}`);
    console.log(`  - Recovery Index: ${cached.recoveryIndex || 0}`);
    console.log(`  - Connection Score: ${cached.connectionScore || 0}`);
  } else {
    console.log(`\n⚠️ No cached DSS found for today`);
  }
  
  // Now let's actually calculate it by importing the TS function
  process.exit(0);
}

calculateDSS('dummy-user', new Date())
  .catch(console.error)
  .finally(() => prisma.$disconnect());

