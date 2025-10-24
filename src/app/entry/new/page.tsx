"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ParameterSlider from "@/components/ui/ParameterSlider";
import ActivitySelector from "@/components/ui/ActivitySelector";
import { generateAISuggestions } from "@/lib/aiService";

// Helper functions for genre styling
const getGenreSelectedStyle = (genre: string) => {
  const colorMap: { [key: string]: string } = {
    'Pop': 'bg-gradient-to-r from-pink-500/30 to-rose-500/20 text-white shadow-lg scale-105 border border-pink-400/50',
    'Hip-Hop': 'bg-gradient-to-r from-purple-500/30 to-indigo-500/20 text-white shadow-lg scale-105 border border-purple-400/50',
    'Dance': 'bg-gradient-to-r from-cyan-500/30 to-blue-500/20 text-white shadow-lg scale-105 border border-cyan-400/50',
    'Electronic': 'bg-gradient-to-r from-green-500/30 to-emerald-500/20 text-white shadow-lg scale-105 border border-green-400/50',
    'Indie Pop': 'bg-gradient-to-r from-yellow-500/30 to-orange-500/20 text-white shadow-lg scale-105 border border-yellow-400/50',
    'K-Pop': 'bg-gradient-to-r from-red-500/30 to-pink-500/20 text-white shadow-lg scale-105 border border-red-400/50',
    'Reggaeton': 'bg-gradient-to-r from-orange-500/30 to-red-500/20 text-white shadow-lg scale-105 border border-orange-400/50',
    'R&B': 'bg-gradient-to-r from-blue-500/30 to-purple-500/20 text-white shadow-lg scale-105 border border-blue-400/50',
    'Alternative': 'bg-gradient-to-r from-slate-500/30 to-gray-500/20 text-white shadow-lg scale-105 border border-slate-400/50',
    'Fitness Remix': 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 text-white shadow-lg scale-105 border border-emerald-400/50',
    'Yoga Chill': 'bg-gradient-to-r from-teal-500/30 to-cyan-500/20 text-white shadow-lg scale-105 border border-teal-400/50',
    'Motivational': 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-white shadow-lg scale-105 border border-amber-400/50'
  };
  return colorMap[genre] || 'bg-gradient-to-r from-blue-500/30 to-purple-500/20 text-white shadow-lg scale-105 border border-blue-400/50';
};

const getGenreUnselectedStyle = (genre: string) => {
  // All unselected genres use the same muted styling
  return 'bg-gradient-to-r from-slate-500/15 to-gray-500/10 text-slate-200 hover:from-slate-500/25 hover:to-gray-500/15 border border-slate-400/20 hover:border-slate-300/40';
};

// Time slot configuration
const timeSlots = [
  {
    id: 'morning',
    name: 'Morning',
    hours: [5, 6, 7, 8, 9, 10],
    color: 'from-orange-500/30 to-yellow-500/20',
    borderColor: 'border-orange-400/50',
    textColor: 'text-orange-200',
    icon: '🌅'
  },
  {
    id: 'midday',
    name: 'Midday',
    hours: [11, 12, 13, 14, 15, 16],
    color: 'from-blue-500/30 to-cyan-500/20',
    borderColor: 'border-blue-400/50',
    textColor: 'text-blue-200',
    icon: '☀️'
  },
  {
    id: 'evening',
    name: 'Evening',
    hours: [17, 18, 19, 20, 21, 22],
    color: 'from-purple-500/30 to-pink-500/20',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-200',
    icon: '🌆'
  },
  {
    id: 'night',
    name: 'Night',
    hours: [23, 0, 1, 2, 3, 4],
    color: 'from-indigo-500/30 to-slate-500/20',
    borderColor: 'border-indigo-400/50',
    textColor: 'text-indigo-200',
    icon: '🌙'
  }
];

