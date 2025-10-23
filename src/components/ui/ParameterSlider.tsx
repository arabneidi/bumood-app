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
      className="relative bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 border border-cyan-400/20 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 overflow-hidden"
      whileHover={{ scale: 1.03, rotateY: 2 }}
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Futuristic Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(6,182,212,0.1)_25%,rgba(6,182,212,0.1)_26%,transparent_27%,transparent_74%,rgba(147,51,234,0.1)_75%,rgba(147,51,234,0.1)_76%,transparent_77%)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Neon Glow Effects */}
      <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.4)]"></div>
      <div className="absolute inset-0 rounded-3xl border border-purple-400/20 shadow-[0_0_60px_rgba(147,51,234,0.3)]"></div>
      
      {/* Scanning Line Effect */}
      <motion.div
        className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center space-x-6">
          <motion.div
            className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-3xl drop-shadow-lg">{icon}</span>
            {/* Pulsing Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <div>
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 drop-shadow-lg">
              {label}
            </h3>
            <p className="text-sm text-cyan-300 font-medium tracking-wider uppercase">
              {valueLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <motion.div 
            className="relative text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 drop-shadow-2xl"
            animate={{ 
              scale: [1, 1.15, 1],
              textShadow: [
                "0 0 10px rgba(6,182,212,0.5)",
                "0 0 20px rgba(6,182,212,0.8)",
                "0 0 10px rgba(6,182,212,0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {value}
            {/* Glowing Effect */}
            <motion.div
              className="absolute inset-0 text-5xl font-black text-cyan-400/30 blur-sm"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {value}
            </motion.div>
          </motion.div>
          <div className="text-xs text-cyan-300 font-bold mt-2 tracking-widest">
            / {max}
          </div>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative py-10">
        {/* Futuristic Track Background */}
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-full shadow-inner border border-slate-600/30" />
        
        {/* Grid Pattern on Track */}
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-6 rounded-full opacity-20">
          <div className="w-full h-full bg-[linear-gradient(90deg,transparent_48%,rgba(6,182,212,0.3)_49%,rgba(6,182,212,0.3)_51%,transparent_52%)] bg-[length:8px_8px]"></div>
        </div>
        
        {/* Filled Track with Theme Colors */}
        <motion.div 
          className="absolute top-1/2 transform -translate-y-1/2 h-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)] border border-cyan-400/20"
          style={{ width: `${percentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Outer Glow Effect */}
        <div 
          className="absolute top-1/2 transform -translate-y-1/2 h-8 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 rounded-full opacity-15 blur-sm"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Scanning Line on Track */}
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 h-6 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent rounded-full"
          style={{ width: `${percentage}%` }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        
        {/* Slider Input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="relative w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none z-20"
          style={{
            WebkitAppearance: 'none',
          }}
        />
      </div>

      {/* Futuristic Labels */}
      <div className="flex justify-between text-sm font-bold mb-8 relative z-10">
        <motion.span 
          className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 py-2 rounded-full border border-cyan-400/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] tracking-wider"
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(6,182,212,0.5)" }}
        >
          {minLabel || min}
        </motion.span>
        <motion.span 
          className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 py-2 rounded-full border border-purple-400/30 text-purple-300 shadow-[0_0_10px_rgba(147,51,234,0.3)] tracking-wider"
          whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(147,51,234,0.5)" }}
        >
          {maxLabel || max}
        </motion.span>
      </div>

      {/* Futuristic Value Dots */}
      <div className="flex justify-between px-4 relative z-10">
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const dotValue = min + i;
          const isActive = dotValue <= value;
          const isCurrent = dotValue === value;
          return (
            <motion.button
              key={dotValue}
              type="button"
              onClick={() => onChange(dotValue)}
              className={`relative w-8 h-8 rounded-full transition-all duration-500 hover:scale-150 ${
                isCurrent
                  ? `bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.4)] scale-125 border-2 border-white`
                  : isActive 
                    ? `bg-gradient-to-br from-cyan-500/60 to-blue-500/60 shadow-[0_0_6px_rgba(6,182,212,0.3)] scale-110 border border-cyan-400/30` 
                    : 'bg-slate-700/60 hover:bg-slate-600/80 border border-slate-500/50 shadow-[0_0_3px_rgba(0,0,0,0.2)]'
              }`}
              title={valueLabels[dotValue] || dotValue.toString()}
              whileHover={{ scale: 1.4, rotate: 180 }}
              whileTap={{ scale: 0.8 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: isCurrent ? 1.25 : isActive ? 1.1 : 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Pulsing Ring for Current */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-cyan-400/60"
                  animate={{ 
                    scale: [1, 1.8, 1], 
                    opacity: [0.8, 0, 0.8] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {/* Inner Glow */}
              {isActive && (
                <motion.div
                  className="absolute inset-1 rounded-full bg-white/20"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              
              {/* Value Number */}
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-black ${
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
