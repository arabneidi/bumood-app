export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const userId = 'dummy-user';
    
    console.log('🎯 Categorizing all goals for DSS components...');

    // Get all goals without DSS component
    const goals = await db.goal.findMany({
      where: {
        userId: userId,
        dssComponent: null
      }
    });

    console.log(`📊 Found ${goals.length} goals to categorize`);

    if (goals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All goals already categorized',
        categorized: 0
      });
    }

    // Categorize each goal
    const categorizationResults = [];
    
    for (const goal of goals) {
      try {
        // Create AI prompt for goal categorization
        const aiPrompt = `You are a mental wellness coach categorizing goals into DSS (Daily Success Score) components.

DSS COMPONENTS:
- LM (Learning Momentum): Goals related to learning, studying, skill development, knowledge acquisition, personal growth, education
- RI (Recovery Index): Goals related to rest, recovery, sleep, relaxation, stress management, mental health, self-care
- Connection: Goals related to relationships, social connections, communication, community, family, friends, networking

GOAL TO CATEGORIZE:
- Title: ${goal.title}
- Category: ${goal.category}
- Subcategory: ${goal.subcategory || 'None'}
- Description: ${goal.description || 'None'}

Please analyze this goal and determine which DSS component it primarily contributes to. Consider the goal's main focus and impact.

Respond with ONLY one of these options: "LM", "RI", or "Connection"
Do not include any other text or explanation.`;

        // Call AI service
        const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-actions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: aiPrompt,
            type: 'goal_categorization',
            context: 'dss_categorization'
          })
        });

        let dssComponent = null;

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const aiResponseText = aiResult.response || aiResult.message || '';
          
          // Extract DSS component from AI response
          if (aiResponseText.includes('LM')) {
            dssComponent = 'LM';
          } else if (aiResponseText.includes('RI')) {
            dssComponent = 'RI';
          } else if (aiResponseText.includes('Connection')) {
            dssComponent = 'Connection';
          }
        } else {
          // Use fallback categorization
          dssComponent = getFallbackCategorization(goal.category, goal.subcategory);
        }

        // Update goal with DSS component
        if (dssComponent) {
          await db.goal.update({
            where: { id: goal.id },
            data: { dssComponent }
          });
          
          categorizationResults.push({
            goalId: goal.id,
            title: goal.title,
            dssComponent,
            isAICategorized: aiResponse.ok
          });
          
          console.log(`✅ Categorized "${goal.title}" as ${dssComponent}`);
        }

      } catch (error) {
        console.error(`❌ Error categorizing goal "${goal.title}":`, error);
        categorizationResults.push({
          goalId: goal.id,
          title: goal.title,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎯 Categorization complete: ${categorizationResults.length} goals processed`);

    return NextResponse.json({
      success: true,
      message: `Categorized ${categorizationResults.length} goals`,
      categorized: categorizationResults.length,
      results: categorizationResults
    });

  } catch (error) {
    console.error('❌ Error in bulk goal categorization:', error);
    return NextResponse.json(
      { error: 'Failed to categorize goals' },
      { status: 500 }
    );
  }
}

// Fallback categorization when AI is not available
function getFallbackCategorization(category: string, subcategory: string): string {
  const categoryLower = category.toLowerCase();
  const subcategoryLower = (subcategory || '').toLowerCase();
  
  // Learning Momentum (LM) categories
  if (categoryLower.includes('growth') || 
      categoryLower.includes('learning') || 
      categoryLower.includes('education') ||
      subcategoryLower.includes('study') ||
      subcategoryLower.includes('skill') ||
      subcategoryLower.includes('knowledge')) {
    return 'LM';
  }
  
  // Recovery Index (RI) categories
  if (categoryLower.includes('health') || 
      categoryLower.includes('sleep') || 
      categoryLower.includes('stress') ||
      categoryLower.includes('wellness') ||
      subcategoryLower.includes('rest') ||
      subcategoryLower.includes('recovery') ||
      subcategoryLower.includes('meditation')) {
    return 'RI';
  }
  
  // Connection categories
  if (categoryLower.includes('relationship') || 
      categoryLower.includes('social') ||
      subcategoryLower.includes('family') ||
      subcategoryLower.includes('friends') ||
      subcategoryLower.includes('communication')) {
    return 'Connection';
  }
  
  // Default fallback
  return 'LM';
}
