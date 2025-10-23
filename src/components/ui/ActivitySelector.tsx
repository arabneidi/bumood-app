"use client";

import React, { useState } from 'react';
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

const activityCategories = {
  'Physical': {
    color: 'bg-gradient-to-r from-red-500 to-pink-500',
    selectedColor: 'bg-gradient-to-r from-red-600 to-pink-600',
    cardStyle: 'bg-gradient-to-br from-red-500/20 to-pink-500/15 border-red-400/30',
    activities: [
      { id: 'exercise', name: 'Exercise', icon: '💪', color: 'bg-red-100 text-red-800' },
      { id: 'walking', name: 'Walking', icon: '🚶', color: 'bg-red-100 text-red-800' },
      { id: 'running', name: 'Running', icon: '🏃', color: 'bg-red-100 text-red-800' },
      { id: 'yoga', name: 'Yoga', icon: '🧘', color: 'bg-red-100 text-red-800' },
      { id: 'dancing', name: 'Dancing', icon: '💃', color: 'bg-red-100 text-red-800' },
      { id: 'swimming', name: 'Swimming', icon: '🏊', color: 'bg-red-100 text-red-800' },
    ]
  },
  'Mental': {
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    selectedColor: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    cardStyle: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/15 border-blue-400/30',
    activities: [
      { id: 'reading', name: 'Reading', icon: '📚', color: 'bg-blue-100 text-blue-800' },
      { id: 'learning', name: 'Learning', icon: '🎓', color: 'bg-blue-100 text-blue-800' },
      { id: 'meditation', name: 'Meditation', icon: '🧘‍♀️', color: 'bg-blue-100 text-blue-800' },
      { id: 'puzzles', name: 'Puzzles', icon: '🧩', color: 'bg-blue-100 text-blue-800' },
      { id: 'writing', name: 'Writing', icon: '✍️', color: 'bg-blue-100 text-blue-800' },
      { id: 'planning', name: 'Planning', icon: '📋', color: 'bg-blue-100 text-blue-800' },
    ]
  },
  'Social': {
    color: 'bg-gradient-to-r from-green-500 to-emerald-500',
    selectedColor: 'bg-gradient-to-r from-green-600 to-emerald-600',
    cardStyle: 'bg-gradient-to-br from-green-500/20 to-emerald-500/15 border-green-400/30',
    activities: [
      { id: 'socializing', name: 'Socializing', icon: '👥', color: 'bg-green-100 text-green-800' },
      { id: 'family_time', name: 'Family Time', icon: '👨‍👩‍👧‍👦', color: 'bg-green-100 text-green-800' },
      { id: 'calling', name: 'Calling', icon: '📞', color: 'bg-green-100 text-green-800' },
      { id: 'dating', name: 'Dating', icon: '💕', color: 'bg-green-100 text-green-800' },
      { id: 'meeting', name: 'Meeting', icon: '🤝', color: 'bg-green-100 text-green-800' },
      { id: 'volunteering', name: 'Volunteering', icon: '🤲', color: 'bg-green-100 text-green-800' },
    ]
  },
  'Creative': {
    color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
    selectedColor: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    cardStyle: 'bg-gradient-to-br from-purple-500/20 to-indigo-500/15 border-purple-400/30',
    activities: [
      { id: 'music', name: 'Music', icon: '🎵', color: 'bg-purple-100 text-purple-800' },
      { id: 'art', name: 'Art', icon: '🎨', color: 'bg-purple-100 text-purple-800' },
      { id: 'cooking', name: 'Cooking', icon: '👨‍🍳', color: 'bg-purple-100 text-purple-800' },
      { id: 'crafting', name: 'Crafting', icon: '✂️', color: 'bg-purple-100 text-purple-800' },
      { id: 'photography', name: 'Photography', icon: '📸', color: 'bg-purple-100 text-purple-800' },
      { id: 'gaming', name: 'Gaming', icon: '🎮', color: 'bg-purple-100 text-purple-800' },
    ]
  },
  'Relaxation': {
    color: 'bg-gradient-to-r from-amber-500 to-orange-500',
    selectedColor: 'bg-gradient-to-r from-amber-600 to-orange-600',
    cardStyle: 'bg-gradient-to-br from-amber-500/20 to-orange-500/15 border-amber-400/30',
    activities: [
      { id: 'sleeping', name: 'Sleeping', icon: '😴', color: 'bg-yellow-100 text-yellow-800' },
      { id: 'napping', name: 'Napping', icon: '💤', color: 'bg-yellow-100 text-yellow-800' },
      { id: 'watching', name: 'Watching', icon: '📺', color: 'bg-yellow-100 text-yellow-800' },
      { id: 'bathing', name: 'Bathing', icon: '🛁', color: 'bg-yellow-100 text-yellow-800' },
      { id: 'massage', name: 'Massage', icon: '💆', color: 'bg-yellow-100 text-yellow-800' },
      { id: 'nature', name: 'Nature', icon: '🌿', color: 'bg-yellow-100 text-yellow-800' },
    ]
  },
  'Work': {
    color: 'bg-gradient-to-r from-slate-500 to-gray-500',
    selectedColor: 'bg-gradient-to-r from-slate-600 to-gray-600',
    cardStyle: 'bg-gradient-to-br from-slate-500/20 to-gray-500/15 border-slate-400/30',
    activities: [
      { id: 'working', name: 'Working', icon: '💼', color: 'bg-gray-100 text-gray-800' },
      { id: 'studying', name: 'Studying', icon: '📖', color: 'bg-gray-100 text-gray-800' },
      { id: 'meeting', name: 'Meeting', icon: '👔', color: 'bg-gray-100 text-gray-800' },
      { id: 'presenting', name: 'Presenting', icon: '📊', color: 'bg-gray-100 text-gray-800' },
      { id: 'emailing', name: 'Emailing', icon: '📧', color: 'bg-gray-100 text-gray-800' },
      { id: 'coding', name: 'Coding', icon: '💻', color: 'bg-gray-100 text-gray-800' },
    ]
  }
};

export default function ActivitySelector({ selectedActivities, onActivityToggle }: ActivitySelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Physical');

  const handleActivityClick = (activityId: string) => {
    onActivityToggle(activityId);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(activityCategories).map(([category, data]) => (
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
          {activityCategories[activeCategory as keyof typeof activityCategories].activities.map((activity) => {
            const isSelected = selectedActivities.includes(activity.id);
            return (
              <motion.button
                key={activity.id}
                type="button"
                onClick={() => handleActivityClick(activity.id)}
                className={`p-5 rounded-2xl border-2 transition-all duration-300 shadow-lg backdrop-blur-sm ${
                  isSelected
                    ? `${activityCategories[activeCategory as keyof typeof activityCategories].cardStyle} scale-105 shadow-xl`
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



