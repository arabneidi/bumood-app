"use client";

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { analyzeMoodPatterns, extractSuccessfulSolutions, UserMoodProfile, AISuggestion } from '@/lib/aiService';
import { MoodEntry } from '@prisma/client';

interface AISuggestionsProps {
  moodEntries: MoodEntry[];
  currentMood?: {
    valence: number;
    energy: number;
    focus: number;
    stress: number;
    sleep?: number;
  };
}

export default function AISuggestions({ moodEntries, currentMood }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, { tried: boolean; helpful?: boolean }>>({});
  const [lastPayload, setLastPayload] = useState<UserMoodProfile | null>(null);
  const [showPayload, setShowPayload] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [moodEntries, currentMood]);

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Generating fresh AI suggestions...');
      
      // Use current mood if available, otherwise use latest entry
      const latestEntry = moodEntries[0];
      const moodData = currentMood || {
        valence: latestEntry?.valence || 5,
        energy: latestEntry?.energy || 5,
        focus: latestEntry?.focus || 5,
        stress: latestEntry?.stress || 5,
        sleep: latestEntry?.sleep || 8
      };

      // Compute today's entries (UTC-normalized day match)
      const now = new Date();
      const utcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const isSameUTCDate = (d: Date) => {
        const dd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        return dd.getTime() === utcDay.getTime();
      };
      const todaysEntries = moodEntries.filter(e => isSameUTCDate(new Date(e.createdAt)));

      // Aggregate today's mood averages
      const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
      const todayAvgValence = avg(todaysEntries.map(e => e.valence));
      const todayAvgEnergy = avg(todaysEntries.map(e => e.energy));
      const todayAvgStress = avg(todaysEntries.map(e => e.stress));
      const todayAvgFocus = avg(todaysEntries.map(e => e.focus));

      // Aggregate today's daily tracking totals
      const sum = (arr: number[]) => arr.reduce((a,b)=>a+(b||0),0);
      const todayWater = sum(todaysEntries.map((e:any) => e.waterIntake || 0));
      const todayMeals = sum(todaysEntries.map((e:any) => e.mealsEaten || 0));
      const todayCaffeine = sum(todaysEntries.map((e:any) => e.caffeine || 0));
      const todayAlcohol = sum(todaysEntries.map((e:any) => e.alcohol || 0));

      // Collect today's activities and latest reflection
      const todayActivities = Array.from(new Set(todaysEntries.flatMap((e:any) => (Array.isArray(e.activities) ? e.activities : (e.activities || [])))));

      // Derive basic activity flags for AI (exercise/active)
      const activitySet = new Set((todayActivities || []).map((a:string)=>a.toLowerCase()));
      const exerciseKeywords = ['gym','running','run','walk','walking','jog','jogging','football','soccer','basketball','tennis','yoga','pilates','dance','dancing','workout','cycling','bike','swim','swimming','hike','hiking'];
      const exercisedToday = exerciseKeywords.some(k => activitySet.has(k));
      const inferredExerciseType = activitySet.has('yoga') ? 'yoga'
        : activitySet.has('running') || activitySet.has('run') || activitySet.has('jogging') ? 'cardio'
        : activitySet.has('walking') || activitySet.has('walk') ? 'light-cardio'
        : activitySet.has('gym') || activitySet.has('workout') ? 'strength'
        : activitySet.has('dance') || activitySet.has('dancing') ? 'dance'
        : exercisedToday ? 'general' : undefined;
      const latestTodayReflection = todaysEntries[0]?.notes || latestEntry?.notes || '';

      // Fetch user feedback from database
      const userFeedback = await fetchUserFeedback();
      console.log('📊 User feedback loaded:', userFeedback);

      // Fetch user preferences (favorites)
      const userPreferences = await fetchUserPreferences();
      console.log('✨ User preferences loaded:', userPreferences);

      // Fetch user personal info (age, gender, etc.)
      const userInfo = await fetchUserInfo();
      console.log('👤 User info loaded:', userInfo);

      // Create comprehensive user profile with feedback
      const userProfile: UserMoodProfile = {
        currentMood: moodData,
        recentEntries: moodEntries.slice(0, 14), // Last 14 entries for better analysis
        // Override history with today's averages so trend isn't zero
        moodHistory: todaysEntries.length > 0 ? {
          avgValence: todayAvgValence || moodData.valence,
          valenceTrend: todayAvgValence || moodData.valence,
          stressPattern: todayAvgStress || moodData.stress,
          energyPattern: todayAvgEnergy || moodData.energy,
          sleepPattern: todaysEntries.length ? avg(todaysEntries.map((e:any)=> e.sleep ?? 8)) : (moodData.sleep ?? 8)
        } : analyzeMoodPatterns(moodEntries),
        successfulSolutions: extractSuccessfulSolutions(moodEntries),
        commonActivities: todayActivities.length > 0 ? todayActivities : getCommonActivities(moodEntries),
        timeOfDay: getCurrentTimeOfDay(),
        userFeedback, // Include user feedback for personalization
        userPreferences, // Include user favorites for SPECIFIC suggestions
        userInfo, // Include age, gender, period data for accurate suggestions
        dailyTracking: {
          waterIntake: todayWater,
          mealsEaten: todayMeals,
          caffeine: todayCaffeine,
          alcohol: todayAlcohol,
          exercise: exercisedToday,
          exerciseType: inferredExerciseType
        },
        // Include reflection text from latest entry today (typed or voice)
        reflection: latestTodayReflection
      };

      console.log('Generating AI suggestions with profile (server-side):', userProfile);
      setLastPayload(userProfile);
      const res = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const newSuggestions: AISuggestion[] = data.suggestions || [];
      
      // Clear existing action states for fresh suggestions
      setActionStates({});
      setSuggestions(newSuggestions);
      
      console.log(`✅ Generated ${newSuggestions.length} fresh suggestions`);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setError('Failed to generate AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFeedback = async () => {
    try {
      const response = await fetch('/api/ai-actions?userId=dummy-user');
      if (response.ok) {
        const actions = await response.json();
        
        // Analyze feedback to create preferences
        const helpful = actions.filter((a: any) => a.helpful === true);
        const unhelpful = actions.filter((a: any) => a.helpful === false);
        
        const helpfulSuggestions = helpful.map((a: any) => a.title);
        const unhelpfulSuggestions = unhelpful.map((a: any) => a.title);
        
        // Get preferred categories (from helpful suggestions)
        const preferredCategories = [...new Set(helpful.map((a: any) => a.category))];
        const avoidCategories = [...new Set(unhelpful.map((a: any) => a.category))];
        
        return {
          helpfulSuggestions,
          unhelpfulSuggestions,
          preferredCategories,
          avoidCategories
        };
      }
    } catch (error) {
      console.error('Error fetching user feedback:', error);
    }
    
    return {
      helpfulSuggestions: [],
      unhelpfulSuggestions: [],
      preferredCategories: [],
      avoidCategories: []
    };
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch('/api/user?userId=dummy-user');
      if (response.ok) {
        const user = await response.json();
        
        return {
          interests: user.interests ? JSON.parse(user.interests) : [],
          quoteStyle: user.quoteStyle,
          favoriteWriters: user.favoriteWriters ? user.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
          favoriteSportsFigures: user.favoriteSportsFigures ? user.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          favoriteMusicians: user.favoriteMusicians ? user.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
          favoriteArtists: user.favoriteArtists ? user.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
          favoriteMovies: user.favoriteMovies ? user.favoriteMovies.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
          favoritePhilosophers: user.favoritePhilosophers ? user.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : []
        };
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
    
    return {
      interests: [],
      favoriteWriters: [],
      favoriteSportsFigures: [],
      favoriteMusicians: [],
      favoriteArtists: [],
      favoritePhilosophers: []
    };
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user?userId=dummy-user');
      if (response.ok) {
        const user = await response.json();
        
        return {
          gender: user.gender,
          age: user.age,
          height: user.height,
          weight: user.weight,
          timezone: user.timezone,
          onPeriod: false, // This would come from the latest mood entry
          periodDay: 0,
          periodCycleLength: 28, // Default cycle length
          periodSymptoms: []
        };
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
    
    return {
      gender: undefined,
      age: undefined,
      height: undefined,
      weight: undefined,
      timezone: undefined,
      onPeriod: false,
      periodDay: 0,
      periodCycleLength: 28,
      periodSymptoms: []
    };
  };

  const loadActionStates = async (suggestions: AISuggestion[]) => {
    try {
      const response = await fetch('/api/ai-actions');
      if (response.ok) {
        const actions = await response.json();
        const states: Record<string, { tried: boolean; helpful?: boolean }> = {};
        
        actions.forEach((action: any) => {
          if (action.suggestionId) {
            states[action.suggestionId] = {
              tried: action.tried,
              helpful: action.helpful
            };
          }
        });
        
        setActionStates(states);
      }
    } catch (error) {
      console.error('Error loading action states:', error);
    }
  };

  const getCommonActivities = (entries: MoodEntry[]): string[] => {
    const allActivities = entries.flatMap(entry => entry.activities || []);
    const activityCounts = allActivities.reduce((acc, activity) => {
      acc[activity] = (acc[activity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(activityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([activity]) => activity);
  };

  const getCurrentTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const handleTryAction = async (suggestion: AISuggestion) => {
    try {
      // Create action in database
      const response = await fetch('/api/ai-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'dummy-user', // Use same user ID as existing data
          suggestionId: suggestion.suggestionId,
          title: suggestion.title,
          description: suggestion.description,
          action: suggestion.action,
          type: suggestion.type,
          priority: suggestion.priority,
          category: suggestion.category,
          icon: suggestion.icon,
          reasoning: suggestion.reasoning
        })
      });

      if (response.ok) {
        const action = await response.json();
        
        // Update local state
        setActionStates(prev => ({
          ...prev,
          [suggestion.suggestionId!]: { tried: true, helpful: undefined }
        }));

        // Show success message (removed popup alert)
        console.log(`✅ Action logged: ${suggestion.action}`);
      } else {
        throw new Error('Failed to save action');
      }
    } catch (error) {
      console.error('Error saving action:', error);
      alert('❌ Failed to save action. Please try again.');
    }
  };

  const learnConnectionFromFeedback = async (suggestion: AISuggestion, helpful: boolean) => {
    try {
      // Extract activity and outcome from suggestion
      const activity = extractActivityFromSuggestion(suggestion);
      const outcome = extractOutcomeFromSuggestion(suggestion);
      
      if (activity && outcome) {
        const response = await fetch('/api/learn-connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'dummy-user',
            activity,
            outcome,
            isPositive: helpful
          })
        });

        if (response.ok) {
          console.log(`🧠 Learned connection: ${activity} -> ${outcome} (${helpful ? 'positive' : 'negative'})`);
        }
      }
    } catch (error) {
      console.error('Error learning connection:', error);
    }
  };

  const extractActivityFromSuggestion = (suggestion: AISuggestion): string | null => {
    const text = `${suggestion.title} ${suggestion.description} ${suggestion.action}`.toLowerCase();
    
    // Map common activities mentioned in suggestions
    const activityMap: { [key: string]: string } = {
      'read': 'reading',
      'book': 'reading',
      'music': 'music',
      'listen': 'music',
      'song': 'music',
      'exercise': 'gym',
      'workout': 'gym',
      'run': 'running',
      'walk': 'walking',
      'meditate': 'meditation',
      'breathe': 'meditation',
      'paint': 'art',
      'draw': 'art',
      'write': 'writing',
      'journal': 'writing',
      'sleep': 'sleep',
      'nap': 'sleep',
      'rest': 'sleep'
    };

    for (const [keyword, activity] of Object.entries(activityMap)) {
      if (text.includes(keyword)) {
        return activity;
      }
    }

    return null;
  };

  const extractOutcomeFromSuggestion = (suggestion: AISuggestion): string | null => {
    const text = `${suggestion.title} ${suggestion.description} ${suggestion.action}`.toLowerCase();
    
    // Map common outcomes mentioned in suggestions
    const outcomeMap: { [key: string]: string } = {
      'sleep': 'sleep',
      'better sleep': 'sleep',
      'fall asleep': 'sleep',
      'rest': 'sleep',
      'focus': 'focus',
      'concentration': 'focus',
      'energy': 'energy',
      'energized': 'energy',
      'stress': 'stress',
      'relax': 'stress',
      'calm': 'stress',
      'mood': 'mood',
      'happy': 'mood',
      'positive': 'mood',
      'motivation': 'motivation',
      'motivated': 'motivation'
    };

    for (const [keyword, outcome] of Object.entries(outcomeMap)) {
      if (text.includes(keyword)) {
        return outcome;
      }
    }

    return null;
  };

  const updateSuggestionsBasedOnFeedback = (wasHelpful: boolean) => {
    setSuggestions(prevSuggestions => 
      prevSuggestions.map(suggestion => {
        // If this suggestion was just rated, update its priority and reasoning
        if (actionStates[suggestion.suggestionId!]?.tried && 
            actionStates[suggestion.suggestionId!]?.helpful === wasHelpful) {
          
          const updatedSuggestion = { ...suggestion };
          
          if (wasHelpful) {
            // Boost priority for helpful suggestions
            updatedSuggestion.priority = 'high';
            updatedSuggestion.reasoning += ` (Boosted based on your positive feedback!)`;
          } else {
            // Lower priority for unhelpful suggestions
            updatedSuggestion.priority = 'low';
            updatedSuggestion.reasoning += ` (Reduced priority based on your feedback)`;
          }
          
          return updatedSuggestion;
        }
        return suggestion;
      })
    );
  };

  const handleRateHelpfulness = async (suggestion: AISuggestion, helpful: boolean) => {
    try {
      console.log('Rating helpfulness:', { suggestionId: suggestion.suggestionId, helpful });
      
      // Update local state immediately for better UX
      setActionStates(prev => ({
        ...prev,
        [suggestion.suggestionId!]: { 
          tried: true, 
          helpful 
        }
      }));

      // Try to find and update the action in the database
      try {
        const response = await fetch('/api/ai-actions');
        if (response.ok) {
          const actions = await response.json();
          console.log('Found actions:', actions);
          
          const action = actions.find((a: any) => a.suggestionId === suggestion.suggestionId);
          console.log('Found action to update:', action);
          
          if (action) {
            const updateResponse = await fetch(`/api/ai-actions/${action.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ helpful })
            });

            if (updateResponse.ok) {
              console.log('✅ Rating updated successfully');
            } else {
              console.error('Failed to update rating in database');
            }
          } else {
            console.log('Action not found in database, but local state updated');
          }
        }
      } catch (dbError) {
        console.log('Database update failed, but local state updated:', dbError);
      }

      // Learn connections from feedback
      await learnConnectionFromFeedback(suggestion, helpful);
      
      // Show success feedback
      console.log(`✅ Thank you for your feedback! ${helpful ? 'We\'re glad it helped!' : 'We\'ll improve our suggestions.'}`);
      
      // Update existing suggestions based on feedback (don't generate new ones)
      updateSuggestionsBasedOnFeedback(helpful);
      
    } catch (error) {
      console.error('Error rating helpfulness:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'activity': return '🎯';
      case 'tip': return '💡';
      case 'reminder': return '⏰';
      case 'encouragement': return '🌟';
      case 'challenge': return '🏆';
      default: return '📝';
    }
  };

  const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 3);

  if (suggestions.length === 0 && !loading) {
    return (
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-2xl" style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255,255,255,0.6)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)'
      }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">AI Suggestions</h3>
          <p className="text-white/90 mb-4 drop-shadow-md">Add some mood entries to get personalized suggestions!</p>
          <Button onClick={generateSuggestions} disabled={loading} className="backdrop-blur-sm bg-indigo-500/80 border-indigo-300 text-white hover:bg-indigo-600 shadow-lg font-semibold">
            {loading ? 'Generating...' : 'Generate Suggestions'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-6 shadow-2xl" style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255,255,255,0.6)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)'
    }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h3 className="text-lg font-semibold text-white drop-shadow-lg">AI Suggestions</h3>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="group relative overflow-hidden backdrop-blur-sm bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-blue-300 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg font-semibold w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center justify-center">
              {loading ? (
                <div className="animate-spin text-xl">⚡</div>
              ) : (
                <div className="text-xl group-hover:rotate-180 transition-transform duration-500">✨</div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/60 transition-all duration-300"></div>
          </button>
          {suggestions.length > 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="backdrop-blur-sm bg-purple-500/80 border-purple-300 text-white hover:bg-purple-600 shadow-lg font-semibold"
            >
              {showAll ? 'Show Less' : `Show All (${suggestions.length})`}
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="text-center py-8">
          <div className="text-red-300 text-4xl mb-4">⚠️</div>
          <p className="text-red-200 mb-4 drop-shadow-md">{error}</p>
          <Button onClick={generateSuggestions} variant="outline" className="backdrop-blur-sm bg-red-500/80 border-red-300 text-white hover:bg-red-600 shadow-lg font-semibold">
            Try Again
          </Button>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mx-auto mb-4"></div>
          <p className="text-white/90 drop-shadow-md">AI is analyzing your mood patterns and generating personalized suggestions...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`backdrop-blur-lg border border-white/30 rounded-xl p-4 shadow-lg transition-all hover:shadow-xl ${
                suggestion.priority === 'high' ? 'bg-red-500/30 border-red-400/50' :
                suggestion.priority === 'medium' ? 'bg-yellow-500/30 border-yellow-400/50' :
                'bg-green-500/30 border-green-400/50'
              }`} style={{
                background: suggestion.priority === 'high' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.1))' :
                           suggestion.priority === 'medium' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.1))' :
                           'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.1))',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)'
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{suggestion.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                    <h4 className="font-semibold text-white drop-shadow-lg">{suggestion.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                      suggestion.priority === 'high' ? 'bg-red-500 text-white border-2 border-red-300 shadow-lg' :
                      suggestion.priority === 'medium' ? 'bg-yellow-500 text-white border-2 border-yellow-300 shadow-lg' :
                      'bg-green-500 text-white border-2 border-green-300 shadow-lg'
                    }`}>
                      {suggestion.priority}
                    </span>
                  </div>
                  <p className="text-white/90 text-sm mb-3 drop-shadow-md">{suggestion.description}</p>
                  
                  {suggestion.reasoning && (
                    <div className="mb-3 p-2 backdrop-blur-sm bg-white/10 rounded text-xs text-white/80 border border-white/20">
                      <strong>AI Reasoning:</strong> {suggestion.reasoning}
                    </div>
                  )}
                  
                  {suggestion.action && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white/90 drop-shadow-md">
                        💡 {suggestion.action}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="backdrop-blur-sm bg-green-500/80 border-green-300 text-white hover:bg-green-600 shadow-lg font-semibold"
                          onClick={() => handleTryAction(suggestion)}
                          disabled={actionStates[suggestion.suggestionId!]?.tried}
                        >
                          {actionStates[suggestion.suggestionId!]?.tried ? '✅ Tried' : 'Try It'}
                        </Button>
                        
                        {actionStates[suggestion.suggestionId!]?.tried && actionStates[suggestion.suggestionId!]?.helpful === undefined && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleRateHelpfulness(suggestion, true)}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-all transform hover:scale-110"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleRateHelpfulness(suggestion, false)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-all transform hover:scale-110"
                            >
                              👎
                            </button>
                          </div>
                        )}
                        
                        {actionStates[suggestion.suggestionId!]?.tried && actionStates[suggestion.suggestionId!]?.helpful !== undefined && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-white/80">
                              {actionStates[suggestion.suggestionId!]?.helpful ? '👍 Thanks!' : '👎 Noted!'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm text-white/80">
            <span>Based on your recent mood patterns and current state</span>
            <span className="text-white/90 font-medium">
              {suggestions.filter(s => s.priority === 'high').length} high priority
            </span>
          </div>
          <div className="mt-3">
            <button
              onClick={() => setShowPayload(v => !v)}
              className="text-xs underline text-white/80 hover:text-white"
            >
              {showPayload ? 'Hide' : 'Show'} AI payload sent
            </button>
            {showPayload && lastPayload && (
              <pre className="mt-2 max-h-64 overflow-auto text-xs text-white bg-black/30 p-3 rounded border border-white/20">
{JSON.stringify(lastPayload, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
