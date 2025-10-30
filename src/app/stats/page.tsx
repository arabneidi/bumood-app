'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Sparkles, Target } from 'lucide-react';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import TagsNetworkGraph from '@/components/dashboard/TagsNetworkGraph';
import PeriodInsights from '@/components/dashboard/PeriodInsights';
import DSSRadar from '@/components/dashboard/DSSRadar';
import DriversCard from '@/components/dashboard/DriversCard';
import PowerHoursHeatmap from '@/components/charts/PowerHoursHeatmap';
import PerformanceHeatmap from '@/components/charts/PerformanceHeatmap';
import WordCloud from '@/components/dashboard/WordCloud';

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
  const [powerHoursWindow, setPowerHoursWindow] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [performanceWindow, setPerformanceWindow] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // DSS states
  const [dssData, setDssData] = useState<any>(null);
  const [dssLoading, setDssLoading] = useState(true);
  
  // Drivers states
  const [driversData, setDriversData] = useState<any>(null);
  const [driversLoading, setDriversLoading] = useState(true);
  
  // Power Hours states
  const [powerHoursData, setPowerHoursData] = useState<any>(null);
  const [powerHoursLoading, setPowerHoursLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  

  useEffect(() => {
    const perfStart = performance.now();
    setLoading(true);

    // Kick off all requests in parallel; update sections independently as they complete
    (async () => {
      try {
        const moodStart = performance.now();
        fetch('/api/mood-entries')
          .then(async r => {
            if (!r.ok) throw new Error('Failed to fetch mood entries');
            const data = await r.json();
            setMoodEntries(data);
          })
          .catch(err => console.error('Mood entries error:', err));

        const userStart = performance.now();
        fetch('/api/user')
          .then(async r => {
            if (r.ok) setUserInfo(await r.json());
            else if (r.status === 404) setUserInfo(null);
            else throw new Error('Failed to fetch user info');
          })
          .catch(err => console.error('User info error:', err));

        const prefStart = performance.now();
        fetch('/api/learn-connections?userId=dummy-user')
          .then(r => r.ok ? r.json() : null)
          .then(data => data && setUserPreferences(data))
          .catch(err => console.error('Learn connections error:', err));

        const dssStart = performance.now();
        fetch('/api/dss?userId=dummy-user&noCache=true')
          .then(async r => {
            if (r.ok) {
              const data = await r.json();
              if (data.success && data.data && data.data.currentDSS) setDssData(data.data.currentDSS);
            }
          })
          .catch(err => console.error('DSS error:', err))
          .finally(() => setDssLoading(false));

        const driversStart = performance.now();
        fetch('/api/drivers')
          .then(r => r.ok ? r.json() : null)
          .then(data => data && setDriversData(data))
          .catch(err => console.error('Drivers error:', err))
          .finally(() => setDriversLoading(false));
      } finally {
        setLoading(false); // let the page render; sections show skeletons using their own loading flags
        // quiet perf log
      }
    })();
  }, []);

  // Separate effect for power hours window changes
  useEffect(() => {
    const fetchPowerHours = async () => {
      setPowerHoursLoading(true);
      try {
        const powerStart = performance.now();
        const powerHoursResponse = await fetch(`/api/power-hours?userId=dummy-user&window=${powerHoursWindow}`);
        if (powerHoursResponse.ok) {
          const powerHoursData = await powerHoursResponse.json();
          setPowerHoursData(powerHoursData);
        }
      } catch (powerHoursError) {
        console.error('Error fetching power hours data:', powerHoursError);
      } finally {
        setPowerHoursLoading(false);
      }
    };

    fetchPowerHours();
  }, [powerHoursWindow]);

  // Separate effect for performance window changes (decoupled from power hours)
  useEffect(() => {
    (async () => {
      try {
        setPerformanceLoading(true);
        const perfStart = performance.now();
        const perfResponse = await fetch(`/api/performance-hours?userId=dummy-user&window=${performanceWindow}`);
        if (perfResponse.ok) {
          const p = await perfResponse.json();
          setPerformanceData(p);
        }
        console.log(`⏱️ [Stats] Performance hours fetch (${performanceWindow}) took ${(performance.now() - perfStart).toFixed(2)}ms`);
      } catch (e) {
        console.error('Performance hours error:', e);
      } finally {
        setPerformanceLoading(false);
      }
    })();
  }, [performanceWindow]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative">
      {/* Modern Background */}
      <div className="absolute top-24 left-0 right-0 bottom-0 z-0">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.1)_25%,rgba(59,130,246,0.1)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1)_76%,transparent_77%)] bg-[length:50px_50px] animate-pulse"></div>
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
          <motion.div 
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-blue-500/20 p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <AnalyticsDashboard data={moodEntries} dssData={dssData} dssLoading={dssLoading} />
          </motion.div>
        </motion.div>

        {/* Power Hours Heatmap Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-12"
        >
          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 shadow-lg">
            {/* Time Window Selector */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-2 text-3xl">⚡</span>
                Power Hours
              </h2>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-300">Window:</span>
                <div className="flex bg-slate-700/50 backdrop-blur-sm rounded-lg p-1 border border-blue-500/20">
                  {[
                    { value: 'weekly', label: 'Week', icon: '📊' },
                    { value: 'monthly', label: 'Month', icon: '📈' },
                    { value: 'yearly', label: 'Year', icon: '🗓️' }
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => setPowerHoursWindow(option.value as any)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        powerHoursWindow === option.value
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

            <PowerHoursHeatmap 
              data={powerHoursData?.data || []} 
              loading={powerHoursLoading} 
            />
          </div>
        </motion.div>

        {/* Performance (DSS) Heatmap Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-12"
        >
          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-emerald-500/20 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-2 text-3xl">📈</span>
                Performance
              </h2>

              {/* Independent window selector for Performance */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-300">Window:</span>
                <div className="flex bg-slate-700/50 backdrop-blur-sm rounded-lg p-1 border border-emerald-500/20">
                  {[
                    { value: 'weekly', label: 'Weekly', icon: '🗓️' },
                    { value: 'monthly', label: 'Monthly', icon: '📅' },
                    { value: 'yearly', label: 'Yearly', icon: '🗓️' }
                  ].map((option) => (
                    <motion.button
                      key={option.value}
                      onClick={() => setPerformanceWindow(option.value as any)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                        performanceWindow === option.value
                          ? 'bg-emerald-500/30 text-white shadow-lg'
                          : 'text-slate-300 hover:text-white hover:bg-emerald-500/20'
                      }`}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <PerformanceHeatmap
              data={performanceData?.data || []}
              loading={performanceLoading}
            />
          </div>
        </motion.div>


        {/* Activity Drivers Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <DriversCard data={driversData} loading={driversLoading} userInfo={userInfo} />
        </motion.div>

        {/* Period Insights Section */}
        {userInfo?.gender === 'female' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-12"
          >
            <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 shadow-lg">
              <PeriodInsights moodEntries={moodEntries} userInfo={userInfo} />
            </div>
          </motion.div>
        )}

        {/* Network Graph Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
              driversData={driversData}
            />
          </div>
        </motion.div>

        {/* Word Cloud Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-12"
        >
          <WordCloud
            moodEntries={moodEntries}
            userPreferences={userPreferences}
            timeRange={networkTimeRange}
          />
        </motion.div>
      </div>
    </div>
  );
}