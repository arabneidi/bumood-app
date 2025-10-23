import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const dailyTrackingData = await prisma.dailyTracking.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        date: true,
        deepworkMinutes: true,
        tasksCompleted: true,
        learningMomentum: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Get mood entries with activities to analyze activity patterns
    const moodEntries = await prisma.moodEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        activities: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${dailyTrackingData.length} daily tracking entries`);
    console.log(`📊 Found ${moodEntries.length} mood entries with activities`);

    // Analyze activity patterns to determine LM-focused activities
    const activityAnalysis = await analyzeActivityPatterns(moodEntries);

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
        // Calculate productivity based on Learning Momentum components
        const deepWorkMinutes = dayData.deepworkMinutes || 0;
        const tasksCompleted = dayData.tasksCompleted || 0;
        const learningMomentum = dayData.learningMomentum || 0;

        // Use activity analysis to determine productive hours
        const dayActivities = moodEntries.filter(entry => 
          entry.createdAt.toDateString() === currentDate.toDateString()
        ).flatMap(entry => JSON.parse(entry.activities || '[]'));

        // Calculate base productivity for this day
        const baseProductivity = Math.min(learningMomentum / 100, 1); // Normalize to 0-1

        // Create hourly data
        for (let hour = 0; hour < 24; hour++) {
          let productivity = 0;
          let deepWorkMinutes = 0;
          let tasksCompleted = 0;

          // Check if this hour has LM-focused activities
          const hasLMActivities = dayActivities.some(activity => 
            ['studying', 'working', 'reading', 'coding', 'writing', 'research', 'learning'].includes(activity)
          );

          // Check if this hour aligns with user's activity patterns
          const isProductiveHour = activityAnalysis.lmPatterns.size > 0 ? 
            Array.from(activityAnalysis.lmPatterns.values()).some(pattern => 
              pattern.peakHours.includes(hour)
            ) : 
            (hour >= 9 && hour <= 17) || (hour >= 19 && hour <= 22);

          if (isProductiveHour || hasLMActivities) {
            // Distribute the day's productivity based on activity patterns
            const hourWeight = hasLMActivities ? 0.8 : 0.4;
            productivity = baseProductivity * hourWeight;
            
            // Distribute deep work and tasks across productive hours
            if (hour >= 9 && hour <= 17) {
              deepWorkMinutes = Math.round((dayData.deepworkMinutes || 0) * 0.1);
              tasksCompleted = Math.round((dayData.tasksCompleted || 0) * 0.1);
            }
          }

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
    const insights = calculateInsights(powerHoursData);

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
  // Group activities by hour of day
  const hourlyActivities = new Map();
  
  moodEntries.forEach(entry => {
    const hour = new Date(entry.createdAt).getHours();
    if (!hourlyActivities.has(hour)) {
      hourlyActivities.set(hour, []);
    }
    // Parse activities JSON string
    const activities = JSON.parse(entry.activities || '[]');
    hourlyActivities.get(hour).push(...activities);
  });

  // Analyze which activities are most common during productive hours
  const activityFrequency = new Map();
  hourlyActivities.forEach((activities, hour) => {
    activities.forEach(activity => {
      if (!activityFrequency.has(activity)) {
        activityFrequency.set(activity, { count: 0, hours: [] });
      }
      activityFrequency.get(activity).count++;
      activityFrequency.get(activity).hours.push(hour);
    });
  });

  // Identify LM-focused activities (studying, working, reading, etc.)
  const lmActivities = ['studying', 'working', 'reading', 'coding', 'writing', 'research', 'learning'];
  const lmPatterns = new Map();
  
  lmActivities.forEach(activity => {
    if (activityFrequency.has(activity)) {
      const data = activityFrequency.get(activity);
      lmPatterns.set(activity, {
        frequency: data.count,
        peakHours: data.hours,
        isLM: true
      });
    }
  });

  return {
    hourlyActivities,
    activityFrequency,
    lmPatterns,
    totalActivities: Array.from(activityFrequency.keys()).length
  };
}

function calculateInsights(data: any[]) {
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

  return {
    mostProductiveHours,
    bestDay: bestDay ? { day: bestDay[0], productivity: bestDay[1] } : null,
    totalDataPoints: data.length,
    productiveDataPoints: data.filter(item => item.productivity > 0).length
  };
}
