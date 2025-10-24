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
  const [aiIcon, setAiIcon] = useState('🤖'); // Default fallback icon
  const [userGender, setUserGender] = useState<string | null>(null);
  const [periodStartDate, setPeriodStartDate] = useState<string | null>(null);
  const [isFirstPeriodEntry, setIsFirstPeriodEntry] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(0);
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
    // Date and time for past entries
    entryDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    entryTime: new Date().toTimeString().slice(0, 5), // HH:MM format
  });

  // Increment/Decrement helpers (no upper limit)
  const adjustCount = (key: 'waterIntake' | 'mealsEaten' | 'caffeine' | 'alcohol', delta: number) => {
    setFormData(prev => {
      const current = (prev as any)[key] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  };

  const handleChange = (name: string, value: number | string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Handle period tracking logic
    if (name === 'onPeriod' && value === true) {
      // Set period start date to today (Day 1)
      const today = new Date().toISOString().split('T')[0];
      setPeriodStartDate(today);
      // Mark this as the first period entry of the cycle
      setIsFirstPeriodEntry(true);
    } else if (name === 'onPeriod' && value === false) {
      // Clear period start date when period ends - resets to Day 1 for next cycle
      setPeriodStartDate(null);
      setIsFirstPeriodEntry(false);
    }
  };

  // Calculate period day (1, 2, 3, etc.)
  const getPeriodDay = () => {
    if (!periodStartDate) return 0;
    const start = new Date(periodStartDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum day 1
  };

  // Load user preferences on component mount
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await fetch('/api/user?userId=dummy-user');
        if (response.ok) {
          const user = await response.json();
          setUserInfo(user);
          setUserGender(user.gender);
          setUserPreferences({
            interests: user.interests ? JSON.parse(user.interests) : [],
            favoriteWriters: user.favoriteWriters ? user.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
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

  // Set AI icon based on connected services
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const openaiKey = localStorage.getItem('openai_api_key');
      const geminiKey = localStorage.getItem('gemini_api_key');
      const textcortexKey = localStorage.getItem('textcortex_api_key');
      
      if (openaiKey) {
        setAiIcon('openai');
      } else if (geminiKey) {
        setAiIcon('gemini');
      } else if (textcortexKey) {
        setAiIcon('textcortex');
      } else {
        setAiIcon('🤖');
      }
    }
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
      // Check if we're offline or AI is unavailable
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        console.log('📱 Offline mode: Using fallback genre options');
        const fallbackGenres = generateFallbackGenreOptions();
        setGenreOptions(fallbackGenres);
        setSelectedGenres([]);
        setCurrentStep('genres');
        setIsGeneratingPreferences(false);
        return;
      }

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
                interests: userInfo.interests,
                personality: userInfo.personality,
                universityLevel: userInfo.universityLevel,
                fieldOfStudy: userInfo.fieldOfStudy,
                favoriteAuthors: userInfo.favoriteAuthors,
                favoriteMovies: userInfo.favoriteMovies,
                favoritePhilosophers: userInfo.favoritePhilosophers,
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
          } else {
            console.log(`⚠️ AI service unavailable for ${activity}, using fallback`);
            return generateFallbackGenreOption(activity);
          }
        } catch (error) {
          console.error(`Error generating genres for ${activity}:`, error);
          console.log(`🔄 Using fallback for ${activity}`);
          return generateFallbackGenreOption(activity);
        }
      });
      
      const results = await Promise.all(genrePromises);
      const validGenres = results.filter(Boolean);
      
      setGenreOptions(validGenres);
      setSelectedGenres([]);
      setCurrentStep('genres');
    } catch (error) {
      console.error('Error generating genre options:', error);
      // Fallback to offline mode
      const fallbackGenres = generateFallbackGenreOptions();
      setGenreOptions(fallbackGenres);
      setSelectedGenres([]);
      setCurrentStep('genres');
    } finally {
      setIsGeneratingPreferences(false);
    }
  };

  // Fallback genre options for offline mode
  const generateFallbackGenreOptions = () => {
    return formData.activities.map(activity => generateFallbackGenreOption(activity));
  };

  const generateFallbackGenreOption = (activity: string) => {
    const fallbackOptions = {
      reading: ['Fiction', 'Non-fiction', 'Poetry', 'Biography', 'Self-help'],
      watching: ['Drama', 'Comedy', 'Action', 'Documentary', 'Sci-fi'],
      exercise: ['Cardio', 'Strength', 'Yoga', 'Swimming', 'Running'],
      cooking: ['Italian', 'Asian', 'Mediterranean', 'Mexican', 'Healthy'],
      music: ['Pop', 'Rock', 'Classical', 'Jazz', 'Electronic'],
      art: ['Painting', 'Drawing', 'Digital Art', 'Sculpture', 'Photography'],
      gaming: ['Action', 'Puzzle', 'Strategy', 'RPG', 'Sports'],
      meditation: ['Mindfulness', 'Breathing', 'Body Scan', 'Walking', 'Guided']
    };

    return {
      activity,
      title: `${activity.charAt(0).toUpperCase() + activity.slice(1)} Styles`,
      description: `What ${activity} styles did you do today? (Offline mode)`,
      options: (fallbackOptions as any)[activity] || ['General', 'Creative', 'Relaxing', 'Active', 'Social']
    };
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
                interests: userInfo.interests,
                personality: userInfo.personality,
                universityLevel: userInfo.universityLevel,
                fieldOfStudy: userInfo.fieldOfStudy,
                favoriteAuthors: userInfo.favoriteAuthors,
                favoriteMovies: userInfo.favoriteMovies,
                favoritePhilosophers: userInfo.favoritePhilosophers,
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
          const combinedPreferences = Array.from(new Set([...currentPreferences, ...categoryPreferences]));
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
            favoriteWriters: user.favoriteWriters ? user.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
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
          periodDay: formData.onPeriod ? getPeriodDay() : null,
          waterIntake: formData.waterIntake,
          mealsEaten: formData.mealsEaten,
          mealQuality: formData.mealQuality,
          caffeine: formData.caffeine,
          alcohol: formData.alcohol,
          // Custom date and time for past entries
          customDate: formData.entryDate,
          customTime: formData.entryTime,
        }),
      });

      if (response.ok) {
        console.log("Entry saved successfully!");
        
        // Signal dashboard to regenerate AI suggestions and Pro Tips
        localStorage.setItem('mood-entry-created', Date.now().toString());
        console.log('📝 Mood entry created - signaling dashboard for regeneration');
        
        // Reset period tracking state after successful save
        handleChange('onPeriod', false);
        // Reset first period entry flag after saving
        setIsFirstPeriodEntry(false);
        
        router.push("/");
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
    <>
      {/* Custom CSS for date/time picker styling */}
      <style jsx global>{`
        /* Hide native date/time picker icons */
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          display: none;
        }
        
        /* Style the date picker popup */
        input[type="date"]::-webkit-datetime-edit {
          color: white;
        }
        
        input[type="date"]::-webkit-datetime-edit-fields-wrapper {
          background: transparent;
        }
        
        input[type="date"]::-webkit-datetime-edit-text {
          color: white;
        }
        
        input[type="date"]::-webkit-datetime-edit-month-field,
        input[type="date"]::-webkit-datetime-edit-day-field,
        input[type="date"]::-webkit-datetime-edit-year-field {
          color: white;
        }
        
        /* Style the time picker popup */
        input[type="time"]::-webkit-datetime-edit {
          color: white;
        }
        
        input[type="time"]::-webkit-datetime-edit-fields-wrapper {
          background: transparent;
        }
        
        input[type="time"]::-webkit-datetime-edit-text {
          color: white;
        }
        
        input[type="time"]::-webkit-datetime-edit-hour-field,
        input[type="time"]::-webkit-datetime-edit-minute-field {
          color: white;
        }
        
        /* Custom date picker popup styling */
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          color: transparent;
          cursor: pointer;
        }
        
        /* Custom time picker popup styling */
        input[type="time"]::-webkit-calendar-picker-indicator {
          background: transparent;
          color: transparent;
          cursor: pointer;
        }
      `}</style>
      
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
          {/* Date & Time Selection Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.1 },
              y: { duration: 0.8, delay: 0.1, ease: "easeOut" }
            }}
            className="relative bg-slate-800/20 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-500/10 p-6"
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-700/10 to-slate-800/5"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent flex items-center" style={{
                  textShadow: '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                  filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
                }}>
                  📅 Entry Date & Time
                </h2>
              </div>
              <p className="text-slate-400 text-sm mb-6">Select when this entry occurred (for past entries)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Picker */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.entryDate}
                      onChange={(e) => handleChange('entryDate', e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className={`w-full px-4 py-4 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 text-lg pr-12 ${
                        (formData.onPeriod && isFirstPeriodEntry)
                          ? 'border-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.6),0_0_50px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.7),0_0_60px_rgba(239,68,68,0.5)] focus:border-red-400/70 focus:ring-2 focus:ring-red-400/30'
                          : 'border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20'
                      }`}
                    />
                    {/* Custom Calendar Icon */}
                    <div 
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 ${
                        (formData.onPeriod && isFirstPeriodEntry)
                          ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                          : 'text-purple-400 drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]'
                      }`}
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Time Picker */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">Time</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.entryTime}
                      onChange={(e) => handleChange('entryTime', e.target.value)}
                      placeholder="HH:MM"
                      className={`w-full px-4 py-4 bg-slate-800/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 text-lg pr-12 ${
                        (formData.onPeriod && isFirstPeriodEntry)
                          ? 'border-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.6),0_0_50px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.7),0_0_60px_rgba(239,68,68,0.5)] focus:border-red-400/70 focus:ring-2 focus:ring-red-400/30'
                          : 'border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/20'
                      }`}
                    />
                    {/* Custom Clock Icon */}
                    <div 
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer z-10 ${
                        (formData.onPeriod && isFirstPeriodEntry)
                          ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                          : 'text-purple-400 drop-shadow-[0_0_8px_rgba(147,51,234,0.8)]'
                      }`}
                      onClick={() => setShowTimePicker(!showTimePicker)}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </motion.div>

          {/* Custom Date Picker Modal */}
          {showDatePicker && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-400/30 p-6 w-full max-w-md"
                style={{
                  boxShadow: '0 0 30px rgba(147, 51, 234, 0.3), 0 0 60px rgba(59, 130, 246, 0.2)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Select Date
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Year and Month Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-purple-400/50 focus:outline-none"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Month</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-purple-400/50 focus:outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                          <option key={month} value={month}>
                            {new Date(0, month).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Day Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Day</label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: new Date(selectedYear, selectedMonth + 1, 0).getDate() }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const selectedDate = new Date(selectedYear, selectedMonth, day);
                            const dateString = selectedDate.toISOString().split('T')[0];
                            handleChange('entryDate', dateString);
                            setShowDatePicker(false);
                          }}
                          className="p-2 text-center rounded-lg bg-slate-700/50 hover:bg-purple-500/30 border border-slate-600/50 hover:border-purple-400/50 transition-all duration-200 text-white hover:scale-105 text-sm"
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        handleChange('entryDate', yesterday.toISOString().split('T')[0]);
                        setShowDatePicker(false);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-purple-500/30 border border-slate-600/50 hover:border-purple-400/50 rounded-lg transition-all duration-200 text-white"
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        handleChange('entryDate', today.toISOString().split('T')[0]);
                        setShowDatePicker(false);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/50 rounded-lg transition-all duration-200 text-white"
                    >
                      Today
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Custom Time Picker Modal */}
          {showTimePicker && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-400/30 p-6 w-full max-w-md"
                style={{
                  boxShadow: '0 0 30px rgba(147, 51, 234, 0.3), 0 0 60px rgba(59, 130, 246, 0.2)'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    Select Time
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Hour and Minute Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Hour</label>
                      <div className="grid grid-cols-6 gap-1">
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => setSelectedHour(hour)}
                            className={`p-2 text-center rounded-lg border transition-all duration-200 text-white hover:scale-105 text-sm ${
                              selectedHour === hour
                                ? 'bg-purple-500/50 border-purple-400/50'
                                : 'bg-slate-700/50 border-slate-600/50 hover:bg-purple-500/30 hover:border-purple-400/50'
                            }`}
                          >
                            {hour.toString().padStart(2, '0')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Minute</label>
                      <div className="grid grid-cols-6 gap-1">
                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                          <button
                            key={minute}
                            type="button"
                            onClick={() => setSelectedMinute(minute)}
                            className={`p-2 text-center rounded-lg border transition-all duration-200 text-white hover:scale-105 text-sm ${
                              selectedMinute === minute
                                ? 'bg-purple-500/50 border-purple-400/50'
                                : 'bg-slate-700/50 border-slate-600/50 hover:bg-purple-500/30 hover:border-purple-400/50'
                            }`}
                          >
                            {minute.toString().padStart(2, '0')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Time Display and Confirm */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-4">
                      {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
                          handleChange('entryTime', timeString);
                          setShowTimePicker(false);
                        }}
                        className="flex-1 px-4 py-2 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400/50 rounded-lg transition-all duration-200 text-white"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const timeString = now.toTimeString().slice(0, 5);
                          handleChange('entryTime', timeString);
                          setShowTimePicker(false);
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-purple-500/30 border border-slate-600/50 hover:border-purple-400/50 rounded-lg transition-all duration-200 text-white"
                      >
                        Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Mood Parameters Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative bg-slate-800/20 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-500/10 p-6"
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-700/10 to-slate-800/5"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent flex items-center" style={{
                    textShadow: (formData.onPeriod && isFirstPeriodEntry)
                      ? '0 0 25px rgba(239, 68, 68, 1), 0 0 50px rgba(239, 68, 68, 0.8), 0 0 75px rgba(239, 68, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)'
                      : '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                    filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
                  }}>
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
                  glowColor={(formData.onPeriod && isFirstPeriodEntry) ? 'red' : 'purple'}
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
                      glowColor={(formData.onPeriod && isFirstPeriodEntry) ? 'red' : 'purple'}
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
                      glowColor={(formData.onPeriod && isFirstPeriodEntry) ? 'red' : 'purple'}
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
                      glowColor={(formData.onPeriod && isFirstPeriodEntry) ? 'red' : 'purple'}
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
                      max={10}
                      minLabel="No sleep"
                      maxLabel="10+ hours"
                      color="from-indigo-400 to-purple-500"
                      glowColor={(formData.onPeriod && isFirstPeriodEntry) ? 'red' : 'purple'}
                      icon="😴"
                      valueLabels={{
                        0: "No sleep", 1: "1 hour", 2: "2 hours", 3: "3 hours", 4: "4 hours", 5: "5 hours",
                        6: "6 hours", 7: "7 hours", 8: "8 hours", 9: "9 hours", 10: "10+ hours"
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
            <div className={`absolute inset-0 rounded-3xl border-2 ${(formData.onPeriod && isFirstPeriodEntry) ? 'border-red-400/80 shadow-[0_0_50px_rgba(239,68,68,0.8),0_0_100px_rgba(239,68,68,0.6),0_0_150px_rgba(239,68,68,0.4)]' : 'border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)]'} animate-pulse`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent flex items-center" style={{ 
                  textShadow: (formData.onPeriod && isFirstPeriodEntry) 
                    ? '0 0 25px rgba(239, 68, 68, 1), 0 0 50px rgba(239, 68, 68, 0.8), 0 0 75px rgba(239, 68, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)'
                    : '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                  filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
                }}>
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
                  animate={{ 
                    y: enablePreferenceLearning ? [0, -2, 0] : 0
                  }}
                  transition={{ 
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  title={enablePreferenceLearning ? "Click to disable AI suggestions" : "Click to enable AI suggestions"}
                  data-tooltip={enablePreferenceLearning ? "Disable AI" : "Enable AI"}
                >
                  <div className="flex items-center space-x-2">
                    <motion.span
                      className="text-lg"
                      animate={{ 
                        rotate: enablePreferenceLearning ? 360 : 0,
                        scale: enablePreferenceLearning ? [1, 1.2, 1] : 1
                      }}
                      transition={{ 
                        rotate: { duration: 0.8, ease: "easeInOut" },
                        scale: { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                      }}
                    >
                      {(() => {
                        // Check which AI service is connected and show appropriate icon
                        if (aiIcon === 'openai') {
                          return (
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-white">
                              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                            </svg>
                          );
                        } else if (aiIcon === 'gemini') {
                          return (
                            <svg viewBox="0 0 16 16" className="w-5 h-5 fill-current text-white">
                              <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" fill="url(#prefix__paint0_radial_980_20147)"/>
                              <defs>
                                <radialGradient id="prefix__paint0_radial_980_20147" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)">
                                  <stop offset=".067" stopColor="#9168C0"/>
                                  <stop offset=".343" stopColor="#5684D1"/>
                                  <stop offset=".672" stopColor="#1BA1E3"/>
                                </radialGradient>
                              </defs>
                            </svg>
                          );
                        } else if (aiIcon === 'textcortex') {
                          return (
                            <svg viewBox="0 0 2000 2000" className="w-5 h-5 fill-current text-white">
                              <defs>
                                <linearGradient id="textcortex-gradient" x1="350.014" y1="470.01" x2="1388.96" y2="1743.1" gradientUnits="userSpaceOnUse">
                                  <stop stopColor="#FF805F"/>
                                  <stop offset="0.5" stopColor="#B74BDD"/>
                                  <stop offset="1" stopColor="#0379FF"/>
                                </linearGradient>
                              </defs>
                              <path fillRule="evenodd" clipRule="evenodd" d="M1308.48 1291.92C1308.53 1291.99 1308.58 1292.05 1308.62 1292.13L1308.84 1292.36C1308.72 1292.22 1308.6 1292.07 1308.48 1291.92ZM1150.88 1099.73L1150.87 1099.74L1030.02 1207.98L1030.08 1208.05H1030.02V1377.97C1030.02 1462.21 1098.3 1530.49 1182.54 1530.49C1266.26 1530.49 1334.23 1463.04 1335.05 1379.51C1349.42 1383.99 1364.7 1386.41 1380.54 1386.41C1464.77 1386.41 1533.06 1318.13 1533.06 1233.89C1533.06 1203.86 1524.38 1175.87 1509.4 1152.27C1587.82 1145.95 1649.49 1080.31 1649.49 1000.25C1649.49 920.26 1587.91 854.652 1509.58 848.24C1524.45 824.7 1533.06 796.801 1533.06 766.89C1533.06 682.66163 1464.77 614.371 1380.54 614.371C1364.7 614.371 1349.42 616.79 1335.05 621.271C1334.38 537.621 1266.35 470.01 1182.54 470.01C1098.3 470.01 1030.02 538.3 1030.02 622.531V792.309L1030.18 792.45L1150.87 900.549L1150.88 900.561L1150.88 1099.73ZM1275.06 622.531C1275.06 640.309 1270.04 656.92 1261.34 671.02L1234.94 698.781L1202.92 732.451H1090.02V622.531C1090.02 571.44 1131.44 530.011 1182.54 530.011C1233.63 530.011 1275.06 571.44 1275.06 622.531ZM1210.88 1092.77V907.732H1496.97C1548.06 907.732 1589.49 949.16 1589.49 1000.25C1589.49 1051.35 1548.06 1092.77 1496.97 1092.77H1210.88ZM1090.02 1268.05H1202.91L1234.96 1301.73L1261.33 1329.46C1270.04 1343.56 1275.06 1360.18 1275.06 1377.97C1275.06 1429.07 1233.63 1470.49 1182.54 1470.49C1131.43 1470.49 1090.02 1429.07 1090.02 1377.97L1090.02 1268.05ZM1181.6 1152.77H1425.05C1453.66 1168.5 1473.06 1198.93 1473.06 1233.89C1473.06 1284.99 1431.63 1326.41 1380.54 1326.41C1356.71 1326.41 1334.99 1317.4 1318.59 1302.6L1318.55 1302.56C1315.07 1299.43 1311.82 1296.02 1308.86 1292.38L1308.84 1292.36L1308.62 1292.13L1274.61 1256.37L1230.2 1209.67L1229.97 1209.43L1228.66 1208.05H1119.87L1181.6 1152.77ZM1120.11 792.45H1228.66L1229.93 791.111L1230.2 790.832L1274.59 744.141L1308.65 708.332L1311.06 705.802L1311.08 705.781C1312.63 704.021 1314.25 702.311 1315.93 700.691V700.681C1332.6 684.402 1355.4 674.372 1380.54 674.372C1431.63 674.372 1473.06 715.8 1473.06 766.891C1473.06 801.653 1453.89 831.931 1425.55 847.731H1181.83L1120.11 792.45ZM1030.18 792.45H1030.02L1030.02 792.309L1030.18 792.45ZM1030.18 792.45H1030.02L1030.02 792.309L1030.18 792.45ZM1315.93 700.691L1311.08 705.781C1312.63 704.022 1314.25 702.312 1315.93 700.691ZM1318.55 1302.56C1315.07 1299.43 1311.82 1296.02 1308.86 1292.38L1318.55 1302.56ZM1150.88 900.561L1150.88 907.732H1150.87V900.548L1150.88 900.561ZM1150.88 1092.77V1099.73L1150.87 1099.74V1092.77H1150.88ZM690.665 1292.36L690.885 1292.13C690.926 1292.05 690.974 1291.99 691.026 1291.92C690.904 1292.07 690.785 1292.22 690.665 1292.36ZM848.625 900.561L848.635 900.549L969.324 792.45L969.486 792.309V622.531C969.486 538.3 901.205 470.01 816.965 470.01C733.155 470.01 665.123 537.62 664.453 621.271C650.083 616.791 634.803 614.371 618.965 614.371C534.734 614.371 466.444 682.661 466.444 766.89C466.444 796.801 475.055 824.7 489.925 848.24C411.594 854.652 350.014 920.26 350.014 1000.25C350.014 1080.31 411.683 1145.95 490.102 1152.27C475.123 1175.87 466.443 1203.86 466.443 1233.89C466.443 1318.13 534.733 1386.41 618.964 1386.41C634.802 1386.41 650.083 1383.99 664.452 1379.51C665.275 1463.04 733.244 1530.49 816.964 1530.49C901.203 1530.49 969.485 1462.21 969.485 1377.97V1208.05H969.424L969.485 1207.98L848.634 1099.74L848.624 1099.73L848.625 900.561ZM816.965 530.011C868.065 530.011 909.484 571.44 909.484 622.531V732.451H796.584L764.563 698.781L738.163 671.02C729.464 656.919 724.446 640.309 724.446 622.531C724.446 571.44 765.876 530.011 816.965 530.011ZM502.535 1092.77C451.446 1092.77 410.014 1051.35 410.014 1000.25C410.014 949.16 451.445 907.732 502.535 907.732H788.626V1092.77H502.535ZM909.484 1377.97C909.484 1429.07 868.065 1470.49 816.965 1470.49C765.876 1470.49 724.446 1429.07 724.446 1377.97C724.446 1360.18 729.464 1343.56 738.175 1329.46L764.545 1301.73L796.585 1268.05H909.484V1377.97ZM879.636 1208.05H770.845L769.535 1209.43L769.306 1209.67L724.895 1256.37L690.885 1292.13L690.665 1292.36L690.646 1292.38C687.686 1296.02 684.435 1299.43 680.955 1302.56L680.915 1302.6C664.515 1317.4 642.795 1326.41 618.965 1326.41C567.874 1326.41 526.444 1284.99 526.444 1233.89C526.444 1198.93 545.845 1168.5 574.455 1152.77H817.905L879.636 1208.05ZM817.675 847.73H573.955C545.617 831.93 526.445 801.651 526.445 766.89C526.445 715.799 567.875 674.371 618.966 674.371C644.106 674.371 666.906 684.401 683.576 700.68V700.69C685.257 702.31 686.875 704.02 688.425 705.78L688.446 705.801L690.855 708.331L724.906 744.14L769.307 790.831L769.566 791.11L770.847 792.449H879.397L817.675 847.73ZM969.486 792.309V792.45H969.324L969.486 792.309ZM969.486 792.309V792.45H969.324L969.486 792.309ZM688.425 705.78L683.576 700.69C685.257 702.311 686.876 704.021 688.425 705.78ZM690.646 1292.38C687.686 1296.02 684.435 1299.43 680.955 1302.56L690.646 1292.38ZM848.635 900.548V907.732H848.625V900.561L848.635 900.548ZM848.635 1092.77V1099.74L848.624 1099.73L848.625 1092.77H848.635Z" fill="url(#textcortex-gradient)"/>
                            </svg>
                          );
                        } else {
                          // Default robot icon if no AI service is connected
                          return aiIcon;
                        }
                      })()}
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
                  
                  {/* Subtle pulse animation for interactivity */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.4, 0.8, 0.4]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                  />
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
              <div className={`absolute inset-0 rounded-3xl border-2 ${(formData.onPeriod && isFirstPeriodEntry) ? 'border-red-400/80 shadow-[0_0_50px_rgba(239,68,68,0.8),0_0_100px_rgba(239,68,68,0.6),0_0_150px_rgba(239,68,68,0.4)]' : 'border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)]'} animate-pulse`}></div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center" style={{ 
                  textShadow: (formData.onPeriod && isFirstPeriodEntry) 
                    ? '0 0 25px rgba(239, 68, 68, 1), 0 0 50px rgba(239, 68, 68, 0.8), 0 0 75px rgba(239, 68, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)'
                    : '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                  filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
                }}>
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
            <div className={`absolute inset-0 rounded-3xl border-2 ${(formData.onPeriod && isFirstPeriodEntry) ? 'border-red-400/80 shadow-[0_0_50px_rgba(239,68,68,0.8),0_0_100px_rgba(239,68,68,0.6),0_0_150px_rgba(239,68,68,0.4)]' : 'border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)]'} animate-pulse`}></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center" style={{ 
                textShadow: (formData.onPeriod && isFirstPeriodEntry) 
                  ? '0 0 10px rgba(239, 68, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)'
                  : '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
              }}>
                Time Slots
              </h2>
              

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
          {userGender === 'female' && (
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
              <div className={`absolute inset-0 rounded-3xl border-2 ${(formData.onPeriod && isFirstPeriodEntry) ? 'border-red-400/80 shadow-[0_0_50px_rgba(239,68,68,0.8),0_0_100px_rgba(239,68,68,0.6),0_0_150px_rgba(239,68,68,0.4)]' : 'border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)]'} animate-pulse`}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent flex items-center" style={{ 
                    textShadow: (formData.onPeriod && isFirstPeriodEntry) 
                      ? '0 0 10px rgba(239, 68, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)'
                      : '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                    filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
                  }}>
                    Period Tracking
                  </h3>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    aria-pressed={formData.onPeriod}
                    onClick={() => handleChange('onPeriod', !formData.onPeriod)}
                    className={`w-full md:w-64 h-16 inline-flex items-center space-x-3 px-5 py-3 rounded-full transition-all border-2 shadow-sm backdrop-blur-xl
                      ${formData.onPeriod
                        ? 'bg-red-500/20 text-red-200 border-red-400/50 hover:bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : 'bg-slate-800/50 text-red-400 border-red-400/50 hover:bg-slate-700/50'}
                    `}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow ${formData.onPeriod ? 'bg-red-500/30 text-red-200' : 'bg-red-900/30 text-red-400'}`}>🩸</span>
                    <div className="text-left">
                      <div className="font-semibold">
                        {formData.onPeriod 
                          ? `Period Day ${getPeriodDay()}` 
                          : 'Start period cycle'
                        }
                      </div>
                      {formData.onPeriod && (
                        <div className="text-xs text-red-300">
                          Click to end period
                        </div>
                      )}
                      {!formData.onPeriod && (
                        <div className="text-xs text-red-300">
                          Click to begin Day 1
                        </div>
                      )}
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
            className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-8 mx-8"
          >
            {/* Glowing Edge Effect */}
            <div className={`absolute inset-0 rounded-3xl border-2 ${(formData.onPeriod && isFirstPeriodEntry) ? 'border-red-400/80 shadow-[0_0_50px_rgba(239,68,68,0.8),0_0_100px_rgba(239,68,68,0.6),0_0_150px_rgba(239,68,68,0.4)]' : 'border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)]'} animate-pulse`}></div>
            

            <div className="relative z-10">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center" style={{ 
                textShadow: (formData.onPeriod && isFirstPeriodEntry) 
                  ? '0 0 25px rgba(239, 68, 68, 1), 0 0 50px rgba(239, 68, 68, 0.8), 0 0 75px rgba(239, 68, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)'
                  : '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
              }}>
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
            <div className={`absolute inset-0 rounded-3xl border-2 ${(formData.onPeriod && isFirstPeriodEntry) ? 'border-red-400/80 shadow-[0_0_50px_rgba(239,68,68,0.8),0_0_100px_rgba(239,68,68,0.6),0_0_150px_rgba(239,68,68,0.4)]' : 'border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)]'} animate-pulse`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent" style={{ 
                    textShadow: (formData.onPeriod && isFirstPeriodEntry) 
                      ? '0 0 10px rgba(239, 68, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)'
                      : '0 0 10px rgba(147, 51, 234, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.2)',
                    filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4))'
                  }}>Quick Reflection</h3>
                </div>
                {!isRecording ? (
                  <motion.button
                    type="button"
                    onClick={startVoiceRecording}
                    className="relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      y: [0, -2, 0]
                    }}
                    transition={{ 
                      y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    title="Click to start voice recording"
                    data-tooltip="Start Recording"
                  >
                    <div className="flex items-center space-x-2">
                      <motion.span
                        className="text-lg"
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 0.8, ease: "easeInOut" },
                          scale: { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                        }}
                      >
                        🎤
                      </motion.span>
                      <span>Voice</span>
                    </div>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30 border border-red-400/50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      y: [0, -2, 0]
                    }}
                    transition={{ 
                      y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    title="Click to stop voice recording"
                    data-tooltip="Stop Recording"
                  >
                    <div className="flex items-center space-x-2">
                      <motion.span
                        className="text-lg"
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 0.8, ease: "easeInOut" },
                          scale: { duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                        }}
                      >
                        ⏹️
                      </motion.span>
                      <span>Stop</span>
                    </div>
                  </motion.button>
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
    </>
  );
}