export default function NewEntry() {
  const router = useRouter();
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  
  // AI Preference Learning state
  const [preferenceOptions, setPreferenceOptions] = useState<any[]>([]);
  const [dssAnalysis, setDssAnalysis] = useState<any>(null);
  const [isGeneratingPreferences, setIsGeneratingPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'genres' | 'specifics'>('genres');
  const [genreOptions, setGenreOptions] = useState<any[]>([]);
  const [customInput, setCustomInput] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [preferencesLocked, setPreferencesLocked] = useState<boolean>(false);
  const [enablePreferenceLearning, setEnablePreferenceLearning] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    valence: 5,
    energy: 5,
    focus: 5,
    stress: 5,
    sleep: 8,
    activities: [] as string[],
    selectedTimeSlots: [] as string[],
    selectedSubcategories: [] as string[],
    dssAnalysis: null as any,
    onPeriod: false,
    waterIntake: 0,
    mealsEaten: 0,
    mealQuality: 'good',
    caffeine: 0,
    alcohol: 0,
  });

  // Increment/Decrement helpers (no upper limit)
  const adjustCount = (key: 'waterIntake' | 'mealsEaten' | 'caffeine' | 'alcohol', delta: number) => {
    setFormData(prev => {
      const current = (prev as any)[key] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  };

  const handleChange = (name: string, value: number | string | string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Load user preferences on component mount
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await fetch('/api/user?userId=dummy-user');
        if (response.ok) {
          const user = await response.json();
          setUserInfo(user);
          setUserPreferences({
            interests: user.interests ? JSON.parse(user.interests) : [],
            quoteStyle: user.quoteStyle,
            favoriteWriters: user.favoriteWriters ? user.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
            favoriteSportsFigures: user.favoriteSportsFigures ? user.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            favoriteMusicians: user.favoriteMusicians ? user.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
            favoriteArtists: user.favoriteArtists ? user.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
            favoriteMovies: user.favoriteMovies ? user.favoriteMovies.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
            favoritePhilosophers: user.favoritePhilosophers ? user.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : []
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };
    
    fetchUserPreferences();
  }, []);

  // Generate preference options when activities change
  useEffect(() => {
    if (!enablePreferenceLearning || preferencesLocked) return; // do not regenerate once locked or when disabled
    if (formData.activities.length > 0) {
      generateGenreOptions();
    } else {
      setPreferenceOptions([]);
      setSelectedPreferences([]);
      setGenreOptions([]);
      setSelectedGenres([]);
      setCurrentStep('genres');
    }
  }, [formData.activities, preferencesLocked, enablePreferenceLearning]);

  // Clear options when user disables learning toggle
  useEffect(() => {
    if (!enablePreferenceLearning) {
      setPreferenceOptions([]);
      setSelectedPreferences([]);
      setGenreOptions([]);
      setSelectedGenres([]);
      setCurrentStep('genres');
      setPreferencesLocked(false);
    }
  }, [enablePreferenceLearning]);

  const generateGenreOptions = async () => {
    if (preferencesLocked) return;
    setIsGeneratingPreferences(true);
    try {
      // Fetch user info for AI
      const userResponse = await fetch('/api/user?userId=dummy-user');
      const userInfo = userResponse.ok ? await userResponse.json() : {};
      
      // Generate AI-powered genre options for each activity
      const genrePromises = formData.activities.map(async (activity) => {
        try {
          const response = await fetch('/api/ai-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity,
              preferenceType: 'genres',
              userInfo: {
                age: userInfo.age || 25,
                gender: userInfo.gender || 'other',
                interests: userInfo.interests ? JSON.parse(userInfo.interests) : []
              }
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Debug: Show the AI prompt and response
            if (data.debug) {
              console.log('🔍 AI DEBUG INFO:');
              console.log('Activity:', data.debug.activity);
              console.log('Preference Type:', data.debug.preferenceType);
              console.log('Selected Genres:', data.debug.selectedGenres);
              console.log('User Info:', data.debug.userInfo);
              console.log('FULL PROMPT:');
              console.log('=====================================');
              console.log(data.debug.prompt);
              console.log('=====================================');
              console.log('AI RESPONSE:');
              console.log('=====================================');
              console.log(data.debug.aiResponse);
              console.log('=====================================');
            }
            
            // Store DSS analysis for this activity
            if (data.dssAnalysis) {
              setFormData(prev => ({
                ...prev,
                dssAnalysis: {
                  ...prev.dssAnalysis,
                  [activity]: data.dssAnalysis
                }
              }));
            }
            
            return {
              activity,
              title: `${activity.charAt(0).toUpperCase() + activity.slice(1)} Styles`,
              description: `What ${activity} styles did you do today?`,
              options: data.suggestions
            };
          }
        } catch (error) {
          console.error(`Error generating genres for ${activity}:`, error);
        }
        return null;
      });
      
      const results = await Promise.all(genrePromises);
      const validGenres = results.filter(Boolean);
      
      setGenreOptions(validGenres);
      setSelectedGenres([]);
      setCurrentStep('genres');
    } catch (error) {
      console.error('Error generating genre options:', error);
    } finally {
      setIsGeneratingPreferences(false);
    }
  };

  const generateSpecificOptions = async (selectedGenres: string[]) => {
    if (preferencesLocked) return;
    setIsGeneratingPreferences(true);
    try {
      // Fetch user info for AI
      const userResponse = await fetch('/api/user?userId=dummy-user');
      const userInfo = userResponse.ok ? await userResponse.json() : {};
      
      // Get existing favorites to exclude them
      const existingFavorites = [
        ...(userInfo.favoriteWriters ? userInfo.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : []),
        ...(userInfo.favoriteMusicians ? userInfo.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : []),
        ...(userInfo.favoriteSportsFigures ? userInfo.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
        ...(userInfo.favoriteArtists ? userInfo.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : []),
        ...(userInfo.favoritePhilosophers ? userInfo.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : [])
      ];
      
      // Generate AI-powered specific options for each activity
      const specificPromises = formData.activities.map(async (activity) => {
        try {
          const response = await fetch('/api/ai-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity,
              selectedGenres,
              preferenceType: 'specifics',
              userInfo: {
                age: userInfo.age || 25,
                gender: userInfo.gender || 'other',
                interests: userInfo.interests ? JSON.parse(userInfo.interests) : []
              },
              existingFavorites
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Debug: Show the AI prompt and response
            if (data.debug) {
              console.log('🔍 AI DEBUG INFO (SPECIFICS):');
              console.log('Activity:', data.debug.activity);
              console.log('Preference Type:', data.debug.preferenceType);
              console.log('Selected Genres:', data.debug.selectedGenres);
              console.log('User Info:', data.debug.userInfo);
              console.log('FULL PROMPT:');
              console.log('=====================================');
              console.log(data.debug.prompt);
              console.log('=====================================');
              console.log('AI RESPONSE:');
              console.log('=====================================');
              console.log(data.debug.aiResponse);
              console.log('=====================================');
            }
            
            const category = getCategoryForActivity(activity);
            
            // Store DSS analysis for the first activity (we'll show it for the primary activity)
            if (data.dssAnalysis && !dssAnalysis) {
              setDssAnalysis(data.dssAnalysis);
            }
            
            return {
              category,
              title: getTitleForActivity(activity),
              description: `Select ${activity} favorites based on your chosen genres (${selectedGenres.join(', ')})`,
              options: data.suggestions,
              currentCount: getCurrentCountForCategory(category, userInfo),
              dssAnalysis: data.dssAnalysis
            };
          }
        } catch (error) {
          console.error(`Error generating specifics for ${activity}:`, error);
        }
        return null;
      });
      
      const results = await Promise.all(specificPromises);
      const validOptions = results.filter(Boolean);
      
      setPreferenceOptions(validOptions);
      setSelectedPreferences([]);
      setCurrentStep('specifics');
    } catch (error) {
      console.error('Error generating specific options:', error);
    } finally {
      setIsGeneratingPreferences(false);
    }
  };

  // Helper functions for AI-powered preferences
  const getCategoryForActivity = (activity: string): string => {
    const categories: { [key: string]: string } = {
      'reading': 'favoriteWriters',
      'music': 'favoriteMusicians',
      'dancing': 'favoriteMusicians',
      'gym': 'favoriteSportsFigures',
      'football': 'favoriteSportsFigures',
      'running': 'favoriteSportsFigures',
      'art': 'favoriteArtists',
      'painting': 'favoriteArtists',
      'drawing': 'favoriteArtists',
      'watching': 'favoriteMovies', // movies and TV shows
      'movies': 'favoriteMovies',
      'tv': 'favoriteMovies',
      'philosophy': 'favoritePhilosophers'
    };
    return categories[activity] || 'favoriteWriters';
  };

  const getTitleForActivity = (activity: string): string => {
    const titles: { [key: string]: string } = {
      'reading': 'Favorite Writers/Authors',
      'music': 'Favorite Musicians/Artists',
      'dancing': 'Favorite Musicians/Artists',
      'gym': 'Favorite Athletes/Sports Figures',
      'football': 'Favorite Athletes/Sports Figures',
      'running': 'Favorite Athletes/Sports Figures',
      'art': 'Favorite Artists/Painters',
      'painting': 'Favorite Artists/Painters',
      'drawing': 'Favorite Artists/Painters',
      'watching': 'Favorite Movies & TV Shows',
      'movies': 'Favorite Movies',
      'tv': 'Favorite TV Shows',
      'philosophy': 'Favorite Philosophers'
    };
    return titles[activity] || 'Favorite Writers/Authors';
  };

  const getCurrentCountForCategory = (category: string, userInfo: any): number => {
    const field = userInfo[category];
    if (!field) return 0;
    return field.split(',').filter((item: string) => item.trim()).length;
  };


  const savePreferences = async () => {
    if (selectedPreferences.length === 0) return;
    
    try {
      // Group selected preferences by category and append to existing ones
      const preferencesToSave: any = {};
      
      preferenceOptions.forEach(option => {
        const categoryPreferences = selectedPreferences.filter(pref => 
          option.options.includes(pref)
        );
        if (categoryPreferences.length > 0) {
          // Get current preferences for this category
          const currentPreferences = userPreferences?.[option.category] || [];
          // Combine with new preferences and remove duplicates
          const combinedPreferences = [...new Set([...currentPreferences, ...categoryPreferences])];
          preferencesToSave[option.category] = combinedPreferences.join(', ');
        }
      });
      
      // Save to user profile
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'dummy-user',
          ...preferencesToSave
        })
      });
      
      if (response.ok) {
        console.log('✅ Preferences saved successfully!');
        setSelectedPreferences([]);
        setPreferencesLocked(true);
        // Reload user preferences
        const userResponse = await fetch('/api/user?userId=dummy-user');
        if (userResponse.ok) {
          const user = await userResponse.json();
          setUserPreferences({
            interests: user.interests ? JSON.parse(user.interests) : [],
            quoteStyle: user.quoteStyle,
            favoriteWriters: user.favoriteWriters ? user.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
            favoriteSportsFigures: user.favoriteSportsFigures ? user.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            favoriteMusicians: user.favoriteMusicians ? user.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
            favoriteArtists: user.favoriteArtists ? user.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
            favoritePhilosophers: user.favoritePhilosophers ? user.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : []
          });
        }
        // Do not regenerate options; keep section locked
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Voice recording started');
      };
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setReflection(prev => prev + finalTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try speaking clearly.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else {
          alert(`Speech recognition error: ${event.error}`);
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
        console.log('Voice recording ended');
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  };
  
  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/mood-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valence: formData.valence,
          energy: formData.energy,
          focus: formData.focus,
          stress: formData.stress,
          sleep: formData.sleep,
          notes: reflection, // Save reflection as notes
          activities: formData.activities,
          selectedTimeSlots: formData.selectedTimeSlots,
          selectedSubcategories: formData.selectedSubcategories,
          dssAnalysis: formData.dssAnalysis ? JSON.stringify(formData.dssAnalysis) : null,
          onPeriod: formData.onPeriod,
          waterIntake: formData.waterIntake,
          mealsEaten: formData.mealsEaten,
          mealQuality: formData.mealQuality,
          caffeine: formData.caffeine,
          alcohol: formData.alcohol,
        }),
      });

      if (response.ok) {
        console.log("Entry saved successfully!");
        router.push("/stats");
      } else {
        const errorData = await response.json();
        alert(`Failed to save mood entry: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Error saving mood entry:", error);
      alert(`Failed to save mood entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      {/* Futuristic Background */}
      <div className="absolute inset-0">
        {/* Animated Grid Pattern */}
        <div className="absolute top-24 left-0 right-0 bottom-0 z-0 bg-[linear-gradient(90deg,transparent_24%,rgba(147,51,234,0.1)_25%,rgba(147,51,234,0.1)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1)_76%,transparent_77%)] bg-[length:50px_50px] animate-pulse"></div>
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/30 rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
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
        className="max-w-4xl mx-auto py-8 relative z-10"
      >
      
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mood Parameters Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8"
          >
            {/* Glowing Edge Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <motion.span
                    className="mr-2 text-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🎭
                  </motion.span>
                  Mood Parameters
                </h2>
              </div>
              
              <div className="space-y-4">
                {/* Parameter Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <ParameterSlider
                  label="Valence"
                  value={formData.valence}
                  onChange={(val) => handleChange("valence", val)}
                  min={1}
                  max={10}
                  minLabel="Negative"
                  maxLabel="Positive"
                  color="from-red-400 to-green-500"
                  icon="😊"
                  valueLabels={{
                    1: "Very Negative", 2: "Negative", 3: "Slightly Negative", 4: "Neutral-", 5: "Neutral",
                    6: "Neutral+", 7: "Slightly Positive", 8: "Positive", 9: "Very Positive", 10: "Ecstatic"
                  }}
                />

                    <ParameterSlider
                      label="Energy"
                      value={formData.energy}
                      onChange={(val) => handleChange("energy", val)}
                      min={1}
                      max={10}
                      minLabel="Drained"
                      maxLabel="Energized"
                      color="from-blue-400 to-yellow-500"
                      icon="⚡"
                      valueLabels={{
                        1: "Exhausted", 2: "Very Low", 3: "Low", 4: "Tired", 5: "Normal",
                        6: "Rested", 7: "Active", 8: "High", 9: "Very High", 10: "Hyper"
                      }}
                    />

                    <ParameterSlider
                      label="Focus"
                      value={formData.focus}
                      onChange={(val) => handleChange("focus", val)}
                      min={1}
                      max={10}
                      minLabel="Distracted"
                      maxLabel="Focused"
                      color="from-purple-400 to-pink-500"
                      icon="🎯"
                      valueLabels={{
                        1: "Completely Distracted", 2: "Very Distracted", 3: "Distracted", 4: "Wandering", 5: "Moderate",
                        6: "Attentive", 7: "Engaged", 8: "Highly Focused", 9: "Deep Focus", 10: "Laser Focus"
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <ParameterSlider
                      label="Stress"
                      value={formData.stress}
                      onChange={(val) => handleChange("stress", val)}
                      min={1}
                      max={10}
                      minLabel="Calm"
                      maxLabel="Stressed"
                      color="from-green-400 to-red-500"
                      icon="😟"
                      valueLabels={{
                        1: "Zen Master", 2: "Very Calm", 3: "Calm", 4: "Relaxed", 5: "Mild",
                        6: "Moderate", 7: "Elevated", 8: "High", 9: "Very High", 10: "Overwhelmed"
                      }}
                    />

                    <ParameterSlider
                      label="Sleep"
                      value={formData.sleep}
                      onChange={(val) => handleChange("sleep", val)}
                      min={0}
                      max={12}
                      minLabel="No sleep"
                      maxLabel="12+ hours"
                      color="from-indigo-400 to-purple-500"
                      icon="😴"
                      valueLabels={{
                        0: "No sleep", 1: "1 hour", 2: "2 hours", 3: "3 hours", 4: "4 hours", 5: "5 hours",
                        6: "6 hours", 7: "7 hours", 8: "8 hours", 9: "9 hours", 10: "10 hours", 11: "11 hours", 12: "12+ hours"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>


          {/* Activities Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.3 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8"
          >
            {/* Glowing Edge Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <motion.span
                    className="mr-2 text-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🎯
                  </motion.span>
                  Activities
                </h2>
                
                {/* AI Toggle Button */}
                <motion.button
                  type="button"
                  onClick={() => setEnablePreferenceLearning(!enablePreferenceLearning)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    enablePreferenceLearning
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-500/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center space-x-2">
                    <motion.span
                      className="text-lg"
                      animate={{ rotate: enablePreferenceLearning ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      🤖
                    </motion.span>
                    <span className="hidden sm:inline">
                      {enablePreferenceLearning ? 'AI Enabled' : 'AI Disabled'}
                    </span>
                  </div>
                  
                  {/* Glow effect when enabled */}
                  {enablePreferenceLearning && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-sm"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              </div>
              
              <ActivitySelector
                selectedActivities={formData.activities}
                onActivityToggle={(activity) => {
                  const newActivities = formData.activities.includes(activity)
                    ? formData.activities.filter(a => a !== activity)
                    : [...formData.activities, activity];
                  handleChange("activities", newActivities);
                }}
              />
            </div>
          </motion.div>

          

          {/* AI Preference Learning */}
          {enablePreferenceLearning && formData.activities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -3, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 0.5 },
                y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8"
            >
              {/* Glowing Edge Effect */}
              <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <motion.span
                    className="mr-2 text-2xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎯
                  </motion.span>
                  Help Us Know You Better
                </h3>
            
            
                {preferencesLocked ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-lg font-semibold text-white mb-2">All Preferences Saved!</h4>
                    <p className="text-slate-300 mb-4">
                      Your selections are saved and locked for this entry.
                    </p>
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-400/30">
                      <p className="text-sm text-blue-200">
                        ✅ We will use them for AI personalization now.
                      </p>
                    </div>
                  </div>
                ) : isGeneratingPreferences ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-300">Loading preference options...</span>
                  </div>
                ) : currentStep === 'genres' && genreOptions.length > 0 ? (
                  <div className="space-y-6">
                    {genreOptions.map((option, index) => (
                      <div key={index} className="bg-slate-800/40 backdrop-blur-xl rounded-lg p-4 border-2 border-blue-400/30">
                        <h4 className="font-semibold text-white mb-2">{option.title}</h4>
                        <p className="text-sm text-slate-300 mb-4">{option.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {option.options.map((genre: string) => (
                            <button
                              key={genre}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (selectedGenres.includes(genre)) {
                                  setSelectedGenres(prev => prev.filter(g => g !== genre));
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedSubcategories: prev.selectedSubcategories.filter(g => g !== genre)
                                  }));
                                } else {
                                  setSelectedGenres(prev => [...prev, genre]);
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedSubcategories: [...prev.selectedSubcategories, genre]
                                  }));
                                }
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-sm ${
                                selectedGenres.includes(genre)
                                  ? getGenreSelectedStyle(genre)
                                  : getGenreUnselectedStyle(genre)
                              }`}
                            >
                              {genre}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                
                    {selectedGenres.length > 0 && (
                      <div className="flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/15 rounded-2xl p-5 border border-blue-400/30 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">✅</span>
                          <span className="text-sm font-semibold text-white">
                            {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
                          </span>
                        </div>
                      </div>
                    )}
              </div>
                ) : formData.activities.length > 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-lg font-semibold text-white mb-2">All Preferences Saved!</h4>
                    <p className="text-slate-300 mb-4">
                      You've already saved preferences for all selected activities. 
                      The AI will use these for personalized suggestions!
                    </p>
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-400/30">
                      <p className="text-sm text-blue-200">
                        ✅ We will use them for AI personalization now.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-300 text-center py-4">
                    Select activities above to help us learn your preferences!
                  </p>
                )}
              </div>
            </motion.div>
          )}

{/* Time Slots Section */}
<motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.4 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8"
          >
            {/* Glowing Edge Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <motion.span
                  className="mr-2 text-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ⏰
                </motion.span>
                Time Slots
              </h2>
              
              <p className="text-slate-300 mb-6 text-sm">
                Select the hours when you performed these activities. You can select multiple hours across different time slots.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {timeSlots.map((slot, slotIndex) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: slotIndex * 0.1 }}
                    className={`p-4 rounded-2xl bg-gradient-to-r ${slot.color} border ${slot.borderColor} backdrop-blur-sm`}
                  >
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">{slot.icon}</span>
                      <h3 className={`text-lg font-bold ${slot.textColor}`}>
                        {slot.name}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {slot.hours.map((hour) => {
                        const hourKey = `${slot.id}-${hour}`;
                        const isSelected = formData.selectedTimeSlots.includes(hourKey);
                        
                        return (
                          <motion.button
                            key={hourKey}
                            type="button"
                            onClick={() => {
                              const newTimeSlots = isSelected
                                ? formData.selectedTimeSlots.filter(ts => ts !== hourKey)
                                : [...formData.selectedTimeSlots, hourKey];
                              handleChange("selectedTimeSlots", newTimeSlots);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? `bg-white/20 text-white shadow-lg border-2 ${slot.borderColor}`
                                : `bg-white/10 ${slot.textColor} hover:bg-white/15 border border-transparent hover:border-white/20`
                            }`}
                          >
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {formData.selectedTimeSlots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-slate-700/30 rounded-lg"
                >
                  <p className="text-slate-300 text-sm">
                    <span className="font-semibold">Selected hours:</span> {formData.selectedTimeSlots.length} hour{formData.selectedTimeSlots.length !== 1 ? 's' : ''}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
          {/* Period Tracking - Only for females */}
          {userInfo && userInfo.gender === 'female' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: [0, -4, 0] }}
              transition={{
                opacity: { duration: 0.6, delay: 1.0 },
                y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8"
            >
              {/* Glowing Edge Effect */}
              <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <motion.span
                      className="mr-2 text-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🩸
                    </motion.span>
                    Period Tracking
                  </h3>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    aria-pressed={formData.onPeriod}
                    onClick={() => handleChange('onPeriod', !formData.onPeriod)}
                    className={`w-full md:w-auto inline-flex items-center space-x-3 px-5 py-3 rounded-full transition-all border-2 shadow-sm
                      ${formData.onPeriod
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-300 hover:from-pink-600 hover:to-rose-600'
                        : 'bg-slate-800/50 text-pink-400 border-pink-400/50 hover:bg-slate-700/50'}
                    `}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow ${formData.onPeriod ? 'bg-white/20' : 'bg-pink-900/30 text-pink-400'}`}>🩸</span>
                    <div className="text-left">
                      <div className="font-semibold">
                        {formData.onPeriod ? 'On period today' : 'Mark period today'}
                      </div>
                      <div className={`text-xs ${formData.onPeriod ? 'text-white/90' : 'text-pink-400/80'}`}>
                        Tap to {formData.onPeriod ? 'unset' : 'set'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Meals & Drinks Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -3, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 1.2 },
              y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8 overflow-hidden"
          >
            {/* Glowing Edge Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
            

            <div className="relative z-10">
              <h3 className="text-2xl font-extrabold text-white mb-6 flex items-center">
                <motion.span
                  className="mr-3 text-3xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🍽️
                </motion.span>
                Meals & Drinks
              </h3>
          
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Row 1: Water + Caffeine */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Water */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/15 border border-blue-400/30 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">💧</span>
                        <span className="font-semibold text-white">Water</span>
                      </div>
                      <span className="text-xs text-slate-400">glasses</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button type="button" aria-label="Decrease water" onClick={() => adjustCount('waterIntake', -1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-blue-400/50 text-blue-300 font-bold hover:bg-blue-900/30">−</button>
                      <div className="min-w-[50px] text-center px-3 py-2 bg-slate-800/50 border-2 border-blue-400/50 rounded-lg text-white font-bold text-lg">{formData.waterIntake}</div>
                      <button type="button" aria-label="Increase water" onClick={() => adjustCount('waterIntake', 1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-blue-400/50 text-blue-300 font-bold hover:bg-blue-900/30">+</button>
                    </div>
                  </div>

                  {/* Caffeine */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/15 border border-amber-400/30 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">☕</span>
                        <span className="font-semibold text-white">Caffeine</span>
                      </div>
                      <span className="text-xs text-slate-400">drinks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button type="button" aria-label="Decrease caffeine" onClick={() => adjustCount('caffeine', -1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-amber-400/50 text-amber-300 font-bold hover:bg-amber-900/30">−</button>
                      <div className="min-w-[50px] text-center px-3 py-2 bg-slate-800/50 border-2 border-amber-400/50 rounded-lg text-white font-bold text-lg">{formData.caffeine}</div>
                      <button type="button" aria-label="Increase caffeine" onClick={() => adjustCount('caffeine', 1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-amber-400/50 text-amber-300 font-bold hover:bg-amber-900/30">+</button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Meals + Alcohol */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Meals */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-sky-500/15 border border-indigo-400/30 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🍱</span>
                        <span className="font-semibold text-white">Meals</span>
                      </div>
                      <span className="text-xs text-slate-400">eaten</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button type="button" aria-label="Decrease meals" onClick={() => adjustCount('mealsEaten', -1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-indigo-400/50 text-indigo-300 font-bold hover:bg-indigo-900/30">−</button>
                      <div className="min-w-[50px] text-center px-3 py-2 bg-slate-800/50 border-2 border-indigo-400/50 rounded-lg text-white font-bold text-lg">{formData.mealsEaten}</div>
                      <button type="button" aria-label="Increase meals" onClick={() => adjustCount('mealsEaten', 1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-indigo-400/50 text-indigo-300 font-bold hover:bg-indigo-900/30">+</button>
                    </div>
                  </div>

                  {/* Alcohol */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/15 border border-pink-400/30 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🍷</span>
                        <span className="font-semibold text-white">Alcohol</span>
                      </div>
                      <span className="text-xs text-slate-400">drinks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button type="button" aria-label="Decrease alcohol" onClick={() => adjustCount('alcohol', -1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-pink-400/50 text-pink-300 font-bold hover:bg-pink-900/30">−</button>
                      <div className="min-w-[50px] text-center px-3 py-2 bg-slate-800/50 border-2 border-pink-400/50 rounded-lg text-white font-bold text-lg">{formData.alcohol}</div>
                      <button type="button" aria-label="Increase alcohol" onClick={() => adjustCount('alcohol', 1)} className="w-9 h-9 rounded-lg bg-slate-800/50 backdrop-blur border-2 border-pink-400/50 text-pink-300 font-bold hover:bg-pink-900/30">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Reflection Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -2, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 1.4 },
              y: { duration: 4.0, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8"
          >
            {/* Glowing Edge Effect */}
            <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Reflection</h3>
                </div>
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border border-cyan-400/30 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="font-semibold">Voice</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 animate-pulse shadow-lg hover:shadow-xl border border-blue-400/30 backdrop-blur-sm"
                  >
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    <span className="font-semibold">Stop Recording</span>
                  </button>
                )}
              </div>
              
              <div className="relative">
                <textarea
                  rows={4}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full border border-slate-600 rounded-lg p-4 text-white bg-slate-800/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-slate-400"
                  placeholder={isRecording ? "Listening... Start speaking..." : "Type your thoughts or click the voice button to speak..."}
                  disabled={isRecording}
                />
                {isRecording && (
                  <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-red-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                    <span className="text-sm font-medium">Recording...</span>
                  </div>
                )}
              </div>
              
              {reflection && (
                <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                  <span>{reflection.length} characters</span>
                  <button
                    type="button"
                    onClick={() => setReflection('')}
                    className="text-red-400 hover:text-red-300 font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 1.6 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="flex justify-center"
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700 disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl border border-purple-400/30 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Entry</span>
                </div>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
