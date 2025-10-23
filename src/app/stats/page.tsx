"use client";

import { useState, useEffect } from "react";
import { MoodEntry } from "@prisma/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import TagsNetworkGraph from "@/components/dashboard/TagsNetworkGraph";
import PeriodInsights from "@/components/dashboard/PeriodInsights";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Sparkles } from "lucide-react";

export default function StatsPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkTimeRange, setNetworkTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch mood entries
        const moodResponse = await fetch("/api/mood-entries");
        if (!moodResponse.ok) {
          throw new Error(`HTTP error! status: ${moodResponse.status}`);
        }
        const moodData: MoodEntry[] = await moodResponse.json();
        setMoodEntries(moodData);

        // Fetch user preferences and info
        const userResponse = await fetch("/api/user?userId=dummy-user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserInfo(userData);
          setUserPreferences({
            interests: userData.interests ? JSON.parse(userData.interests) : [],
            favoriteWriters: userData.favoriteWriters ? userData.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
            favoriteMusicians: userData.favoriteMusicians ? userData.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
            favoriteSportsFigures: userData.favoriteSportsFigures ? userData.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            favoriteArtists: userData.favoriteArtists ? userData.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
            favoritePhilosophers: userData.favoritePhilosophers ? userData.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : []
          });
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
        />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-gray-600"
        >
          Loading your analytics...
        </motion.p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-red-600 text-4xl mb-4"
        >
          ⚠️
        </motion.div>
        <p className="text-red-600 text-lg">Error: {error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto"
    >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-12 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-indigo-300 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              style={{
                left: `${10 + i * 8}%`,
                top: `${20 + i * 5}%`,
              }}
            />
          ))}
        </div>

        <motion.h1 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center justify-center"
        >
          <BarChart3 className="w-12 h-12 mr-4 text-indigo-500" />
          Analytics Dashboard
          <TrendingUp className="w-12 h-12 ml-4 text-purple-500" />
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-gray-600 flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
          Comprehensive insights into your mood patterns and wellness trends
          <Sparkles className="w-5 h-5 ml-2 text-yellow-500" />
        </motion.p>
      </motion.div>

      <AnalyticsDashboard data={moodEntries} />

      {/* Network Graph Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="mb-16"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">🕸️</span>
              Your Life Network
            </h2>
            
            {/* Time Range Selector for Network */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">View:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { value: 'daily', label: 'Today', icon: '📅' },
                  { value: 'weekly', label: 'Week', icon: '📊' },
                  { value: 'monthly', label: 'Month', icon: '📈' },
                  { value: 'yearly', label: 'Year', icon: '🗓️' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setNetworkTimeRange(option.value as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      networkTimeRange === option.value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            See how your activities, interests, and favorites connect over time. 
            Thicker lines = more frequent connections. Larger nodes = more activity.
          </p>
          
          <TagsNetworkGraph 
            moodEntries={moodEntries} 
            userPreferences={userPreferences}
            timeRange={networkTimeRange}
          />
        </div>
      </motion.div>

      {/* Period Insights (female only) */}
      {userInfo?.gender === 'female' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-16"
        >
          <PeriodInsights moodEntries={moodEntries} userInfo={userInfo} />
        </motion.div>
      )}
    </motion.div>
  );
}