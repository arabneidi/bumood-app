"use client";

import { useState, useEffect } from "react";
import { Target, Plus, X, Star, Trophy, Minus } from "lucide-react";

export default function GoalsPage() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Run 5K",
      difficulty: "medium",
      currentValue: 2,
      targetValue: 31,
      progress: 6
    },
    {
      id: 2,
      title: "Stop drinking alcohol",
      difficulty: "hard",
      currentValue: 0,
      targetValue: 30,
      progress: 0
    },
    {
      id: 3,
      title: "Stress Management",
      difficulty: "medium",
      currentValue: 8,
      targetValue: 14,
      progress: 57
    },
    {
      id: 4,
      title: "Morning Exercise",
      difficulty: "hard",
      currentValue: 15,
      targetValue: 21,
      progress: 71
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "",
    subcategory: "",
    targetValue: 30,
    currentValue: 0,
    difficulty: "medium"
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedGoal, setCompletedGoal] = useState(null);
  const [completedGoals, setCompletedGoals] = useState([]);

  const goalCategories = [
    {
      id: "health",
      name: "Health & Fitness",
      subcategories: [
        { id: "exercise", name: "Exercise", examples: ["Run 5K", "Gym 3x/week", "Daily yoga"] },
        { id: "nutrition", name: "Nutrition", examples: ["Drink 8 glasses water", "Eat 5 veggies", "No sugar"] },
        { id: "sleep", name: "Sleep", examples: ["Sleep 8 hours", "Bed by 10pm", "No phone before bed"] },
      ]
    },
    {
      id: "mental",
      name: "Mental Wellness",
      subcategories: [
        { id: "meditation", name: "Meditation", examples: ["Meditate 10 min", "Morning mindfulness", "Evening reflection"] },
        { id: "breaking-bad-habits", name: "Break Bad Habits", examples: ["Quit smoking", "No alcohol", "Reduce caffeine"] },
        { id: "learning", name: "Learning", examples: ["Read 30 min", "Learn new skill", "Take course"] },
      ]
    },
    {
      id: "productivity",
      name: "Productivity",
      subcategories: [
        { id: "work", name: "Work", examples: ["Complete project", "Learn new tool", "Networking"] },
        { id: "organization", name: "Organization", examples: ["Clean desk daily", "Plan tomorrow", "Declutter"] },
      ]
    },
    {
      id: "relationships",
      name: "Relationships",
      subcategories: [
        { id: "family", name: "Family", examples: ["Call parents weekly", "Family dinner", "Quality time"] },
        { id: "friends", name: "Friends", examples: ["Meet friend weekly", "Message friends", "Plan outing"] },
      ]
    }
  ];

  const [achievements, setAchievements] = useState({
    achieved: [],
    locked: []
  });

  // Define all possible achievements
  const allAchievements = [
    {
      id: "getting-started",
      title: "Getting Started",
      description: "Log your first mood entry",
      icon: "🌟",
      stars: 1,
      type: "streak"
    },
    {
      id: "streak-3",
      title: "3-Day Streak",
      description: "Log mood entries for 3 consecutive days",
      icon: "🔥",
      stars: 1,
      type: "streak"
    },
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Log mood entries for 7 consecutive days",
      icon: "⚡",
      stars: 2,
      type: "streak"
    },
    {
      id: "streak-30",
      title: "Monthly Master",
      description: "Log mood entries for 30 consecutive days",
      icon: "🏆",
      stars: 3,
      type: "streak"
    },
    {
      id: "entries-10",
      title: "Mood Tracker",
      description: "Log 10 mood entries total",
      icon: "📊",
      stars: 1,
      type: "count"
    },
    {
      id: "entries-50",
      title: "Data Collector",
      description: "Log 50 mood entries total",
      icon: "📈",
      stars: 2,
      type: "count"
    },
    {
      id: "entries-100",
      title: "Mood Expert",
      description: "Log 100 mood entries total",
      icon: "🎯",
      stars: 3,
      type: "count"
    },
    {
      id: "activities-5",
      title: "Activity Explorer",
      description: "Try 5 different activities",
      icon: "🎪",
      stars: 1,
      type: "activity"
    },
    {
      id: "activities-15",
      title: "Activity Master",
      description: "Try 15 different activities",
      icon: "🎨",
      stars: 2,
      type: "activity"
    },
    {
      id: "perfect-week",
      title: "Perfect Week",
      description: "Log entries every day for a week",
      icon: "💎",
      stars: 3,
      type: "streak"
    }
  ];
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch("/api/goals");
        if (response.ok) {
          const data = await response.json();
          // Filter active and completed goals
          const activeGoals = data
            .filter((goal: any) => !goal.completed)
            .map((goal: any) => ({
              ...goal,
              progress: Math.round((goal.currentValue / goal.targetValue) * 100)
            }));
          
          const completedGoalsData = data
            .filter((goal: any) => goal.completed)
            .map((goal: any) => ({
              ...goal,
              progress: 100
            }));
          
          setGoals(activeGoals);
          setCompletedGoals(completedGoalsData);
        } else {
          console.error("Failed to fetch goals");
        }
      } catch (error) {
        console.error("Error fetching goals:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAchievements = async () => {
      try {
        const response = await fetch("/api/achievements");
        if (response.ok) {
          const achievedData = await response.json();
          console.log("API returned achievements:", achievedData);
          
          // If no achievements from API, show all as locked
          if (achievedData.length === 0) {
            setAchievements({
              achieved: [],
              locked: allAchievements
            });
          } else {
            const achievedIds = achievedData.map((achievement: any) => achievement.id || achievement.title.toLowerCase().replace(/\s+/g, '-'));
            console.log("Achieved IDs:", achievedIds);
            
            // Separate achieved and locked achievements
            const achieved = allAchievements.filter(achievement => 
              achievedIds.includes(achievement.id) || 
              achievedIds.includes(achievement.title.toLowerCase().replace(/\s+/g, '-'))
            );
            
            const locked = allAchievements.filter(achievement => 
              !achievedIds.includes(achievement.id) && 
              !achievedIds.includes(achievement.title.toLowerCase().replace(/\s+/g, '-'))
            );
            
            console.log("Achieved:", achieved.length, "Locked:", locked.length);
            
            setAchievements({
              achieved,
              locked
            });
          }
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
        // If API fails, show all as locked
        setAchievements({
          achieved: [],
          locked: allAchievements
        });
      }
    };

    fetchGoals();
    fetchAchievements();
  }, []);

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.category || !newGoal.subcategory) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newGoal,
          userId: 1,
        }),
      });

      if (response.ok) {
        const createdGoal = await response.json();
        setGoals([...goals, createdGoal]);
        
        // Signal dashboard that goals have changed
        localStorage.setItem('goals-changed', Date.now().toString());
        console.log('🎯 Goal created - signaling dashboard to regenerate Pro Tips');
        
        setNewGoal({
          title: "",
          category: "",
          subcategory: "",
          targetValue: 30,
          currentValue: 0,
          difficulty: "medium"
        });
        setShowAddGoal(false);
        setSelectedCategory("");
        setSelectedSubcategory("");
        setSelectedGoal("");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const updateProgress = async (goalId, change) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newValue = Math.max(0, Math.min(goal.currentValue + change, goal.targetValue));
        const newProgress = Math.round((newValue / goal.targetValue) * 100);
        
        // Check if goal is completed (100%)
        if (newProgress >= 100 && change > 0) {
          setCompletedGoal(goal);
          setShowCompletionModal(true);
        }
        
        return { ...goal, currentValue: newValue, progress: newProgress };
      }
      return goal;
    });

    // Update local state immediately for responsive UI
    setGoals(updatedGoals);

    // Update database
    try {
      const goalToUpdate = updatedGoals.find(goal => goal.id === goalId);
      if (goalToUpdate) {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentValue: goalToUpdate.currentValue,
          }),
        });

        if (!response.ok) {
          console.error('Failed to update goal progress in database');
          // Optionally revert the local state change
        }
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from database
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
        console.log('Goal deleted successfully');
      } else {
        console.error('Failed to delete goal from database');
        alert('Failed to delete goal. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Error deleting goal. Please try again.');
    }
  };

  const getSelectedCategory = () => {
    return goalCategories.find(cat => cat.id === selectedCategory);
  };

  const getSelectedSubcategory = () => {
    const category = getSelectedCategory();
    return category?.subcategories.find(sub => sub.id === selectedSubcategory);
  };

  const handleGoalCompletion = async () => {
    if (completedGoal) {
      try {
        // Update database - mark goal as completed
        const response = await fetch(`/api/goals/${completedGoal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed: true,
            currentValue: completedGoal.targetValue,
          }),
        });

        if (response.ok) {
          // Remove completed goal from the list
          setGoals(prevGoals => prevGoals.filter(goal => goal.id !== completedGoal.id));
          
          // Here you would typically:
          // 1. Update achievement progress
          // 2. Send notification to user
          // 3. Update user statistics
          
          console.log(`Goal completed: ${completedGoal.title}`);
          
          // TODO: Update achievements based on completed goal
          // TODO: Send completion notification
          // TODO: Update user statistics
          
        } else {
          console.error('Failed to mark goal as completed in database');
        }
      } catch (error) {
        console.error('Error completing goal:', error);
      }
      
      // Reset modal state
      setShowCompletionModal(false);
      setCompletedGoal(null);
    }
  };

  const handleCancelCompletion = () => {
    // Reset the goal progress back to 99% if user cancels
    if (completedGoal) {
      setGoals(prevGoals =>
        prevGoals.map(goal => {
          if (goal.id === completedGoal.id) {
            const newValue = Math.max(0, completedGoal.targetValue - 1);
            const newProgress = Math.round((newValue / completedGoal.targetValue) * 100);
            return { ...goal, currentValue: newValue, progress: newProgress };
          }
          return goal;
        })
      );
    }
    
    setShowCompletionModal(false);
    setCompletedGoal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="w-16 h-16 border-4 border-blue-400/50 border-t-blue-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Animated Background */}
      <div className="absolute top-16 left-0 right-0 bottom-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(59,130,246,0.1)_25%,rgba(59,130,246,0.1)_26%,transparent_27%,transparent_74%,rgba(59,130,246,0.1)_75%,rgba(59,130,246,0.1)_76%,transparent_77%)] bg-[length:50px_50px] animate-pulse"></div>
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${2 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
          {[...Array(15)].map((_, i) => (
            <div
              key={`large-${i}`}
              className="absolute w-4 h-4 bg-cyan-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `drift ${5 + Math.random() * 5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-15px) rotate(-1deg); }
        }
        
        @keyframes drift {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(90deg); }
          50% { transform: translate(-5px, -10px) rotate(180deg); }
          75% { transform: translate(-15px, 5px) rotate(270deg); }
        }
      `}</style>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1
          className="text-6xl font-bold text-center mb-12"
          style={{
            background: 'linear-gradient(45deg, #06b6d4, #3b82f6, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Goals & Achievements
        </h1>

        {/* Create New Goal Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowAddGoal(true)}
            className="relative overflow-hidden group hover:scale-105 transition-all duration-500 rounded-2xl px-8 py-4 font-bold text-lg"
            style={{
              background: 'rgba(30, 41, 59, 0.3)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Edge glow effect */}
            <div className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(45deg, transparent, rgba(6, 182, 212, 0.1), transparent)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.2), 0 0 40px rgba(6, 182, 212, 0.3)'
              }}
            ></div>
            
            {/* Glass overlay */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(10px)'
              }}
            ></div>
            
            <div className="relative z-10 flex items-center justify-center">
              <Plus className="w-6 h-6 inline-block mr-2" />
              <span style={{
                background: 'linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
              }}>
                Create New Goal
              </span>
            </div>
          </button>
        </div>

        {/* Goals List */}
        <div className="mb-16">

          {goals.length === 0 ? (
            <div className="text-center py-20 relative overflow-hidden group hover:scale-105 transition-all duration-500 rounded-3xl p-8"
              style={{
                background: 'rgba(30, 41, 59, 0.3)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Edge glow effect */}
              <div className="absolute inset-0 rounded-3xl"
                style={{
                  background: 'linear-gradient(45deg, transparent, rgba(6, 182, 212, 0.1), transparent)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.2), 0 0 40px rgba(6, 182, 212, 0.3)'
                }}
              ></div>
              
              {/* Glass overlay */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  backdropFilter: 'blur(10px)'
                }}
              ></div>
              
              <div className="relative z-10">
                <Target className="w-20 h-20 text-blue-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4" style={{
                  background: 'linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
                }}>
                  No Goals Yet
                </h3>
                <p className="text-slate-300 text-lg font-medium">Create your first goal to get started on your journey!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {goals.map((goal, index) => (
                <div 
                  key={goal.id} 
                  className="relative overflow-hidden group hover:scale-105 transition-all duration-500 rounded-2xl"
                  style={{
                    animation: `float ${3 + (index * 0.5)}s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`,
                    background: 'rgba(30, 41, 59, 0.3)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Edge glow effect - always visible */}
                  <div className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(45deg, transparent, rgba(6, 182, 212, 0.1), transparent)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      boxShadow: 'inset 0 0 20px rgba(6, 182, 212, 0.2), 0 0 40px rgba(6, 182, 212, 0.3)'
                    }}
                  ></div>
                  
                  {/* Glass overlay */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                      backdropFilter: 'blur(10px)'
                    }}
                  ></div>
                  
                  <div className="relative z-10 p-6">
                    {/* Delete button - top right */}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="absolute top-4 right-4 p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-all duration-200 z-20"
                      title="Delete this goal"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mr-4">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1" style={{
                          background: 'linear-gradient(45deg, #06b6d4, #3b82f6, #8b5cf6)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
                        }}>
                          {goal.title}
                        </h3>
                        <div className="text-xs text-cyan-300 font-medium">Active Goal</div>
                      </div>
                    </div>
                    
                    <div className="mb-4 space-y-3">
                      {/* Category */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-cyan-300 text-sm font-medium">Category</span>
                        </div>
                        <span className="text-white text-sm font-bold bg-cyan-500/20 px-3 py-1 rounded-full">{goal.category}</span>
                      </div>
                      
                      {/* Type */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-purple-300 text-sm font-medium">Type</span>
                        </div>
                        <span className="text-white text-sm font-bold bg-purple-500/20 px-3 py-1 rounded-full">{goal.subcategory}</span>
                      </div>
                      
                      {/* Difficulty */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-orange-300 text-sm font-medium">Difficulty</span>
                        </div>
                        <span className={`text-white text-sm font-bold px-3 py-1 rounded-full capitalize ${
                          goal.difficulty === 'easy' ? 'bg-green-500/20' :
                          goal.difficulty === 'medium' ? 'bg-yellow-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {goal.difficulty}
                        </span>
                      </div>
                      
                      {/* Progress */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-emerald-300 text-sm font-medium">Progress</span>
                        </div>
                        <span className="text-white text-sm font-bold bg-emerald-500/20 px-3 py-1 rounded-full">{goal.currentValue}/{goal.targetValue} days</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((goal.currentValue / goal.targetValue) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 text-sm">{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProgress(goal.id, -1)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => updateProgress(goal.id, 1)}
                        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Goals Section */}
        {completedGoals.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black mb-4" style={{
                background: 'linear-gradient(45deg, #10b981, #059669, #047857, #065f46)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Completed Goals
              </h2>
              <p className="text-slate-300 text-lg">Your achievements and completed goals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {completedGoals.map((goal, index) => (
                <div 
                  key={goal.id} 
                  className="relative overflow-hidden group hover:scale-105 transition-all duration-500 rounded-2xl"
                  style={{
                    animation: `float ${4 + (index * 0.3)}s ease-in-out infinite`,
                    animationDelay: `${index * 0.2}s`,
                    background: 'rgba(16, 185, 129, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Edge glow effect - green for completed */}
                  <div className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(45deg, transparent, rgba(16, 185, 129, 0.1), transparent)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.2), 0 0 40px rgba(16, 185, 129, 0.3)'
                    }}
                  ></div>
                  
                  <div className="relative z-10 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1" style={{
                          background: 'linear-gradient(45deg, #10b981, #059669, #047857)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                        }}>
                          {goal.title}
                        </h3>
                        <div className="text-xs text-green-300 font-medium">✅ Completed Goal</div>
                      </div>
                    </div>
                    
                    <div className="mb-4 space-y-3">
                      {/* Category */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-green-300 text-sm font-medium">Category</span>
                        </div>
                        <span className="text-white text-sm font-bold bg-green-500/20 px-3 py-1 rounded-full">{goal.category}</span>
                      </div>
                      
                      {/* Type */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-emerald-300 text-sm font-medium">Type</span>
                        </div>
                        <span className="text-white text-sm font-bold bg-emerald-500/20 px-3 py-1 rounded-full">{goal.subcategory}</span>
                      </div>
                      
                      {/* Difficulty */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-teal-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-teal-300 text-sm font-medium">Difficulty</span>
                        </div>
                        <span className={`text-white text-sm font-bold px-3 py-1 rounded-full capitalize ${
                          goal.difficulty === 'easy' ? 'bg-green-500/20' :
                          goal.difficulty === 'medium' ? 'bg-yellow-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {goal.difficulty}
                        </span>
                      </div>
                      
                      {/* Duration */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                          <span className="text-cyan-300 text-sm font-medium">Duration</span>
                        </div>
                        <span className="text-white text-sm font-bold bg-cyan-500/20 px-3 py-1 rounded-full">{goal.targetValue} days</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-300 text-sm font-bold">100% Complete!</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black mb-4" style={{
              background: 'linear-gradient(45deg, #f59e0b, #eab308, #84cc16, #22c55e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Achievement Badges
            </h2>
            <p className="text-slate-300 text-lg">Unlock badges by completing goals and building streaks</p>
          </div>

          {/* Achieved Badges */}
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="mr-4">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-green-500 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">✅ Achieved Badges</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {achievements.achieved.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-slate-300">No achievements unlocked yet. Keep working on your goals!</p>
                </div>
              ) : (
                achievements.achieved.map((badge, index) => (
                <div 
                  key={badge.id} 
                  className="relative p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/50 group hover:scale-105"
                  style={{
                    animation: `float ${4 + (index * 0.3)}s ease-in-out infinite`,
                    animationDelay: `${index * 0.4}s`
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl border-2 border-green-400/50 shadow-[0_0_25px_rgba(34,197,94,0.8)] animate-pulse group-hover:shadow-[0_0_40px_rgba(34,197,94,1)] transition-all duration-500"></div>
                  <div className="relative text-center">
                    <div className="text-6xl mb-4">{badge.icon}</div>
                    <h4 className="text-xl font-black mb-2 text-green-300">{badge.title}</h4>
                    <p className="text-sm mb-4 text-green-200">{badge.description}</p>
                    <div className="flex justify-center space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < badge.stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <div className="mt-4 text-green-300 font-bold">✅ Achieved!</div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Locked Badges */}
          <div>
            <div className="flex items-center mb-8">
              <div className="mr-4">
                <div className="p-3 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-black bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 bg-clip-text text-transparent">🔒 Locked Badges</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {achievements.locked.map((badge, index) => (
                <div 
                  key={badge.id} 
                  className="relative p-6 rounded-2xl border shadow-2xl transition-all duration-300 bg-slate-800/20 border-slate-700/30 opacity-60 group hover:opacity-80 hover:scale-105"
                  style={{
                    animation: `float ${5 + (index * 0.4)}s ease-in-out infinite`,
                    animationDelay: `${index * 0.6}s`
                  }}
                >
                  <div className="absolute inset-0 rounded-2xl border border-slate-400/30 shadow-[0_0_15px_rgba(148,163,184,0.4)]"></div>
                  <div className="text-center">
                    <div className="text-6xl mb-4 grayscale opacity-50">{badge.icon}</div>
                    <h4 className="text-xl font-black mb-2 text-slate-400">{badge.title}</h4>
                    <p className="text-sm mb-4 text-slate-500">{badge.description}</p>
                    <div className="flex justify-center space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < badge.stars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <div className="mt-4 text-slate-500 font-bold">🔒 Locked</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddGoal(false)}>
          <div className="relative w-[95vw] max-w-6xl h-[95vh] mx-4 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-white">Create New Goal</h3>
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="p-2 rounded-full bg-slate-700/60 hover:bg-slate-600/60 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <label className="block text-lg font-semibold text-slate-200 mb-3">Choose Your Goal Category</label>
                  <div className="space-y-6">
                    {goalCategories.map((category, index) => {
                      const colors = [
                        { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.4)', glow: 'rgba(6, 182, 212, 0.3)' }, // Cyan
                        { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.4)', glow: 'rgba(34, 197, 94, 0.3)' }, // Green
                        { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.4)', glow: 'rgba(168, 85, 247, 0.3)' }, // Purple
                        { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.4)', glow: 'rgba(245, 158, 11, 0.3)' }, // Orange
                        { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.4)', glow: 'rgba(239, 68, 68, 0.3)' }  // Red
                      ];
                      const color = colors[index % colors.length];
                      
                      return (
                      <div key={category.id} className="relative overflow-hidden group rounded-xl p-4 border backdrop-blur-sm"
                           style={{
                             background: color.bg,
                             backdropFilter: 'blur(20px)',
                             border: `1px solid ${color.border}`,
                             boxShadow: `inset 0 0 20px ${color.glow}, 0 0 40px ${color.glow}`
                           }}>
                        <h3 className="text-lg font-bold text-white mb-4">{category.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {category.subcategories.map((subcategory, subIndex) => {
                            const subColors = [
                              { bg: 'rgba(6, 182, 212, 0.2)', border: 'rgba(6, 182, 212, 0.5)', glow: 'rgba(6, 182, 212, 0.2)' }, // Cyan
                              { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.5)', glow: 'rgba(34, 197, 94, 0.2)' }, // Green
                              { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.5)', glow: 'rgba(168, 85, 247, 0.2)' }, // Purple
                              { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', glow: 'rgba(245, 158, 11, 0.2)' }, // Orange
                              { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', glow: 'rgba(239, 68, 68, 0.2)' }  // Red
                            ];
                            const subColor = subColors[subIndex % subColors.length];
                            
                            return (
                            <div
                              key={subcategory.id}
                              className="relative overflow-hidden p-4 rounded-lg border-2 transition-all duration-300"
                              style={{
                                background: subColor.bg,
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${subColor.border}`,
                                boxShadow: `inset 0 0 15px ${subColor.glow}, 0 0 30px ${subColor.glow}`
                              }}
                            >
                              <h4 className="text-lg font-bold text-white mb-4">{subcategory.name}</h4>
                              
                              {/* Goal examples directly visible within each subcategory */}
                              <div className="grid grid-cols-1 gap-2">
                                {subcategory.examples?.map((example, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setSelectedCategory(category.id);
                                      setSelectedSubcategory(subcategory.id);
                                      setSelectedGoal(example);
                                      setNewGoal({ 
                                        ...newGoal, 
                                        title: example,
                                        category: subcategory.name,
                                        subcategory: example
                                      });
                                    }}
                                    className="relative overflow-hidden p-3 rounded-lg border transition-all duration-300 text-left"
                                    style={{
                                      backdropFilter: 'blur(10px)',
                                      background: selectedGoal === example 
                                        ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))'
                                        : 'rgba(30, 41, 59, 0.3)',
                                      border: selectedGoal === example 
                                        ? '1px solid rgba(6, 182, 212, 0.7)'
                                        : '1px solid rgba(148, 163, 184, 0.3)',
                                      boxShadow: selectedGoal === example
                                        ? '0 0 20px rgba(6, 182, 212, 0.5)'
                                        : '0 4px 16px rgba(0, 0, 0, 0.1)'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (selectedGoal !== example) {
                                        e.currentTarget.style.border = '1px solid rgba(6, 182, 212, 0.5)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.3)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedGoal !== example) {
                                        e.currentTarget.style.border = '1px solid rgba(148, 163, 184, 0.3)';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                                      }
                                    }}
                                  >
                                    <h5 className="text-sm font-medium text-white mb-1">{example}</h5>
                                    <p className="text-xs text-slate-400">Click to use this goal</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                {/* Days and Difficulty */}
                {selectedGoal && (
                  <div className="space-y-6">
                    {/* Editable Category and Subcategory */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-semibold text-slate-200 mb-3">Category</label>
                        <input
                          type="text"
                          value={newGoal.category}
                          onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                          placeholder="Enter category name"
                          className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-lg font-semibold text-slate-200 mb-3">Subcategory</label>
                        <input
                          type="text"
                          value={newGoal.subcategory}
                          onChange={(e) => setNewGoal({ ...newGoal, subcategory: e.target.value })}
                          placeholder="Enter subcategory name"
                          className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:border-cyan-400/70 focus:outline-none transition-all duration-300"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-semibold text-slate-200 mb-3">Target Days</label>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setNewGoal({ ...newGoal, targetValue: Math.max(1, newGoal.targetValue - 1) })}
                            className="p-2 rounded-full bg-slate-700/60 hover:bg-slate-600/60 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-white" />
                          </button>
                          <input
                            type="number"
                            value={newGoal.targetValue}
                            onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 1 })}
                            min="1"
                            className="w-20 p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white text-center focus:border-cyan-400/70 focus:outline-none transition-all duration-300"
                          />
                          <button
                            onClick={() => setNewGoal({ ...newGoal, targetValue: newGoal.targetValue + 1 })}
                            className="p-2 rounded-full bg-slate-700/60 hover:bg-slate-600/60 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-slate-200 mb-3">Difficulty</label>
                        <select
                          value={newGoal.difficulty}
                          onChange={(e) => setNewGoal({ ...newGoal, difficulty: e.target.value })}
                          className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white focus:border-cyan-400/70 focus:outline-none transition-all duration-300"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleCreateGoal}
                      disabled={!newGoal.title.trim() || !newGoal.category.trim() || !newGoal.subcategory.trim()}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Goal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Completion Confirmation Modal */}
      {showCompletionModal && completedGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleCancelCompletion}>
          <div className="relative w-[90vw] max-w-md mx-4 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 rounded-3xl border-2 border-green-400/50 shadow-[0_0_25px_rgba(34,197,94,0.6)] animate-pulse pointer-events-none"></div>
            
            <div className="relative z-10 text-center">
              {/* Celebration Icon */}
              <div className="text-6xl mb-4">🎉</div>
              
              {/* Title */}
              <h3 className="text-3xl font-bold text-white mb-4">Congratulations!</h3>
              
              {/* Goal Details */}
              <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600/50">
                <h4 className="text-xl font-bold text-green-300 mb-2">{completedGoal.title}</h4>
                <p className="text-slate-300">You've successfully completed your goal!</p>
                <div className="mt-3 flex items-center justify-center space-x-4">
                  <span className="text-sm text-slate-400">Difficulty:</span>
                  <span className="text-sm font-medium text-slate-200 capitalize">{completedGoal.difficulty}</span>
                  <span className="text-sm text-slate-400">Days:</span>
                  <span className="text-sm font-medium text-slate-200">{completedGoal.targetValue}</span>
                </div>
              </div>
              
              {/* Achievement Impact */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 mb-6 border border-green-400/30">
                <h5 className="text-lg font-bold text-green-300 mb-2">🏆 Achievement Unlocked!</h5>
                <p className="text-sm text-green-200">This completion will contribute to your achievement badges and overall progress.</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCancelCompletion}
                  className="flex-1 px-4 py-3 bg-slate-600/60 hover:bg-slate-600/80 text-slate-300 rounded-xl font-medium transition-all duration-300"
                >
                  Not Yet
                </button>
                <button
                  onClick={handleGoalCompletion}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                >
                  Complete Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}