import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateAchievements } from "@/lib/achievementCalculator";

export async function GET() {
  try {
    const dummyUserId = "dummy-user";
    
    // Calculate and get all achievements for the user
    const achievements = await calculateAchievements(dummyUserId);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, description, icon, stars } = body;

    // For now, we'll use a dummy user ID since we don't have auth set up
    const dummyUserId = "dummy-user";

    const achievement = await db.achievement.create({
      data: {
        userId: dummyUserId,
        type,
        title,
        description,
        icon,
        stars: stars || 1,
        unlockedAt: new Date(),
      },
    });

    return NextResponse.json(achievement);
  } catch (error) {
    console.error("Error creating achievement:", error);
    return NextResponse.json(
      { error: "Failed to create achievement" },
      { status: 500 }
    );
  }
}
