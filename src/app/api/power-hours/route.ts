import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const days = parseInt(searchParams.get('days') || '14'); // Default to 14 days

    console.log(`📊 GET /api/power-hours - Fetching power hours data for user: ${userId}, days: ${days}`);

    // Get daily tracking data for the specified period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    console.log(`📊 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const dailyTrackingData = await db.dailyTracking.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        date: true,
        exerciseDuration: true,
        readingTime: true,
        meditationDuration: true,
        screenTime: true,
        steps: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Get mood entries with activities and time slots to analyze activity patterns
    const moodEntries = await db.moodEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        activities: true,
        selectedTimeSlots: true,
        selectedSubcategories: true,
        valence: true,
        energy: true,
        focus: true,
        stress: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${dailyTrackingData.length} daily tracking entries`);
    console.log(`📊 Found ${moodEntries.length} mood entries with activities`);

    // For now, return simple data to test
    if (dailyTrackingData.length === 0 && moodEntries.length === 0) {
      console.log('📊 No data found, returning empty power hours');
      return NextResponse.json({
        data: [],
        insights: {
          mostProductiveHours: [],
          bestDay: null,
          bestDeepWorkHours: [],
          recommendations: [],
          totalDataPoints: 0,
          productiveDataPoints: 0,
          deepWorkDataPoints: 0
        },
        activityAnalysis: {},
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days
        }
      });
    }

    // Analyze activity patterns to determine LM-focused activities
    const activityAnalysis = {
      hourlyActivities: new Map(),
      timeSlotActivities: new Map(),
      deepWorkActivities: new Map(),
      activityFrequency: new Map(),
      lmPatterns: new Map(),
      optimalHours: new Map(),
      totalActivities: 0
    };

    // Process data to create power hours heatmap data
    const powerHoursData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // For each day in the period, create hourly data
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeek = daysOfWeek[currentDate.getDay()];

      // Get the daily tracking data for this date
      const dayData = dailyTrackingData.find(d => 
        d.date.toDateString() === currentDate.toDateString()
      );

      if (dayData) {
        // Calculate productivity based on available tracking data
        const exerciseMinutes = dayData.exerciseDuration || 0;
        const readingMinutes = dayData.readingTime || 0;
        const meditationMinutes = dayData.meditationDuration || 0;
        const screenTime = dayData.screenTime || 0;
        const steps = dayData.steps || 0;

        // Use activity analysis to determine productive hours
        const dayActivities = moodEntries.filter(entry => 
          entry.createdAt.toDateString() === currentDate.toDateString()
        ).flatMap(entry => JSON.parse(entry.activities || '[]'));

        // Calculate base productivity for this day based on productive activities
        const productiveMinutes = exerciseMinutes + readingMinutes + meditationMinutes;
        const baseProductivity = Math.min(productiveMinutes / 480, 1); // Normalize to 0-1 (8 hours max)

        // Create hourly data using enhanced activity analysis
        for (let hour = 0; hour < 24; hour++) {
          let productivity = 0;
          let deepWorkMinutes = 0;
          let tasksCompleted = 0;

          // Check if this hour has LM-focused activities from time slots
          const hasLMActivities = dayActivities.some(activity => 
            ['studying', 'working', 'reading', 'coding', 'writing', 'research', 'learning', 'programming'].includes(activity)
          );

          // Check if this hour is in user's optimal deep work hours
          const isOptimalHour = activityAnalysis.optimalHours.has(hour);
          const optimalData = activityAnalysis.optimalHours.get(hour);

          // Check if this hour aligns with user's activity patterns (including time slots)
          const isProductiveHour = activityAnalysis.lmPatterns.size > 0 ? 
            Array.from(activityAnalysis.lmPatterns.values()).some(pattern => 
              pattern.peakHours.includes(hour) || pattern.timeSlotHours.includes(hour)
            ) : 
            (hour >= 9 && hour <= 17) || (hour >= 19 && hour <= 22);

          // Calculate productivity based on multiple factors
          if (isOptimalHour && optimalData) {
            // Use actual user data for optimal hours
            productivity = Math.min(optimalData.productivity, 1);
            deepWorkMinutes = Math.round(readingMinutes * 0.15);
            tasksCompleted = Math.round((exerciseMinutes + meditationMinutes) * 0.1);
          } else if (isProductiveHour || hasLMActivities) {
            // Use pattern-based calculation for other productive hours
            const hourWeight = hasLMActivities ? 0.8 : 0.4;
            productivity = baseProductivity * hourWeight;
            
            // Distribute productive activities across productive hours
            if (hour >= 9 && hour <= 17) {
              deepWorkMinutes = Math.round(readingMinutes * 0.1);
              tasksCompleted = Math.round((exerciseMinutes + meditationMinutes) * 0.1);
            }
          }

          // Apply time slot boost if user specifically selected this hour
          const timeSlotBoost = activityAnalysis.timeSlotActivities.has(hour) ? 0.2 : 0;
          productivity = Math.min(1, productivity + timeSlotBoost);

          powerHoursData.push({
            day: dayOfWeek,
            hour: hour,
            productivity: Math.max(0, Math.min(1, productivity)),
            deepWorkMinutes,
            tasksCompleted
          });
        }
      } else {
        // No data for this day, create empty hourly entries
        for (let hour = 0; hour < 24; hour++) {
          powerHoursData.push({
            day: dayOfWeek,
            hour: hour,
            productivity: 0,
            deepWorkMinutes: 0,
            tasksCompleted: 0
          });
        }
      }
    }

    console.log(`📊 Generated ${powerHoursData.length} power hours data points`);

    // Calculate insights
    const insights = calculateInsights(powerHoursData, activityAnalysis);

    return NextResponse.json({
      data: powerHoursData,
      insights,
      activityAnalysis,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      }
    });

  } catch (error) {
    console.error('❌ Error fetching power hours data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch power hours data' },
      { status: 500 }
    );
  }
}

async function analyzeActivityPatterns(moodEntries: any[]) {
  // Group activities by hour of day using both actual time and selected time slots
  const hourlyActivities = new Map();
  const timeSlotActivities = new Map();
  const deepWorkActivities = new Map();
  
  moodEntries.forEach(entry => {
    const actualHour = new Date(entry.createdAt).getHours();
    const activities = JSON.parse(entry.activities || '[]');
    const timeSlots = JSON.parse(entry.selectedTimeSlots || '[]');
    const subcategories = JSON.parse(entry.selectedSubcategories || '[]');
    
    // Track activities by actual time
    if (!hourlyActivities.has(actualHour)) {
      hourlyActivities.set(actualHour, []);
    }
    hourlyActivities.get(actualHour).push(...activities);
    
    // Track activities by selected time slots
    timeSlots.forEach((timeSlot: string) => {
      const hour = parseInt(timeSlot.split('-')[1]) || actualHour;
      if (!timeSlotActivities.has(hour)) {
        timeSlotActivities.set(hour, []);
      }
      timeSlotActivities.get(hour).push(...activities);
    });
    
    // Identify deep work activities based on mood scores and activities
    const isDeepWork = activities.some((activity: string) => 
      ['studying', 'working', 'reading', 'coding', 'writing', 'research', 'learning', 'programming'].includes(activity)
    ) && entry.focus >= 7 && entry.stress <= 5;
    
    if (isDeepWork) {
      const hour = timeSlots.length > 0 ? parseInt(timeSlots[0].split('-')[1]) || actualHour : actualHour;
      if (!deepWorkActivities.has(hour)) {
        deepWorkActivities.set(hour, []);
      }
      deepWorkActivities.get(hour).push({
        activities,
        subcategories,
        valence: entry.valence,
        energy: entry.energy,
        focus: entry.focus,
        stress: entry.stress
      });
    }
  });

  // Analyze which activities are most common during productive hours
  const activityFrequency = new Map();
  hourlyActivities.forEach((activities, hour) => {
    activities.forEach((activity: string) => {
      if (!activityFrequency.has(activity)) {
        activityFrequency.set(activity, { count: 0, hours: [], timeSlots: [] });
      }
      activityFrequency.get(activity).count++;
      activityFrequency.get(activity).hours.push(hour);
    });
  });

  // Analyze time slot patterns
  timeSlotActivities.forEach((activities, hour) => {
    activities.forEach((activity: string) => {
      if (activityFrequency.has(activity)) {
        activityFrequency.get(activity).timeSlots.push(hour);
      }
    });
  });

  // Identify LM-focused activities (studying, working, reading, etc.)
  const lmActivities = ['studying', 'working', 'reading', 'coding', 'writing', 'research', 'learning', 'programming'];
  const lmPatterns = new Map();
  
  lmActivities.forEach(activity => {
    if (activityFrequency.has(activity)) {
      const data = activityFrequency.get(activity);
      const timeSlotHours = data.timeSlots || [];
      const allHours = Array.from(new Set([...data.hours, ...timeSlotHours]));
      
      lmPatterns.set(activity, {
        frequency: data.count,
        peakHours: allHours,
        timeSlotHours,
        isLM: true,
        deepWorkHours: deepWorkActivities.has(activity) ? Array.from(deepWorkActivities.keys()) : []
      });
    }
  });

  // Calculate optimal hours for deep work based on user patterns
  const optimalHours = new Map();
  deepWorkActivities.forEach((sessions, hour) => {
      const avgFocus = sessions.reduce((sum: number, session: any) => sum + session.focus, 0) / sessions.length;
      const avgEnergy = sessions.reduce((sum: number, session: any) => sum + session.energy, 0) / sessions.length;
      const avgStress = sessions.reduce((sum: number, session: any) => sum + session.stress, 0) / sessions.length;
    
    optimalHours.set(hour, {
      focus: avgFocus,
      energy: avgEnergy,
      stress: avgStress,
      sessions: sessions.length,
      productivity: (avgFocus + avgEnergy - avgStress) / 3
    });
  });

  return {
    hourlyActivities,
    timeSlotActivities,
    deepWorkActivities,
    activityFrequency,
    lmPatterns,
    optimalHours,
    totalActivities: Array.from(activityFrequency.keys()).length
  };
}

function calculateInsights(data: any[], activityAnalysis?: any) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Find most productive hours
  const hourlyProductivity = new Map();
  
  data.forEach(item => {
    if (item.productivity > 0) {
      const key = `${item.day}-${item.hour}`;
      if (!hourlyProductivity.has(key) || hourlyProductivity.get(key) < item.productivity) {
        hourlyProductivity.set(key, item.productivity);
      }
    }
  });

  // Get top productive hours
  const sortedHours = Array.from(hourlyProductivity.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const mostProductiveHours = sortedHours.map(([key, productivity]) => {
    const [day, hour] = key.split('-');
    return { day, hour: parseInt(hour), productivity };
  });

  // Calculate average productivity by day of week
  const dayProductivity = new Map();
  daysOfWeek.forEach(day => {
    const dayData = data.filter(item => item.day === day && item.productivity > 0);
    const avgProductivity = dayData.length > 0 
      ? dayData.reduce((sum, item) => sum + item.productivity, 0) / dayData.length 
      : 0;
    dayProductivity.set(day, avgProductivity);
  });

  const bestDay = Array.from(dayProductivity.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Calculate deep work insights
  const deepWorkHours = new Map();
  data.forEach(item => {
    if (item.deepWorkMinutes > 0) {
      const key = `${item.day}-${item.hour}`;
      if (!deepWorkHours.has(key)) {
        deepWorkHours.set(key, { minutes: 0, tasks: 0, count: 0 });
      }
      const current = deepWorkHours.get(key);
      current.minutes += item.deepWorkMinutes;
      current.tasks += item.tasksCompleted;
      current.count += 1;
    }
  });

  // Find best deep work hours
  const bestDeepWorkHours = Array.from(deepWorkHours.entries())
    .map(([key, data]) => {
      const [day, hour] = key.split('-');
      return {
        day,
        hour: parseInt(hour),
        avgMinutes: data.minutes / data.count,
        avgTasks: data.tasks / data.count,
        sessions: data.count
      };
    })
    .sort((a, b) => b.avgMinutes - a.avgMinutes)
    .slice(0, 3);

  // Generate personalized recommendations
  const recommendations = [];
  
  if (activityAnalysis && activityAnalysis.optimalHours.size > 0) {
    const optimalHours = Array.from(activityAnalysis.optimalHours.entries())
      .sort((a: any, b: any) => b[1].productivity - a[1].productivity)
      .slice(0, 3);
    
    recommendations.push({
      type: 'optimal_hours',
      title: 'Your Optimal Deep Work Hours',
      description: `Based on your activity patterns, your most productive hours are: ${optimalHours.map((item: any) => `${item[0]}:00 (${Math.round(item[1].productivity * 100)}% productivity)`).join(', ')}`,
      priority: 'high'
    });
  }

  if (bestDeepWorkHours.length > 0) {
    recommendations.push({
      type: 'deep_work_schedule',
      title: 'Schedule Deep Work Sessions',
      description: `Your best deep work times are ${bestDeepWorkHours[0].day}s at ${bestDeepWorkHours[0].hour}:00 (avg ${Math.round(bestDeepWorkHours[0].avgMinutes)} min sessions)`,
      priority: 'medium'
    });
  }

  if (activityAnalysis && activityAnalysis.lmPatterns.size > 0) {
    const topActivities = Array.from(activityAnalysis.lmPatterns.entries())
      .sort((a: any, b: any) => b[1].frequency - a[1].frequency)
      .slice(0, 3);
    
    recommendations.push({
      type: 'activity_focus',
      title: 'Focus on Your Most Productive Activities',
      description: `Your most productive activities are: ${topActivities.map((item: any) => `${item[0]} (${item[1].frequency} sessions)`).join(', ')}`,
      priority: 'medium'
    });
  }

  return {
    mostProductiveHours,
    bestDay: bestDay ? { day: bestDay[0], productivity: bestDay[1] } : null,
    bestDeepWorkHours,
    recommendations,
    totalDataPoints: data.length,
    productiveDataPoints: data.filter(item => item.productivity > 0).length,
    deepWorkDataPoints: data.filter(item => item.deepWorkMinutes > 0).length
  };
}
