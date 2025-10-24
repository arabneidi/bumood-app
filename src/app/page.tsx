"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressCircle from "@/components/ui/ProgressCircle";
import AchievementBadge from "@/components/ui/AchievementBadge";
import AISuggestions from "@/components/dashboard/AISuggestions";
import { CongratulationModal, useCongratulations } from "@/components/ui/CongratulationModal";
import { MoodEntry } from "@prisma/client";
import { generateAIMotivationalQuote } from "@/lib/inspirationalQuotes";

export default function Home() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [inspirationalQuote, setInspirationalQuote] = useState("");
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dssScore, setDssScore] = useState<number | null>(null);
  const [dssLoading, setDssLoading] = useState(true);
  const [dssData, setDssData] = useState<any>(null);
  const [moodComposite, setMoodComposite] = useState<number | null>(null);
  const [mcLoading, setMcLoading] = useState(true);
  const [currentTimeBucket, setCurrentTimeBucket] = useState<string>('');

  // Congratulations system
  const {
    congratulations,
    currentCongratulation,
    isModalOpen,
    loading: congratulationsLoading,
    markAsRead,
    closeModal
  } = useCongratulations('dummy-user');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all data in parallel
        const [moodEntriesRes, achievementsRes, userRes, dssRes, mcRes] = await Promise.all([
          fetch("/api/mood-entries"),
          fetch("/api/achievements"),
          fetch("/api/user?userId=dummy-user"),
          fetch(`/api/dss?userId=dummy-user&date=${new Date().toISOString().split('T')[0]}`),
          fetch("/api/mood-composite?userId=dummy-user")
        ]);

        // Process mood entries
        if (moodEntriesRes.ok) {
          const data = await moodEntriesRes.json();
          setMoodEntries(data);
        }

        // Process achievements
        if (achievementsRes.ok) {
          const data = await achievementsRes.json();
          setAchievements(data);
          setAchievementsLoading(false);
        }

        // Process user data
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserPreferences({
            interests: userData.interests ? JSON.parse(userData.interests) : [],
            favoriteWriters: userData.favoriteWriters ? userData.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
            favoriteMusicians: userData.favoriteMusicians ? userData.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
            favoriteSportsFigures: userData.favoriteSportsFigures ? userData.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            favoriteArtists: userData.favoriteArtists ? userData.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
            favoritePhilosophers: userData.favoritePhilosophers ? userData.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : []
          });
        }

        // Process DSS data
        if (dssRes.ok) {
          const data = await dssRes.json();
          if (data.success && data.data) {
            setDssScore(data.data.dssScore);
            setDssData(data.data);
          }
          setDssLoading(false);
        }

        // Process mood composite
        if (mcRes.ok) {
          const data = await mcRes.json();
          if (data.success && data.data) {
            setMoodComposite(data.data.trends.moodComposites[data.data.trends.moodComposites.length - 1] || null);
            setCurrentTimeBucket(data.data.currentTimeBucket);
          }
          setMcLoading(false);
        }

        // Generate personalized quote
        try {
          const quoteRes = await fetch(`/api/personalized-quotes?userId=dummy-user`);
          if (quoteRes.ok) {
            const quoteData = await quoteRes.json();
            setInspirationalQuote(quoteData.quote);
            console.log('✅ Personalized quote loaded:', quoteData.quote);
          } else {
            console.log('⚠️ Personalized quote API failed, using fallback');
            setInspirationalQuote("Your mental wellness journey starts here.");
          }
        } catch (error) {
          console.error('Error generating personalized quote:', error);
          setInspirationalQuote("Your mental wellness journey starts here.");
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setAchievementsLoading(false);
        setDssLoading(false);
        setMcLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter entries based on time range
  const getFilteredEntries = () => {
    const now = new Date();
    const filtered = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      
      if (timeRange === 'daily') {
        // Today only - compare dates without time using UTC
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const entryStart = new Date(entryDate.getUTCFullYear(), entryDate.getUTCMonth(), entryDate.getUTCDate());
        
        console.log('🔍 Date comparison (UTC):', {
          entryDate: entryDate.toISOString(),
          entryStart: entryStart.toISOString(),
          todayStart: todayStart.toISOString(),
          match: entryStart.getTime() === todayStart.getTime()
        });
        
        return entryStart.getTime() === todayStart.getTime();
      } else if (timeRange === 'weekly') {
        // Last 7 days
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return entryDate >= weekAgo;
      } else {
        // Last 30 days
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return entryDate >= monthAgo;
      }
    });
    
    console.log(`📊 Time range: ${timeRange}, Filtered entries: ${filtered.length} of ${moodEntries.length}`);
    return filtered;
  };

  const filteredEntries = getFilteredEntries();
  const totalEntries = filteredEntries.length;
  
  // MOOD METRICS: Use AVERAGE of filtered entries
  const averageValence = totalEntries > 0 ? (filteredEntries.reduce((sum, entry) => sum + entry.valence, 0) / totalEntries) : 0;
  const averageEnergy = totalEntries > 0 ? (filteredEntries.reduce((sum, entry) => sum + entry.energy, 0) / totalEntries) : 0;
  const averageFocus = totalEntries > 0 ? (filteredEntries.reduce((sum, entry) => sum + entry.focus, 0) / totalEntries) : 0;
  const averageStress = totalEntries > 0 ? (filteredEntries.reduce((sum, entry) => sum + entry.stress, 0) / totalEntries) : 0;
  // Use DSS score as primary display score
  const displayScore = dssScore !== null && dssScore !== undefined ? dssScore : 0;

  // CUMULATIVE METRICS: Sum for the time period (for daily totals)
  const totalWater = filteredEntries.reduce((sum, entry) => sum + (entry.waterIntake || 0), 0);
  const totalCaffeine = filteredEntries.reduce((sum, entry) => sum + (entry.caffeine || 0), 0);
  const totalMeals = filteredEntries.reduce((sum, entry) => sum + (entry.mealsEaten || 0), 0);
  
  const recentEntry = moodEntries[0];

  // Mood coloring functions (same as calendar)
  const getMoodColor = (mood: MoodEntry) => {
    // Use DSS score for coloring (DSS ranges from -3 to +3 typically)
    const score = dssScore !== null && dssScore !== undefined ? dssScore : 0;
    if (score >= 1) return "bg-gradient-to-br from-green-400 to-emerald-500";  // Excellent
    if (score >= 0) return "bg-gradient-to-br from-blue-400 to-cyan-500";      // Good
    if (score >= -1) return "bg-gradient-to-br from-yellow-400 to-orange-400"; // Fair
    return "bg-gradient-to-br from-red-500 to-pink-600";  // Needs Improvement
  };

  const getMoodEmoji = (mood: MoodEntry) => {
    // Use DSS score for emoji (DSS ranges from -3 to +3 typically)
    const score = dssScore !== null && dssScore !== undefined ? dssScore : 0;
    if (score >= 1) return "😍";  // Excellent
    if (score >= 0) return "😊";  // Good
    if (score >= -1) return "🙂"; // Fair
    return "😟";  // Needs Improvement
  };

  const getMoodScore = (mood: MoodEntry) => {
    // Use DSS score for main display
    return dssScore !== null && dssScore !== undefined ? Math.round(dssScore * 10) : 0;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      {/* Futuristic Background */}
      <div className="absolute inset-0">
        {/* Animated Grid Pattern */}
        <div className="absolute top-24 left-0 right-0 bottom-0 z-0 bg-[linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.1)_25%,rgba(59,130,246,0.1)_26%,transparent_27%,transparent_74%,rgba(147,51,234,0.1)_75%,rgba(147,51,234,0.1)_76%,transparent_77%)] bg-[length:50px_50px] animate-pulse"></div>
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

      {/* Hero Section - Floating Rounded Rectangle */}
      <div className="relative overflow-hidden py-12">

        {/* Quote Box - Rounded Rectangle with Float */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative"
          >
            
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent opacity-30"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
              
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-3xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-relaxed relative z-10"
            >
              {inspirationalQuote || "Your mental wellness journey starts here."}
            </motion.h2>
          </motion.div>
        </motion.div>
      </div>

      {/* Dashboard Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-slate-300">Loading your dashboard...</p>
            <p className="mt-2 text-xs text-slate-400">Loading state: {loading.toString()}</p>
          </div>
        ) : (
          <>
            {/* Today Rhythm Score - Heartbeat Pulse Animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.2 },
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-16"
            >
              <div className="relative">
                {/* Heartbeat SVG Animation */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full opacity-20" viewBox="0 0 1000 200">
                    <motion.path
                      d="M0,100 L100,100 L120,100 L130,80 L140,120 L150,60 L160,140 L170,100 L200,100 L300,100 L320,100 L330,80 L340,120 L350,60 L360,140 L370,100 L400,100 L500,100 L520,100 L530,80 L540,120 L550,60 L560,140 L570,100 L600,100 L700,100 L720,100 L730,80 L740,120 L750,60 L760,140 L770,100 L800,100 L900,100 L920,100 L930,80 L940,120 L950,60 L960,140 L970,100 L1000,100"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-blue-400"
                      initial={{ pathLength: 0, pathOffset: 0 }}
                      animate={{
                        pathLength: [0, 1, 0],
                        pathOffset: [0, 0.2, 0.4],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </svg>
                </div>


                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-10">
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="text-center md:text-left flex-1"
                  >
                    <motion.h2 
                      animate={{ 
                        scale: [1, 1.05, 1],
                        x: [0, 3, 0]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3 drop-shadow-lg"
                    >
                      📊 Daily Success Score
                    </motion.h2>
                  </motion.div>
                  
                  {/* Animated Score Display */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0, type: "spring", stiffness: 150 }}
                    className="flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.15, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-2xl">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: 1, 
                            repeat: Infinity
                          }}
                          className="text-center"
                        >
                          <div className="text-6xl font-bold text-white drop-shadow-lg">
                            {dssLoading ? (
                              <div className="animate-pulse">...</div>
                            ) : (
                              displayScore !== null && displayScore !== undefined 
                                ? displayScore.toFixed(2) 
                                : 'N/A'
                            )}
                          </div>
                          <div className="text-white text-sm font-semibold">
                            Score
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Pulse Rings */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full border-4 border-blue-400"
                          animate={{
                            scale: [1, 1.5, 2],
                            opacity: [0.6, 0.3, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.6
                          }}
                        />
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Achievements Section - Goals Page Style */}
            {achievementsLoading ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.2 },
                  y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mb-16"
              >
                <div className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8">
                  {/* Glowing Edge Effect */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
                  
                  <div className="text-center py-12 relative z-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <div className="rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto"></div>
                    </motion.div>
                    <p className="mt-4 text-slate-300 text-lg">Loading achievements...</p>
                  </div>
                </div>
              </motion.div>
            ) : achievements.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.2 },
                  y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mb-16"
              >
                <div className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8">
                  {/* Glowing Edge Effect */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
                  
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent opacity-20"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  <div className="mb-6 relative z-10 text-center">
                    <motion.h2 
                      className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.span
                        className="mr-3 text-4xl"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🏅
                      </motion.span>
                      Recent Achievements
                    </motion.h2>
                  </div>
                  
                  {/* Achievements Grid */}
                  <div className="mb-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {achievements.filter(a => a.unlockedAt).slice(-4).map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 30, scale: 0.5, rotate: -10 }}
                          animate={{ 
                            opacity: 1, 
                            y: [0, -8, 0], 
                            scale: 1, 
                            rotate: 0 
                          }}
                          transition={{ 
                            delay: 0.1 + index * 0.1, 
                            duration: 0.6,
                            type: "spring",
                            stiffness: 150,
                            y: { duration: 3.5 + index * 0.3, repeat: Infinity, ease: "easeInOut" }
                          }}
                          whileHover={{ 
                            scale: 1.15, 
                            rotate: 8,
                            y: -20,
                            transition: { duration: 0.3, type: "spring" }
                          }}
                          className="relative group"
                        >
                          {/* Colorful Transparent Glass - Different Colors for Each Achievement */}
                          <div className={`relative rounded-2xl border-2 backdrop-blur-xl p-6 overflow-hidden shadow-lg ${
                            index === 0 ? 'border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-cyan-500/20' :
                            index === 1 ? 'border-orange-400/60 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-orange-500/20' :
                            index === 2 ? 'border-yellow-400/60 bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-yellow-500/20' :
                            index === 3 ? 'border-pink-400/60 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-pink-500/20' :
                            'border-blue-400/60 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20'
                          }`}>
                            {/* Glowing Edge Effect with Different Colors */}
                            <div className={`absolute inset-0 rounded-2xl border shadow-lg animate-pulse ${
                              index === 0 ? 'border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.3)]' :
                              index === 1 ? 'border-orange-400/30 shadow-[0_0_20px_rgba(251,146,60,0.3)]' :
                              index === 2 ? 'border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.3)]' :
                              index === 3 ? 'border-pink-400/30 shadow-[0_0_20px_rgba(244,114,182,0.3)]' :
                              'border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                            }`}></div>
                            
                            <div className="text-center relative z-10">
                              {/* Icon */}
                              <div className="text-5xl mb-4">
                                {achievement.icon}
                              </div>
                              
                              {/* Title with Different Color Gradients */}
                              <h3 className={`text-xl font-bold bg-clip-text text-transparent mb-2 ${
                                index === 0 ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400' :
                                index === 1 ? 'bg-gradient-to-r from-orange-400 via-red-400 to-orange-400' :
                                index === 2 ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400' :
                                index === 3 ? 'bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400' :
                                'bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400'
                              }`}>
                                {achievement.title}
                              </h3>
                              
                              {/* Description */}
                              <p className="text-sm text-slate-200 mb-3">
                                {achievement.description}
                              </p>
                              
                              {/* Stars */}
                              <div className="flex items-center justify-center space-x-1">
                                {Array.from({ length: 3 }, (_, i) => (
                                  <span
                                    key={i}
                                    className={`text-sm ${i < achievement.stars ? 'text-yellow-300' : 'text-slate-400'}`}
                                  >
                                    ⭐
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Locked Badges Section */}
                  {achievements.filter(a => !a.unlockedAt).length > 0 && (
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold text-slate-400 mb-4 flex items-center">
                        <span className="mr-2">🏆</span>
                        <span className="mr-2">🔒</span>
                        Locked Badges
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {achievements.filter(a => !a.unlockedAt).slice(0, showAllBadges ? undefined : 4).map((achievement, index) => (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 30, scale: 0.5, rotate: -10 }}
                            animate={{ 
                              opacity: 0.6, 
                              y: [0, -4, 0], 
                              scale: 1, 
                              rotate: 0 
                            }}
                            transition={{ 
                              delay: 0.1 + index * 0.1, 
                              duration: 0.6,
                              type: "spring",
                              stiffness: 150,
                              y: { duration: 4 + index * 0.3, repeat: Infinity, ease: "easeInOut" }
                            }}
                            whileHover={{ 
                              scale: 1.05, 
                              rotate: 4,
                              y: -10,
                              transition: { duration: 0.3, type: "spring" }
                            }}
                            className="relative group"
                          >
                            {/* Transparent Glass for Locked Badges - Modern Muted Style */}
                            <div className="relative rounded-2xl border border-slate-500/30 bg-gradient-to-br from-slate-500/10 via-slate-600/10 to-slate-700/10 backdrop-blur-xl p-6 overflow-hidden grayscale shadow-lg">
                              {/* Subtle Edge Effect */}
                              <div className="absolute inset-0 rounded-2xl border border-slate-400/20 shadow-[0_0_10px_rgba(148,163,184,0.2)]"></div>
                              
                              <div className="text-center relative z-10">
                                {/* Icon */}
                                <div className="text-5xl mb-4 opacity-60">
                                  {achievement.icon}
                                </div>
                                
                                {/* Title in Muted Blue-Purple */}
                                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 bg-clip-text text-transparent mb-2">
                                  {achievement.title}
                                </h3>
                                
                                {/* Description */}
                                <p className="text-sm text-slate-400 mb-3">
                                  {achievement.description}
                                </p>
                                
                                {/* Stars */}
                                <div className="flex items-center justify-center space-x-1 mb-3">
                                  {Array.from({ length: 3 }, (_, i) => (
                                    <span
                                      key={i}
                                      className="text-sm text-slate-500"
                                    >
                                      ⭐
                                    </span>
                                  ))}
                                </div>
                                
                                {/* Locked Status */}
                                <div className="flex items-center justify-center bg-gradient-to-r from-slate-500 to-slate-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                                  🔒 Locked
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}


            {/* Time Range Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -4, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.35 },
                y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-8 flex justify-center"
            >
              <div className="relative bg-blue-900/20 backdrop-blur-xl rounded-full shadow-2xl border border-blue-400/30 p-1">
                {/* Glowing Edge Effect */}
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/50 shadow-[0_0_20px_rgba(147,51,234,0.3)] animate-pulse"></div>
                
                {[
                  { value: 'daily', label: 'Today', icon: '📅' },
                  { value: 'weekly', label: 'Week', icon: '📊' },
                  { value: 'monthly', label: 'Month', icon: '📈' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as any)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 relative z-10 ${
                      timeRange === option.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                        : 'text-slate-300 hover:text-white hover:bg-blue-500/20'
                    }`}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Quick Stats - Floating Rounded Rectangles */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.4, type: "spring" },
                y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { value: averageStress.toFixed(1), label: `Avg Stress (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-red-500 to-orange-500", icon: "😰", delay: 0.1 },
                  { value: averageValence.toFixed(1), label: `Avg Valence (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-green-500 to-emerald-500", icon: "😊", delay: 0.2 },
                  { value: averageEnergy.toFixed(1), label: `Avg Energy (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-yellow-500 to-amber-500", icon: "⚡", delay: 0.3 },
                  { value: averageFocus.toFixed(1), label: `Avg Focus (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-blue-500 to-purple-500", icon: "🎯", delay: 0.4 }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
                    transition={{ 
                      opacity: { delay: stat.delay, duration: 0.6, type: "spring", stiffness: 120 },
                      y: { duration: 3.5 + index * 0.3, repeat: Infinity, ease: "easeInOut" },
                      scale: { delay: stat.delay, duration: 0.6, type: "spring", stiffness: 120 }
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -10,
                      transition: { duration: 0.3 }
                    }}
                    className="relative group"
                  >
                    <div className="relative bg-slate-800/40 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-500/20 p-8 overflow-hidden">
                      {/* Glowing Edge Effect */}
                      <div className="absolute inset-0 rounded-2xl border-2 border-purple-400/30 shadow-[0_0_20px_rgba(147,51,234,0.2)] animate-pulse"></div>
                      
                      {/* Shimmer Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent opacity-20"
                        animate={{
                          x: ['-100%', '200%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5,
                          ease: "linear"
                        }}
                      />
                      
                      {/* Icon */}
                      <motion.div 
                        className="text-5xl mb-3 text-center relative z-10"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          delay: index * 0.2
                        }}
                      >
                        {stat.icon}
                      </motion.div>
                      
                      {/* Value */}
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: stat.delay + 0.3, type: "spring", stiffness: 200 }}
                        className="text-5xl font-bold text-white mb-2 text-center drop-shadow-lg relative z-10"
                      >
                        {stat.value}
                      </motion.div>
                      
                      {/* Label */}
                      <div className="text-slate-300 text-center font-semibold text-lg relative z-10">
                        {stat.label}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Today's Entries Section */}
            {(() => {
              console.log('🔍 Today Entries Check:', { 
                timeRange, 
                filteredCount: filteredEntries.length,
                totalCount: moodEntries.length,
                shouldShow: timeRange === 'daily' && filteredEntries.length > 0 
              });
              return timeRange === 'daily' && filteredEntries.length > 0;
            })() && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: [0, -5, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.45, type: "spring" },
                  y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mb-16"
              >
                <div className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8">
                  {/* Glowing Edge Effect */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <span className="mr-2">📝</span>
                      Today's Entries ({filteredEntries.length})
                    </h2>
                    <button
                      onClick={() => setShowAllEntries(v => !v)}
                      className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow hover:from-blue-600 hover:to-purple-600"
                    >
                      {showAllEntries ? 'Show Last 4' : 'Show All'}
                    </button>
                  </div>
                
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {(showAllEntries ? filteredEntries : filteredEntries.slice(0, 4)).map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-sm font-semibold text-slate-400">
                            {new Date(entry.createdAt).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </span>
                          {entry.onPeriod && <span className="text-xl">🩸</span>}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-2 bg-green-900/30 rounded-lg border border-green-500/20">
                            <div className="text-2xl font-bold text-green-400">{entry.valence}</div>
                            <div className="text-xs text-slate-300">😊 Happy</div>
                          </div>
                          <div className="text-center p-2 bg-orange-900/30 rounded-lg border border-orange-500/20">
                            <div className="text-2xl font-bold text-orange-400">{entry.energy}</div>
                            <div className="text-xs text-slate-300">⚡ Energy</div>
                          </div>
                          <div className="text-center p-2 bg-purple-900/30 rounded-lg border border-purple-500/20">
                            <div className="text-2xl font-bold text-purple-400">{entry.focus}</div>
                            <div className="text-xs text-slate-300">🎯 Focus</div>
                          </div>
                          <div className="text-center p-2 bg-red-900/30 rounded-lg border border-red-500/20">
                            <div className="text-2xl font-bold text-red-400">{entry.stress}</div>
                            <div className="text-xs text-slate-300">😰 Stress</div>
                          </div>
                        </div>
                        
                        {/* Today Rhythm Score Display */}
                        <div className="mb-4">
                          <div className={`text-center p-3 rounded-lg ${getMoodColor(entry)} shadow-lg`}>
                            <div className="text-3xl font-bold text-white drop-shadow-lg">
                              {getMoodScore(entry)}/100
                            </div>
                            <div className="text-sm text-white font-semibold opacity-90 flex items-center justify-center">
                              <span className="mr-2">{getMoodEmoji(entry)}</span>
                              Daily Success Score
                            </div>
                          </div>
                        </div>
                        
                        {entry.waterIntake || entry.mealsEaten || entry.caffeine ? (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {entry.waterIntake > 0 && (
                              <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">
                                💧 {entry.waterIntake} glasses
                              </span>
                            )}
                            {entry.mealsEaten > 0 && (
                              <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded-full border border-green-500/20">
                                🍽️ {entry.mealsEaten} meals
                              </span>
                            )}
                            {entry.caffeine > 0 && (
                              <span className="text-xs bg-amber-900/30 text-amber-300 px-2 py-1 rounded-full border border-amber-500/20">
                                ☕ {entry.caffeine} caffeine
                              </span>
                            )}
                          </div>
                        ) : null}
                        
                        {entry.notes && (
                          <p className="text-sm text-slate-300 italic line-clamp-2">
                            "{entry.notes}"
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Suggestions - Modern Futuristic Design */}
            {moodEntries.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.5, type: "spring" },
                  y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
                }}
                className="mb-16"
              >
                <div className="relative bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-indigo-900/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/40 p-8 overflow-hidden">
                  {/* Glowing Edge Effect */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/60 shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-pulse"></div>
                  
                  {/* Neural Network Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 400 300">
                      {[...Array(15)].map((_, i) => (
                        <motion.circle
                          key={i}
                          cx={Math.random() * 400}
                          cy={Math.random() * 300}
                          r="1.5"
                          fill="currentColor"
                          className="text-blue-400"
                          animate={{
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                      {[...Array(10)].map((_, i) => (
                        <motion.line
                          key={`line-${i}`}
                          x1={Math.random() * 400}
                          y1={Math.random() * 300}
                          x2={Math.random() * 400}
                          y2={Math.random() * 300}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-blue-400"
                          animate={{
                            opacity: [0.1, 0.4, 0.1]
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.3
                          }}
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Data Stream Animation */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* AI Suggestions Content */}
                  <div className="relative z-10">
                    <AISuggestions moodEntries={moodEntries} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mood Composite Display */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="mb-16"
            >
              <div className="relative bg-purple-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-400/30 p-8 overflow-hidden">
                <div className="text-center">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    📈 Mood Composite ({mcLoading ? 'loading...' : (currentTimeBucket || 'unknown')})
                  </h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {mcLoading ? (
                      <div className="animate-pulse">...</div>
                    ) : (
                      moodComposite !== null && moodComposite !== undefined 
                        ? moodComposite.toFixed(2) 
                        : 'N/A'
                    )}
                  </div>
                  <p className="text-sm text-purple-200">
                    MC = 0.4×zV + 0.3×zE + 0.2×zF - 0.2×zS
                  </p>
                </div>
              </div>
            </motion.div>


          </>
        )}

        {/* Congratulations Modal */}
        <CongratulationModal
          isOpen={isModalOpen}
          onClose={closeModal}
          congratulation={currentCongratulation}
          onMarkAsRead={markAsRead}
        />
      </div>
    </div>
  );
}