import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateMoodComposite } from '@/lib/moodCompositeCalculator';

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

    // Get mood entries with MC values for power hours calculation
    const moodEntries = await db.moodEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        moodComposite: {
          not: null
        }
      },
      select: {
        createdAt: true,
        moodComposite: true,
        timeBucket: true,
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
    console.log(`📊 Found ${moodEntries.length} mood entries with MC values`);

    // If no mood entries with MC values, return empty data
    if (moodEntries.length === 0) {
      console.log('📊 No mood entries with MC values found, returning empty power hours');
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

    // Group mood entries by weekday and hour, then average MC values
    const mcDataByTimeSlot = new Map();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Process each mood entry
    moodEntries.forEach(entry => {
      const entryDate = new Date(entry.createdAt);
      const dayOfWeek = daysOfWeek[entryDate.getDay()];
      const hour = entryDate.getHours();
      const key = `${dayOfWeek}-${hour}`;
      
      if (!mcDataByTimeSlot.has(key)) {
        mcDataByTimeSlot.set(key, {
          mcValues: [],
          entries: [],
          day: dayOfWeek,
          hour: hour
        });
      }
      
      const timeSlotData = mcDataByTimeSlot.get(key);
      timeSlotData.mcValues.push(entry.moodComposite || 0);
      timeSlotData.entries.push(entry);
    });

    // Calculate average MC values for each time slot
    const powerHoursData = [];
    
    // Generate data for all days and hours in the period
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeek = daysOfWeek[currentDate.getDay()];

      for (let hour = 0; hour < 24; hour++) {
        const key = `${dayOfWeek}-${hour}`;
        const timeSlotData = mcDataByTimeSlot.get(key);
        
        let avgMC = null; // Use null for empty cells instead of 0
        let deepWorkMinutes = 0;
        let tasksCompleted = 0;
        let productivity = 0; // Default to 0 for empty cells
        
        if (timeSlotData && timeSlotData.mcValues.length > 0) {
          // Calculate average MC value for this time slot
          avgMC = timeSlotData.mcValues.reduce((sum, mc) => sum + mc, 0) / timeSlotData.mcValues.length;
          
          // Calculate additional metrics based on mood scores
          const avgValence = timeSlotData.entries.reduce((sum, entry) => sum + entry.valence, 0) / timeSlotData.entries.length;
          const avgEnergy = timeSlotData.entries.reduce((sum, entry) => sum + entry.energy, 0) / timeSlotData.entries.length;
          const avgFocus = timeSlotData.entries.reduce((sum, entry) => sum + entry.focus, 0) / timeSlotData.entries.length;
          const avgStress = timeSlotData.entries.reduce((sum, entry) => sum + entry.stress, 0) / timeSlotData.entries.length;
          
          // Calculate deep work metrics based on focus and MC
          if (avgFocus >= 7 && avgMC > 0) {
            deepWorkMinutes = Math.round(60 * (avgFocus / 10));
            tasksCompleted = Math.round((avgEnergy + avgFocus) / 2);
          }
          
          // Only calculate productivity if we have actual MC data
          productivity = Math.max(0, Math.min(1, (avgMC + 2) / 4)); // Normalize MC (-2 to 2) to 0-1 scale
        }
        
        powerHoursData.push({
          day: dayOfWeek,
          hour: hour,
          productivity, // 0 for empty cells, calculated value for cells with data
          deepWorkMinutes,
          tasksCompleted,
          mcValue: avgMC // null for empty cells, actual MC value for cells with data
        });
      }
    }

    console.log(`📊 Generated ${powerHoursData.length} power hours data points`);

    // Calculate insights based on MC values
    const insights = calculateInsights(powerHoursData, null);

    return NextResponse.json({
      data: powerHoursData,
      insights,
      mcAnalysis: {
        totalTimeSlots: mcDataByTimeSlot.size,
        timeSlotsWithData: Array.from(mcDataByTimeSlot.values()).filter(slot => slot.mcValues.length > 0).length,
        avgMCValue: powerHoursData.reduce((sum, item) => sum + (item.mcValue || 0), 0) / powerHoursData.length
      },
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


function calculateInsights(data: any[], mcAnalysis?: any) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Find most productive hours based on MC values
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

  // Generate MC-based recommendations
  const recommendations = [];
  
  if (mostProductiveHours.length > 0) {
    recommendations.push({
      type: 'optimal_hours',
      title: 'Your Optimal Power Hours (MC-based)',
      description: `Based on your Mood Composite patterns, your most productive hours are: ${mostProductiveHours.map(item => `${item.day}s at ${item.hour}:00 (${Math.round(item.productivity * 100)}% productivity)`).join(', ')}`,
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

  // MC-specific insights
  const mcInsights = data.filter(item => item.mcValue !== undefined && item.mcValue !== 0);
  if (mcInsights.length > 0) {
    const avgMC = mcInsights.reduce((sum, item) => sum + item.mcValue, 0) / mcInsights.length;
    recommendations.push({
      type: 'mc_insights',
      title: 'Mood Composite Insights',
      description: `Your average Mood Composite is ${avgMC.toFixed(2)}. ${avgMC > 0 ? 'You tend to have positive mood patterns during productive hours.' : 'Consider focusing on mood-boosting activities during your power hours.'}`,
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
    deepWorkDataPoints: data.filter(item => item.deepWorkMinutes > 0).length,
    mcDataPoints: data.filter(item => item.mcValue !== undefined && item.mcValue !== 0).length
  };
}
