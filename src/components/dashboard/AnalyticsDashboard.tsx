'use client';

import React from 'react';
import { MoodEntry } from '@prisma/client';
import Link from 'next/link';
import Card from '../ui/Card';
import Button from '../ui/Button';
import MoodChart from '../charts/MoodChart';
import RadarChart from '../charts/RadarChart';
import ActivityChart from '../charts/ActivityChart';
import HeatmapChart from '../charts/HeatmapChart';
import ProgressCircle from '../ui/ProgressCircle';
import { TrendingUp, TrendingDown, Activity, Brain, Heart, Zap, Sparkles, Star, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsDashboardProps {
  data: MoodEntry[];
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <Card className="p-12 text-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl mb-4"
          >
            📊
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4"
          >
            No Analytics Yet
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 text-lg mb-6"
          >
            Start tracking your mood to see detailed analytics and insights
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/entry/new" className="inline-block">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                Create New Entry
              </Button>
            </Link>
          </motion.div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-indigo-300 rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + i * 10}%`,
                }}
              />
            ))}
          </div>
        </Card>
      </motion.div>
    );
  }

  // Calculate insights
  const totalEntries = data.length;
  const avgValence = data.reduce((sum, entry) => sum + entry.valence, 0) / totalEntries;
  const avgEnergy = data.reduce((sum, entry) => sum + entry.energy, 0) / totalEntries;
  const avgFocus = data.reduce((sum, entry) => sum + entry.focus, 0) / totalEntries;
  const avgStress = data.reduce((sum, entry) => sum + entry.stress, 0) / totalEntries;
  const avgSleep = data.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / totalEntries;

  // Calculate trends (last 7 days vs previous 7 days)
  const last7Days = data.slice(0, 7);
  const previous7Days = data.slice(7, 14);
  const last7AvgValence = last7Days.length > 0 ? last7Days.reduce((sum, entry) => sum + entry.valence, 0) / last7Days.length : 0;
  const previous7AvgValence = previous7Days.length > 0 ? previous7Days.reduce((sum, entry) => sum + entry.valence, 0) / previous7Days.length : 0;
  const valenceTrend = last7AvgValence - previous7AvgValence;

  // Calculate life rhythm score
  const lifeRhythmScore = Math.round((avgValence + avgEnergy + avgFocus + (avgSleep / 2)) / 3.5 * 10);

  // Get most common activities
  const allActivities = data.flatMap(entry => {
    // Activities are already parsed by the API
    if (Array.isArray(entry.activities)) {
      return entry.activities;
    }
    // Fallback: if they're still strings (shouldn't happen), parse them
    try {
      return JSON.parse(entry.activities as string || '[]');
    } catch {
      return [];
    }
  });
  const activityCounts = allActivities.reduce((acc, activity) => {
    acc[activity] = (acc[activity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topActivities = Object.entries(activityCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Show empty state if no activities
  if (topActivities.length === 0) {
    return (
      <div className="space-y-8">
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Activity Data Yet</h2>
          <p className="text-gray-600 mb-6">Start selecting activities in your mood entries to see analytics here</p>
          <Link href="/entry/new" className="inline-block">
            <Button>Create New Entry</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Calculate mood patterns
  const moodPatterns = data.reduce((acc, entry) => {
    const hour = new Date(entry.createdAt).getHours();
    const timeOfDay = hour < 6 ? 'Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
    if (!acc[timeOfDay]) acc[timeOfDay] = [];
    acc[timeOfDay].push(entry.valence);
    return acc;
  }, {} as Record<string, number[]>);

  const timeOfDayAverages = Object.entries(moodPatterns).map(([time, moods]) => ({
    time,
    avgMood: moods.reduce((sum, mood) => sum + mood, 0) / moods.length,
    count: moods.length
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Key Metrics Row */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 text-center bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 hover:shadow-xl transition-all duration-300">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center mb-2"
            >
              <Heart className="w-6 h-6 text-red-500 mr-2" />
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent"
              >
                {avgValence.toFixed(1)}
              </motion.span>
            </motion.div>
            <div className="text-sm font-medium text-gray-700">Average Valence</div>
            {valenceTrend !== 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`text-xs mt-2 flex items-center justify-center ${valenceTrend > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {valenceTrend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(valenceTrend).toFixed(1)} vs last week
              </motion.div>
            )}
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <Card className="p-6 text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 hover:shadow-xl transition-all duration-300">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center mb-2"
            >
              <Zap className="w-6 h-6 text-yellow-500 mr-2" />
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent"
              >
                {avgEnergy.toFixed(1)}
              </motion.span>
            </motion.div>
            <div className="text-sm font-medium text-gray-700">Average Energy</div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
        >
          <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-xl transition-all duration-300">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ 
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center mb-2"
            >
              <Brain className="w-6 h-6 text-blue-500 mr-2" />
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"
              >
                {avgFocus.toFixed(1)}
              </motion.span>
            </motion.div>
            <div className="text-sm font-medium text-gray-700">Average Focus</div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
        >
          <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -3, 3, 0]
              }}
              transition={{ 
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center mb-2"
            >
              <Activity className="w-6 h-6 text-purple-500 mr-2" />
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
              >
                {lifeRhythmScore}
              </motion.span>
            </motion.div>
            <div className="text-sm font-medium text-gray-700">Life Rhythm Score</div>
          </Card>
        </motion.div>
      </motion.div>


      {/* Life Rhythm Score Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className="p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 hover:shadow-2xl transition-all duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center md:text-left mb-6 md:mb-0"
            >
              <motion.h2 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
              >
                Life Rhythm Score
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-gray-600 text-lg mb-4"
              >
                Your overall wellbeing based on mood, energy, and calmness patterns
              </motion.p>
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="grid grid-cols-2 gap-4 text-sm"
              >
                <div className="flex justify-between p-2 bg-white/50 rounded-lg">
                  <span className="text-gray-600 font-medium">Stress Level:</span>
                  <span className="font-bold text-red-600">{avgStress.toFixed(1)}/10</span>
                </div>
                <div className="flex justify-between p-2 bg-white/50 rounded-lg">
                  <span className="text-gray-600 font-medium">Sleep Quality:</span>
                  <span className="font-bold text-blue-600">{avgSleep.toFixed(1)}h</span>
                </div>
              </motion.div>
            </motion.div>
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
              className="flex items-center"
            >
              <ProgressCircle 
                value={lifeRhythmScore} 
                size="lg" 
                color="indigo"
                showValue={true}
                label="Score"
              />
            </motion.div>
          </div>
          
          {/* Floating sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-indigo-400 rounded-full"
                animate={{
                  x: [0, 50, 0],
                  y: [0, -30, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + i * 8}%`,
                }}
              />
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-xl transition-all duration-300">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center"
            >
              <TrendingUp className="w-6 h-6 mr-2 text-green-500" />
              Mood Trends
            </motion.h3>
            <MoodChart data={data} type="area" height={250} />
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-xl transition-all duration-300">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 flex items-center"
            >
              <Target className="w-6 h-6 mr-2 text-blue-500" />
              Wellness Radar
            </motion.h3>
            <RadarChart data={data} height={250} />
          </Card>
        </motion.div>
      </motion.div>

      {/* Activity Analysis */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 hover:shadow-xl transition-all duration-300">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-4 flex items-center"
            >
              <Activity className="w-6 h-6 mr-2 text-orange-500" />
              Top Activities
            </motion.h3>
            <ActivityChart data={data} type="bar" height={250} />
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-xl transition-all duration-300">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center"
            >
              <Star className="w-6 h-6 mr-2 text-purple-500" />
              Activity Distribution
            </motion.h3>
            <ActivityChart data={data} type="pie" height={250} />
          </Card>
        </motion.div>
      </motion.div>

      {/* Mood Heatmap */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        whileHover={{ scale: 1.01 }}
      >
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 hover:shadow-xl transition-all duration-300">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center"
          >
            <Sparkles className="w-6 h-6 mr-2 text-indigo-500" />
            Mood Heatmap
          </motion.h3>
          <HeatmapChart data={data} />
        </Card>
      </motion.div>

      {/* Time of Day Analysis */}
      {timeOfDayAverages.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          whileHover={{ scale: 1.01 }}
        >
          <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 hover:shadow-xl transition-all duration-300">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
              className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center"
            >
              <Brain className="w-6 h-6 mr-2 text-cyan-500" />
              Mood by Time of Day
            </motion.h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {timeOfDayAverages.map(({ time, avgMood, count }, index) => (
                <motion.div 
                  key={time} 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.6 + index * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-3 bg-white/50 rounded-lg hover:bg-white/80 transition-all duration-300"
                >
                  <div className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-1">{avgMood.toFixed(1)}</div>
                  <div className="text-sm font-medium text-gray-700">{time}</div>
                  <div className="text-xs text-gray-500">({count} entries)</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        whileHover={{ scale: 1.01 }}
      >
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:shadow-xl transition-all duration-300">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
            className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4 flex items-center"
          >
            <Sparkles className="w-6 h-6 mr-2 text-emerald-500" />
            Insights & Recommendations
          </motion.h3>
          <div className="space-y-4">
            {valenceTrend > 0 && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="flex items-start space-x-3 p-4 bg-green-100 rounded-lg border border-green-200 hover:bg-green-200 transition-all duration-300"
              >
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">Positive Trend</h4>
                  <p className="text-green-700 text-sm">Your mood has improved by {valenceTrend.toFixed(1)} points compared to last week. Keep up the great work!</p>
                </div>
              </motion.div>
            )}
            
            {avgSleep < 7 && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 2 }}
                className="flex items-start space-x-3 p-4 bg-yellow-100 rounded-lg border border-yellow-200 hover:bg-yellow-200 transition-all duration-300"
              >
                <Activity className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Sleep Optimization</h4>
                  <p className="text-yellow-700 text-sm">Your average sleep is {avgSleep.toFixed(1)} hours. Consider improving your sleep routine for better mood and energy.</p>
                </div>
              </motion.div>
            )}

            {topActivities.length > 0 && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 2.2 }}
                className="flex items-start space-x-3 p-4 bg-blue-100 rounded-lg border border-blue-200 hover:bg-blue-200 transition-all duration-300"
              >
                <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">Activity Insights</h4>
                  <p className="text-blue-700 text-sm">Your most common activities are: {topActivities.slice(0, 3).map(([activity]) => activity).join(', ')}. Consider how these activities affect your mood.</p>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
