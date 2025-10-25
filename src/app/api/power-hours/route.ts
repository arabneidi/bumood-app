import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateMoodComposite, calculateMoodCompositeForPowerHours } from '@/lib/moodCompositeCalculator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const window = searchParams.get('window') || 'weekly'; // 'weekly', 'monthly', 'yearly'

    console.log(`📊 GET /api/power-hours - Fetching power hours data for user: ${userId}, window: ${window}`);

    // Define date range based on window
    const endDate = new Date();
    let startDate = new Date();
    let days = 7; // Default to weekly

    if (window === 'weekly') {
      // Last 7 days from today, but start from the day before to include today
      startDate.setDate(endDate.getDate() - 6);
      days = 7;
    } else if (window === 'monthly') {
      // Current month from the 1st
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } else if (window === 'yearly') {
      // Current year from January 1st
      startDate = new Date(endDate.getFullYear(), 0, 1);
      days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    console.log(`📊 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    console.log(`📊 Window: ${window}, Days: ${days}`);

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
        selectedTimeSlots: true,
        valence: true,
        energy: true,
        focus: true,
        stress: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${moodEntries.length} mood entries with MC values`);
    
    // Debug: Log all entries
    moodEntries.forEach((entry, i) => {
      console.log(`📊 Entry ${i+1}: ${entry.createdAt.toISOString()}, MC: ${entry.moodComposite}`);
    });

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
          days,
          window
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
      
      // Extract hours from selectedTimeSlots if available, otherwise use createdAt
      let hoursToProcess: number[] = [entryDate.getHours()]; // Default to createdAt hour
      
      if (entry.selectedTimeSlots) {
        try {
          const timeSlots = typeof entry.selectedTimeSlots === 'string' 
            ? JSON.parse(entry.selectedTimeSlots) 
            : entry.selectedTimeSlots;
          
          if (timeSlots && timeSlots.length > 0) {
            // Process ALL time slots, not just the first one
            hoursToProcess = [];
            timeSlots.forEach((timeSlotStr: string) => {
              // Extract hour from format like "midday-12" or "night-23"
              const hourMatch = timeSlotStr.match(/[-]?(\d+)/);
              if (hourMatch) {
                const parsedHour = parseInt(hourMatch[1]);
                if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
                  hoursToProcess.push(parsedHour);
                }
              }
            });
          }
        } catch (e) {
          console.log('⚠️ Could not parse selectedTimeSlots, using createdAt hour:', e.message);
        }
      }
      
      // Create a data point for each hour
      hoursToProcess.forEach(hour => {
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
    });

    // Get ALL historical entries for proper z-score calculation
    const allHistoricalEntries = await db.moodEntry.findMany({
      where: {
        userId,
        moodComposite: {
          not: null
        }
      },
      select: {
        createdAt: true,
        moodComposite: true,
        selectedTimeSlots: true,
        activityEntries: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${allHistoricalEntries.length} total historical entries for z-score calculation`);
    
    // Generate data for all days and hours in the period
    const powerHoursData = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayOfWeek = daysOfWeek[currentDate.getDay()];

      for (let hour = 0; hour < 24; hour++) {
        const key = `${dayOfWeek}-${hour}`;
        const timeSlotData = mcDataByTimeSlot.get(key);
        
        let avgMC = null; // Use null for empty cells
        
        // ALWAYS check historical data first - this is the core fix
        // Check if we have sufficient historical data for this specific time slot
        // Filter by date: only entries before the START of the current date (exclude same day)
        const currentEntryDate = new Date(currentDate);
        currentEntryDate.setHours(0, 0, 0, 0); // Start of the day
        const historicalDataForTimeSlot = allHistoricalEntries.filter(entry => {
          // Only include entries before the START of the current date (exclude same day)
          if (entry.createdAt >= currentEntryDate) return false;
            
            // Check both activityEntries and selectedTimeSlots
            let hasHour = false;
            
            // Check activityEntries first
            if (entry.activityEntries) {
              try {
                const activityEntries = typeof entry.activityEntries === 'string' 
                  ? JSON.parse(entry.activityEntries) 
                  : entry.activityEntries;
                
                if (activityEntries && activityEntries.length > 0) {
                  hasHour = activityEntries.some((activity: any) => {
                    return activity.hour === hour;
                  });
                }
              } catch (e) {
                // ignore
              }
            }
            
            // If not found in activityEntries, check selectedTimeSlots
            if (!hasHour && entry.selectedTimeSlots) {
              try {
                const timeSlots = typeof entry.selectedTimeSlots === 'string' 
                  ? JSON.parse(entry.selectedTimeSlots) 
                  : entry.selectedTimeSlots;
                
                if (timeSlots && timeSlots.length > 0) {
                  hasHour = timeSlots.some((timeSlotStr: string) => {
                    const hourMatch = timeSlotStr.match(/[-]?(\d+)/);
                    if (hourMatch) {
                      const parsedHour = parseInt(hourMatch[1]);
                      return !isNaN(parsedHour) && parsedHour === hour;
                    }
                    return false;
                  });
                }
              } catch (e) {
                // ignore
              }
            }
            
            return hasHour;
          });
          
          if (dayOfWeek === 'Sat' && hour === 13) {
            console.log(`📊 Sat 13:00 - Historical entries: ${historicalDataForTimeSlot.length} (need 5+), currentDate: ${currentEntryDate.toISOString()}`);
          }
          
          if (dayOfWeek === 'Wed' && hour === 15) {
            console.log(`📊 Wed 15:00 - Historical entries: ${historicalDataForTimeSlot.length} (need 5+), currentDate: ${currentEntryDate.toISOString()}`);
            console.log(`📊 Wed 15:00 - historicalDataForTimeSlot:`, JSON.stringify(historicalDataForTimeSlot.map(e => ({
              date: e.createdAt,
              valence: e.valence,
              energy: e.energy,
              focus: e.focus,
              stress: e.stress
            }))));
          }
          
        // NEW APPROACH: Calculate MC using exact hour matching for power hours
        if (historicalDataForTimeSlot.length >= 5) {
          // We have sufficient historical data, calculate MC for this exact hour
          if (timeSlotData && timeSlotData.mcValues.length > 0) {
            // Use the current entry's mood parameters to calculate MC
            const currentEntry = timeSlotData.entries[0]; // Get the most recent entry
            
            try {
              const mcResult = await calculateMoodCompositeForPowerHours(
                userId,
                currentEntry.valence,
                currentEntry.energy,
                currentEntry.focus,
                currentEntry.stress,
                hour, // Exact hour
                window as 'weekly' | 'monthly' | 'yearly',
                currentEntryDate
              );
              
              avgMC = mcResult.moodComposite;
              console.log(`📊 ${dayOfWeek} ${hour}:00 - Calculated MC: ${avgMC} using exact hour matching`);
            } catch (error) {
              console.error(`❌ Error calculating MC for ${dayOfWeek} ${hour}:00:`, error);
              avgMC = null;
            }
          }
        } else {
          // Insufficient historical data
          avgMC = null;
          console.log(`📊 ${dayOfWeek} ${hour}:00 - Insufficient historical data (${historicalDataForTimeSlot.length}), setting to null`);
        }
        
        // Debug for Saturday 10am
        if (dayOfWeek === 'Sat' && hour === 10) {
          console.log(`🐛 DEBUG Sat 10:00 - timeSlotData exists: ${!!timeSlotData}, mcValues: ${timeSlotData?.mcValues}, historicalData: ${historicalDataForTimeSlot.length}, avgMC: ${avgMC}`);
        }
        
        powerHoursData.push({
          day: dayOfWeek,
          hour: hour,
          mcValue: avgMC // null for empty cells or insufficient historical data
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
        totalEntries: moodEntries.length,
        historicalEntries: allHistoricalEntries.length,
        avgMCValue: powerHoursData.filter(item => item.mcValue !== null).length > 0
          ? powerHoursData.filter(item => item.mcValue !== null).reduce((sum, item) => sum + (item.mcValue || 0), 0) / powerHoursData.filter(item => item.mcValue !== null).length
          : 0
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
        window
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
  const hourlyMC = new Map();
  
  data.forEach(item => {
    if (item.mcValue !== null) {
      const key = `${item.day}-${item.hour}`;
      if (!hourlyMC.has(key) || hourlyMC.get(key) < item.mcValue) {
        hourlyMC.set(key, item.mcValue);
      }
    }
  });

  // Get top productive hours
  const sortedHours = Array.from(hourlyMC.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const mostProductiveHours = sortedHours.map(([key, mcValue]) => {
    const [day, hour] = key.split('-');
    return { day, hour: parseInt(hour), mcValue };
  });

  // Calculate average MC by day of week
  const dayMC = new Map();
  daysOfWeek.forEach(day => {
    const dayData = data.filter(item => item.day === day && item.mcValue !== null);
    const avgMC = dayData.length > 0 
      ? dayData.reduce((sum, item) => sum + item.mcValue, 0) / dayData.length 
      : 0;
    dayMC.set(day, avgMC);
  });

  const bestDay = Array.from(dayMC.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Generate MC-based recommendations
  const recommendations = [];
  
  if (mostProductiveHours.length > 0) {
    recommendations.push({
      type: 'optimal_hours',
      title: 'Your Optimal Power Hours',
      description: `Your highest Mood Composite is during: ${mostProductiveHours.map(item => `${item.day}s at ${item.hour}:00 (MC: ${item.mcValue.toFixed(2)})`).join(', ')}`,
      priority: 'high'
    });
  }

  // MC-specific insights
  const mcInsights = data.filter(item => item.mcValue !== null);
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
    bestDay: bestDay ? { day: bestDay[0], mcValue: bestDay[1] } : null,
    bestDeepWorkHours: [],
    recommendations,
    totalDataPoints: data.length,
    productiveDataPoints: data.filter(item => item.mcValue !== null).length,
    deepWorkDataPoints: 0,
    mcDataPoints: data.filter(item => item.mcValue !== null).length
  };
}
