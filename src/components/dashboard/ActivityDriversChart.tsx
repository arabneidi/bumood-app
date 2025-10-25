'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Target } from 'lucide-react';

interface ActivityData {
  activity: string;
  effect: number;
  daysWith: number;
  daysWithout: number;
  dssEffect: number;
  mcEffect: number;
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
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);
  const [chartData, setChartData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(false);

  // Get top 5 activities (3 helpful + 2 harmful)
  const topActivities = [
    ...driversData.helpful.slice(0, 3),
    ...driversData.harmful.slice(0, 2)
  ];

  const fetchActivityData = async (activity: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/activity-drivers-chart?activity=${encodeURIComponent(activity)}&userId=dummy-user`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data.chartData || []);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedActivity) {
      fetchActivityData(selectedActivity.activity);
    }
  }, [selectedActivity]);

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

  const getPercentageEffect = (effect: number) => {
    return Math.round(effect * 10);
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

        {/* Top 5 Activities Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-slate-300 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-400" />
            Top 5 Activities by Impact
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topActivities.map((activity, index) => {
              const colors = getActivityColor(activity);
              const percentageEffect = getPercentageEffect(activity.effect);
              
              return (
                <motion.button
                  key={activity.activity}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedActivity(activity)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedActivity?.activity === activity.activity
                      ? `${colors.bg} ${colors.border} ring-2 ring-blue-400/50`
                      : `${colors.bg} ${colors.border} hover:ring-1 hover:ring-blue-400/30`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold capitalize ${colors.text}`}>
                      {activity.activity}
                    </span>
                    <span className={`text-sm font-bold ${colors.accent}`}>
                      {activity.isHelpful ? '+' : ''}{percentageEffect}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {activity.daysWith} days with • {activity.daysWithout} days without
                  </div>
                  {activity.isHelpful ? (
                    <TrendingUp className="w-4 h-4 text-green-400 mt-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400 mt-1" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected Activity Chart */}
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/40 rounded-xl p-6 border border-slate-600/30"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-bold text-slate-200 capitalize">
                  {selectedActivity.activity} Impact
                </h4>
                <p className="text-sm text-slate-400">
                  Last 14 days • {selectedActivity.daysWith} days with activity
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  selectedActivity.isHelpful ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedActivity.isHelpful ? '+' : ''}{getPercentageEffect(selectedActivity.effect)}%
                </div>
                <div className="text-xs text-slate-400">Overall Impact</div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-slate-400">Loading chart data...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* DSS & MC Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* DSS Chart */}
                  <div className="bg-slate-800/30 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-blue-400 mb-4">Daily Success Score (DSS)</h5>
                    <div className="space-y-2">
                      {chartData.slice(-14).map((day, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-16 text-xs text-slate-400">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1 mx-3">
                            <div className="bg-slate-700 rounded-full h-2 relative">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  day.hasActivity 
                                    ? (selectedActivity.isHelpful ? 'bg-green-500' : 'bg-red-500')
                                    : 'bg-slate-600'
                                }`}
                                style={{ width: `${Math.max(10, Math.min(100, (day.dss / 10) * 100))}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm font-medium text-slate-300">
                            {day.dss.toFixed(1)}
                          </div>
                          <div className="w-8 text-center">
                            {day.hasActivity ? (
                              <div className={`w-3 h-3 rounded-full ${
                                selectedActivity.isHelpful ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-slate-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MC Chart */}
                  <div className="bg-slate-800/30 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-purple-400 mb-4">Mood Composite (MC)</h5>
                    <div className="space-y-2">
                      {chartData.slice(-14).map((day, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-16 text-xs text-slate-400">
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex-1 mx-3">
                            <div className="bg-slate-700 rounded-full h-2 relative">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  day.hasActivity 
                                    ? (selectedActivity.isHelpful ? 'bg-green-500' : 'bg-red-500')
                                    : 'bg-slate-600'
                                }`}
                                style={{ width: `${Math.max(10, Math.min(100, (day.mc / 10) * 100))}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm font-medium text-slate-300">
                            {day.mc.toFixed(1)}
                          </div>
                          <div className="w-8 text-center">
                            {day.hasActivity ? (
                              <div className={`w-3 h-3 rounded-full ${
                                selectedActivity.isHelpful ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-slate-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      selectedActivity.isHelpful ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-slate-300">Days with {selectedActivity.activity}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-600 mr-2" />
                    <span className="text-slate-300">Days without {selectedActivity.activity}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
