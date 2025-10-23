"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    color: 'bg-red-500',
    selectedColor: 'bg-red-600',
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
    color: 'bg-blue-500',
    selectedColor: 'bg-blue-600',
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
    color: 'bg-green-500',
    selectedColor: 'bg-green-600',
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
    color: 'bg-purple-500',
    selectedColor: 'bg-purple-600',
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
    color: 'bg-yellow-500',
    selectedColor: 'bg-yellow-600',
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
    color: 'bg-gray-500',
    selectedColor: 'bg-gray-600',
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
      <div className="flex flex-wrap gap-2">
        {Object.entries(activityCategories).map(([category, data]) => (
          <motion.button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === category
                ? `${data.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
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
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
                whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: isSelected ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{activity.icon}</div>
                  <div className={`text-sm font-medium ${
                    isSelected ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {activity.name}
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-2 text-blue-600"
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

      {/* Selected Activities Summary */}
      {selectedActivities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-gray-100 rounded-xl border border-gray-200"
        >
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            Selected Activities ({selectedActivities.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedActivities.map((activityId) => {
              // Find the activity in all categories
              let activity = null;
              for (const category of Object.values(activityCategories)) {
                const found = category.activities.find(a => a.id === activityId);
                if (found) {
                  activity = found;
                  break;
                }
              }
              if (!activity) return null;
              
              return (
                <motion.span
                  key={activityId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-white text-gray-800 rounded-full text-sm border border-gray-200"
                >
                  <span>{activity.icon}</span>
                  <span>{activity.name}</span>
                  <button
                    type="button"
                    onClick={() => onActivityToggle(activityId)}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}



