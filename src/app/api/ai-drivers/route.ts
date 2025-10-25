import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driversData, userInfo, timeRange } = body;
    
    console.log('🤖 AI Drivers Analysis - Processing data:', {
      helpfulCount: driversData.helpful?.length || 0,
      harmfulCount: driversData.harmful?.length || 0,
      userGender: userInfo?.gender,
      userAge: userInfo?.age
    });

    // Check for cached AI drivers analysis
    const userId = 'dummy-user';
    const cacheKey = `ai-drivers-${userId}`;
    
    // Look for existing cached analysis
    const existingCache = await db.aISuggestionAction.findFirst({
      where: {
        userId: userId,
        type: 'drivers_analysis',
        title: 'AI Drivers Analysis'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check if cache is still valid (less than 24 hours old and no new entries)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    if (existingCache && new Date(existingCache.createdAt) > twentyFourHoursAgo) {
      // Check if there are new mood entries since cache was created
      const newEntries = await db.moodEntry.count({
        where: {
          userId: userId,
          createdAt: {
            gt: existingCache.createdAt
          }
        }
      });

      if (newEntries === 0) {
        console.log('🤖 Using cached AI drivers analysis');
        return NextResponse.json({
          success: true,
          aiInsights: existingCache.message,
          isCached: true,
          cacheTimestamp: existingCache.createdAt,
          analysisContext: {
            helpfulCount: driversData.helpful?.length || 0,
            harmfulCount: driversData.harmful?.length || 0
          }
        });
      } else {
        console.log(`🤖 Cache invalidated - ${newEntries} new entries found`);
      }
    }

    // Calculate date ranges for filtering
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    // Fetch goals and achievements data for productivity context
    const [goals, achievements] = await Promise.all([
      db.goal.findMany({
        where: { userId: 'dummy-user' },
        orderBy: { createdAt: 'desc' }
      }),
      db.achievement.findMany({
        where: { userId: 'dummy-user' },
        orderBy: { unlockedAt: 'desc' }
      })
    ]);

    // Filter goals by 14-day window (completed in last 14 days)
    const recentCompletedGoals = goals.filter(goal => {
      if (!goal.completed || !goal.completedAt) return false;
      const completionDate = new Date(goal.completedAt);
      return completionDate >= fourteenDaysAgo;
    });

    // Filter achievements by 14-day window (unlocked in last 14 days)
    const recentAchievements = achievements.filter(achievement => {
      if (!achievement.unlockedAt) return false;
      const achievementDate = new Date(achievement.unlockedAt);
      return achievementDate >= fourteenDaysAgo;
    });

    // Calculate goals progress metrics
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.completed).length;
    const inProgressGoals = goals.filter(goal => !goal.completed).length;
    const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Calculate achievements metrics
    const totalAchievements = achievements.length;

    // Prepare context for AI analysis
    const analysisContext = {
      userProfile: {
        gender: userInfo?.gender || 'unknown',
        age: userInfo?.age || 'unknown',
        timeRange: timeRange || '4 weeks'
      },
      helpfulActivities: driversData.helpful?.map(driver => ({
        activity: driver.tag,
        effect: driver.overallEffect,
        daysWith: driver.presentDays,
        daysWithout: driver.absentDays,
        dssEffect: driver.dssEffect,
        mcEffect: driver.mcEffect
      })) || [],
      harmfulActivities: driversData.harmful?.map(driver => ({
        activity: driver.tag,
        effect: driver.overallEffect,
        daysWith: driver.presentDays,
        daysWithout: driver.absentDays,
        dssEffect: driver.dssEffect,
        mcEffect: driver.mcEffect
      })) || [],
      productivityMetrics: {
        goals: {
          total: totalGoals,
          completed: completedGoals,
          inProgress: inProgressGoals,
          completionRate: Math.round(goalsCompletionRate),
          recentCompleted: recentCompletedGoals.length,
          recentCompletedGoals: recentCompletedGoals.slice(0, 3).map(g => g.title)
        },
        achievements: {
          total: totalAchievements,
          recent: recentAchievements.length,
          recentAchievements: recentAchievements.slice(0, 3).map(a => a.title)
        }
      }
    };

    // Create AI prompt for drivers analysis with percentage improvements
    const aiPrompt = `You are a mental wellness coach analyzing activity drivers data. Provide personalized insights and actionable recommendations using PERCENTAGE improvements.

USER PROFILE:
- Gender: ${analysisContext.userProfile.gender}
- Age: ${analysisContext.userProfile.age}
- Analysis Period: ${analysisContext.userProfile.timeRange}

PRODUCTIVITY METRICS:
- Goals: ${analysisContext.productivityMetrics.goals.total} total (${analysisContext.productivityMetrics.goals.completed} completed, ${analysisContext.productivityMetrics.goals.inProgress} in progress)
- Goals Completion Rate: ${analysisContext.productivityMetrics.goals.completionRate}%
- Recent Goal Completions (last 14 days): ${analysisContext.productivityMetrics.goals.recentCompleted} goals completed
${analysisContext.productivityMetrics.goals.recentCompletedGoals.length > 0 ? 
  `- Recent Completed Goals: ${analysisContext.productivityMetrics.goals.recentCompletedGoals.join(', ')}` : 
  '- No goals completed in last 14 days'
}
- Achievements: ${analysisContext.productivityMetrics.achievements.total} total, ${analysisContext.productivityMetrics.achievements.recent} recent (last 14 days)
${analysisContext.productivityMetrics.achievements.recentAchievements.length > 0 ? 
  `- Recent Achievements: ${analysisContext.productivityMetrics.achievements.recentAchievements.join(', ')}` : 
  '- No achievements in last 14 days'
}

HELPFUL ACTIVITIES (activities that improve performance):
${analysisContext.helpfulActivities.map(activity => {
  const percentageImprovement = Math.round(activity.effect * 10); // Convert to percentage
  const dssPercentage = Math.round(activity.dssEffect * 10);
  const mcPercentage = Math.round(activity.mcEffect * 10);
  return `- ${activity.activity}: +${percentageImprovement}% overall improvement (DSS: +${dssPercentage}%, MC: +${mcPercentage}%) - ${activity.daysWith} days with, ${activity.daysWithout} days without`;
}).join('\n')}

HARMFUL ACTIVITIES (activities that hurt performance):
${analysisContext.harmfulActivities.map(activity => {
  const percentageDecrease = Math.round(activity.effect * 10); // Convert to percentage
  const dssPercentage = Math.round(activity.dssEffect * 10);
  const mcPercentage = Math.round(activity.mcEffect * 10);
  return `- ${activity.activity}: ${percentageDecrease}% performance decrease (DSS: ${dssPercentage}%, MC: ${mcPercentage}%) - ${activity.daysWith} days with, ${activity.daysWithout} days without`;
}).join('\n')}

Please provide:
1. A personalized summary using PERCENTAGE improvements (e.g., "Exercise boosts your performance by 28%")
2. Connect activities to productivity metrics (goals completion, achievements earned)
3. Specific recommendations for optimizing helpful activities
4. Strategies for reducing harmful activities  
5. Actionable next steps based on goals and achievements
6. Any patterns or connections you notice between activities and productivity

IMPORTANT: 
- Always use percentages instead of raw numbers
- Connect activity impact to goals completion and achievements
- Consider how activities affect productivity metrics
- Provide goal-oriented recommendations

For example:
- "Exercise improves your daily success by 28% and correlates with your 75% goals completion rate"
- "Social media reduces your focus by 15% and may be impacting your goal progress"
- "Your recent achievements show that [activity] is helping you stay productive"

Keep the tone supportive, data-driven, and actionable. Focus on practical advice the user can implement immediately.`;

    // Call AI service
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: aiPrompt,
        type: 'drivers_analysis',
        context: 'activity_drivers'
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI service unavailable');
    }

    const aiResult = await aiResponse.json();
    const aiInsights = aiResult.response || aiResult.message;
    
    // Store the AI analysis in cache
    try {
      await db.aISuggestionAction.create({
        data: {
          userId: userId,
          type: 'drivers_analysis',
          title: 'AI Drivers Analysis',
          message: aiInsights,
          actionMessage: 'View Activity Drivers',
          icon: '📊',
          stars: 1
        }
      });
      console.log('🤖 AI drivers analysis cached successfully');
    } catch (cacheError) {
      console.error('❌ Error caching AI drivers analysis:', cacheError);
    }
    
    console.log('🤖 AI Drivers Analysis completed successfully');
    
    return NextResponse.json({
      success: true,
      aiInsights,
      isCached: false,
      analysisContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in AI drivers analysis:', error);
    
    // Fallback response if AI is unavailable
    const fallbackInsights = `Based on your activity drivers analysis:

${driversData.helpful?.length > 0 ? 
  `🎯 **Top Helpful Activities:** ${driversData.helpful.slice(0, 3).map(d => d.tag).join(', ')} - These activities consistently improve your daily success and mood.` : 
  '📊 **No helpful activities identified yet** - Keep tracking to discover what works best for you.'
}

${driversData.harmful?.length > 0 ? 
  `⚠️ **Activities to Reduce:** ${driversData.harmful.slice(0, 3).map(d => d.tag).join(', ')} - These activities tend to lower your performance and mood.` : 
  '✅ **No harmful activities identified** - Your current activities are working well for you.'
}

💡 **Recommendation:** Continue tracking your mood and activities to build more insights over time.`;

    return NextResponse.json({
      success: true,
      aiInsights: fallbackInsights,
      isFallback: true,
      timestamp: new Date().toISOString()
    });
  }
}
