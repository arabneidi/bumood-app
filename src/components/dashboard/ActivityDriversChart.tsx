'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Target } from 'lucide-react';

interface ActivityData {
  tag: string;
  occurrences: number;
  presentDays: number;
  absentDays: number;
  dssEffect: number;
  mcEffect: number;
  overallEffect: number;
  isHelpful: boolean;
}

interface DayData {
  date: string;
  dss: number;
  mc: number;
  hasActivity: boolean;
  valence: number;
  energy: number;
  focus: number;
  stress: number;
}

interface ActivityDriversChartProps {
  driversData: {
    helpful: ActivityData[];
    harmful: ActivityData[];
  };
  userInfo?: any;
}

export default function ActivityDriversChart({ driversData, userInfo }: ActivityDriversChartProps) {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Get top 5 activities by absolute effect size
  const allActivities = [...driversData.helpful, ...driversData.harmful];
  const topActivities = allActivities
    .sort((a, b) => Math.abs(b.overallEffect) - Math.abs(a.overallEffect))
    .slice(0, 5);

  const fetchMonthlyData = async () => {
    setLoading(true);
    try {
      const monthlyPromises = topActivities.map(async (activity) => {
        const response = await fetch(`/api/activity-drivers-chart?activity=${encodeURIComponent(activity.tag)}&userId=dummy-user`);
        if (response.ok) {
          const data = await response.json();
          return {
            activity: activity.tag,
            effect: activity.overallEffect,
            isHelpful: activity.isHelpful,
            chartData: data.chartData || []
          };
        }
        return null;
      });

      const results = await Promise.all(monthlyPromises);
      setMonthlyData(results.filter(Boolean));
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (topActivities.length > 0) {
      fetchMonthlyData();
    }
  }, [topActivities.length]);

  const getActivityColor = (activity: ActivityData) => {
    if (activity.isHelpful) {
      return {
        bg: 'bg-green-900/20',
        border: 'border-green-500/30',
        text: 'text-green-300',
        accent: 'text-green-400'
      };
    } else {
      return {
        bg: 'bg-red-900/20',
        border: 'border-red-500/30',
        text: 'text-red-300',
        accent: 'text-red-400'
      };
    }
  };

  const getActivityDotColor = (activityName: string) => {
    const colorMap: { [key: string]: string } = {
      'exercise': 'bg-green-500',
      'yoga': 'bg-red-500',
      'walking': 'bg-blue-500',
      'watching': 'bg-purple-500',
      'coding': 'bg-orange-500',
      'calling': 'bg-cyan-500',
      'puzzles': 'bg-pink-500',
      'meeting': 'bg-yellow-500'
    };
    return colorMap[activityName.toLowerCase()] || 'bg-gray-500';
  };

  const getActivityCellColor = (activitiesPresent: any[]) => {
    if (activitiesPresent.length === 0) {
      return 'bg-slate-700/30';
    } else if (activitiesPresent.length === 1) {
      const activityName = activitiesPresent[0].activity.toLowerCase();
      const colorMap: { [key: string]: string } = {
        'exercise': 'bg-green-500/80',
        'yoga': 'bg-red-500/80',
        'walking': 'bg-blue-500/80',
        'watching': 'bg-purple-500/80',
        'coding': 'bg-orange-500/80',
        'calling': 'bg-cyan-500/80',
        'puzzles': 'bg-pink-500/80',
        'meeting': 'bg-yellow-500/80'
      };
      return colorMap[activityName] || 'bg-gray-500/80';
    } else {
      // Multiple activities - use a gradient or pattern
      return 'bg-gradient-to-br from-blue-500/60 to-purple-500/60';
    }
  };

  const getActivityColorClass = (activityName: string) => {
    const colorMap: { [key: string]: string } = {
      'exercise': 'bg-green-500',
      'yoga': 'bg-red-500',
      'walking': 'bg-blue-500',
      'watching': 'bg-purple-500',
      'coding': 'bg-orange-500',
      'calling': 'bg-cyan-500',
      'puzzles': 'bg-pink-500',
      'meeting': 'bg-yellow-500'
    };
    return colorMap[activityName.toLowerCase()] || 'bg-gray-500';
  };

  const getPercentageEffect = (effect: number) => {
    return Math.round(effect);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center mb-6"
        >
          <BarChart3 className="w-6 h-6 text-blue-500 mr-3" />
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Activity Impact Analysis
          </h3>
        </motion.div>

        {/* Activity Drivers Heatmap */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-slate-300 mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-400" />
            Activity Impact Heatmap
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-slate-400">Loading activity data...</span>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-600/30">
              {/* Monthly Calendar View */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <h5 className="text-lg font-semibold text-slate-300 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                  Monthly Activity Calendar
                </h5>
                
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-slate-400 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {monthlyData[0]?.chartData.map((day: any, index: number) => {
                    const date = new Date(day.date);
                    const dayOfWeek = date.getDay();
                    const dayNumber = date.getDate();
                    
                    // Find activities present on this day
                    const activitiesPresent = monthlyData.filter(activityData => 
                      activityData.chartData[index]?.hasActivity
                    );
                    
                    return (
                      <div
                        key={index}
                        className="aspect-square p-1 border border-slate-600/30 rounded hover:bg-slate-700/50 transition-colors relative overflow-hidden"
                        title={`${day.date}: ${activitiesPresent.length} activities - ${activitiesPresent.map(a => a.activity).join(', ')}`}
                      >
                        {activitiesPresent.length === 0 && (
                          <div className="w-full h-full bg-slate-700/30 rounded flex items-center justify-center">
                            <div className="text-xs text-slate-300 font-medium">{dayNumber}</div>
                          </div>
                        )}
                        
                        {activitiesPresent.length === 1 && (
                          <div className={`w-full h-full ${getActivityColorClass(activitiesPresent[0].activity)}/80 rounded flex items-center justify-center`}>
                            <div className="text-xs text-white font-medium">{dayNumber}</div>
                          </div>
                        )}
                        
                        {activitiesPresent.length === 2 && (
                          <>
                            <div className={`absolute top-0 left-0 w-1/2 h-full ${getActivityColorClass(activitiesPresent[0].activity)}/80`}></div>
                            <div className={`absolute top-0 right-0 w-1/2 h-full ${getActivityColorClass(activitiesPresent[1].activity)}/80`}></div>
                            <div className="relative z-10 flex items-center justify-center h-full">
                              <div className="text-xs text-white font-medium">{dayNumber}</div>
                            </div>
                          </>
                        )}
                        
                        {activitiesPresent.length > 2 && (
                          <div className="w-full h-full relative">
                            {activitiesPresent.map((activity, activityIndex) => {
                              const sectionWidth = 100 / activitiesPresent.length;
                              const leftPosition = (activityIndex * sectionWidth);
                              return (
                                <div
                                  key={activityIndex}
                                  className={`absolute top-0 h-full ${getActivityColorClass(activity.activity)}/80`}
                                  style={{
                                    width: `${sectionWidth}%`,
                                    left: `${leftPosition}%`
                                  }}
                                />
                              );
                            })}
                            <div className="relative z-10 flex items-center justify-center h-full">
                              <div className="text-xs text-white font-medium">{dayNumber}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 text-xs text-slate-400 text-center mb-4">
                  Each cell is colored based on activities present. Multiple activities split the cell equally.
                </div>
                
                {/* Activity Color Legend */}
                <div className="flex flex-wrap justify-center gap-3 text-xs">
                  {topActivities.map((activity, index) => (
                    <div key={activity.tag} className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getActivityDotColor(activity.tag)}`} />
                      <span className="text-slate-300 capitalize">{activity.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/20">
                  <h6 className="text-green-400 font-semibold mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Positive Impact Activities
                  </h6>
                  <div className="space-y-2">
                    {topActivities.filter(a => a.isHelpful).map(activity => (
                      <div key={activity.tag} className="flex justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="text-green-300 capitalize">{activity.tag}</span>
                          <span className="text-xs text-green-300/70">{activity.presentDays} present • {activity.absentDays} absent</span>
                        </div>
                        <span className="text-green-400 font-medium">+{activity.overallEffect.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/20">
                  <h6 className="text-red-400 font-semibold mb-3 flex items-center">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Negative Impact Activities
                  </h6>
                  <div className="space-y-2">
                    {topActivities.filter(a => !a.isHelpful).map(activity => (
                      <div key={activity.tag} className="flex justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="text-red-300 capitalize">{activity.tag}</span>
                          <span className="text-xs text-red-300/70">{activity.presentDays} present • {activity.absentDays} absent</span>
                        </div>
                        <span className="text-red-400 font-medium">{activity.overallEffect.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
