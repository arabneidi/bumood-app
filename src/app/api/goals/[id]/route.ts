import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { currentValue, streak, bestStreak, completed } = body;

    const updateData: any = {};
    
    if (currentValue !== undefined) updateData.currentValue = currentValue;
    if (streak !== undefined) updateData.streak = streak;
    if (bestStreak !== undefined) updateData.bestStreak = bestStreak;
    if (completed !== undefined) updateData.completed = completed;

    const updatedGoal = await db.goal.update({
      where: { id: params.id },
      data: updateData,
    });
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
