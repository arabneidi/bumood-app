"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AchievementBadge from './AchievementBadge';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: string;
  stars?: number;
  type?: 'achievement' | 'streak' | 'milestone' | 'goal';
}

export default function CelebrationModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  icon, 
  stars = 1,
  type = 'achievement'
}: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const getTypeColor = () => {
    switch (type) {
      case 'achievement': return 'from-yellow-400 to-orange-500';
      case 'streak': return 'from-blue-400 to-purple-500';
      case 'milestone': return 'from-green-400 to-teal-500';
      case 'goal': return 'from-pink-400 to-rose-500';
      default: return 'from-yellow-400 to-orange-500';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'streak': return '🔥';
      case 'milestone': return '🎯';
      case 'goal': return '⭐';
      default: return '🎉';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Custom Achievement Badge */}
          <div className="flex justify-center">
            <AchievementBadge
              title={title}
              type={type}
              stars={stars}
              unlocked={true}
              size="lg"
              description={description}
              icon={icon}
            />
          </div>
          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  initial={{ 
                    x: '50%', 
                    y: '50%', 
                    scale: 0,
                    rotate: 0
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`, 
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                    rotate: 360,
                    opacity: [1, 1, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    delay: Math.random() * 0.5,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>
          )}

          {/* Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-6"
          >
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Awesome! 🎉
            </button>
          </motion.div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors bg-white rounded-full p-2 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}



