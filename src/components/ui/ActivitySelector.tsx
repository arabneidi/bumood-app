"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function for category unselected styles
const getCategoryUnselectedStyle = (category: string) => {
  const colorMap: { [key: string]: string } = {
    'Physical': 'bg-gradient-to-r from-red-500/20 to-pink-500/15 text-red-200 hover:text-white hover:scale-105 border border-red-400/30 hover:border-red-300/50 hover:shadow-lg',
    'Mental': 'bg-gradient-to-r from-blue-500/20 to-cyan-500/15 text-blue-200 hover:text-white hover:scale-105 border border-blue-400/30 hover:border-blue-300/50 hover:shadow-lg',
    'Social': 'bg-gradient-to-r from-green-500/20 to-emerald-500/15 text-green-200 hover:text-white hover:scale-105 border border-green-400/30 hover:border-green-300/50 hover:shadow-lg',
    'Creative': 'bg-gradient-to-r from-purple-500/20 to-indigo-500/15 text-purple-200 hover:text-white hover:scale-105 border border-purple-400/30 hover:border-purple-300/50 hover:shadow-lg',
    'Relaxation': 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-200 hover:text-white hover:scale-105 border border-amber-400/30 hover:border-amber-300/50 hover:shadow-lg',
    'Work': 'bg-gradient-to-r from-slate-500/20 to-gray-500/15 text-slate-200 hover:text-white hover:scale-105 border border-slate-400/30 hover:border-slate-300/50 hover:shadow-lg'
  };
  return colorMap[category] || 'bg-gradient-to-r from-slate-500/20 to-gray-500/15 text-slate-200 hover:text-white hover:scale-105 border border-slate-400/30 hover:border-slate-300/50 hover:shadow-lg';
};

interface Activity {
  id: string;
  name: string;
  icon: string;
  category: string;
  color: string;
}

interface ActivitySelectorProps {
  selectedActivities: string[];
  onActivityToggle: (activity: string) => void;
}

interface PredefinedActivity {
  id: string;
  name: string;
  icon: string;
  category: string;
  dssComponent: string;
  color?: string;
}

// Category styling configuration
const categoryStyles = {
  'Physical': {
    color: 'bg-gradient-to-r from-red-500 to-pink-500',
    selectedColor: 'bg-gradient-to-r from-red-600 to-pink-500',
    cardStyle: 'bg-gradient-to-br from-red-500/20 to-pink-500/15 border-red-400/30'
  },
  'Mental': {
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    selectedColor: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    cardStyle: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/15 border-blue-400/30'
  },
  'Social': {
    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    selectedColor: 'bg-gradient-to-r from-green-600 to-emerald-600',
    cardStyle: 'bg-gradient-to-br from-green-500/20 to-emerald-500/15 border-green-400/30'
  },
  'Creative': {
    color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    selectedColor: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    cardStyle: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/15 border-purple-400/30'
  },
  'Relaxation': {
    color: 'bg-gradient-to-r from-amber-500 to-orange-500',
    selectedColor: 'bg-gradient-to-r from-amber-600 to-orange-600',
    cardStyle: 'bg-gradient-to-br from-amber-500/20 to-orange-500/15 border-amber-400/30'
  },
  'Work': {
    color: 'bg-gradient-to-r from-slate-500 to-gray-500',
    selectedColor: 'bg-gradient-to-r from-slate-600 to-gray-600',
    cardStyle: 'bg-gradient-to-br from-slate-500/20 to-gray-500/15 border-slate-400/30'
  }
};

export default function ActivitySelector({ selectedActivities, onActivityToggle }: ActivitySelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Physical');
  const [predefinedActivities, setPredefinedActivities] = useState<PredefinedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredefinedActivities = async () => {
      try {
        const response = await fetch('/api/predefined-activities');
        if (response.ok) {
          const data = await response.json();
          setPredefinedActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Error fetching predefined activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredefinedActivities();
  }, []);

  // Generate activity categories from database data
  const getActivityCategories = () => {
    if (predefinedActivities.length === 0) return {};
    
    const categories = predefinedActivities.reduce((acc, activity) => {
      if (!acc[activity.category]) {
        acc[activity.category] = {
          ...categoryStyles[activity.category as keyof typeof categoryStyles],
          activities: []
        };
      }
      acc[activity.category].activities.push({
        id: activity.name.toLowerCase().replace(/\s+/g, '_'),
        name: activity.name,
        icon: activity.icon,
        color: activity.color || 'bg-gray-100 text-gray-800'
      });
      return acc;
    }, {} as any);
    
    return categories;
  };

  const handleActivityClick = (activityId: string) => {
    onActivityToggle(activityId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-700 rounded-lg mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(getActivityCategories()).map(([category, data]) => (
          <motion.button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 backdrop-blur-sm ${
              activeCategory === category
                ? `${data.color} text-white shadow-xl scale-105 border-2 border-white/30`
                : getCategoryUnselectedStyle(category)
            }`}
            whileHover={{ scale: activeCategory === category ? 1.05 : 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            {category}
          </motion.button>
        ))}
      </div>

      {/* Activities Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {getActivityCategories()[activeCategory as keyof ReturnType<typeof getActivityCategories>]?.activities.map((activity) => {
            const isSelected = selectedActivities.includes(activity.id);
            return (
              <motion.button
                key={activity.id}
                type="button"
                onClick={() => handleActivityClick(activity.id)}
                className={`p-5 rounded-2xl border-2 transition-all duration-300 shadow-lg backdrop-blur-sm ${
                  isSelected
                    ? `${getActivityCategories()[activeCategory as keyof ReturnType<typeof getActivityCategories>]?.cardStyle} scale-105 shadow-xl`
                    : 'bg-gradient-to-br from-slate-500/20 to-gray-500/15 border-slate-400/30 hover:shadow-md'
                }`}
                whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">{activity.icon}</div>
                  <div className={`text-sm font-semibold ${
                    isSelected ? 'text-white drop-shadow-lg' : 'text-white/90'
                  }`}>
                    {activity.name}
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2 text-white text-lg font-bold"
                    >
                      ✓
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}



