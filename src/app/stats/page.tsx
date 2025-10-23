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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Futuristic Background */}
      <div className="absolute inset-0">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(147,51,234,0.1)_25%,rgba(147,51,234,0.1)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1)_76%,transparent_77%)] bg-[length:50px_50px] animate-pulse"></div>
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto relative z-10"
      >
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: [0, -8, 0], opacity: 1 }}
        transition={{ 
          opacity: { duration: 0.6, delay: 0.2 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        className="text-center mb-12 relative overflow-hidden"
      >
        <div className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8">
          {/* Glowing Edge Effect */}
          <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
          
          <motion.h1 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="text-5xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mr-4"
          >
            <BarChart3 className="w-12 h-12 text-blue-400" />
          </motion.div>
          Analytics Dashboard
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="ml-4"
          >
            <TrendingUp className="w-12 h-12 text-purple-400" />
          </motion.div>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl text-slate-300 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mr-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </motion.div>
          Comprehensive insights into your mood patterns and wellness trends
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            className="ml-2"
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </motion.div>
        </motion.p>
        </div>
      </motion.div>

      <AnalyticsDashboard data={moodEntries} />

      {/* Network Graph Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{ 
          opacity: { duration: 0.6, delay: 0.4 },
          y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
        }}
        className="mb-16"
      >
        <div className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8">
          {/* Glowing Edge Effect */}
          <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
          
          <div className="flex items-center justify-between mb-6">
            <motion.h2 
              className="text-2xl font-bold text-white flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span 
                className="mr-2 text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🕸️
              </motion.span>
              Your Life Network
            </motion.h2>
            
            {/* Time Range Selector for Network */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-300">View:</span>
              <div className="flex bg-blue-900/30 backdrop-blur-xl rounded-lg p-1 border border-blue-400/30">
                {[
                  { value: 'daily', label: 'Today', icon: '📅' },
                  { value: 'weekly', label: 'Week', icon: '📊' },
                  { value: 'monthly', label: 'Month', icon: '📈' },
                  { value: 'yearly', label: 'Year', icon: '🗓️' }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setNetworkTimeRange(option.value as any)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                      networkTimeRange === option.value
                        ? 'bg-blue-500/30 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-blue-500/20'
                    }`}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
          
          <p className="text-slate-300 mb-6">
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
          animate={{ opacity: 1, y: [0, -5, 0] }}
          transition={{ 
            opacity: { duration: 0.6, delay: 0.2 },
            y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="mb-16"
        >
          <div className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8">
            {/* Glowing Edge Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
            <PeriodInsights moodEntries={moodEntries} userInfo={userInfo} />
          </div>
        </motion.div>
      )}
      </motion.div>
    </div>
  );
}