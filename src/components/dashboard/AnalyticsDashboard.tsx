'use client';

import React from 'react';
import { MoodEntry } from '@prisma/client';
import Link from 'next/link';
import Card from '../ui/Card';
import Button from '../ui/Button';
import MoodChart from '../charts/MoodChart';
import ModernRadarChart from '../charts/ModernRadarChart';
import DSSRadar from './DSSRadar';
import ActivityChart from '../charts/ActivityChart';
import ProgressCircle from '../ui/ProgressCircle';
import { TrendingUp, TrendingDown, Activity, Brain, Heart, Zap, Sparkles, Star, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsDashboardProps {
  data: MoodEntry[];
  dssData?: any;
  dssLoading?: boolean;
}

export default function AnalyticsDashboard({ data, dssData, dssLoading }: AnalyticsDashboardProps) {
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <Card className="p-12 text-center bg-slate-800/40 backdrop-blur-sm border border-blue-500/20">
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
            className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
          >
            No Analytics Yet
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-300 text-lg mb-6"
          >
            Start tracking your mood to see detailed analytics and insights
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/entry/new" className="inline-block">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
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
                className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
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
  
  // Valence trend
  const last7AvgValence = last7Days.length > 0 ? last7Days.reduce((sum, entry) => sum + entry.valence, 0) / last7Days.length : 0;
  const previous7AvgValence = previous7Days.length > 0 ? previous7Days.reduce((sum, entry) => sum + entry.valence, 0) / previous7Days.length : 0;
  const valenceTrend = last7AvgValence - previous7AvgValence;
  
  // Energy trend
  const last7AvgEnergy = last7Days.length > 0 ? last7Days.reduce((sum, entry) => sum + entry.energy, 0) / last7Days.length : 0;
  const previous7AvgEnergy = previous7Days.length > 0 ? previous7Days.reduce((sum, entry) => sum + entry.energy, 0) / previous7Days.length : 0;
  const energyTrend = last7AvgEnergy - previous7AvgEnergy;
  
  // Focus trend
  const last7AvgFocus = last7Days.length > 0 ? last7Days.reduce((sum, entry) => sum + entry.focus, 0) / last7Days.length : 0;
  const previous7AvgFocus = previous7Days.length > 0 ? previous7Days.reduce((sum, entry) => sum + entry.focus, 0) / previous7Days.length : 0;
  const focusTrend = last7AvgFocus - previous7AvgFocus;
  
  // Stress trend (note: for stress, lower is better, so we invert the trend)
  const last7AvgStress = last7Days.length > 0 ? last7Days.reduce((sum, entry) => sum + entry.stress, 0) / last7Days.length : 0;
  const previous7AvgStress = previous7Days.length > 0 ? previous7Days.reduce((sum, entry) => sum + entry.stress, 0) / previous7Days.length : 0;
  const stressTrend = previous7AvgStress - last7AvgStress; // Inverted: lower stress is better


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
        <Card className="p-12 text-center bg-slate-800/40 backdrop-blur-sm border border-blue-500/20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-white mb-4">No Activity Data Yet</h2>
          <p className="text-slate-300 mb-6">Start selecting activities in your mood entries to see analytics here</p>
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
          <Card className="p-6 text-center bg-slate-800/40 backdrop-blur-sm border border-red-500/20 hover:shadow-xl transition-all duration-300">
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
            <div className="text-sm font-medium text-slate-300">Average Valence</div>
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
          <Card className="p-6 text-center bg-slate-800/40 backdrop-blur-sm border border-yellow-500/20 hover:shadow-xl transition-all duration-300">
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
            <div className="text-sm font-medium text-slate-300">Average Energy</div>
            {energyTrend !== 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`text-xs mt-2 flex items-center justify-center ${energyTrend > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {energyTrend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(energyTrend).toFixed(1)} vs last week
              </motion.div>
            )}
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
        >
          <Card className="p-6 text-center bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 hover:shadow-xl transition-all duration-300">
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
            <div className="text-sm font-medium text-slate-300">Average Focus</div>
            {focusTrend !== 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`text-xs mt-2 flex items-center justify-center ${focusTrend > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {focusTrend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(focusTrend).toFixed(1)} vs last week
              </motion.div>
            )}
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
        >
          <Card className="p-6 text-center bg-slate-800/40 backdrop-blur-sm border border-red-500/20 hover:shadow-xl transition-all duration-300">
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
              <Activity className="w-6 h-6 text-red-500 mr-2" />
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent"
              >
                {avgStress.toFixed(1)}
              </motion.span>
            </motion.div>
            <div className="text-sm font-medium text-slate-300">Average Stress</div>
            {stressTrend !== 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`text-xs mt-2 flex items-center justify-center ${stressTrend > 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {stressTrend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(stressTrend).toFixed(1)} vs last week
              </motion.div>
            )}
          </Card>
        </motion.div>
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
          <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-green-500/20 hover:shadow-xl transition-all duration-300">
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
          <Card className="p-6 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 flex items-center"
            >
              <Target className="w-6 h-6 mr-2 text-blue-500" />
              Wellness Radar
            </motion.h3>
            <ModernRadarChart data={data} height={250} />
          </Card>
        </motion.div>
      </motion.div>

      {/* Success Compass */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mb-8"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-purple-500/20 hover:shadow-xl transition-all duration-300">
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center"
            >
              <Target className="w-6 h-6 mr-2 text-purple-500" />
              Success Compass
            </motion.h3>
            <DSSRadar data={dssData} loading={dssLoading} />
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
          <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-orange-500/20 hover:shadow-xl transition-all duration-300">
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
          <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-purple-500/20 hover:shadow-xl transition-all duration-300">
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



    </motion.div>
  );
}
