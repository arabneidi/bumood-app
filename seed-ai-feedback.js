import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAIFeedback() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🌱 SEEDING AI SUGGESTION FEEDBACK');
    console.log('='.repeat(60) + '\n');

    // Ensure user exists
    try {
      await prisma.user.create({
        data: {
          id: 'dummy-user',
          name: 'Demo User',
          email: 'demo@example.com'
        }
      });
      console.log('✅ User created');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ User already exists');
      } else {
        throw error;
      }
    }

    // Clear existing AI actions
    await prisma.aISuggestionAction.deleteMany({
      where: { userId: 'dummy-user' }
    });
    console.log('🗑️  Cleared existing AI actions\n');

    // Sample AI suggestions with feedback
    const aiActions = [
      // HELPFUL suggestions (user liked these)
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_1`,
        title: 'Morning Meditation',
        description: 'Start your day with 10 minutes of mindfulness meditation',
        action: 'Practice meditation for 10 minutes',
        type: 'activity',
        priority: 'high',
        category: 'stress',
        icon: '🧘',
        reasoning: 'Meditation helps reduce stress and improve focus',
        tried: true,
        helpful: true,
        triedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_2`,
        title: 'Evening Walk',
        description: 'Take a 20-minute walk in nature to clear your mind',
        action: 'Go for a walk for 20 minutes',
        type: 'activity',
        priority: 'high',
        category: 'energy',
        icon: '🚶',
        reasoning: 'Walking boosts energy and improves mood',
        tried: true,
        helpful: true,
        triedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ratedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_3`,
        title: 'Gratitude Journaling',
        description: 'Write down 3 things you\'re grateful for today',
        action: 'Journal 3 gratitudes',
        type: 'activity',
        priority: 'medium',
        category: 'wellness',
        icon: '📔',
        reasoning: 'Gratitude practice increases happiness',
        tried: true,
        helpful: true,
        triedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        ratedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_4`,
        title: 'Deep Breathing Exercise',
        description: 'Practice 4-7-8 breathing technique for 5 minutes',
        action: 'Do breathing exercises',
        type: 'activity',
        priority: 'high',
        category: 'stress',
        icon: '🌬️',
        reasoning: 'Deep breathing reduces stress instantly',
        tried: true,
        helpful: true,
        triedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        ratedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_5`,
        title: 'Hydration Reminder',
        description: 'Drink a glass of water to boost energy and focus',
        action: 'Drink 8oz of water',
        type: 'reminder',
        priority: 'medium',
        category: 'wellness',
        icon: '💧',
        reasoning: 'Hydration improves cognitive function',
        tried: true,
        helpful: true,
        triedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },

      // UNHELPFUL suggestions (user didn't like these)
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_6`,
        title: 'Cold Shower',
        description: 'Take a cold shower to boost energy',
        action: 'Take a 2-minute cold shower',
        type: 'activity',
        priority: 'low',
        category: 'energy',
        icon: '🚿',
        reasoning: 'Cold exposure increases alertness',
        tried: true,
        helpful: false,
        triedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        ratedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_7`,
        title: 'High-Intensity Exercise',
        description: 'Do a 30-minute HIIT workout',
        action: 'Complete HIIT workout',
        type: 'activity',
        priority: 'low',
        category: 'fitness',
        icon: '🏋️',
        reasoning: 'Intense exercise releases endorphins',
        tried: true,
        helpful: false,
        triedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ratedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        userId: 'dummy-user',
        suggestionId: `seed_${Date.now()}_8`,
        title: 'Caffeine Break',
        description: 'Skip your afternoon coffee to improve sleep',
        action: 'Avoid caffeine after 2 PM',
        type: 'tip',
        priority: 'low',
        category: 'sleep',
        icon: '☕',
        reasoning: 'Reducing caffeine helps sleep quality',
        tried: true,
        helpful: false,
        triedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        ratedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      }
    ];

    console.log('📝 Creating AI suggestion actions with feedback...\n');
    
    for (const action of aiActions) {
      await prisma.aISuggestionAction.create({
        data: action
      });
      
      const status = action.helpful ? '✅ HELPFUL' : '❌ UNHELPFUL';
      console.log(`${status}: ${action.icon} ${action.title} (${action.category})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 FEEDBACK SUMMARY');
    console.log('='.repeat(60) + '\n');

    const helpful = aiActions.filter(a => a.helpful === true);
    const unhelpful = aiActions.filter(a => a.helpful === false);

    console.log(`✅ Helpful suggestions: ${helpful.length}`);
    helpful.forEach(a => console.log(`   - ${a.title} (${a.category})`));

    console.log(`\n❌ Unhelpful suggestions: ${unhelpful.length}`);
    unhelpful.forEach(a => console.log(`   - ${a.title} (${a.category})`));

    console.log('\n📈 Preferred categories:', [...new Set(helpful.map(a => a.category))].join(', '));
    console.log('📉 Avoid categories:', [...new Set(unhelpful.map(a => a.category))].join(', '));

    console.log('\n' + '='.repeat(60));
    console.log('🎉 AI FEEDBACK SEEDING COMPLETE!');
    console.log('='.repeat(60) + '\n');

    console.log('💡 The AI will now use this feedback to personalize suggestions:');
    console.log('   - More suggestions like: Meditation, Walking, Gratitude, Breathing');
    console.log('   - Fewer suggestions about: Cold showers, HIIT, Caffeine restrictions');
    console.log('   - Focus on categories: stress, energy, wellness');
    console.log('   - Avoid categories: fitness, sleep (caffeine-related)\n');

  } catch (error) {
    console.error('❌ Error seeding AI feedback:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAIFeedback();

