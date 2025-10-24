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
    if (completed !== undefined) updateData.completed = completed;

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
    await db.goal.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
