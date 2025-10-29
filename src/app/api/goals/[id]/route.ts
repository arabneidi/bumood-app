export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { currentValue, streak, bestStreak, completed } = body;

    // Get the current goal to check if it's being completed
    const currentGoal = await db.goal.findUnique({
      where: { id: params.id }
    });

    if (!currentGoal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    
    if (currentValue !== undefined) updateData.currentValue = currentValue;
    if (streak !== undefined) updateData.streak = streak;
    if (bestStreak !== undefined) updateData.bestStreak = bestStreak;
    if (completed !== undefined) {
      updateData.completed = completed;
      // Set completion date if goal is being completed
      if (completed === true && !currentGoal.completed) {
        updateData.completedAt = new Date();
      }
    }

    const updatedGoal = await db.goal.update({
      where: { id: params.id },
      data: updateData,
    });

    // Check if goal was just completed
    if (completed === true && !currentGoal.completed) {
      console.log('🎉 Goal completed! Creating congratulation...');
      
      try {
        // Create congratulation for goal completion
        const congratulationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/congratulations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentGoal.userId,
            type: 'goal_completed',
            title: currentGoal.title,
            description: currentGoal.description,
            icon: '🎯',
            stars: 3
          })
        });

        if (congratulationResponse.ok) {
          const congratulation = await congratulationResponse.json();
          console.log('✅ Congratulation created:', congratulation.congratulation.title);
        }
      } catch (congratulationError) {
        console.error('⚠️ Error creating congratulation:', congratulationError);
        // Don't fail the goal update if congratulation fails
      }
    }

    // Invalidate AI drivers cache when goal is updated
    try {
      await db.aISuggestionAction.deleteMany({
        where: {
          userId: currentGoal.userId,
          type: 'drivers_analysis'
        }
      });
      console.log('🗑️ AI drivers cache invalidated due to goal update');
    } catch (cacheError) {
      console.error('❌ Error invalidating AI drivers cache:', cacheError);
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the goal before deleting to get userId
    const goal = await db.goal.findUnique({
      where: { id: params.id }
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    await db.goal.delete({
      where: { id: params.id },
    });

    // Invalidate AI drivers cache when goal is deleted
    try {
      await db.aISuggestionAction.deleteMany({
        where: {
          userId: goal.userId,
          type: 'drivers_analysis'
        }
      });
      console.log('🗑️ AI drivers cache invalidated due to goal deletion');
    } catch (cacheError) {
      console.error('❌ Error invalidating AI drivers cache:', cacheError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
