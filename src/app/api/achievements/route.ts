import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateAchievements } from "@/lib/achievementCalculator";

export async function GET() {
  try {
    const dummyUserId = "dummy-user";
    
    // Get all unlocked achievements from database
    const unlockedAchievements = await db.achievement.findMany({
      where: { userId: dummyUserId },
      orderBy: { unlockedAt: 'desc' }
    });

    return NextResponse.json(unlockedAchievements);
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
    const { type, title, description, icon, stars, unlockedAt } = body;

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
        unlockedAt: unlockedAt ? new Date(unlockedAt) : new Date(),
      },
    });

    // Create congratulation for the achievement
    try {
      const congratulationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/congratulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: dummyUserId,
          type: 'achievement_unlocked',
          title: title,
          description: description,
          icon: icon,
          stars: stars || 1
        })
      });

      if (congratulationResponse.ok) {
        console.log('🎉 Congratulation created for achievement:', title);
      }
    } catch (congratulationError) {
      console.error('Error creating congratulation:', congratulationError);
      // Don't fail the achievement creation if congratulation fails
    }

    // Signal dashboard to regenerate Pro Tips
    console.log('🏆 Achievement created - signaling dashboard for regeneration');

    // Invalidate AI drivers cache when new achievement is unlocked
    try {
      await db.aISuggestionAction.deleteMany({
        where: {
          userId: dummyUserId,
          type: 'drivers_analysis'
        }
      });
      console.log('🗑️ AI drivers cache invalidated due to new achievement');
    } catch (cacheError) {
      console.error('❌ Error invalidating AI drivers cache:', cacheError);
    }

    return NextResponse.json(achievement);
  } catch (error) {
    console.error("Error creating achievement:", error);
    return NextResponse.json(
      { error: "Failed to create achievement" },
      { status: 500 }
    );
  }
}
