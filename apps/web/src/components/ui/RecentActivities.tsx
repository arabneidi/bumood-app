import React from 'react';
import { motion } from 'framer-motion';

interface RecentActivitiesProps {
  recentActivities: string[];
  onActivitySelect: (activity: string) => void;
  selectedActivities: string[];
}

export default function RecentActivities({ 
  recentActivities, 
  onActivitySelect, 
  selectedActivities 
}: RecentActivitiesProps) {
  if (!recentActivities || recentActivities.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className="flex items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 to-transparent ml-4"></div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {recentActivities.map((activity, index) => {
          const isSelected = selectedActivities.includes(activity);
          return (
            <motion.button
              key={`${activity}-${index}`}
              type="button"
              onClick={() => onActivitySelect(activity)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                backdrop-blur-sm border-2
                ${isSelected 
                  ? 'bg-blue-500/30 text-white border-blue-400/60 shadow-lg shadow-blue-500/20' 
                  : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/15 hover:border-white/30'
                }
              `}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">⚡</span>
                <span className="truncate">{activity}</span>
              </div>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-xs text-white">✓</span>
                </motion.div>
              )}
              
              {/* Subtle glow effect when selected */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-sm -z-10"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      <div className="mt-3 text-xs text-slate-400 text-center">
        💡 Click to quickly add your recent activities
      </div>
    </motion.div>
  );
}
