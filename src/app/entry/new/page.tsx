"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ParameterSlider from "@/components/ui/ParameterSlider";
import ActivitySelector from "@/components/ui/ActivitySelector";
import { generateAISuggestions } from "@/lib/aiService";

export default function NewEntry() {
  const router = useRouter();
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  
  // AI Preference Learning state
  const [preferenceOptions, setPreferenceOptions] = useState<any[]>([]);
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
            return {
              activity,
              title: `${activity.charAt(0).toUpperCase() + activity.slice(1)} Genres`,
              description: `What ${activity} styles do you enjoy?`,
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
            const category = getCategoryForActivity(activity);
            return {
              category,
              title: getTitleForActivity(activity),
              description: `Select ${activity} favorites based on your chosen genres (${selectedGenres.join(', ')})`,
              options: data.suggestions,
              currentCount: getCurrentCountForCategory(category, userInfo)
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
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">New Mood Entry</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <ActivitySelector
          selectedActivities={formData.activities}
          onActivityToggle={(activity) => {
            const newActivities = formData.activities.includes(activity)
              ? formData.activities.filter(a => a !== activity)
              : [...formData.activities, activity];
            handleChange("activities", newActivities);
          }}
        />

        {/* Toggle: AI Preference Learning opt-out */}
        <Card className="p-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={enablePreferenceLearning}
              onChange={(e) => setEnablePreferenceLearning(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div className="flex-1">
              <span className="font-semibold text-gray-900">Enable AI to learn my preferences during this entry</span>
              <p className="text-sm text-gray-600">Uncheck if you don’t want to see AI suggestions for genres and favorites right now.</p>
            </div>
          </label>
        </Card>

        {/* AI Preference Learning */}
        {enablePreferenceLearning && formData.activities.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Help Us Know You Better
            </h3>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  currentStep === 'genres' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-white text-green-600 font-bold text-sm flex items-center justify-center">1</span>
                  <span className="font-semibold">Choose Genres</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  currentStep === 'specifics' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-white text-green-600 font-bold text-sm flex items-center justify-center">2</span>
                  <span className="font-semibold">Pick Favorites</span>
                </div>
              </div>
            </div>
            
            {preferencesLocked ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">All Preferences Saved!</h4>
                <p className="text-gray-600 mb-4">
                  Your selections are saved and locked for this entry.
                </p>
                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ We will use them for AI personalization now.
                  </p>
                </div>
              </div>
            ) : isGeneratingPreferences ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Loading preference options...</span>
              </div>
            ) : currentStep === 'genres' && genreOptions.length > 0 ? (
              <div className="space-y-6">
                {genreOptions.map((option, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border-2 border-green-100">
                    <h4 className="font-semibold text-gray-900 mb-2">{option.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                    
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
                            } else {
                              setSelectedGenres(prev => [...prev, genre]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedGenres.includes(genre)
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                              : 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 hover:from-blue-200 hover:to-purple-200 border border-blue-200'
                          }`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {selectedGenres.length > 0 && (
                  <div className="flex items-center justify-between bg-green-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm font-medium text-green-800">
                        {selectedGenres.length} genre{selectedGenres.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        generateSpecificOptions(selectedGenres);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Next: Choose Specific Favorites
                    </button>
                  </div>
                )}
              </div>
            ) : currentStep === 'specifics' && preferenceOptions.length > 0 ? (
              <div className="space-y-6">
                {/* Back Button */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentStep('genres');
                      setSelectedPreferences([]);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <span>←</span>
                    <span>Back to Genres</span>
                  </button>
                  <div className="text-sm text-gray-500">
                    Selected genres: {selectedGenres.join(', ')}
                  </div>
                </div>
                
                {preferenceOptions.map((option, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border-2 border-green-100">
                    <h4 className="font-semibold text-gray-900 mb-2">{option.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                    
                    {option.currentCount > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Already saved:</span> {option.currentCount} preference{option.currentCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {option.options.map((pref: string) => (
                        <button
                          key={pref}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedPreferences.includes(pref)) {
                              setSelectedPreferences(prev => prev.filter(p => p !== pref));
                            } else {
                              setSelectedPreferences(prev => [...prev, pref]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedPreferences.includes(pref)
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                              : 'bg-gradient-to-r from-pink-100 to-orange-100 text-pink-800 hover:from-pink-200 hover:to-orange-200 border border-pink-200'
                          }`}
                        >
                          {pref}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Input Section */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCustomInput(!showCustomInput);
                          }}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <span>{showCustomInput ? '−' : '+'}</span>
                          <span>Add Custom {option.title.split('/')[0]}</span>
                        </button>
                      </div>
                      
                      {showCustomInput && (
                        <div className="flex space-x-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <input
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder={`Enter custom ${option.title.toLowerCase()}`}
                            className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-gray-900 placeholder-gray-500 caret-blue-600"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && customInput.trim()) {
                                e.preventDefault();
                                if (!selectedPreferences.includes(customInput.trim())) {
                                  setSelectedPreferences(prev => [...prev, customInput.trim()]);
                                }
                                setCustomInput('');
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (customInput.trim() && !selectedPreferences.includes(customInput.trim())) {
                                setSelectedPreferences(prev => [...prev, customInput.trim()]);
                                setCustomInput('');
                              }
                            }}
                            disabled={!customInput.trim()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {selectedPreferences.length > 0 && (
                  <div className="flex items-center justify-between bg-green-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm font-medium text-green-800">
                        {selectedPreferences.length} preference{selectedPreferences.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        savePreferences();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Save Preferences
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-3">
                  💡 This helps us personalize future suggestions based on your interests!
                </p>
              </div>
            ) : formData.activities.length > 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">All Preferences Saved!</h4>
                <p className="text-gray-600 mb-4">
                  You've already saved preferences for all selected activities. 
                  The AI will use these for personalized suggestions!
                </p>
                <div className="bg-green-100 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ Your preferences are cached and ready for AI personalization
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">
                Select activities above to help us learn your preferences!
              </p>
            )}
          </Card>
        )}

        {/* Period Tracking - Only for females */}
        {userInfo && userInfo.gender === 'female' && (
          <Card className="p-6 bg-gradient-to-br from-pink-50 to-rose-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">🩸</span>
                Period Tracking
              </h3>
              <span className="text-xs text-gray-500">Optional</span>
            </div>

            <div className="mt-4">
              <button
                type="button"
                aria-pressed={formData.onPeriod}
                onClick={() => handleChange('onPeriod', !formData.onPeriod)}
                className={`w-full md:w-auto inline-flex items-center space-x-3 px-5 py-3 rounded-full transition-all border-2 shadow-sm
                  ${formData.onPeriod
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-300 hover:from-rose-600 hover:to-pink-600'
                    : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}
                `}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow ${formData.onPeriod ? 'bg-white/20' : 'bg-rose-100 text-rose-600'}`}>🩸</span>
                <div className="text-left">
                  <div className="font-semibold">
                    {formData.onPeriod ? 'On period today' : 'Mark period today'}
                  </div>
                  <div className={`text-xs ${formData.onPeriod ? 'text-white/90' : 'text-rose-600/80'}`}>
                    Tap to {formData.onPeriod ? 'unset' : 'set'}
                  </div>
                </div>
              </button>
            </div>
          </Card>
        )}

        {/* Meals & Drinks Tracking */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-10 w-60 h-60 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />

          <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
            <span className="mr-3 text-3xl">🍽️</span>
            Meals & Drinks
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Row 1: Water + Caffeine */}
            <div className="grid grid-cols-2 gap-4">
              {/* Water */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border border-blue-300/30 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">💧</span>
                    <span className="font-semibold text-gray-900">Water</span>
                  </div>
                  <span className="text-xs text-gray-500">glasses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" aria-label="Decrease water" onClick={() => adjustCount('waterIntake', -1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-blue-200 text-blue-700 font-bold hover:bg-blue-50">−</button>
                  <div className="min-w-[50px] text-center px-3 py-2 bg-white/90 border-2 border-blue-200 rounded-lg text-gray-900 font-bold text-lg">{formData.waterIntake}</div>
                  <button type="button" aria-label="Increase water" onClick={() => adjustCount('waterIntake', 1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-blue-200 text-blue-700 font-bold hover:bg-blue-50">+</button>
                </div>
              </div>

              {/* Caffeine */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-300/30 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">☕</span>
                    <span className="font-semibold text-gray-900">Caffeine</span>
                  </div>
                  <span className="text-xs text-gray-500">drinks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" aria-label="Decrease caffeine" onClick={() => adjustCount('caffeine', -1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50">−</button>
                  <div className="min-w-[50px] text-center px-3 py-2 bg-white/90 border-2 border-amber-200 rounded-lg text-gray-900 font-bold text-lg">{formData.caffeine}</div>
                  <button type="button" aria-label="Increase caffeine" onClick={() => adjustCount('caffeine', 1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50">+</button>
                </div>
              </div>
            </div>

            {/* Row 2: Meals + Alcohol */}
            <div className="grid grid-cols-2 gap-4">
              {/* Meals */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-sky-500/10 border border-indigo-300/30 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🍱</span>
                    <span className="font-semibold text-gray-900">Meals</span>
                  </div>
                  <span className="text-xs text-gray-500">eaten</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" aria-label="Decrease meals" onClick={() => adjustCount('mealsEaten', -1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50">−</button>
                  <div className="min-w-[50px] text-center px-3 py-2 bg-white/90 border-2 border-indigo-200 rounded-lg text-gray-900 font-bold text-lg">{formData.mealsEaten}</div>
                  <button type="button" aria-label="Increase meals" onClick={() => adjustCount('mealsEaten', 1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50">+</button>
                </div>
              </div>

              {/* Alcohol */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/15 to-rose-500/10 border border-pink-300/30 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🍷</span>
                    <span className="font-semibold text-gray-900">Alcohol</span>
                  </div>
                  <span className="text-xs text-gray-500">drinks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" aria-label="Decrease alcohol" onClick={() => adjustCount('alcohol', -1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-pink-200 text-pink-700 font-bold hover:bg-pink-50">−</button>
                  <div className="min-w-[50px] text-center px-3 py-2 bg-white/90 border-2 border-pink-200 rounded-lg text-gray-900 font-bold text-lg">{formData.alcohol}</div>
                  <button type="button" aria-label="Increase alcohol" onClick={() => adjustCount('alcohol', 1)} className="w-9 h-9 rounded-lg bg-white/90 backdrop-blur border-2 border-pink-200 text-pink-700 font-bold hover:bg-pink-50">+</button>
                </div>
              </div>
            </div>
          </div>

          
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Quick Reflection</h3>
              <p className="text-sm text-gray-600 mt-1">Type or speak your thoughts</p>
            </div>
            {!isRecording ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="font-medium">Voice</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 animate-pulse"
              >
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="font-medium">Stop Recording</span>
              </button>
            )}
          </div>
          
          <div className="relative">
            <textarea
              rows={4}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-4 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              placeholder={isRecording ? "Listening... Start speaking..." : "Type your thoughts or click the voice button to speak..."}
              disabled={isRecording}
            />
            {isRecording && (
              <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}
          </div>
          
          {reflection && (
            <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
              <span>{reflection.length} characters</span>
              <button
                type="button"
                onClick={() => setReflection('')}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            </div>
          )}
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
