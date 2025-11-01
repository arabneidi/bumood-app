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
  glowColor?: 'purple' | 'red';
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
  valueLabels = {},
  glowColor = 'purple'
}: ParameterSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const valueLabel = valueLabels[value] || value.toString();

  return (
    <motion.div 
      className="relative bg-blue-900/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-400/30 p-4"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Glowing Edge Effect */}
      <div className={`absolute inset-0 rounded-3xl border-2 ${glowColor === 'red' ? 'border-red-400/80 shadow-[0_0_50px_rgba(239,68,68,0.8),0_0_100px_rgba(239,68,68,0.6),0_0_150px_rgba(239,68,68,0.4)]' : 'border-purple-400/50 shadow-[0_0_30px_rgba(147,51,234,0.4)]'} animate-pulse`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <motion.div
              className={`px-3 py-1.5 bg-slate-800/40 backdrop-blur-xl rounded-lg border ${glowColor === 'red' ? 'border-red-400/80' : 'border-purple-400/50'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: glowColor === 'red' ? '0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(147, 51, 234, 0.4)',
                borderColor: glowColor === 'red' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(147, 51, 234, 0.6)'
              }}
            >
              <h3 className="text-sm font-semibold text-white">
                {label}
              </h3>
            </motion.div>
          </div>
          
          {/* Current Value Indicator */}
          <motion.div 
              className={`px-3 py-1.5 bg-slate-800/40 backdrop-blur-xl rounded-lg border ${glowColor === 'red' ? 'border-red-400/80' : 'border-purple-400/50'}`}
            animate={{
              boxShadow: glowColor === 'red' ? '0 0 25px rgba(239, 68, 68, 0.6), 0 0 50px rgba(239, 68, 68, 0.4)' : '0 0 15px rgba(147, 51, 234, 0.3)'
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            <span className="text-sm font-semibold text-white">
              {value}/{max}
            </span>
          </motion.div>
        </div>
        
        
        {/* Range Numbers */}
        <div className="flex justify-between mt-3 px-1">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => {
            const isCurrentValue = num === value;
            return (
              <motion.button
                key={num}
                type="button"
                className={`
                  relative w-8 h-8 rounded-lg font-bold transition-all duration-300 cursor-pointer
                  flex items-center justify-center backdrop-blur-sm
                  ${isCurrentValue 
                    ? glowColor === 'red' 
                      ? 'text-red-300 text-sm scale-110 bg-red-400/30 border border-red-400/60 shadow-[0_0_25px_rgba(239,68,68,0.8),0_0_50px_rgba(239,68,68,0.6)]' 
                      : 'text-purple-400 text-sm scale-110 bg-purple-400/20 border border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                    : glowColor === 'red'
                      ? 'text-slate-300 hover:text-red-300 hover:bg-red-400/20 border border-slate-500/30 hover:border-red-400/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.4),0_0_30px_rgba(239,68,68,0.2)]'
                      : 'text-slate-300 hover:text-purple-400 hover:bg-purple-400/10 border border-slate-500/30 hover:border-purple-400/30 hover:shadow-[0_0_8px_rgba(147,51,234,0.2)]'
                  }
                `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange(num)}
                animate={{
                  textShadow: isCurrentValue 
                    ? glowColor === 'red' ? '0 0 20px rgba(239, 68, 68, 1), 0 0 40px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(147, 51, 234, 0.6)'
                    : '0 0 0px rgba(0, 0, 0, 0)',
                  boxShadow: isCurrentValue 
                    ? glowColor === 'red' 
                      ? '0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.2)' 
                      : '0 0 20px rgba(147, 51, 234, 0.3), inset 0 0 15px rgba(147, 51, 234, 0.1)'
                    : '0 0 0px rgba(0, 0, 0, 0)'
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Glowing inner effect for selected */}
                {isCurrentValue && (
                  <motion.div
                    className={`absolute inset-0.5 rounded-md ${glowColor === 'red' ? 'bg-red-400/10' : 'bg-purple-400/10'}`}
                    animate={{
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Number */}
                <span className="relative z-10">
                  {num}
                </span>
              </motion.button>
            );
          })}
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
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.8), rgba(255, 0, 255, 0.8));
      border: 2px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3);
      cursor: grab;
      transition: all 0.2s ease;
      appearance: none;
    }
    
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 0 30px rgba(0, 255, 255, 1), 0 0 60px rgba(255, 0, 255, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.5);
    }
    
    input[type="range"]::-webkit-slider-thumb:active {
      transform: scale(1.05);
      cursor: grabbing;
    }
    
    input[type="range"]::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 255, 255, 0.8), rgba(255, 0, 255, 0.8));
      border: 2px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3);
      cursor: grab;
      transition: all 0.2s ease;
      appearance: none;
    }
    
    input[type="range"]::-moz-range-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 0 30px rgba(0, 255, 255, 1), 0 0 60px rgba(255, 0, 255, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.5);
    }
    
    input[type="range"]::-moz-range-thumb:active {
      transform: scale(1.05);
      cursor: grabbing;
    }
  `;
  document.head.appendChild(style);
}
