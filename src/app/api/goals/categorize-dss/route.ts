export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { goalTitle, goalCategory, goalSubcategory, goalDescription } = body;
    
    console.log('🎯 Categorizing goal for DSS component:', {
      title: goalTitle,
      category: goalCategory,
      subcategory: goalSubcategory
    });

    // Create AI prompt for goal categorization
    const aiPrompt = `You are a mental wellness coach categorizing goals into DSS (Daily Success Score) components.

DSS COMPONENTS:
- LM (Learning Momentum): Goals related to learning, studying, skill development, knowledge acquisition, personal growth, education
- RI (Recovery Index): Goals related to rest, recovery, sleep, relaxation, stress management, mental health, self-care
- Connection: Goals related to relationships, social connections, communication, community, family, friends, networking

GOAL TO CATEGORIZE:
- Title: ${goalTitle}
- Category: ${goalCategory}
- Subcategory: ${goalSubcategory || 'None'}
- Description: ${goalDescription || 'None'}

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
      
      console.log('🤖 AI categorized goal as:', dssComponent);
    } else {
      console.log('⚠️ AI service unavailable, using fallback categorization');
      dssComponent = getFallbackCategorization(goalCategory, goalSubcategory);
    }

    return NextResponse.json({
      success: true,
      dssComponent,
      isAICategorized: aiResponse.ok
    });

  } catch (error) {
    console.error('❌ Error categorizing goal:', error);
    
    // Fallback categorization based on category
    const { goalCategory, goalSubcategory } = await request.json().catch(() => ({ goalCategory: '', goalSubcategory: '' }));
    const fallbackComponent = getFallbackCategorization(goalCategory, goalSubcategory);
    
    return NextResponse.json({
      success: true,
      dssComponent: fallbackComponent,
      isAICategorized: false,
      isFallback: true
    });
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
