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
      className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-2xl rounded-2xl p-4 border border-cyan-400/20 shadow-xl hover:shadow-cyan-500/20 transition-all duration-500 overflow-hidden"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(6,182,212,0.1)_25%,rgba(6,182,212,0.1)_26%,transparent_27%,transparent_74%,rgba(147,51,234,0.1)_75%,rgba(147,51,234,0.1)_76%,transparent_77%)] bg-[length:15px_15px]"></div>
      </div>
      
      {/* Subtle Glow Effects */}
      <div className="absolute inset-0 rounded-2xl border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]"></div>
      
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <motion.div
            className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-lg drop-shadow-lg">{icon}</span>
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 drop-shadow-lg">
              {label}
            </h3>
            <p className="text-xs text-cyan-300 font-medium tracking-wider uppercase">
              {valueLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <motion.div 
            className="relative text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 drop-shadow-lg"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {value}
          </motion.div>
          <div className="text-xs text-cyan-300 font-bold mt-1 tracking-widest">
            / {max}
          </div>
        </div>
      </div>

      {/* Slider Container - Compact */}
      <div className="relative py-4">
        {/* Track Background */}
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-full shadow-inner border border-slate-600/30" />
        
        {/* Filled Track */}
        <motion.div 
          className="absolute top-1/2 transform -translate-y-1/2 h-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.3)] border border-cyan-400/20"
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
          className="relative w-full h-4 bg-transparent appearance-none cursor-pointer focus:outline-none z-20"
          style={{
            WebkitAppearance: 'none',
          }}
        />
      </div>

      {/* Compact Labels */}
      <div className="flex justify-between text-xs font-bold mb-3 relative z-10">
        <motion.span 
          className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-3 py-1 rounded-full border border-cyan-400/30 text-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.2)] tracking-wider"
          whileHover={{ scale: 1.05 }}
        >
          {minLabel || min}
        </motion.span>
        <motion.span 
          className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-3 py-1 rounded-full border border-purple-400/30 text-purple-300 shadow-[0_0_6px_rgba(147,51,234,0.2)] tracking-wider"
          whileHover={{ scale: 1.05 }}
        >
          {maxLabel || max}
        </motion.span>
      </div>

      {/* Compact Value Dots */}
      <div className="flex justify-between px-2 relative z-10">
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const dotValue = min + i;
          const isActive = dotValue <= value;
          const isCurrent = dotValue === value;
          return (
            <motion.button
              key={dotValue}
              type="button"
              onClick={() => onChange(dotValue)}
              className={`relative w-6 h-6 rounded-full transition-all duration-300 hover:scale-125 ${
                isCurrent
                  ? `bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_6px_rgba(6,182,212,0.4)] scale-110 border-2 border-white`
                  : isActive 
                    ? `bg-gradient-to-br from-cyan-500/60 to-blue-500/60 shadow-[0_0_4px_rgba(6,182,212,0.3)] scale-105 border border-cyan-400/30` 
                    : 'bg-slate-700/60 hover:bg-slate-600/80 border border-slate-500/50 shadow-[0_0_2px_rgba(0,0,0,0.2)]'
              }`}
              title={valueLabels[dotValue] || dotValue.toString()}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: isCurrent ? 1.1 : isActive ? 1.05 : 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              {/* Value Number */}
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                isActive ? 'text-white drop-shadow-lg' : 'text-slate-400'
              }`}>
                {dotValue}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// CSS for the range input thumb - only run on client side
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: transparent;
      cursor: grab;
    }
    
    input[type="range"]:active::-webkit-slider-thumb {
      cursor: grabbing;
    }
    
    input[type="range"]::-moz-range-thumb {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: transparent;
      border: none;
      cursor: grab;
    }
    
    input[type="range"]:active::-moz-range-thumb {
      cursor: grabbing;
    }
  `;
  document.head.appendChild(style);
}
