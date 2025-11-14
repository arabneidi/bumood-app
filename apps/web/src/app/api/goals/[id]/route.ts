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

    // Regenerate Pro Tips when goal progress changes or goal is completed
    // Do this BEFORE returning response so it completes before user navigates to dashboard
    console.log('🔍 Checking if Pro Tip regeneration needed:', { 
      currentValue, 
      currentValueDefined: currentValue !== undefined,
      completed, 
      completedTrue: completed === true,
      shouldRegenerate: currentValue !== undefined || completed === true
    });
    
    if (currentValue !== undefined || completed === true) {
      // Wait for Pro Tip regeneration to complete (with timeout)
      // This ensures Pro Tip is ready when user navigates to dashboard
      try {
        // Get API key from environment (server-side)
        const apiKey = process.env.OPENAI_API_KEY;
        const apiKeyParam = apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : '';
        const proTipUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/personalized-quotes?userId=${currentGoal.userId}&forceRegenerate=true${apiKeyParam}`;
        console.log('🔄 Regenerating Pro Tips after goal update (waiting for completion, max 8s)...');
        console.log('🔗 Pro Tip URL:', proTipUrl.replace(apiKey || '', '***'));
        
        const startTime = Date.now();
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        try {
          const response = await fetch(proTipUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          const duration = Date.now() - startTime;
          
          console.log(`⏱️ Pro Tip regeneration completed in ${duration}ms`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.savedToDB) {
              console.log('✅ Pro Tip regenerated and saved to database:', data.quote?.substring(0, 50) + '...');
            } else {
              console.log('✅ Pro Tip regenerated (not saved to DB):', data.quote?.substring(0, 50) + '...');
            }
          } else {
            const errorText = await response.text();
            console.error('⚠️ Pro Tip regeneration failed:', response.status, errorText.substring(0, 100));
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.log('⏱️ Pro Tip regeneration timed out after 8s - continuing in background...');
            // Continue regeneration in background if it times out
            ;(async () => {
              try {
                const bgResponse = await fetch(proTipUrl, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                });
                if (bgResponse.ok) {
                  const data = await bgResponse.json();
                  console.log('✅ Background Pro Tip regeneration completed:', data.quote?.substring(0, 50) + '...');
                }
              } catch (bgError) {
                console.error('⚠️ Background Pro Tip regeneration failed:', bgError);
              }
            })();
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        console.error('⚠️ Error regenerating Pro Tips:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message, error.stack?.substring(0, 200));
        }
        // Don't fail the goal update if Pro Tip regeneration fails
      }
      console.log('✅ Goal update complete - Pro Tip regeneration finished or continuing in background');
    } else {
      console.log('⏭️ Skipping Pro Tip regeneration - no progress change or completion');
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
