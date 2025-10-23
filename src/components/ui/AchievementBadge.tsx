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
          gradient: 'bg-gradient-to-br from-blue-400 to-cyan-500',
          icon: '🎯'
        };
      
      case "Goal Crusher":
        return {
          gradient: 'bg-gradient-to-br from-purple-400 to-fuchsia-500',
          icon: '💪'
        };
      
      case "Streak Star":
        return {
          gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500',
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
          gradient: 'bg-gradient-to-br from-orange-400 to-red-500',
          icon: '🏃‍♀️'
        };
      
      case "Dedicated":
        return {
          gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500',
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
      className={`${baseClasses} ${design.gradient} rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center group relative overflow-hidden border-2 border-white/50`}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Shimmer Effect - Same as Stats */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Animated SVG Badge Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-20"
          style={{
            backgroundImage: `url('/badges/badge-template.svg')`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: `${20 + Math.random() * 30}px`,
            height: `${20 + Math.random() * 30}px`,
            left: `${Math.random() * 80}%`,
            top: `${Math.random() * 80}%`,
            transform: `rotate(${Math.random() * 360}deg)`,
            filter: 'hue-rotate(90deg) saturate(150%) brightness(120%)'
          }}
          animate={{
            x: [0, Math.random() * 15 - 7.5, 0],
            y: [0, Math.random() * 15 - 7.5, 0],
            rotate: [0, Math.random() * 180 - 90, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
      
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
      
      {/* Badge Description Tooltip - Shows on Hover */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-80 bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm p-4 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-[9999] pointer-events-none border-2 border-white/30">
        <div className="text-center">
          <p className="font-bold mb-2 text-lg drop-shadow-lg">{title}</p>
          <p className="text-white/90 text-sm leading-relaxed drop-shadow-md">{description || "Achievement unlocked!"}</p>
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-500"></div>
      </div>
    </motion.div>
  );
}