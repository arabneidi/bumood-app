export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';

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

    // Simplified analysis context without database queries
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
          total: 5,
          completed: 3,
          inProgress: 2,
          completionRate: 60,
          recentCompleted: 2,
          recentCompletedGoals: ['Learn Spanish', 'Exercise Daily']
        },
        achievements: {
          total: 3,
          recent: 3,
          recentAchievements: ['Week Warrior', 'Activity Explorer', 'Getting Started']
        }
      }
    };

    // Create AI prompt for deep psychological analysis of activity drivers
    const aiPrompt = `You are a clinical psychologist and behavioral analyst specializing in personal productivity and mental wellness. You have access to comprehensive behavioral data from a 4-week tracking period. Provide a profound, analytical psychological assessment that goes beyond surface-level observations.

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

BEHAVIORAL DATA (DSS = Daily Success Score, MC = Mood Composite):
HELPFUL ACTIVITIES (positive behavioral drivers):
${analysisContext.helpfulActivities.map(activity => {
  const dssPoints = (activity.dssEffect || 0).toFixed(3);
  const mcPoints = (activity.mcEffect || 0).toFixed(3);
  const overallPoints = (activity.effect || 0).toFixed(3);
  return `- ${activity.activity}: +${overallPoints} points overall impact (DSS: +${dssPoints}, MC: +${mcPoints}) - ${activity.daysWith} days with, ${activity.daysWithout} days without`;
}).join('\n')}

HARMFUL ACTIVITIES (negative behavioral drivers):
${analysisContext.harmfulActivities.map(activity => {
  const dssPoints = (activity.dssEffect || 0).toFixed(3);
  const mcPoints = (activity.mcEffect || 0).toFixed(3);
  const overallPoints = (activity.effect || 0).toFixed(3);
  return `- ${activity.activity}: ${overallPoints} points negative impact (DSS: ${dssPoints}, MC: ${mcPoints}) - ${activity.daysWith} days with, ${activity.daysWithout} days without`;
}).join('\n')}

ANALYSIS REQUIREMENTS:

1. **PSYCHOLOGICAL PATTERN ANALYSIS**: Identify underlying psychological mechanisms driving these behavioral patterns. What does this data reveal about:
   - Cognitive load management strategies
   - Emotional regulation patterns
   - Social connection needs
   - Stress response mechanisms
   - Motivation and reward systems

2. **BEHAVIORAL ARCHETYPE IDENTIFICATION**: Based on the data, what behavioral archetype or personality pattern emerges? Consider:
   - Introversion vs extroversion tendencies
   - Task-oriented vs relationship-oriented preferences
   - Structured vs flexible approaches
   - Individual vs collaborative work styles

3. **NEUROPSYCHOLOGICAL INSIGHTS**: Analyze the neurological implications:
   - Dopamine reward pathways activation
   - Cortisol stress response patterns
   - Executive function optimization
   - Attention and focus mechanisms

4. **DEEP PATTERN RECOGNITION**: Look beyond obvious correlations to identify:
   - Hidden behavioral dependencies
   - Compensatory mechanisms
   - Energy management strategies
   - Circadian rhythm influences

5. **PSYCHOLOGICAL PROFILING**: Create a psychological profile including:
   - Primary motivation drivers
   - Stress vulnerability factors
   - Optimal performance conditions
   - Behavioral risk factors

6. **THERAPEUTIC RECOMMENDATIONS**: Provide evidence-based psychological interventions:
   - Cognitive restructuring strategies
   - Behavioral modification techniques
   - Mindfulness and awareness practices
   - Environmental optimization suggestions

IMPORTANT ANALYTICAL GUIDELINES:
- Use precise point values (not percentages) - these are standardized scores
- Focus on psychological mechanisms, not surface behaviors
- Provide clinical-level insights about behavioral patterns
- Connect data to established psychological theories
- Identify unconscious behavioral drivers
- Suggest interventions based on psychological principles
- Avoid generic advice - provide specific psychological insights
- Consider the individual's unique psychological makeup

TONE: Professional, analytical, insightful, and clinically informed. Write as if providing a psychological assessment report to a colleague.

RESPONSE FORMAT: Provide a concise, well-structured analysis focusing on the most important insights. Use clear headings and bullet points for easy reading. Keep the response focused and actionable. MAXIMUM 500 WORDS - prioritize the most critical psychological insights only.`;

    // Call AI service
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-service`, {
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
    const fallbackInsights = `**BEHAVIORAL ANALYSIS SUMMARY**

**AI SERVICE UNAVAILABLE**

The AI analysis service is currently experiencing technical difficulties. 

**FALLBACK ANALYSIS:**
Based on the behavioral data provided, this appears to be a mixed behavioral profile requiring further analysis when the AI service is restored.

**RECOMMENDATION:** 
Please try again later or contact support if the issue persists.`;

    return NextResponse.json({
      success: true,
      aiInsights: fallbackInsights,
      isFallback: true,
      timestamp: new Date().toISOString()
    });
  }
}
