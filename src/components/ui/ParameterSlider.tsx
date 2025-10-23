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
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-xl font-bold text-gray-900">{label}</h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{
            backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
            '--tw-gradient-from': color.includes('from-') ? color.split('from-')[1].split(' ')[0] : '#6366f1',
            '--tw-gradient-to': color.includes('to-') ? color.split('to-')[1] : '#8b5cf6'
          } as any}>
            {value}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            {valueLabel}
          </div>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative py-6">
        {/* Background Track */}
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-3 bg-gray-200 rounded-full" />
        
        {/* Filled Track */}
        <div 
          className={`absolute top-1/2 transform -translate-y-1/2 h-3 bg-gradient-to-r ${color} rounded-full transition-all duration-200`}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Slider Input */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="relative w-full h-3 bg-transparent appearance-none cursor-grab active:cursor-grabbing focus:outline-none z-10"
          style={{
            WebkitAppearance: 'none',
          }}
        />
        
        {/* No visual thumb - clean slider design */}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-sm text-gray-600 font-medium mt-2">
        <span>{minLabel || min}</span>
        <span>{maxLabel || max}</span>
      </div>

      {/* Value Dots */}
      <div className="flex justify-between mt-4 px-1">
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const dotValue = min + i;
          const isActive = dotValue <= value;
          return (
            <button
              key={dotValue}
              type="button"
              onClick={() => onChange(dotValue)}
              className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                isActive 
                  ? `bg-gradient-to-r ${color} shadow-md` 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={valueLabels[dotValue] || dotValue.toString()}
            />
          );
        })}
      </div>
    </Card>
  );
}

// CSS for the range input thumb
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
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}
