import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      goalId, 
      goalTitle, 
      goalCategory, 
      goalSubcategory, 
      dssComponent, 
      progressChange, 
      timestamp 
    } = body;
    
    
    const dummyUserId = "dummy-user";
    
    // Create a minimal activity record for DSS tracking
    // This doesn't create a visible mood entry, just tracks the activity
    const activityRecord = {
      userId: dummyUserId,
      type: 'goal_progress',
      goalId: goalId,
      goalTitle: goalTitle,
      goalCategory: goalCategory,
      goalSubcategory: goalSubcategory,
      dssComponent: dssComponent,
      progressChange: progressChange,
      timestamp: new Date(timestamp),
      // Store as a simple activity tracking record
      activityData: JSON.stringify({
        type: 'goal_progress',
        goalId: goalId,
        goalTitle: goalTitle,
        category: goalCategory,
        subcategory: goalSubcategory,
        dssComponent: dssComponent,
        progressChange: progressChange
      })
    };
    
    // Activity tracked for DSS contribution
    
    // Update daily tracking to contribute to DSS
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get or create today's daily tracking entry
      let dailyTracking = await db.dailyTracking.findFirst({
        where: {
          userId: dummyUserId,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });
      
      if (!dailyTracking) {
        // Create new daily tracking entry
        dailyTracking = await db.dailyTracking.create({
          data: {
            userId: dummyUserId,
            date: today,
            waterIntake: null,
            mealsEaten: null,
            exercise: false,
            exerciseType: null,
            exerciseDuration: null,
            steps: null,
            deepworkMinutes: 0,
            tasksCompleted: 0,
            recoveryAction: false,
            positiveSocialTouchpoints: 0,
            dssScore: null
          }
        });
      }
      
      // Update DSS components based on goal activity
      const updateData: any = {};
      
      if (dssComponent === 'LM') {
        // Learning Momentum: add/subtract deepwork minutes and tasks completed
        const timeChange = progressChange > 0 ? 15 : -15; // 15 minutes per +1, -15 minutes per -1
        const taskChange = progressChange > 0 ? 1 : -1; // 1 task per +1, -1 task per -1
        
        updateData.deepworkMinutes = Math.max(0, (dailyTracking.deepworkMinutes || 0) + timeChange);
        updateData.tasksCompleted = Math.max(0, (dailyTracking.tasksCompleted || 0) + taskChange);
      } else if (dssComponent === 'RI') {
        // Recovery Index: handle recovery action based on progress change
        if (progressChange > 0) {
          updateData.recoveryAction = true;
        } else {
          // For -1, we don't set recoveryAction to false as it might affect other activities
          // Just track the decrease without changing the boolean
        }
      } else if (dssComponent === 'Connection') {
        // Connection: add/subtract social touchpoints
        const touchpointChange = progressChange > 0 ? 1 : -1;
        updateData.positiveSocialTouchpoints = Math.max(0, (dailyTracking.positiveSocialTouchpoints || 0) + touchpointChange);
      }
      
      // Update the daily tracking entry
      await db.dailyTracking.update({
        where: { id: dailyTracking.id },
        data: updateData
      });
      
    } catch (error) {
      console.error('❌ Error updating daily tracking:', error);
    }
    
    // Update user's recent activities with the goal activity
    try {
      const user = await db.user.findUnique({
        where: { id: dummyUserId },
        select: { recentActivities: true }
      });
      
      let recentActivities = [];
      if (user?.recentActivities) {
        try {
          recentActivities = JSON.parse(user.recentActivities);
        } catch (error) {
          console.log('⚠️ Could not parse recentActivities, starting fresh');
          recentActivities = [];
        }
      }
      
      // Add the goal activity to recent activities
      const activityName = goalSubcategory || goalTitle;
      recentActivities = [activityName, ...recentActivities];
      
      // Remove duplicates while preserving order
      const uniqueRecentActivities = recentActivities.filter((item, index, self) => 
        self.indexOf(item) === index
      );
      
      // Keep only the last 10 activities
      const trimmedRecentActivities = uniqueRecentActivities.slice(0, 10);
      
      await db.user.update({
        where: { id: dummyUserId },
        data: {
          recentActivities: JSON.stringify(trimmedRecentActivities)
        }
      });
      
    } catch (error) {
      console.error('❌ Error updating recent activities:', error);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Goal activity tracked for DSS',
      activity: {
        goal: goalTitle,
        dssComponent: dssComponent,
        progress: `+${progressChange}`
      }
    });
    
  } catch (error) {
    console.error('❌ Error tracking goal activity:', error);
    return NextResponse.json(
      { error: 'Failed to track goal activity' },
      { status: 500 }
    );
  }
}
