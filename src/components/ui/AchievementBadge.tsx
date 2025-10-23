import React from 'react';
import { motion } from 'framer-motion';

interface AchievementBadgeProps {
  title: string;
  type: string;
  stars: number;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  description?: string;
  icon?: string;
}

export default function AchievementBadge({ 
  title, 
  type, 
  stars, 
  unlocked, 
  size = 'md',
  description,
  icon
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-32 h-20',
    md: 'w-full h-40', 
    lg: 'w-full h-48'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const iconSizes = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl'
  };

  const baseClasses = `${sizeClasses[size]} mx-auto relative transition-all duration-300 hover:scale-110 transform ${
    unlocked ? '' : 'opacity-70 grayscale-50'
  }`;

  const getBadgeContent = () => {
    switch (title) {
      case "First Steps":
        return {
          gradient: 'bg-gradient-to-br from-green-400 to-emerald-500',
          icon: '👶'
        };
      
      case "Week Warrior":
        return {
          gradient: 'bg-gradient-to-br from-orange-400 to-red-500',
          icon: '🔥'
        };
      
      case "Monthly Master":
        return {
          gradient: 'bg-gradient-to-br from-purple-400 to-blue-500',
          icon: '📅'
        };
      
      case "Sunshine Soul":
        return {
          gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500',
          icon: '☀️'
        };
      
      case "Energizer Bunny":
        return {
          gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500',
          icon: '⚡'
        };
      
      case "Sleep Champion":
        return {
          gradient: 'bg-gradient-to-br from-indigo-400 to-purple-500',
          icon: '😴'
        };
      
      case "Zen Master":
        return {
          gradient: 'bg-gradient-to-br from-teal-400 to-green-500',
          icon: '🧘'
        };
      
      case "Activity Enthusiast":
        return {
          gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
          icon: '🏃'
        };
      
      case "Goal Getter":
        return {
          gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
          icon: '🎯'
        };
      
      case "Goal Crusher":
        return {
          gradient: 'bg-gradient-to-br from-purple-400 to-fuchsia-500',
          icon: '💪'
        };
      
      case "Streak Star":
        return {
          gradient: 'bg-gradient-to-br from-yellow-500 to-amber-500',
          icon: '⭐'
        };
      
      case "Streak Legend":
        return {
          gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
          icon: '👑'
        };
      
      // New creative badges inspired by the images
      case "Nerd Hero":
        return {
          gradient: 'bg-gradient-to-br from-amber-400 to-yellow-500',
          icon: '🤓'
        };
      
      case "Hydration Guardian":
        return {
          gradient: 'bg-gradient-to-br from-cyan-400 to-blue-500',
          icon: '💧'
        };
      
      case "Calm Mind":
        return {
          gradient: 'bg-gradient-to-br from-emerald-400 to-green-500',
          icon: '🧘'
        };
      
      case "Movie Buff":
        return {
          gradient: 'bg-gradient-to-br from-pink-400 to-purple-500',
          icon: '🎬'
        };
      
      case "Colorful Life":
        return {
          gradient: 'bg-gradient-to-br from-rose-400 to-pink-500',
          icon: '🎨'
        };
      
      case "Good Group":
        return {
          gradient: 'bg-gradient-to-br from-teal-400 to-cyan-500',
          icon: '👥'
        };
      
      case "Ring Ring":
        return {
          gradient: 'bg-gradient-to-br from-violet-400 to-purple-500',
          icon: '📞'
        };
      
      case "Paparazzi":
        return {
          gradient: 'bg-gradient-to-br from-slate-400 to-gray-500',
          icon: '📸'
        };
      
      case "You Have Style":
        return {
          gradient: 'bg-gradient-to-br from-fuchsia-400 to-pink-500',
          icon: '✍️'
        };
      
      case "Smart":
        return {
          gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500',
          icon: '💡'
        };
      
      case "Playing Safe":
        return {
          gradient: 'bg-gradient-to-br from-blue-400 to-indigo-500',
          icon: '🛡️'
        };
      
      case "Our Hero":
        return {
          gradient: 'bg-gradient-to-br from-red-400 to-orange-500',
          icon: '🦸'
        };
      
      case "Complex Person":
        return {
          gradient: 'bg-gradient-to-br from-purple-400 to-pink-500',
          icon: '🎭'
        };
      
      case "Busy Bee":
        return {
          gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
          icon: '🏃‍♀️'
        };
      
      case "Dedicated":
        return {
          gradient: 'bg-gradient-to-br from-yellow-500 to-amber-500',
          icon: '🏅'
        };
      
      case "Hat-trick":
        return {
          gradient: 'bg-gradient-to-br from-purple-400 to-indigo-500',
          icon: '🎩'
        };
      
      default:
        return {
          gradient: 'bg-gradient-to-br from-gray-400 to-gray-500',
          icon: '🏆'
        };
    }
  };

  const design = getBadgeContent();

  return (
    <motion.div 
      className={`${baseClasses} ${design.gradient} rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center group relative overflow-hidden`}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      
      {/* Achievement Icon - No Badge Shape */}
      <div className="relative mb-4 z-10">
        <div className={`${iconSizes[size]} drop-shadow-lg`}>
          {icon || design.icon}
        </div>
      </div>
      
      {/* Badge Title */}
      <h3 className={`${textSizes[size]} font-bold text-center leading-tight mb-2 text-white ${
        unlocked ? 'opacity-100' : 'opacity-60'
      }`}>
        {title}
      </h3>
      
      {/* Stars */}
      <div className="flex items-center space-x-1">
        {Array.from({ length: 3 }, (_, i) => (
          <span
            key={i}
            className={`text-sm ${i < stars ? 'text-yellow-300 fill-current' : 'text-white opacity-40'}`}
          >
            ⭐
          </span>
        ))}
      </div>
      
    </motion.div>
  );
}