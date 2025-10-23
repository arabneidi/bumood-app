"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save, Sparkles, Heart, Star, Zap, Palette, Music, BookOpen, Gamepad2, Plus, Minus } from 'lucide-react';

export default function ProfilePage() {
  // Profile data
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
    interests: [] as string[],
    quoteStyle: [] as string[],
    favoriteAuthors: '',
    favoriteWriters: '',
    favoriteSportsFigures: '',
    favoriteMusicians: '',
    favoriteArtists: '',
    favoritePhilosophers: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [customCategories, setCustomCategories] = useState<Array<{id: string, name: string, value: string}>>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryValue, setNewCategoryValue] = useState('');
  
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

  const quoteStyleOptions = [
    { name: 'motivational', emoji: '💪', color: 'from-red-400 to-pink-500', description: 'Tony Robbins, Les Brown' },
    { name: 'poetic', emoji: '📝', color: 'from-purple-400 to-violet-500', description: 'Rumi, Maya Angelou' },
    { name: 'sporty', emoji: '⚽', color: 'from-green-400 to-emerald-500', description: 'Muhammad Ali, Kobe Bryant' },
    { name: 'scientific', emoji: '🔬', color: 'from-indigo-400 to-blue-500', description: 'Carl Sagan, Marie Curie' },
    { name: 'spiritual', emoji: '🧘', color: 'from-violet-400 to-purple-500', description: 'Dalai Lama, Thich Nhat Hanh' },
    { name: 'philosophical', emoji: '🤔', color: 'from-slate-400 to-gray-500', description: 'Marcus Aurelius, Seneca' }
  ];

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  // Debug custom categories changes
  useEffect(() => {
    console.log('customCategories changed:', customCategories);
  }, [customCategories]);

  // Debug component render
  console.log('Profile component rendering with state:', { newCategoryName, newCategoryValue, customCategories });
  
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
          interests: data.interests ? JSON.parse(data.interests) : [],
          quoteStyle: data.quoteStyle ? JSON.parse(data.quoteStyle) : [],
          favoriteAuthors: data.favoriteAuthors || '',
          favoriteWriters: data.favoriteWriters || '',
          favoriteSportsFigures: data.favoriteSportsFigures || '',
          favoriteMusicians: data.favoriteMusicians || '',
          favoriteArtists: data.favoriteArtists || '',
          favoritePhilosophers: data.favoritePhilosophers || ''
        });
        // Load custom categories
        if (data.customCategories) {
          setCustomCategories(JSON.parse(data.customCategories));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };


  const removeCustomCategory = async (id: string) => {
    const updatedCategories = customCategories.filter(cat => cat.id !== id);
    setCustomCategories(updatedCategories);
    
    // Save to database
    try {
      await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customCategories: JSON.stringify(updatedCategories)
        })
      });
    } catch (error) {
      console.error('Error saving custom categories:', error);
    }
  };

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
      
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'dummy-user',
          name: profile.name || null,
          gender: profile.gender || null,
          age: profile.age ? parseInt(profile.age) : null,
          height: profile.height ? parseFloat(profile.height) : null,
          weight: profile.weight ? parseFloat(profile.weight) : null,
          interests: JSON.stringify(profile.interests), // For AI personalization
          quoteStyle: JSON.stringify(profile.quoteStyle), // For AI quote generation
          favoriteAuthors: profile.favoriteAuthors || null,
          favoriteWriters: profile.favoriteWriters || null,
          favoriteSportsFigures: profile.favoriteSportsFigures || null,
          favoriteMusicians: profile.favoriteMusicians || null,
          favoriteArtists: profile.favoriteArtists || null,
          favoritePhilosophers: profile.favoritePhilosophers || null,
          customCategories: JSON.stringify(customCategories) // Custom categories
        })
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Saved successfully:', data);
        setMessage('✅ Profile saved successfully!');
        setTimeout(() => setMessage(''), 3000);
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
      <div className="absolute inset-0">
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

            {/* Quote Style Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{ 
                opacity: { duration: 0.5, delay: 0.9 },
                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-12"
            >
              <div className="flex items-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="mr-4"
                >
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-4xl font-black bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  Quote Style
                </h2>
              </div>
              
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quoteStyleOptions.map((style, index) => (
                  <motion.button
                    key={style.name}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    whileTap={{ scale: 0.95 }}
                         onClick={() => {
                           if (profile.quoteStyle.includes(style.name)) {
                             setProfile({
                               ...profile,
                               quoteStyle: profile.quoteStyle.filter(s => s !== style.name)
                             });
                           } else {
                             setProfile({
                               ...profile,
                               quoteStyle: [...profile.quoteStyle, style.name]
                             });
                           }
                         }}
                         className={`relative overflow-hidden rounded-2xl p-4 font-bold text-lg transition-all duration-300 ${
                           profile.quoteStyle.includes(style.name)
                             ? `bg-gradient-to-r ${style.color} text-white shadow-2xl transform scale-105`
                             : 'bg-slate-800/40 backdrop-blur-xl text-slate-300 border border-slate-600/50 hover:border-slate-500 hover:shadow-xl'
                         }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="text-3xl">{style.emoji}</span>
                      <span className="capitalize">{style.name}</span>
                      <span className="text-xs opacity-75">{style.description}</span>
                    </div>
                         {profile.quoteStyle.includes(style.name) && (
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

                {/* Favorite Musicians */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-lg font-bold text-slate-200 flex items-center">
                      <span className="text-2xl mr-2">🎵</span>
                      Favorite Musicians/Bands
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfile({...profile, favoriteMusicians: ''})}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all duration-300"
                    >
                      ✕
                    </motion.button>
                  </div>
                  <input
                    type="text"
                    value={profile.favoriteMusicians}
                    onChange={(e) => setProfile({...profile, favoriteMusicians: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-indigo-500/10"
                    placeholder="e.g., Bob Dylan, Nina Simone, Coldplay"
                  />
                </motion.div>

                {/* Favorite Sports Figures */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-lg font-bold text-slate-200 flex items-center">
                      <span className="text-2xl mr-2">⚽</span>
                      Favorite Athletes/Sports Figures
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfile({...profile, favoriteSportsFigures: ''})}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all duration-300"
                    >
                      ✕
                    </motion.button>
                  </div>
                  <input
                    type="text"
                    value={profile.favoriteSportsFigures}
                    onChange={(e) => setProfile({...profile, favoriteSportsFigures: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-purple-500/10"
                    placeholder="e.g., Messi, Ronaldo, Serena Williams"
                  />
                </motion.div>

                {/* Favorite Artists */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-lg font-bold text-slate-200 flex items-center">
                      <span className="text-2xl mr-2">🎨</span>
                      Favorite Artists/Painters
                    </label>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfile({...profile, favoriteArtists: ''})}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all duration-300"
                    >
                      ✕
                    </motion.button>
                  </div>
                  <input
                    type="text"
                    value={profile.favoriteArtists}
                    onChange={(e) => setProfile({...profile, favoriteArtists: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-pink-500/10"
                    placeholder="e.g., Frida Kahlo, Van Gogh, Banksy"
                  />
                </motion.div>

                {/* Custom Categories */}
                {customCategories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-lg font-bold text-slate-200 flex items-center">
                        <span className="text-2xl mr-2">⭐</span>
                        {category.name}
                      </label>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeCustomCategory(category.id)}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-all duration-300"
                      >
                        ✕
                      </motion.button>
                    </div>
                    <input
                      type="text"
                      value={category.value}
                      onChange={(e) => {
                        const updatedCategories = customCategories.map(cat => 
                          cat.id === category.id ? { ...cat, value: e.target.value } : cat
                        );
                        setCustomCategories(updatedCategories);
                      }}
                      className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-cyan-500/10"
                      placeholder={`Enter your favorite ${category.name.toLowerCase()}`}
                    />
                  </motion.div>
                ))}
              </div>

            </motion.div>

            {/* Add Custom Category - Compact Design */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{ 
                opacity: { duration: 0.5 },
                y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Add New Category
                </h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-white font-bold transition-all duration-300"
                    placeholder="Category name (e.g., Movies, Podcasts)"
                  />
                </div>
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={newCategoryValue}
                    onChange={(e) => setNewCategoryValue(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 text-white font-bold transition-all duration-300"
                    placeholder="Your favorites (e.g., Christopher Nolan, Joe Rogan)"
                  />
                </div>
                
                <motion.button
                  onClick={async () => {
                    if (newCategoryName.trim() && newCategoryValue.trim()) {
                      const newCategory = {
                        id: Date.now().toString(),
                        name: newCategoryName.trim(),
                        value: newCategoryValue.trim()
                      };
                      const updatedCategories = [...customCategories, newCategory];
                      setCustomCategories(updatedCategories);
                      setNewCategoryName('');
                      setNewCategoryValue('');
                      
                      // Save to database
                      try {
                        await fetch('/api/user', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            customCategories: JSON.stringify(updatedCategories)
                          })
                        });
                      } catch (error) {
                        console.error('Error saving custom categories:', error);
                      }
                    }
                  }}
                  disabled={!newCategoryName.trim() || !newCategoryValue.trim()}
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="ml-6 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-bold shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-2xl border border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
                  <div className="relative flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                      <path d="M5 12h14"></path>
                      <path d="M12 5v14"></path>
                    </svg>
                  </div>
                </motion.button>
              </div>
            </motion.div>

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