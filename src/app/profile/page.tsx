"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Save, Sparkles, Heart, Star, Zap, Palette, Music, BookOpen, Gamepad2, Plus, Minus, Settings, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AISettings from '@/components/settings/AISettings';

export default function ProfilePage() {
  const router = useRouter();
  
  // Add global styles to hide spinner arrows
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
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

  // AI Settings
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<{
    openai: { isConnected: boolean; lastUsed: string | null };
    gemini: { isConnected: boolean; lastUsed: string | null };
    textcortex: { isConnected: boolean; lastUsed: string | null };
  }>({
    openai: { isConnected: false, lastUsed: null },
    gemini: { isConnected: false, lastUsed: null },
    textcortex: { isConnected: false, lastUsed: null }
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // Custom categories removed from schema

  // Load AI configuration
  const loadAIConfig = async () => {
    try {
      // Check localStorage for stored API keys
      const openaiKey = localStorage.getItem('openai_api_key');
      const geminiKey = localStorage.getItem('gemini_api_key');
      const textcortexKey = localStorage.getItem('textcortex_api_key');
      
      const config = {
        openai: { 
          isConnected: !!openaiKey, 
          lastUsed: openaiKey ? new Date().toISOString() : null 
        },
        gemini: { 
          isConnected: !!geminiKey, 
          lastUsed: geminiKey ? new Date().toISOString() : null 
        },
        textcortex: { 
          isConnected: !!textcortexKey, 
          lastUsed: textcortexKey ? new Date().toISOString() : null 
        }
      };
      
      setAiConfig(config);
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  useEffect(() => {
    loadAIConfig();
  }, []);
  
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
    const newValue = Math.max(currentValue - 1, 0); // Allow going down to 0 for all fields
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
                  <div className="relative">
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile({...profile, gender: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-purple-500/10 appearance-none pr-12"
                    >
                      <option value="">Choose your identity</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <span className="text-violet-400 text-lg">▼</span>
                    </div>
                  </div>
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
                      type="text"
                      value={profile.age}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
                        setProfile({...profile, age: value});
                      }}
                      className="flex-1 px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-cyan-500/10 text-center"
                      placeholder="Your age"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                      }}
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
                      type="text"
                      value={profile.height}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, ''); // Only allow numbers and decimal
                        setProfile({...profile, height: value});
                      }}
                      className="flex-1 px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-green-500/10 text-center"
                      placeholder="Your height"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                      }}
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
                      type="text"
                      value={profile.weight}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, ''); // Only allow numbers and decimal
                        setProfile({...profile, weight: value});
                      }}
                      className="flex-1 px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-orange-500/10 text-center"
                      placeholder="Your weight"
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'textfield'
                      }}
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
                  <div className="relative">
                    <select
                      value={profile.universityLevel}
                      onChange={(e) => setProfile({...profile, universityLevel: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 text-white font-bold transition-all duration-300 group-hover:shadow-xl shadow-lg hover:shadow-blue-500/10 appearance-none pr-12"
                    >
                      <option value="">Choose your level</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="master">Master's</option>
                      <option value="phd">PhD</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <span className="text-violet-400 text-lg">▼</span>
                    </div>
                  </div>
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

            {/* AI Settings Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                opacity: { duration: 0.5, delay: 0.6 },
                y: { duration: 0.5, delay: 0.6 }
              }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="mr-4"
                  >
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                  <h2 className="text-4xl font-black bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                    AI Services
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    console.log('Manage AI button clicked!');
                    setShowAISettings(true);
                  }}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-blue-400 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 shadow-lg font-semibold transition-all duration-300 cursor-pointer relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Manage AI
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* OpenAI Status */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-2xl border-2 shadow-lg ${
                    aiConfig.openai.isConnected 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/50' 
                      : 'bg-gradient-to-br from-slate-500/20 to-slate-600/20 border-slate-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
             <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
               <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-white">
                 <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
               </svg>
             </div>
                    <div className={`w-3 h-3 rounded-full ${aiConfig.openai.isConnected ? 'bg-green-400' : 'bg-slate-400'}`}></div>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">OpenAI</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    {aiConfig.openai.isConnected ? 'Connected and ready' : 'Not connected'}
                  </p>
                  {aiConfig.openai.lastUsed && (
                    <p className="text-slate-400 text-xs">
                      Last used: {new Date(aiConfig.openai.lastUsed).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>

                {/* Gemini Status */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-2xl border-2 shadow-lg ${
                    aiConfig.gemini.isConnected 
                      ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/50' 
                      : 'bg-gradient-to-br from-slate-500/20 to-slate-600/20 border-slate-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                      <svg viewBox="0 0 16 16" className="w-8 h-8 fill-current text-white">
                        <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#prefix__paint0_radial_980_20147)"/>
                        <defs>
                          <radialGradient id="prefix__paint0_radial_980_20147" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)">
                            <stop offset=".067" stopColor="#9168C0"/>
                            <stop offset=".343" stopColor="#5684D1"/>
                            <stop offset=".672" stopColor="#1BA1E3"/>
                          </radialGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${aiConfig.gemini.isConnected ? 'bg-blue-400' : 'bg-slate-400'}`}></div>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Google Gemini</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    {aiConfig.gemini.isConnected ? 'Connected and ready' : 'Not connected'}
                  </p>
                  {aiConfig.gemini.lastUsed && (
                    <p className="text-slate-400 text-xs">
                      Last used: {new Date(aiConfig.gemini.lastUsed).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>

                {/* TextCortex Status */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-2xl border-2 shadow-lg ${
                    aiConfig.textcortex.isConnected 
                      ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 border-purple-400/50' 
                      : 'bg-gradient-to-br from-slate-500/20 to-slate-600/20 border-slate-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-lg">
                      <svg viewBox="0 0 2000 2000" className="w-12 h-12 fill-current text-white">
                        <defs>
                          <linearGradient id="paint0_linear_461_719" x1="350.014" y1="470.01" x2="1388.96" y2="1743.1" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FF805F"/>
                            <stop offset="0.5" stopColor="#B74BDD"/>
                            <stop offset="1" stopColor="#0379FF"/>
                          </linearGradient>
                        </defs>
                        <path fillRule="evenodd" clipRule="evenodd" d="M1308.48 1291.92C1308.53 1291.99 1308.58 1292.05 1308.62 1292.13L1308.84 1292.36C1308.72 1292.22 1308.6 1292.07 1308.48 1291.92ZM1150.88 1099.73L1150.87 1099.74L1030.02 1207.98L1030.08 1208.05H1030.02V1377.97C1030.02 1462.21 1098.3 1530.49 1182.54 1530.49C1266.26 1530.49 1334.23 1463.04 1335.05 1379.51C1349.42 1383.99 1364.7 1386.41 1380.54 1386.41C1464.77 1386.41 1533.06 1318.13 1533.06 1233.89C1533.06 1203.86 1524.38 1175.87 1509.4 1152.27C1587.82 1145.95 1649.49 1080.31 1649.49 1000.25C1649.49 920.26 1587.91 854.652 1509.58 848.24C1524.45 824.7 1533.06 796.801 1533.06 766.89C1533.06 682.661 1464.77 614.371 1380.54 614.371C1364.7 614.371 1349.42 616.79 1335.05 621.271C1334.38 537.621 1266.35 470.01 1182.54 470.01C1098.3 470.01 1030.02 538.3 1030.02 622.531V792.309L1030.18 792.45L1150.87 900.549L1150.88 900.561L1150.88 1099.73ZM1275.06 622.531C1275.06 640.309 1270.04 656.92 1261.34 671.02L1234.94 698.781L1202.92 732.451H1090.02V622.531C1090.02 571.44 1131.44 530.011 1182.54 530.011C1233.63 530.011 1275.06 571.44 1275.06 622.531ZM1210.88 1092.77V907.732H1496.97C1548.06 907.732 1589.49 949.16 1589.49 1000.25C1589.49 1051.35 1548.06 1092.77 1496.97 1092.77H1210.88ZM1090.02 1268.05H1202.91L1234.96 1301.73L1261.33 1329.46C1270.04 1343.56 1275.06 1360.18 1275.06 1377.97C1275.06 1429.07 1233.63 1470.49 1182.54 1470.49C1131.43 1470.49 1090.02 1429.07 1090.02 1377.97L1090.02 1268.05ZM1181.6 1152.77H1425.05C1453.66 1168.5 1473.06 1198.93 1473.06 1233.89C1473.06 1284.99 1431.63 1326.41 1380.54 1326.41C1356.71 1326.41 1334.99 1317.4 1318.59 1302.6L1318.55 1302.56C1315.07 1299.43 1311.82 1296.02 1308.86 1292.38L1308.84 1292.36L1308.62 1292.13L1274.61 1256.37L1230.2 1209.67L1229.97 1209.43L1228.66 1208.05H1119.87L1181.6 1152.77ZM1120.11 792.45H1228.66L1229.93 791.111L1230.2 790.832L1274.59 744.141L1308.65 708.332L1311.06 705.802L1311.08 705.781C1312.63 704.021 1314.25 702.311 1315.93 700.691V700.681C1332.6 684.402 1355.4 674.372 1380.54 674.372C1431.63 674.372 1473.06 715.8 1473.06 766.891C1473.06 801.653 1453.89 831.931 1425.55 847.731H1181.83L1120.11 792.45ZM1030.18 792.45H1030.02L1030.02 792.309L1030.18 792.45ZM1030.18 792.45H1030.02L1030.02 792.309L1030.18 792.45ZM1315.93 700.691L1311.08 705.781C1312.63 704.022 1314.25 702.312 1315.93 700.691ZM1318.55 1302.56C1315.07 1299.43 1311.82 1296.02 1308.86 1292.38L1318.55 1302.56ZM1150.88 900.561L1150.88 907.732H1150.87V900.548L1150.88 900.561ZM1150.88 1092.77V1099.73L1150.87 1099.74V1092.77H1150.88ZM690.665 1292.36L690.885 1292.13C690.926 1292.05 690.974 1291.99 691.026 1291.92C690.904 1292.07 690.785 1292.22 690.665 1292.36ZM848.625 900.561L848.635 900.549L969.324 792.45L969.486 792.309V622.531C969.486 538.3 901.205 470.01 816.965 470.01C733.155 470.01 665.123 537.62 664.453 621.271C650.083 616.791 634.803 614.371 618.965 614.371C534.734 614.371 466.444 682.661 466.444 766.89C466.444 796.801 475.055 824.7 489.925 848.24C411.594 854.652 350.014 920.26 350.014 1000.25C350.014 1080.31 411.683 1145.95 490.102 1152.27C475.123 1175.87 466.443 1203.86 466.443 1233.89C466.443 1318.13 534.733 1386.41 618.964 1386.41C634.802 1386.41 650.083 1383.99 664.452 1379.51C665.275 1463.04 733.244 1530.49 816.964 1530.49C901.203 1530.49 969.485 1462.21 969.485 1377.97V1208.05H969.424L969.485 1207.98L848.634 1099.74L848.624 1099.73L848.625 900.561ZM816.965 530.011C868.065 530.011 909.484 571.44 909.484 622.531V732.451H796.584L764.563 698.781L738.163 671.02C729.464 656.919 724.446 640.309 724.446 622.531C724.446 571.44 765.876 530.011 816.965 530.011ZM502.535 1092.77C451.446 1092.77 410.014 1051.35 410.014 1000.25C410.014 949.16 451.445 907.732 502.535 907.732H788.626V1092.77H502.535ZM909.484 1377.97C909.484 1429.07 868.065 1470.49 816.965 1470.49C765.876 1470.49 724.446 1429.07 724.446 1377.97C724.446 1360.18 729.464 1343.56 738.175 1329.46L764.545 1301.73L796.585 1268.05H909.484V1377.97ZM879.636 1208.05H770.845L769.535 1209.43L769.306 1209.67L724.895 1256.37L690.885 1292.13L690.665 1292.36L690.646 1292.38C687.686 1296.02 684.435 1299.43 680.955 1302.56L680.915 1302.6C664.515 1317.4 642.795 1326.41 618.965 1326.41C567.874 1326.41 526.444 1284.99 526.444 1233.89C526.444 1198.93 545.845 1168.5 574.455 1152.77H817.905L879.636 1208.05ZM817.675 847.73H573.955C545.617 831.93 526.445 801.651 526.445 766.89C526.445 715.799 567.875 674.371 618.966 674.371C644.106 674.371 666.906 684.401 683.576 700.68V700.69C685.257 702.31 686.875 704.02 688.425 705.78L688.446 705.801L690.855 708.331L724.906 744.14L769.307 790.831L769.566 791.11L770.847 792.449H879.397L817.675 847.73ZM969.486 792.309V792.45H969.324L969.486 792.309ZM969.486 l2.309V792.45H969.324L969.486 792.309ZM688.425 705.78L683.576 700.69C685.257 702.311 686.876 704.021 688.425 705.78ZM690.646 1292.38C687.686 1296.02 684.435 1299.43 680.955 1302.56L690.646 1292.38ZM848.635 900.548V907.732H848.625V900.561L848.635 900.548ZM848.635 1092.77V1099.74L848.624 1099.73L848.625 1092.77H848.635Z" fill="url(#paint0_linear_461_719)"/>
                      </svg>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${aiConfig.textcortex.isConnected ? 'bg-purple-400' : 'bg-slate-400'}`}></div>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">TextCortex</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    {aiConfig.textcortex.isConnected ? 'Connected and ready' : 'Not connected'}
                  </p>
                  {aiConfig.textcortex.lastUsed && (
                    <p className="text-slate-400 text-xs">
                      Last used: {new Date(aiConfig.textcortex.lastUsed).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              </div>

              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
                <p className="text-slate-300 text-sm">
                  <span className="text-blue-400 font-semibold">💡 Tip:</span> Connect your AI accounts to get personalized suggestions and recommendations. Your API keys are encrypted and stored securely.
                </p>
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

      {/* AI Settings Modal */}
      <AnimatePresence>
        {showAISettings && (
          <AISettings
            onClose={() => setShowAISettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}