import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
      },
    });
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
