'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Target, Brain, Sparkles } from 'lucide-react';

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

interface ActivityDriversChartProps {
  driversData: {
    helpful: ActivityData[];
    harmful: ActivityData[];
  };
  userInfo?: any;
  aiInsights?: string;
  showAiInsights?: boolean;
  aiLoading?: boolean;
  isCached?: boolean;
  cacheTimestamp?: string;
  onGetAiInsights?: () => void;
}

export default function ActivityDriversChart({ 
  driversData, 
  userInfo, 
  aiInsights, 
  showAiInsights, 
  aiLoading, 
  isCached, 
  cacheTimestamp, 
  onGetAiInsights 
}: ActivityDriversChartProps) {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if driversData exists and has data
  if (!driversData || !driversData.helpful || !driversData.harmful || 
      (driversData.helpful.length === 0 && driversData.harmful.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6">
          <div className="text-center text-slate-400">
            <p>No activity drivers data available</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Get top 5 activities by absolute effect size
  const allActivities = [...driversData.helpful, ...driversData.harmful];
  const sortedActivities = allActivities.sort((a, b) => {
    const aEffect = Math.abs(Number(a.overallEffect));
    const bEffect = Math.abs(Number(b.overallEffect));
    return bEffect - aEffect; // Descending order by absolute effect
  });
  const topActivities = sortedActivities.slice(0, 5);
  
  // Debug sorting
  console.log('🔍 Activity Sorting Debug:', {
    allActivities: allActivities.map(a => ({ tag: a.tag, effect: a.overallEffect, abs: Math.abs(a.overallEffect) })),
    sortedActivities: sortedActivities.map(a => ({ tag: a.tag, effect: a.overallEffect, abs: Math.abs(a.overallEffect) })),
    topActivities: topActivities.map(a => ({ tag: a.tag, effect: a.overallEffect, abs: Math.abs(a.overallEffect) }))
  });

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
      const filteredResults = results.filter(Boolean);
      console.log('📊 Monthly data fetched:', {
        topActivities: topActivities.map(a => a.tag),
        fetchedActivities: filteredResults.map(r => r.activity),
        results: filteredResults
      });
      setMonthlyData(filteredResults);
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
  }, [driversData]);

  // Fixed 5 colorful colors for activities
  const fixedColors = [
    'bg-blue-500',    // Blue
    'bg-purple-500',  // Purple
    'bg-pink-500',    // Pink
    'bg-orange-500',  // Orange
    'bg-green-500'    // Green
  ];

  // Map each of the top 5 activities to a unique color
  const activityColorMap = new Map<string, string>();
  topActivities.forEach((activity, index) => {
    activityColorMap.set(activity.tag.toLowerCase(), fixedColors[index % fixedColors.length]);
  });

  const getActivityColor = (activity: string) => {
    // First check if it's one of the top 5 activities (get unique color)
    const activityLower = activity.toLowerCase();
    if (activityColorMap.has(activityLower)) {
      return activityColorMap.get(activityLower)!;
    }
    // For any other activities, use hash function
    let hash = 0;
    for (let i = 0; i < activityLower.length; i++) {
      hash = ((hash << 5) - hash) + activityLower.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const colorIndex = Math.abs(hash) % fixedColors.length;
    return fixedColors[colorIndex];
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
          <Target className="w-6 h-6 text-orange-500 mr-3" />
          <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Activity Drivers
          </h3>
        </motion.div>

        {/* Simple Activity List */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-slate-300 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            Top 5 Activities by Impact
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topActivities.map((activity, index) => (
              <motion.div
                key={activity.tag}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-lg border ${
                  activity.isHelpful 
                    ? 'bg-green-900/20 border-green-500/30' 
                    : 'bg-red-900/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getActivityColor(activity.tag)}`}></div>
                    <span className="font-semibold text-slate-200 capitalize">{activity.tag}</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    activity.isHelpful ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {activity.isHelpful ? '+' : ''}{activity.overallEffect.toFixed(3)}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Present: {activity.presentDays} days • Absent: {activity.absentDays} days
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Simple Calendar */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-slate-400">Loading activity data...</span>
          </div>
              ) : (
                <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-600/30">
            <h5 className="text-lg font-semibold text-slate-300 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-400" />
              Monthly Activity Calendar
            </h5>
            
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-xs text-slate-400 text-center py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthlyData[0]?.chartData.map((day: any, index: number) => {
                // Parse date string directly to avoid timezone issues
                const dayNumber = parseInt(day.date.split('-')[2]);
                
                // Find activities present on this day
                const activitiesPresent = monthlyData.filter(activityData => 
                  activityData.chartData && activityData.chartData[index]?.hasActivity
                );
                
                // Simple debug for cells with activities
                if (activitiesPresent.length > 0) {
                  console.log(`Day ${dayNumber}: ${activitiesPresent.length} activities - ${activitiesPresent.map(a => a.activity).join(', ')}`);
                }
                
                return (
                  <div
                    key={index}
                    className="aspect-square p-1 border-2 border-purple-500/50 rounded-lg hover:bg-slate-700/50 hover:border-purple-400/70 transition-all duration-300 relative overflow-hidden"
                    style={{
                      boxShadow: activitiesPresent.length > 0 
                        ? `0 0 20px ${activitiesPresent.map(a => {
                            // Fixed 5 colorful glow colors matching the background colors
                            const glowColorMap: { [key: string]: string } = {
                              'bg-blue-500': 'rgba(59, 130, 246, 0.4)',
                              'bg-purple-500': 'rgba(168, 85, 247, 0.4)',
                              'bg-pink-500': 'rgba(236, 72, 153, 0.4)',
                              'bg-orange-500': 'rgba(249, 115, 22, 0.4)',
                              'bg-green-500': 'rgba(34, 197, 94, 0.4)'
                            };
                            const bgColor = getActivityColor(a.activity);
                            return glowColorMap[bgColor] || 'rgba(107, 114, 128, 0.3)';
                          }).join(', ')}, inset 0 0 0 1px rgba(147, 51, 234, 0.3)`
                        : '0 0 15px rgba(147, 51, 234, 0.2), inset 0 0 0 1px rgba(147, 51, 234, 0.3)'
                    }}
                    title={`${day.date}: ${activitiesPresent.length} activities - ${activitiesPresent.map(a => a.activity).join(', ')}`}
                  >
                    {activitiesPresent.length === 0 && (
                      <div className="w-full h-full rounded flex items-center justify-center">
                        <div className="text-xs text-slate-300 font-medium">{dayNumber}</div>
                      </div>
                    )}
                    
                    {activitiesPresent.length === 1 && (
                      <div className={`w-full h-full ${getActivityColor(activitiesPresent[0].activity)} rounded flex items-center justify-center`} style={{ opacity: 0.7 }}>
                        <div className="text-xs text-white font-medium">{dayNumber}</div>
                      </div>
                    )}
                    
                    {activitiesPresent.length === 2 && (
                      <>
                        <div className={`absolute top-0 left-0 w-1/2 h-full ${getActivityColor(activitiesPresent[0].activity)}`} style={{ opacity: 0.7 }}></div>
                        <div className={`absolute top-0 right-0 w-1/2 h-full ${getActivityColor(activitiesPresent[1].activity)}`} style={{ opacity: 0.7 }}></div>
                        <div className="relative z-10 flex items-center justify-center h-full">
                          <div className="text-xs text-white font-medium">{dayNumber}</div>
                        </div>
                      </>
                    )}
                    
                    {activitiesPresent.length >= 3 && (
                      <div className="w-full h-full relative">
                        {activitiesPresent.map((activity, activityIndex) => {
                          const sectionWidth = 100 / activitiesPresent.length;
                          const leftPosition = (activityIndex * sectionWidth);
                          return (
                            <div
                              key={activityIndex}
                              className={`absolute top-0 h-full ${getActivityColor(activity.activity)}`}
                              style={{
                                width: `${sectionWidth}%`,
                                left: `${leftPosition}%`,
                                opacity: 0.7
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
              Each cell shows activities present on that day
            </div>
            
            {/* Activity Color Legend */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
              {topActivities.map((activity, index) => (
                <motion.div
                  key={activity.tag}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-slate-600/20 hover:border-slate-500/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <div className={`w-2 h-2 rounded-full shadow-lg ${getActivityColor(activity.tag)}`}></div>
                    <span className="text-xs font-bold text-white capitalize">{activity.tag}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 pt-6 border-t border-slate-600/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Brain className="w-5 h-5 text-purple-500 mr-2" />
              <h4 className="text-lg font-semibold text-purple-400">AI Psychological Analysis</h4>
            </div>
            {onGetAiInsights && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(147, 51, 234, 0.4)",
                    "0 0 30px rgba(147, 51, 234, 0.6)",
                    "0 0 40px rgba(147, 51, 234, 0.8)",
                    "0 0 30px rgba(147, 51, 234, 0.6)",
                    "0 0 20px rgba(147, 51, 234, 0.4)"
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                onClick={onGetAiInsights}
                disabled={aiLoading}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-300 mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                    </motion.div>
                    {isCached ? 'Refresh AI Analysis' : 'Get AI Analysis'}
                  </div>
                )}
              </motion.button>
            )}
          </div>

          {showAiInsights && aiInsights && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20"
            >
              {/* Cache Status Indicator */}
              {isCached && (
                <div className="flex items-center mb-3 text-xs text-purple-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Cached analysis • Last updated: {cacheTimestamp ? new Date(cacheTimestamp).toISOString().split('T')[0] : 'Unknown'}</span>
                </div>
              )}
              
              <div 
                className="prose prose-sm max-w-none text-slate-300 prose-headings:text-purple-400 prose-strong:text-white prose-ul:text-slate-300 prose-li:text-slate-300 text-justify"
                dangerouslySetInnerHTML={{ __html: aiInsights }}
              />
            </motion.div>
          )}

          <p className="text-xs text-slate-400 text-center mt-4">
            Analysis based on last 4 weeks • Updated {new Date().toISOString().split('T')[0]}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}