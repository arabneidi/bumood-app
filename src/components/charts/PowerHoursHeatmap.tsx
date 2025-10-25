'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PowerHoursData {
  day: string;
  hour: number;
  mcValue: number | null; // MC (Mood Composite) value, null for empty cells
}

interface PowerHoursHeatmapProps {
  data: PowerHoursData[];
  loading?: boolean;
}

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export default function PowerHoursHeatmap({ data, loading }: PowerHoursHeatmapProps) {
  // Debug: Log the data being received
  console.log('PowerHoursHeatmap data:', data);
  console.log('PowerHoursHeatmap loading:', loading);
  
  if (loading) {
    return (
      <div className="p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-600/50 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded mb-4 w-32"></div>
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }}>
            {Array.from({ length: 168 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-600/50 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center"
          >
            <span className="text-3xl mr-3">⚡</span>
            Power Hours
          </motion.h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-400">No power hours data available. Start tracking your activities to see your productivity patterns!</p>
        </div>
      </div>
    );
  }

  // Create a map for quick lookup
  const dataMap = new Map();
  data.forEach(item => {
    const key = `${item.day}-${item.hour}`;
    dataMap.set(key, item);
  });

  // Calculate dynamic min/max MC values from actual data
  const mcValues = data
    .filter(item => item.mcValue !== null)
    .map(item => item.mcValue as number);
  
  const minMC = mcValues.length > 0 ? Math.min(...mcValues) : -2;
  const maxMC = mcValues.length > 0 ? Math.max(...mcValues) : 2;
  const range = maxMC - minMC;

  console.log('📊 Power Hours Dynamic Range:', { minMC, maxMC, range });

  // Get MC value
  const getMCValue = (day: string, hour: number) => {
    const key = `${day}-${hour}`;
    const item = dataMap.get(key);
    if (!item || item.mcValue === null) return null;
    return item.mcValue;
  };

  // Normalize MC using actual data range from current window
  const normalizeMC = (mc: number) => {
    // Use actual min/max from current data
    if (mcValues.length === 0) return 0.5; // Default to middle if no data
    
    const actualMin = minMC;
    const actualMax = maxMC;
    const actualRange = actualMax - actualMin;
    
    // Handle edge case where all values are the same
    if (actualRange === 0) {
      // If all values are the same, treat them as medium (0.5)
      return 0.5;
    }
    
    return Math.max(0, Math.min(1, (mc - actualMin) / actualRange));
  };

  const getColorClass = (mcValue: number | null) => {
    // Grey for null values OR zero values (insufficient data for meaningful z-score)
    if (mcValue === null || mcValue === 0) return 'bg-slate-700/30';
    
    // Normalize MC to 0-1 range using actual data range
    const normalizedMC = normalizeMC(mcValue);
    
    // Color logic based on normalized MC (0-1):
    // 0-0.33: Low (white)
    // 0.33-0.66: Medium (light red)
    // 0.66-1: High (intense red)
    
    if (normalizedMC < 0.33) return 'bg-white';      // Low MC (white)
    if (normalizedMC < 0.66) return 'bg-red-200';   // Medium MC (light red)
    return 'bg-red-600';                            // High MC (intense red)
  };

  const getTooltipContent = (day: string, hour: number) => {
    const key = `${day}-${hour}`;
    const item = dataMap.get(key);
    if (!item || item.mcValue === null) return `${day} ${hour}:00 - No data`;
    
    return `${day} ${hour}:00 - MC: ${item.mcValue.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-600/50 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent flex items-center"
        >
          <span className="text-3xl mr-3">⚡</span>
          Power Hours
        </motion.h3>
        <div className="text-sm text-slate-400">
          Your most productive times
        </div>
      </div>

      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Lower MC</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-slate-700/30 rounded"></div>
            <div className="w-3 h-3 bg-white border border-slate-600 rounded"></div>
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <div className="w-3 h-3 bg-red-600 rounded"></div>
          </div>
          <span className="text-slate-400">Higher MC</span>
        </div>

        {/* Heatmap Grid */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }}>
          {/* Hour labels */}
          <div></div>
          {hours.map(hour => (
            <div key={hour} className="text-xs text-slate-500 text-center py-1">
              {hour}
            </div>
          ))}
          
          {/* Day rows */}
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="text-sm text-slate-300 font-medium flex items-center justify-end pr-2">
                {day}
              </div>
              {hours.map(hour => {
                const mcValue = getMCValue(day, hour);
                return (
                  <motion.div
                    key={`${day}-${hour}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: (days.indexOf(day) * 24 + hour) * 0.001,
                      duration: 0.3 
                    }}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 ${getColorClass(mcValue)}`}
                    title={getTooltipContent(day, hour)}
                    whileHover={{ scale: 1.2 }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 p-4 bg-slate-700/30 rounded-xl"
        >
          <h4 className="text-lg font-bold text-slate-200 mb-2 flex items-center">
            <span className="text-xl mr-2">💡</span>
            Your Power Patterns
          </h4>
          <div className="text-sm text-slate-300 space-y-1">
            {data.length > 0 ? (
              <>
                <p>• Your most productive hours are when your Mood Composite is highest</p>
                <p>• Focus on high-priority tasks during your power hours</p>
                <p>• Schedule breaks during your less productive times</p>
              </>
            ) : (
              <p className="text-slate-400">Start tracking your activities to see your power hours!</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
