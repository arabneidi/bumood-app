"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';

interface ParameterSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  color?: string;
  icon?: string;
  valueLabels?: Record<number, string>;
}

export default function ParameterSlider({ 
  label, 
  value, 
  onChange, 
  min = 1,
  max = 10,
  minLabel = '',
  maxLabel = '',
  color = 'from-blue-400 to-purple-500',
  icon = '😊',
  valueLabels = {}
}: ParameterSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const valueLabel = valueLabels[value] || value.toString();

  return (
    <motion.div 
      className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl p-6 border border-blue-400/30 shadow-2xl"
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Glowing Edge Effect */}
      <div className="absolute inset-0 rounded-3xl border-2 border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <motion.div
              className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-400/30 backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                borderColor: 'rgba(6, 182, 212, 0.5)'
              }}
            >
              <h3 className="text-sm font-bold text-cyan-400">
                {label}
              </h3>
            </motion.div>
          </div>
          
          {/* Current Value Indicator */}
          <motion.div 
            className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-400/30 backdrop-blur-sm"
            animate={{
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)'
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            <span className="text-sm font-bold text-cyan-400">
              {value}/{max}
            </span>
          </motion.div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Stylish Slider Container */}
          <div className="relative flex-1">
            {/* Track Background */}
            <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-full shadow-inner border border-slate-600/40"></div>
            
            {/* Filled Track */}
            <motion.div 
              className="absolute top-1/2 transform -translate-y-1/2 h-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)] border border-cyan-400/30"
              style={{ width: `${percentage}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            
            {/* Slider Input */}
            <input
              type="range"
              min={min}
              max={max}
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="relative w-full h-3 bg-transparent appearance-none cursor-pointer focus:outline-none z-20"
              style={{
                WebkitAppearance: 'none',
                background: 'transparent',
              }}
            />
            
            {/* Range Numbers */}
            <div className="flex justify-between mt-3 px-1">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => {
                const isCurrentValue = num === value;
                const isActive = num <= value; // Numbers up to current value are active
                return (
                  <motion.span
                    key={num}
                    className={`
                      text-xs font-medium transition-all duration-300 cursor-pointer
                      ${isCurrentValue 
                        ? 'text-cyan-400 font-bold text-sm scale-110' 
                        : isActive 
                          ? 'text-blue-300 font-semibold' 
                          : 'text-slate-600 opacity-40'
                      }
                    `}
                    whileHover={{ scale: isActive ? 1.1 : 1 }}
                    whileTap={{ scale: isActive ? 0.95 : 1 }}
                    onClick={() => onChange(num)}
                    animate={{
                      textShadow: isActive 
                        ? isCurrentValue 
                          ? '0 0 8px rgba(6, 182, 212, 0.6)' 
                          : '0 0 4px rgba(59, 130, 246, 0.4)'
                        : '0 0 0px rgba(0, 0, 0, 0)'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {num}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}

// CSS for the range input thumb - only run on client side
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      display: none;
    }
    
    input[type="range"]::-moz-range-thumb {
      display: none;
    }
  `;
  document.head.appendChild(style);
}
