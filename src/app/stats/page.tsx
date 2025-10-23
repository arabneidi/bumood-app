'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import TagsNetworkGraph from '@/components/dashboard/TagsNetworkGraph';
import PeriodInsights from '@/components/dashboard/PeriodInsights';

interface MoodEntry {
  id: string;
  date: string;
  valence: number;
  energy: number;
  focus: number;
  stress: number;
  sleep: number;
  activities: string[];
  tags: string[];
  notes?: string;
}

interface UserInfo {
  id: string;
  name: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
}

export default function StatsPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [networkTimeRange, setNetworkTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch mood entries
        const moodResponse = await fetch('/api/mood-entries');
        if (!moodResponse.ok) throw new Error('Failed to fetch mood entries');
        const moodData = await moodResponse.json();
        setMoodEntries(moodData);

        // Fetch user info
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) throw new Error('Failed to fetch user info');
        const userData = await userResponse.json();
        setUserInfo(userData);

        // Fetch user preferences for network graph
        const preferencesResponse = await fetch('/api/learn-connections?userId=dummy-user');
        if (preferencesResponse.ok) {
          const preferencesData = await preferencesResponse.json();
          setUserPreferences(preferencesData);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          ⚠️
        </motion.div>
        <p className="text-red-400 text-lg">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      {/* Modern Background */}
      <div className="absolute inset-0">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.05)_25%,rgba(59,130,246,0.05)_26%,transparent_27%,transparent_74%,rgba(147,51,234,0.05)_75%,rgba(147,51,234,0.05)_76%,transparent_77%)] bg-[length:40px_40px]"></div>
        {/* Floating Dots */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="relative bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-8 shadow-xl">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-400 mr-3" />
              Analytics Dashboard
            </h1>
            <p className="text-lg text-slate-300">
              Comprehensive insights into your mood patterns and wellness trends
            </p>
          </div>
        </motion.div>

        {/* Analytics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 shadow-lg">
            <AnalyticsDashboard data={moodEntries} />
          </div>
        </motion.div>

        {/* Network Graph Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-2 text-3xl">🕸️</span>
                Your Life Network
              </h2>

              {/* Time Range Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-300">View:</span>
                <div className="flex bg-slate-700/50 backdrop-blur-sm rounded-lg p-1 border border-blue-500/20">
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

        {/* Period Insights Section */}
        {userInfo?.gender === 'female' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-12"
          >
            <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 shadow-lg">
              <PeriodInsights moodEntries={moodEntries} userInfo={userInfo} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}