"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save, Sparkles, Heart, Star, Zap, Palette, Music, BookOpen, Gamepad2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  
  // Profile data
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
    personality: [] as string[],
    showPersonalityDropdown: false,
    universityLevel: '',
    fieldOfStudy: '',
    interests: [] as string[],
    favoriteAuthors: '',
    favoriteWriters: '',
    favoriteMovies: '',
    favoritePhilosophers: '',
    customFavorites: [] as Array<{id: string, category: string, items: string[]}>,
    newCustomCategory: '',
    newCustomItem: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // Custom categories removed from schema
  
  const interestOptions = [
    { name: 'gym', emoji: '💪', color: 'from-red-400 to-pink-500' },
    { name: 'sports', emoji: '⚽', color: 'from-green-400 to-emerald-500' },
    { name: 'poetry', emoji: '📝', color: 'from-purple-400 to-violet-500' },
    { name: 'literature', emoji: '📚', color: 'from-amber-400 to-orange-500' },
    { name: 'art', emoji: '🎨', color: 'from-pink-400 to-rose-500' },
    { name: 'music', emoji: '🎵', color: 'from-blue-400 to-cyan-500' },
    { name: 'science', emoji: '🔬', color: 'from-indigo-400 to-blue-500' },
    { name: 'spirituality', emoji: '🧘', color: 'from-violet-400 to-purple-500' },
    { name: 'philosophy', emoji: '🤔', color: 'from-slate-400 to-gray-500' },
    { name: 'nature', emoji: '🌿', color: 'from-green-400 to-teal-500' },
    { name: 'technology', emoji: '💻', color: 'from-cyan-400 to-blue-500' },
    { name: 'cooking', emoji: '👨‍🍳', color: 'from-orange-400 to-red-500' }
  ];


  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  // Debug component render
  console.log('Profile component rendering with state:', { profile });
  
  // Test if console.log works at all
  console.log('=== CONSOLE TEST - IF YOU SEE THIS, CONSOLE IS WORKING ===');

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user?userId=dummy-user');
      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.name || '',
          gender: data.gender || '',
          age: data.age?.toString() || '',
          height: data.height?.toString() || '',
          weight: data.weight?.toString() || '',
          personality: data.personality ? JSON.parse(data.personality) : [],
          universityLevel: data.universityLevel || '',
          fieldOfStudy: data.fieldOfStudy || '',
          interests: data.interests ? JSON.parse(data.interests) : [],
          favoriteAuthors: data.favoriteAuthors || '',
          favoriteWriters: data.favoriteWriters || '',
          favoriteMovies: data.favoriteMovies || '',
          favoritePhilosophers: data.favoritePhilosophers || '',
          customFavorites: data.customFavorites ? JSON.parse(data.customFavorites) : []
        });
        // Custom categories removed from schema
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };


  // Custom categories functionality removed

  const handleIncrement = (field: 'age' | 'height' | 'weight') => {
    const currentValue = parseFloat(profile[field]) || 0;
    const newValue = field === 'age' ? Math.min(currentValue + 1, 120) : 
                    field === 'height' ? Math.min(currentValue + 1, 300) : 
                    Math.min(currentValue + 1, 500);
    setProfile({...profile, [field]: newValue.toString()});
  };

  const handleDecrement = (field: 'age' | 'height' | 'weight') => {
    const currentValue = parseFloat(profile[field]) || 0;
    const newValue = field === 'age' ? Math.max(currentValue - 1, 1) : 
                    field === 'height' ? Math.max(currentValue - 1, 50) : 
                    Math.max(currentValue - 1, 20);
    setProfile({...profile, [field]: newValue.toString()});
  };

  const saveProfile = async () => {
    setLoading(true);
    setMessage('');
    try {
      console.log('Saving profile:', profile);
      
      const profileData = {
        userId: 'dummy-user',
        name: profile.name || null,
        gender: profile.gender || null,
        age: profile.age ? parseInt(profile.age) : null,
        height: profile.height ? parseFloat(profile.height) : null,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        personality: JSON.stringify(profile.personality),
        universityLevel: profile.universityLevel || null,
        fieldOfStudy: profile.fieldOfStudy || null,
        interests: JSON.stringify(profile.interests), // For AI personalization
        favoriteAuthors: profile.favoriteAuthors || null,
        favoriteWriters: profile.favoriteWriters || null,
        favoriteMovies: profile.favoriteMovies || null,
        favoritePhilosophers: profile.favoritePhilosophers || null,
        customFavorites: JSON.stringify(profile.customFavorites)
      };
      
      console.log('📤 Sending profile data to API:', profileData);
      
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Saved successfully:', data);
        setMessage('✅ Profile saved successfully!');
        setTimeout(() => {
          setMessage('');
          router.push('/');
        }, 2000);
      } else {
        const error = await response.text();
        console.error('Save failed:', error);
        setMessage('❌ Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('❌ Failed to save profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Futuristic Background */}
      <div className="absolute top-16 left-0 right-0 bottom-0 z-0">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.1)_25%,rgba(59,130,246,0.1)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1)_76%,transparent_77%)] bg-[length:50px_50px] animate-pulse"></div>
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 1, 0.3],
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

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 rounded-full">
                <User className="w-16 h-16 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-6xl font-black mb-4"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              background: 'linear-gradient(45deg, #3b82f6, #6366f1, #8b5cf6, #a855f7, #3b82f6)',
              backgroundSize: '400% 400%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your Amazing Profile
          </motion.h1>
          
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className={`mb-8 p-6 rounded-2xl border-4 shadow-2xl ${
                message.includes('✅') 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-300 backdrop-blur-xl' 
                  : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/50 text-red-300 backdrop-blur-xl'
              }`}
            >
              <div className="flex items-center justify-center text-2xl font-bold">
                {message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
          className="relative"
        >
          {/* Card Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-3xl blur-xl opacity-20 transform rotate-1"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-3xl blur-lg opacity-15 transform -rotate-1"></div>
          
          <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8">
            {/* Glowing Edge Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-blue-400/50 shadow-[0_0_25px_rgba(59,130,246,0.6)] animate-pulse"></div>

            {/* Personal Information Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{ 
                opacity: { duration: 0.5, delay: 0.5 },
                x: { duration: 0.5, delay: 0.5 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-12"
            >
              <div className="flex items-center mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mr-4"
                >
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                  Personal Info
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-pink-400" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-pink-500/10"
                    placeholder="Enter your amazing name"
                  />
                </motion.div>

                {/* Gender */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-purple-400" />
                    Gender
                  </label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({...profile, gender: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-purple-500/10"
                  >
                    <option value="">Choose your identity</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </motion.div>

                {/* Age */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-cyan-400" />
                    Age
                  </label>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDecrement('age')}
                      className="p-3 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-full text-white hover:bg-slate-700/60 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10"
                    >
                      <Minus className="w-5 h-5" />
                    </motion.button>
                    <input
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({...profile, age: e.target.value})}
                      className="flex-1 px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-cyan-500/10 text-center"
                      placeholder="Your age"
                      min="1"
                      max="120"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleIncrement('age')}
                      className="p-3 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-full text-white hover:bg-slate-700/60 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Height */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <span className="text-2xl mr-2">📏</span>
                    Height (cm)
                  </label>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDecrement('height')}
                      className="p-3 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-full text-white hover:bg-slate-700/60 transition-all duration-300 shadow-lg hover:shadow-green-500/10"
                    >
                      <Minus className="w-5 h-5" />
                    </motion.button>
                    <input
                      type="number"
                      value={profile.height}
                      onChange={(e) => setProfile({...profile, height: e.target.value})}
                      className="flex-1 px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-green-500/10 text-center"
                      placeholder="Your height"
                      step="0.1"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleIncrement('height')}
                      className="p-3 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-full text-white hover:bg-slate-700/60 transition-all duration-300 shadow-lg hover:shadow-green-500/10"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Weight */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <span className="text-2xl mr-2">⚖️</span>
                    Weight (kg)
                  </label>
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDecrement('weight')}
                      className="p-3 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-full text-white hover:bg-slate-700/60 transition-all duration-300 shadow-lg hover:shadow-orange-500/10"
                    >
                      <Minus className="w-5 h-5" />
                    </motion.button>
                    <input
                      type="number"
                      value={profile.weight}
                      onChange={(e) => setProfile({...profile, weight: e.target.value})}
                      className="flex-1 px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-orange-500/10 text-center"
                      placeholder="Your weight"
                      step="0.1"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleIncrement('weight')}
                      className="p-3 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-full text-white hover:bg-slate-700/60 transition-all duration-300 shadow-lg hover:shadow-orange-500/10"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>

                {/* Personality Types */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <span className="text-2xl mr-2">🧠</span>
                    Personality Types
                  </label>
                  
                  {/* Selected Types Display */}
                  {profile.personality.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {profile.personality.map((type) => (
                        <motion.span
                          key={type}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-full"
                        >
                          {type}
                        </motion.span>
                      ))}
                    </div>
                  )}
                  
                  {/* Dropdown Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setProfile({...profile, showPersonalityDropdown: !profile.showPersonalityDropdown})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-violet-500/20 focus:border-violet-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-violet-500/10 flex items-center justify-between"
                  >
                    <span>
                      {profile.personality.length === 0 
                        ? 'Choose your personality types' 
                        : `${profile.personality.length} type${profile.personality.length > 1 ? 's' : ''} selected`
                      }
                    </span>
                    <motion.span
                      animate={{ rotate: profile.showPersonalityDropdown ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-violet-400"
                    >
                      ▼
                    </motion.span>
                  </motion.button>
                  
                  {/* Dropdown Options */}
                  <AnimatePresence>
                    {profile.showPersonalityDropdown && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4 max-h-64 overflow-y-auto scrollbar-thin personality-scrollbar"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'INTJ', label: 'INTJ - The Architect' },
                            { value: 'INTP', label: 'INTP - The Thinker' },
                            { value: 'ENTJ', label: 'ENTJ - The Commander' },
                            { value: 'ENTP', label: 'ENTP - The Debater' },
                            { value: 'INFJ', label: 'INFJ - The Advocate' },
                            { value: 'INFP', label: 'INFP - The Mediator' },
                            { value: 'ENFJ', label: 'ENFJ - The Protagonist' },
                            { value: 'ENFP', label: 'ENFP - The Campaigner' },
                            { value: 'ISTJ', label: 'ISTJ - The Logistician' },
                            { value: 'ISFJ', label: 'ISFJ - The Protector' },
                            { value: 'ESTJ', label: 'ESTJ - The Executive' },
                            { value: 'ESFJ', label: 'ESFJ - The Consul' },
                            { value: 'ISTP', label: 'ISTP - The Virtuoso' },
                            { value: 'ISFP', label: 'ISFP - The Adventurer' },
                            { value: 'ESTP', label: 'ESTP - The Entrepreneur' },
                            { value: 'ESFP', label: 'ESFP - The Entertainer' }
                          ].map((type, index) => {
                            // Color mapping for each personality type
                            const getPersonalityColor = (typeValue: string) => {
                              const colorMap: { [key: string]: { 
                                selectedBg: string, 
                                selectedBorder: string, 
                                selectedShadow: string,
                                hoverBg: string,
                                hoverText: string,
                                hoverBorder: string,
                                hoverShadow: string,
                                glowColor: string,
                                indicatorBg: string
                              } } = {
                                'INTJ': { 
                                  selectedBg: 'bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-600/30',
                                  selectedBorder: 'border-blue-400/50',
                                  selectedShadow: 'shadow-blue-500/20',
                                  hoverBg: 'hover:bg-blue-500/10',
                                  hoverText: 'hover:text-blue-200',
                                  hoverBorder: 'hover:border-blue-400/50',
                                  hoverShadow: 'hover:shadow-blue-500/10',
                                  glowColor: 'rgba(59, 130, 246, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-blue-400 to-cyan-400'
                                },
                                'INTP': { 
                                  selectedBg: 'bg-gradient-to-r from-purple-500/30 via-violet-500/30 to-purple-600/30',
                                  selectedBorder: 'border-purple-400/50',
                                  selectedShadow: 'shadow-purple-500/20',
                                  hoverBg: 'hover:bg-purple-500/10',
                                  hoverText: 'hover:text-purple-200',
                                  hoverBorder: 'hover:border-purple-400/50',
                                  hoverShadow: 'hover:shadow-purple-500/10',
                                  glowColor: 'rgba(147, 51, 234, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-purple-400 to-violet-400'
                                },
                                'ENTJ': { 
                                  selectedBg: 'bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-600/30',
                                  selectedBorder: 'border-orange-400/50',
                                  selectedShadow: 'shadow-orange-500/20',
                                  hoverBg: 'hover:bg-orange-500/10',
                                  hoverText: 'hover:text-orange-200',
                                  hoverBorder: 'hover:border-orange-400/50',
                                  hoverShadow: 'hover:shadow-orange-500/10',
                                  glowColor: 'rgba(249, 115, 22, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-orange-400 to-amber-400'
                                },
                                'ENTP': { 
                                  selectedBg: 'bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-green-600/30',
                                  selectedBorder: 'border-green-400/50',
                                  selectedShadow: 'shadow-green-500/20',
                                  hoverBg: 'hover:bg-green-500/10',
                                  hoverText: 'hover:text-green-200',
                                  hoverBorder: 'hover:border-green-400/50',
                                  hoverShadow: 'hover:shadow-green-500/10',
                                  glowColor: 'rgba(34, 197, 94, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-green-400 to-emerald-400'
                                },
                                'INFJ': { 
                                  selectedBg: 'bg-gradient-to-r from-pink-500/30 via-rose-500/30 to-pink-600/30',
                                  selectedBorder: 'border-pink-400/50',
                                  selectedShadow: 'shadow-pink-500/20',
                                  hoverBg: 'hover:bg-pink-500/10',
                                  hoverText: 'hover:text-pink-200',
                                  hoverBorder: 'hover:border-pink-400/50',
                                  hoverShadow: 'hover:shadow-pink-500/10',
                                  glowColor: 'rgba(236, 72, 153, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-pink-400 to-rose-400'
                                },
                                'INFP': { 
                                  selectedBg: 'bg-gradient-to-r from-cyan-500/30 via-sky-500/30 to-cyan-600/30',
                                  selectedBorder: 'border-cyan-400/50',
                                  selectedShadow: 'shadow-cyan-500/20',
                                  hoverBg: 'hover:bg-cyan-500/10',
                                  hoverText: 'hover:text-cyan-200',
                                  hoverBorder: 'hover:border-cyan-400/50',
                                  hoverShadow: 'hover:shadow-cyan-500/10',
                                  glowColor: 'rgba(6, 182, 212, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-cyan-400 to-sky-400'
                                },
                                'ENFJ': { 
                                  selectedBg: 'bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-yellow-600/30',
                                  selectedBorder: 'border-yellow-400/50',
                                  selectedShadow: 'shadow-yellow-500/20',
                                  hoverBg: 'hover:bg-yellow-500/10',
                                  hoverText: 'hover:text-yellow-200',
                                  hoverBorder: 'hover:border-yellow-400/50',
                                  hoverShadow: 'hover:shadow-yellow-500/10',
                                  glowColor: 'rgba(234, 179, 8, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-yellow-400 to-amber-400'
                                },
                                'ENFP': { 
                                  selectedBg: 'bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-indigo-600/30',
                                  selectedBorder: 'border-indigo-400/50',
                                  selectedShadow: 'shadow-indigo-500/20',
                                  hoverBg: 'hover:bg-indigo-500/10',
                                  hoverText: 'hover:text-indigo-200',
                                  hoverBorder: 'hover:border-indigo-400/50',
                                  hoverShadow: 'hover:shadow-indigo-500/10',
                                  glowColor: 'rgba(99, 102, 241, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-indigo-400 to-blue-400'
                                },
                                'ISTJ': { 
                                  selectedBg: 'bg-gradient-to-r from-red-500/30 via-rose-500/30 to-red-600/30',
                                  selectedBorder: 'border-red-400/50',
                                  selectedShadow: 'shadow-red-500/20',
                                  hoverBg: 'hover:bg-red-500/10',
                                  hoverText: 'hover:text-red-200',
                                  hoverBorder: 'hover:border-red-400/50',
                                  hoverShadow: 'hover:shadow-red-500/10',
                                  glowColor: 'rgba(239, 68, 68, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-red-400 to-rose-400'
                                },
                                'ISFJ': { 
                                  selectedBg: 'bg-gradient-to-r from-teal-500/30 via-cyan-500/30 to-teal-600/30',
                                  selectedBorder: 'border-teal-400/50',
                                  selectedShadow: 'shadow-teal-500/20',
                                  hoverBg: 'hover:bg-teal-500/10',
                                  hoverText: 'hover:text-teal-200',
                                  hoverBorder: 'hover:border-teal-400/50',
                                  hoverShadow: 'hover:shadow-teal-500/10',
                                  glowColor: 'rgba(20, 184, 166, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-teal-400 to-cyan-400'
                                },
                                'ESTJ': { 
                                  selectedBg: 'bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-amber-600/30',
                                  selectedBorder: 'border-amber-400/50',
                                  selectedShadow: 'shadow-amber-500/20',
                                  hoverBg: 'hover:bg-amber-500/10',
                                  hoverText: 'hover:text-amber-200',
                                  hoverBorder: 'hover:border-amber-400/50',
                                  hoverShadow: 'hover:shadow-amber-500/10',
                                  glowColor: 'rgba(245, 158, 11, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-amber-400 to-yellow-400'
                                },
                                'ESFJ': { 
                                  selectedBg: 'bg-gradient-to-r from-emerald-500/30 via-green-500/30 to-emerald-600/30',
                                  selectedBorder: 'border-emerald-400/50',
                                  selectedShadow: 'shadow-emerald-500/20',
                                  hoverBg: 'hover:bg-emerald-500/10',
                                  hoverText: 'hover:text-emerald-200',
                                  hoverBorder: 'hover:border-emerald-400/50',
                                  hoverShadow: 'hover:shadow-emerald-500/10',
                                  glowColor: 'rgba(16, 185, 129, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-emerald-400 to-green-400'
                                },
                                'ISTP': { 
                                  selectedBg: 'bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-violet-600/30',
                                  selectedBorder: 'border-violet-400/50',
                                  selectedShadow: 'shadow-violet-500/20',
                                  hoverBg: 'hover:bg-violet-500/10',
                                  hoverText: 'hover:text-violet-200',
                                  hoverBorder: 'hover:border-violet-400/50',
                                  hoverShadow: 'hover:shadow-violet-500/10',
                                  glowColor: 'rgba(139, 92, 246, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-violet-400 to-purple-400'
                                },
                                'ISFP': { 
                                  selectedBg: 'bg-gradient-to-r from-rose-500/30 via-pink-500/30 to-rose-600/30',
                                  selectedBorder: 'border-rose-400/50',
                                  selectedShadow: 'shadow-rose-500/20',
                                  hoverBg: 'hover:bg-rose-500/10',
                                  hoverText: 'hover:text-rose-200',
                                  hoverBorder: 'hover:border-rose-400/50',
                                  hoverShadow: 'hover:shadow-rose-500/10',
                                  glowColor: 'rgba(244, 63, 94, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-rose-400 to-pink-400'
                                },
                                'ESTP': { 
                                  selectedBg: 'bg-gradient-to-r from-sky-500/30 via-blue-500/30 to-sky-600/30',
                                  selectedBorder: 'border-sky-400/50',
                                  selectedShadow: 'shadow-sky-500/20',
                                  hoverBg: 'hover:bg-sky-500/10',
                                  hoverText: 'hover:text-sky-200',
                                  hoverBorder: 'hover:border-sky-400/50',
                                  hoverShadow: 'hover:shadow-sky-500/10',
                                  glowColor: 'rgba(14, 165, 233, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-sky-400 to-blue-400'
                                },
                                'ESFP': { 
                                  selectedBg: 'bg-gradient-to-r from-lime-500/30 via-green-500/30 to-lime-600/30',
                                  selectedBorder: 'border-lime-400/50',
                                  selectedShadow: 'shadow-lime-500/20',
                                  hoverBg: 'hover:bg-lime-500/10',
                                  hoverText: 'hover:text-lime-200',
                                  hoverBorder: 'hover:border-lime-400/50',
                                  hoverShadow: 'hover:shadow-lime-500/10',
                                  glowColor: 'rgba(132, 204, 22, 0.6)',
                                  indicatorBg: 'bg-gradient-to-r from-lime-400 to-green-400'
                                }
                              };
                              return colorMap[typeValue] || { 
                                selectedBg: 'bg-gradient-to-r from-gray-500/30 via-slate-500/30 to-gray-600/30',
                                selectedBorder: 'border-gray-400/50',
                                selectedShadow: 'shadow-gray-500/20',
                                hoverBg: 'hover:bg-gray-500/10',
                                hoverText: 'hover:text-gray-200',
                                hoverBorder: 'hover:border-gray-400/50',
                                hoverShadow: 'hover:shadow-gray-500/10',
                                glowColor: 'rgba(107, 114, 128, 0.6)',
                                indicatorBg: 'bg-gradient-to-r from-gray-400 to-slate-400'
                              };
                            };

                            const colors = getPersonalityColor(type.value);
                            const isSelected = profile.personality.includes(type.value);

                            return (
                              <motion.button
                                key={type.value}
                                type="button"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ 
                                  scale: 1.08,
                                  boxShadow: `0 0 20px ${colors.glowColor}, 0 0 40px ${colors.glowColor.replace('0.6', '0.3')}`
                                }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  if (profile.personality.includes(type.value)) {
                                    setProfile({
                                      ...profile,
                                      personality: profile.personality.filter(p => p !== type.value)
                                    });
                                  } else {
                                    setProfile({
                                      ...profile,
                                      personality: [...profile.personality, type.value]
                                    });
                                  }
                                }}
                                className={`relative px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 backdrop-blur-sm border ${
                                  isSelected
                                    ? `${colors.selectedBg} text-white ${colors.selectedBorder} shadow-lg ${colors.selectedShadow}`
                                    : `${colors.hoverBg} ${colors.hoverText} ${colors.hoverBorder} hover:shadow-lg ${colors.hoverShadow}`
                                }`}
                              >
                                {/* Glass glow effect */}
                                <motion.div
                                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100"
                                  whileHover={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                />
                                
                                {/* Content */}
                                <span className="relative z-10">
                                  {type.label}
                                </span>
                                
                                {/* Glow indicator for selected */}
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`absolute -top-1 -right-1 w-2 h-2 ${colors.indicatorBg} rounded-full shadow-lg`}
                                  />
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* University Level */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <span className="text-2xl mr-2">🎓</span>
                    University Level
                  </label>
                  <select
                    value={profile.universityLevel}
                    onChange={(e) => setProfile({...profile, universityLevel: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-blue-500/10"
                  >
                    <option value="">Choose your level</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="master">Master's</option>
                    <option value="phd">PhD</option>
                    <option value="other">Other</option>
                  </select>
                </motion.div>

                {/* Field of Study */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  className="group"
                >
                  <label className="block text-lg font-bold text-slate-200 mb-3 flex items-center">
                    <span className="text-2xl mr-2">📚</span>
                    Field of Study
                  </label>
                  <input
                    type="text"
                    value={profile.fieldOfStudy}
                    onChange={(e) => setProfile({...profile, fieldOfStudy: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-indigo-500/10"
                    placeholder="e.g., Computer Science, Engineering, Medicine"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Interests Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
              transition={{ 
                opacity: { duration: 0.5, delay: 0.7 },
                x: { duration: 0.5, delay: 0.7 },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-12"
            >
              <div className="flex items-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mr-4"
                >
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Your Interests
                </h2>
              </div>
              
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {interestOptions.map((interest, index) => (
                  <motion.button
                    key={interest.name}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (profile.interests.includes(interest.name)) {
                        setProfile({
                          ...profile,
                          interests: profile.interests.filter(i => i !== interest.name)
                        });
                      } else {
                        setProfile({
                          ...profile,
                          interests: [...profile.interests, interest.name]
                        });
                      }
                    }}
                    className={`relative overflow-hidden rounded-2xl p-4 font-bold text-lg transition-all duration-300 ${
                      profile.interests.includes(interest.name)
                        ? `bg-gradient-to-r ${interest.color} text-white shadow-2xl transform scale-105`
                        : 'bg-slate-800/40 backdrop-blur-xl text-slate-300 border border-slate-600/50 hover:border-slate-500 hover:shadow-xl'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-3xl">{interest.emoji}</span>
                      <span className="capitalize">{interest.name}</span>
                    </div>
                    {profile.interests.includes(interest.name) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <span className="text-green-500 text-sm">✓</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>


            {/* Activity-Specific Favorites */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: [0, -7, 0] }}
              transition={{ 
                opacity: { duration: 0.5, delay: 1.1 },
                y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-12"
            >
              <div className="flex items-center mb-8">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mr-4"
                >
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Your Favorites
                </h2>
              </div>
              

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Favorite Writers */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-lg font-bold text-slate-200 flex items-center">
                      <span className="text-2xl mr-2">📚</span>
                      Favorite Writers/Authors
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfile({...profile, favoriteWriters: ''})}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all duration-300"
                    >
                      ✕
                    </motion.button>
                  </div>
                  <input
                    type="text"
                    value={profile.favoriteWriters}
                    onChange={(e) => setProfile({...profile, favoriteWriters: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-blue-500/10"
                    placeholder="e.g., Jane Austen, Hemingway, Tolkien"
                  />
                </motion.div>


                {/* Favorite Movies */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-lg font-bold text-slate-200 flex items-center">
                      <span className="text-2xl mr-2">🎬</span>
                      Favorite Movies/TV Shows
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfile({...profile, favoriteMovies: ''})}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all duration-300"
                    >
                      ✕
                    </motion.button>
                  </div>
                  <input
                    type="text"
                    value={profile.favoriteMovies}
                    onChange={(e) => setProfile({...profile, favoriteMovies: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-purple-500/10"
                    placeholder="e.g., Inception, Breaking Bad, The Office"
                  />
                </motion.div>

                {/* Custom Categories */}
                {profile.customFavorites.map((customFav, index) => (
                  <motion.div
                    key={customFav.id}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-lg font-bold text-slate-200 flex items-center">
                        <span className="text-2xl mr-2">⭐</span>
                        {customFav.category}
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const updatedFavorites = profile.customFavorites.filter((_, i) => i !== index);
                          setProfile({...profile, customFavorites: updatedFavorites});
                        }}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all duration-300"
                      >
                        ✕
                      </motion.button>
                    </div>
                    <input
                      type="text"
                      value={customFav.items.join(', ')}
                      onChange={(e) => {
                        const updatedFavorites = [...profile.customFavorites];
                        updatedFavorites[index].items = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                        setProfile({...profile, customFavorites: updatedFavorites});
                      }}
                      className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-purple-500/10"
                      placeholder={`e.g., ${customFav.category} examples`}
                    />
                  </motion.div>
                ))}


                {/* Custom Categories removed from schema */}
              </div>

            </motion.div>

            {/* Add Custom Category Section - Separate */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12"
            >
              <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-200 flex items-center">
                  <span className="text-3xl mr-3">⭐</span>
                  Add Custom Category
                </h2>
              </div>
              
              {/* Add New Custom Favorite Form */}
              <div className="mb-8 p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-600/50 rounded-2xl">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={profile.newCustomCategory || ''}
                      onChange={(e) => setProfile({...profile, newCustomCategory: e.target.value})}
                      className="w-full px-4 py-4 bg-slate-700/60 backdrop-blur-xl border border-slate-500/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-white font-medium transition-all duration-300"
                      placeholder="e.g., Singer"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-200 mb-3">
                      Your Favorites
                    </label>
                    <input
                      type="text"
                      value={profile.newCustomItem || ''}
                      onChange={(e) => setProfile({...profile, newCustomItem: e.target.value})}
                      className="w-full px-4 py-4 bg-slate-700/60 backdrop-blur-xl border border-slate-500/50 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 text-white font-medium transition-all duration-300"
                      placeholder="e.g., Sabrina Carpenter"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (profile.newCustomCategory && profile.newCustomItem) {
                        const newId = Date.now().toString();
                        const newCustomFavorite = {
                          id: newId,
                          category: profile.newCustomCategory.trim(),
                          items: [profile.newCustomItem.trim()]
                        };
                        setProfile({
                          ...profile,
                          customFavorites: [...profile.customFavorites, newCustomFavorite],
                          newCustomCategory: '',
                          newCustomItem: ''
                        });
                      }
                    }}
                    className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Custom Categories functionality removed from schema */}

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{ 
                opacity: { duration: 0.5, delay: 1.3 },
                y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.3 }
              }}
              className="text-center"
            >
              <motion.button
                onClick={saveProfile}
                disabled={loading}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative overflow-hidden px-10 py-4 bg-blue-900/20 backdrop-blur-xl border border-blue-400/30 rounded-2xl font-bold text-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 disabled:opacity-50"
              >
                <div className="absolute inset-0 rounded-2xl border border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
                <div className="relative flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6"
                      >
                        <Save className="w-6 h-6" />
                      </motion.div>
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      <span>Save Profile</span>
                    </>
                  )}
                </div>
              </motion.button>
              
            </motion.div>

            {/* AI Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-16 p-8 bg-gradient-to-r from-slate-800/40 to-slate-700/40 backdrop-blur-xl rounded-3xl border border-slate-600/50"
            >
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain w-8 h-8 text-white">
                      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1 .34-4.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
                      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0-.34-4.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-3xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  AI-Powered Personalization
                </h3>
                
                <p className="text-lg text-slate-300 mb-6 leading-relaxed">
                  Your profile information helps our AI provide you with personalized quotes, 
                  suggestions, and insights tailored specifically to your interests and preferences.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <div className="text-2xl mb-2">🎯</div>
                    <h4 className="font-bold text-white mb-2">Personalized Quotes</h4>
                    <p className="text-sm text-slate-400">Get quotes from your favorite writers, philosophers, and thinkers</p>
                  </div>
                  
                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <div className="text-2xl mb-2">💡</div>
                    <h4 className="font-bold text-white mb-2">Smart Suggestions</h4>
                    <p className="text-sm text-slate-400">Receive activity and goal recommendations based on your interests</p>
                  </div>
                  
                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="font-bold text-white mb-2">Better Insights</h4>
                    <p className="text-sm text-slate-400">Enhanced mood analysis and personalized wellness recommendations</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}