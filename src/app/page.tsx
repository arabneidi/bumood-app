"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressCircle from "@/components/ui/ProgressCircle";
import AchievementBadge from "@/components/ui/AchievementBadge";
import AISuggestions from "@/components/dashboard/AISuggestions";
import { MoodEntry } from "@prisma/client";
import { getRandomQuote, generateAIMotivationalQuote } from "@/lib/inspirationalQuotes";

export default function Home() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inspirationalQuote, setInspirationalQuote] = useState("");
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [achievementsLoading, setAchievementsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    async function fetchMoodEntries() {
      try {
        const response = await fetch("/api/mood-entries");
        if (response.ok) {
          const data: MoodEntry[] = await response.json();
          setMoodEntries(data);
        }
      } catch (error) {
        console.error("Error fetching mood entries:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchAchievements() {
      try {
        const response = await fetch("/api/achievements");
        if (response.ok) {
          const data = await response.json();
          setAchievements(data);
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setAchievementsLoading(false);
      }
    }

    async function fetchUserPreferences() {
      try {
        const response = await fetch("/api/user?userId=dummy-user");
        if (response.ok) {
          const userData = await response.json();
          setUserPreferences({
            interests: userData.interests ? JSON.parse(userData.interests) : [],
            favoriteWriters: userData.favoriteWriters ? userData.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
            favoriteMusicians: userData.favoriteMusicians ? userData.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
            favoriteSportsFigures: userData.favoriteSportsFigures ? userData.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            favoriteArtists: userData.favoriteArtists ? userData.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
            favoritePhilosophers: userData.favoritePhilosophers ? userData.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : []
          });
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    }

    async function generateQuote() {
      try {
        // Fetch user profile for interests and preferences
        const userResponse = await fetch("/api/user?userId=dummy-user");
        let userPreferences: any = {};
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userPreferences = {
            gender: userData.gender,
            age: userData.age,
            height: userData.height,
            weight: userData.weight,
            timezone: userData.timezone,
            interests: userData.interests ? JSON.parse(userData.interests) : [],
            quoteStyle: userData.quoteStyle,
            favoriteAuthors: userData.favoriteAuthors ? userData.favoriteAuthors.split(',').map((a: string) => a.trim()) : [],
            favoriteWriters: userData.favoriteWriters ? userData.favoriteWriters.split(',').map((a: string) => a.trim()) : [],
            favoriteSportsFigures: userData.favoriteSportsFigures ? userData.favoriteSportsFigures.split(',').map((a: string) => a.trim()) : [],
            favoriteMusicians: userData.favoriteMusicians ? userData.favoriteMusicians.split(',').map((a: string) => a.trim()) : [],
            favoriteArtists: userData.favoriteArtists ? userData.favoriteArtists.split(',').map((a: string) => a.trim()) : [],
            favoritePhilosophers: userData.favoritePhilosophers ? userData.favoritePhilosophers.split(',').map((a: string) => a.trim()) : []
          };
        }
        
        // Wait for mood entries to load first
        const response = await fetch("/api/mood-entries");
        if (response.ok) {
          const data: MoodEntry[] = await response.json();
          
          if (data.length > 0) {
            const latestEntry = data[0];
            
            // Get current time of day
            const hour = new Date().getHours();
            const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
            
            // Get recent activities from last few entries
            const recentActivities: string[] = [];
            data.slice(0, 5).forEach((entry: any) => {
              if (entry.activities) {
                const acts = Array.isArray(entry.activities) ? entry.activities : JSON.parse(entry.activities || '[]');
                recentActivities.push(...acts);
              }
            });
            const uniqueActivities = [...new Set(recentActivities)].slice(0, 5);
            
            // Generate AI quote based on user's actual mood, data, preferences, and recent activities
            const aiQuote = await generateAIMotivationalQuote({
              currentMood: {
                valence: latestEntry.valence,
                energy: latestEntry.energy,
                focus: latestEntry.focus,
                stress: latestEntry.stress,
                sleep: latestEntry.sleep || 8
              },
              onPeriod: latestEntry.onPeriod,
              waterIntake: latestEntry.waterIntake || 0,
              timeOfDay,
              recentActivities: uniqueActivities,
              ...userPreferences
            });
            
            setInspirationalQuote(aiQuote);
          } else {
            // No entries yet, use random quote
            setInspirationalQuote(getRandomQuote());
          }
        }
      } catch (error) {
        console.error('Error generating AI quote:', error);
        setInspirationalQuote(getRandomQuote());
      }
    }

    fetchMoodEntries();
    fetchAchievements();
    fetchUserPreferences();
    generateQuote().catch(err => {
      console.error('Quote generation failed:', err);
      setInspirationalQuote(getRandomQuote());
    });
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
  const lifeRhythmScore = totalEntries > 0 ? Math.round((averageValence + averageEnergy + averageFocus) / 3 * 10) : 0;

  // CUMULATIVE METRICS: Sum for the time period (for daily totals)
  const totalWater = filteredEntries.reduce((sum, entry) => sum + (entry.waterIntake || 0), 0);
  const totalCaffeine = filteredEntries.reduce((sum, entry) => sum + (entry.caffeine || 0), 0);
  const totalMeals = filteredEntries.reduce((sum, entry) => sum + (entry.mealsEaten || 0), 0);
  
  const recentEntry = moodEntries[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section - Floating Rounded Rectangle */}
      <div className="relative overflow-hidden py-12">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full ${
                i % 3 === 0 ? 'bg-yellow-400' : i % 3 === 1 ? 'bg-pink-400' : 'bg-purple-400'
              } opacity-20`}
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Quote Box - Rounded Rectangle with Float */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative backdrop-blur-xl bg-gradient-to-r from-yellow-100/60 via-pink-100/60 to-purple-100/60 rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-white/50 overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {/* Shimmer Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Floating Emoji Decorations */}
            <motion.div
              className="absolute -top-4 -left-4 text-4xl"
              animate={{ rotate: [0, 10, -10, 0], y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ✨
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -right-4 text-4xl"
              animate={{ rotate: [0, -10, 10, 0], y: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🌟
            </motion.div>
              
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-xl md:text-3xl font-bold text-center bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent leading-relaxed relative z-10"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Life Rhythm Score - Heartbeat Pulse Animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="mb-16"
            >
              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative bg-gradient-to-br from-rose-100 via-red-100 to-pink-100 p-10 rounded-2xl shadow-2xl overflow-hidden border-2 border-white"
              >
                {/* Heartbeat SVG Animation */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full opacity-20" viewBox="0 0 1000 200">
                    <motion.path
                      d="M0,100 L100,100 L120,100 L130,80 L140,120 L150,60 L160,140 L170,100 L200,100 L300,100 L320,100 L330,80 L340,120 L350,60 L360,140 L370,100 L400,100 L500,100 L520,100 L530,80 L540,120 L550,60 L560,140 L570,100 L600,100 L700,100 L720,100 L730,80 L740,120 L750,60 L760,140 L770,100 L800,100 L900,100 L920,100 L930,80 L940,120 L950,60 L960,140 L970,100 L1000,100"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-rose-400"
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

                {/* Pulsing Hearts */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl"
                    style={{
                      left: `${15 + i * 15}%`,
                      top: `${20 + (i % 2) * 60}%`,
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.25,
                    }}
                  >
                    ❤️
                  </motion.div>
                ))}

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
                      className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-3 drop-shadow-lg"
                    >
                      💓 Life Rhythm Score
                    </motion.h2>
                    <p className="text-gray-700 text-lg font-medium">
                      Your heartbeat of wellbeing
                    </p>
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
                      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-2xl">
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
                            {lifeRhythmScore}
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
                          className="absolute inset-0 rounded-full border-4 border-rose-400"
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
              </motion.div>
            </motion.div>

            {/* Achievements Section - Separate card with Show All toggle */}
            {achievementsLoading ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block"
                >
                  <div className="rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto"></div>
                </motion.div>
                <p className="mt-4 text-gray-600 text-lg">Loading achievements...</p>
              </div>
            ) : achievements.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-16"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="mr-2">🏅</span>
                    Achievements
                  </h2>
                  <button
                    onClick={() => setShowAllBadges(v => !v)}
                    className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:from-indigo-700 hover:to-purple-700"
                  >
                    {showAllBadges ? 'Show Last 4' : 'Show All'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 overflow-visible">
                  {(showAllBadges ? achievements : achievements.slice(0, 4)).map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 30, scale: 0.5, rotate: -10 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1, 
                        rotate: 0 
                      }}
                      transition={{ 
                        delay: 0.1 + index * 0.05, 
                        duration: 0.5,
                        type: "spring",
                        stiffness: 150
                      }}
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: 8,
                        y: -15,
                        transition: { duration: 0.3, type: "spring" }
                      }}
                    >
                      <AchievementBadge
                        title={achievement.title}
                        type={achievement.type}
                        stars={achievement.stars}
                        unlocked={!!achievement.unlockedAt}
                        size="md"
                        description={achievement.description}
                        icon={achievement.icon}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : null}


            {/* Time Range Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mb-8 flex justify-center"
            >
              <div className="inline-flex bg-white rounded-full shadow-lg p-1 border-2 border-gray-200">
                {[
                  { value: 'daily', label: 'Today', icon: '📅' },
                  { value: 'weekly', label: 'Week', icon: '📊' },
                  { value: 'monthly', label: 'Month', icon: '📈' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as any)}
                    className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                      timeRange === option.value
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="mb-16"
            >
            {/* Quick Stats - Floating Rounded Rectangles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {[
                { value: averageStress.toFixed(1), label: `Avg Stress (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-orange-400 to-red-500", icon: "😰", delay: 0.1 },
                { value: averageValence.toFixed(1), label: `Avg Valence (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-green-400 to-emerald-500", icon: "😊", delay: 0.2 },
                { value: averageEnergy.toFixed(1), label: `Avg Energy (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-orange-400 to-amber-500", icon: "⚡", delay: 0.3 },
                { value: averageFocus.toFixed(1), label: `Avg Focus (${timeRange === 'daily' ? 'Today' : timeRange === 'weekly' ? 'Week' : 'Month'})`, color: "from-purple-400 to-violet-500", icon: "🎯", delay: 0.4 }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: stat.delay, 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 120
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                  className="relative group"
                >
                  <motion.div
                    animate={{
                      y: [0, -6, 0],
                    }}
                    transition={{
                      duration: 3 + index * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={`relative bg-gradient-to-br ${stat.color} p-8 rounded-2xl shadow-2xl overflow-hidden border-2 border-white`}
                  >
                    {/* Shimmer Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
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
                    <div className="text-white text-center font-semibold text-lg opacity-90 relative z-10">
                      {stat.label}
                    </div>
                  </motion.div>
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6, type: "spring" }}
                className="mb-16"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="mr-2">📝</span>
                    Today's Entries ({filteredEntries.length})
                  </h2>
                  <button
                    onClick={() => setShowAllEntries(v => !v)}
                    className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:from-indigo-700 hover:to-purple-700"
                  >
                    {showAllEntries ? 'Show Last 4' : 'Show All'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(showAllEntries ? filteredEntries : filteredEntries.slice(0, 4)).map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-semibold text-gray-500">
                          {new Date(entry.createdAt).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                        {entry.onPeriod && <span className="text-xl">🩸</span>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{entry.valence}</div>
                          <div className="text-xs text-gray-600">😊 Happy</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{entry.energy}</div>
                          <div className="text-xs text-gray-600">⚡ Energy</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{entry.focus}</div>
                          <div className="text-xs text-gray-600">🎯 Focus</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{entry.stress}</div>
                          <div className="text-xs text-gray-600">😰 Stress</div>
                        </div>
                      </div>
                      
                      {entry.waterIntake || entry.mealsEaten || entry.caffeine ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {entry.waterIntake > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              💧 {entry.waterIntake} glasses
                            </span>
                          )}
                          {entry.mealsEaten > 0 && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              🍽️ {entry.mealsEaten} meals
                            </span>
                          )}
                          {entry.caffeine > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                              ☕ {entry.caffeine} caffeine
                            </span>
                          )}
                        </div>
                      ) : null}
                      
                      {entry.notes && (
                        <p className="text-sm text-gray-600 italic line-clamp-2">
                          "{entry.notes}"
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Suggestions - Blue Background with Glass Center */}
            {moodEntries.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="mb-16"
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-10 rounded-2xl shadow-2xl overflow-hidden border-2 border-cyan-300"
                >
                  {/* Neural Network Background Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 400 300">
                      {[...Array(20)].map((_, i) => (
                        <motion.circle
                          key={i}
                          cx={Math.random() * 400}
                          cy={Math.random() * 300}
                          r="2"
                          fill="currentColor"
                          className="text-cyan-300"
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [1, 1.5, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.1
                          }}
                        />
                      ))}
                      {[...Array(15)].map((_, i) => (
                        <motion.line
                          key={`line-${i}`}
                          x1={Math.random() * 400}
                          y1={Math.random() * 300}
                          x2={Math.random() * 400}
                          y2={Math.random() * 300}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-cyan-300"
                          animate={{
                            opacity: [0.2, 0.8, 0.2]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Floating AI Elements */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-4xl"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 2) * 60}%`,
                      }}
                      animate={{
                        y: [0, -30, 0],
                        rotate: [0, 180, 360],
                        scale: [1, 1.3, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                    >
                      {['🤖', '🧠', '⚡', '🔮', '💫', '🌟'][i]}
                    </motion.div>
                  ))}

                  {/* Data Stream Animation */}
                  <motion.div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />

                  {/* Glowing Border Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-cyan-300"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(34, 211, 238, 0.3)',
                        '0 0 40px rgba(34, 211, 238, 0.6)',
                        '0 0 20px rgba(34, 211, 238, 0.3)'
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  />
                  
                  {/* AI Suggestions Content */}
                  <div className="relative z-10">
                    <AISuggestions moodEntries={moodEntries} />
                  </div>
                </motion.div>
              </motion.div>
            )}


            {/* Recent Entry - Floating Rounded Rectangle */}
            {recentEntry && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="mb-16"
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 5.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 p-8 rounded-2xl shadow-2xl overflow-hidden border-2 border-white"
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: 1,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Floating Background Shapes */}
                  <motion.div
                    animate={{ x: [0, 20, 0], y: [0, -20, 0], rotate: [0, 90, 0] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-10 right-10 w-24 h-24 bg-yellow-300 rounded-full opacity-20"
                  />
                  <motion.div
                    animate={{ x: [0, -15, 0], y: [0, 15, 0], rotate: [0, -90, 0] }}
                    transition={{ duration: 7, repeat: Infinity }}
                    className="absolute bottom-10 left-10 w-32 h-32 bg-pink-300 rounded-full opacity-20"
                  />

                  <motion.h3 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                    className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
                  >
                    📝 Latest Entry
                  </motion.h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
                    {[
                      { value: recentEntry.valence, label: "Valence", color: "from-indigo-400 to-purple-500", icon: "😊", delay: 1.1 },
                      { value: recentEntry.energy, label: "Energy", color: "from-green-400 to-teal-500", icon: "⚡", delay: 1.2 },
                      { value: recentEntry.focus, label: "Focus", color: "from-blue-400 to-cyan-500", icon: "🎯", delay: 1.3 },
                      { value: recentEntry.stress, label: "Stress", color: "from-orange-400 to-red-500", icon: "😰", delay: 1.4 }
                    ].map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, scale: 0, rotate: -90 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: item.delay, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        className={`bg-gradient-to-br ${item.color} p-6 rounded-3xl text-center shadow-lg transform`}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                          className="text-4xl mb-2"
                        >
                          {item.icon}
                        </motion.div>
                        <div className="text-3xl font-bold text-white mb-1 drop-shadow-lg">{item.value}</div>
                        <div className="text-sm text-white font-semibold opacity-90">{item.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {recentEntry.notes && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      className="mt-8 p-6 bg-white rounded-3xl shadow-lg relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute top-2 right-2 text-2xl"
                        animate={{ rotate: [0, 20, -20, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        💭
                      </motion.div>
                      <p className="text-gray-700 italic text-lg relative">"{recentEntry.notes}"</p>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}

          </>
        )}
      </div>
    </div>
  );
}