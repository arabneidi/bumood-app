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
            sleepHours: null,
            waterIntake: null,
            mealsEaten: null,
            exerciseMinutes: null,
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
        // Learning Momentum: increment deepwork minutes and tasks completed
        updateData.deepworkMinutes = (dailyTracking.deepworkMinutes || 0) + 15; // 15 minutes of focused work
        updateData.tasksCompleted = (dailyTracking.tasksCompleted || 0) + 1;
      } else if (dssComponent === 'RI') {
        // Recovery Index: mark recovery action
        updateData.recoveryAction = true;
      } else if (dssComponent === 'Connection') {
        // Connection: increment social touchpoints
        updateData.positiveSocialTouchpoints = (dailyTracking.positiveSocialTouchpoints || 0) + 1;
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
