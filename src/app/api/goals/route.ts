import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

export async function GET() {
  try {
    const dummyUserId = "dummy-user"; // Placeholder for actual user ID
    const goals = await db.goal.findMany({
      where: { userId: dummyUserId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      description, 
      category, 
      subcategory, 
      difficulty, 
      targetValue, 
      unit 
    } = body;

    const dummyUserId = "dummy-user"; // Placeholder for actual user ID

    // Categorize goal for DSS component
    let dssComponent = null;
    try {
      const categorizeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/goals/categorize-dss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalTitle: title,
          goalCategory: category,
          goalSubcategory: subcategory,
          goalDescription: description
        })
      });

      if (categorizeResponse.ok) {
        const categorizeResult = await categorizeResponse.json();
        dssComponent = categorizeResult.dssComponent;
        console.log(`🎯 Goal "${title}" categorized as ${dssComponent}`);
      }
    } catch (categorizeError) {
      console.error('⚠️ Error categorizing goal, using fallback:', categorizeError);
      // Use fallback categorization
      dssComponent = getFallbackCategorization(category, subcategory);
    }

    const newGoal = await db.goal.create({
      data: {
        userId: dummyUserId,
        title,
        description: description || "",
        category,
        subcategory,
        difficulty,
        targetValue,
        // unit: unit || "days", // Temporarily commented out
        currentValue: 0,
        streak: 0,
        bestStreak: 0,
        completed: false,
        dssComponent: dssComponent,
      },
    });
    // Invalidate AI drivers cache when new goal is created
    try {
      await db.aISuggestionAction.deleteMany({
        where: {
          userId: dummyUserId,
          type: 'drivers_analysis'
        }
      });
      console.log('🗑️ AI drivers cache invalidated due to new goal creation');
    } catch (cacheError) {
      console.error('❌ Error invalidating AI drivers cache:', cacheError);
    }

    return NextResponse.json(newGoal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to create goal", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
