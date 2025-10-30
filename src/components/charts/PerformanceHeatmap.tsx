import React from 'react';
import { motion } from 'framer-motion';

interface PerformanceData {
  day: string; // Sun..Sat
  hour: number; // 0..23
  dssValue: number | null;
}

interface PerformanceHeatmapProps {
  data: PerformanceData[];
  loading?: boolean;
}

const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export default function PerformanceHeatmap({ data, loading }: PerformanceHeatmapProps) {
  // Focused diagnostics for slow loads/appearance
  if (typeof window !== 'undefined') {
    try {
      const nonNull = data?.filter?.(d => d && d.dssValue !== null) || [];
      const sample = nonNull.slice(0, 5).map(d => ({ day: d.day, hour: d.hour, v: d.dssValue }));
      console.log('🧭 [PerformanceHeatmap] props:', {
        loading: !!loading,
        totalPoints: data?.length || 0,
        nonNullPoints: nonNull.length,
        sample
      });
    } catch {}
  }

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
            <span className="text-3xl mr-3">📈</span>
            Performance
          </motion.h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-400">No performance data available. Log more entries to see your trends!</p>
        </div>
      </div>
    );
  }

  // Create map for quick lookup
  const dataMap = new Map();
  data.forEach(item => {
    const key = `${item.day}-${item.hour}`;
    dataMap.set(key, item);
  });

  // Compute dynamic min/max from data (mirror Power Hours behavior)
  const values = data.filter(i => i.dssValue !== null).map(i => i.dssValue as number);
  const minVal = values.length > 0 ? Math.min(...values) : -2;
  const maxVal = values.length > 0 ? Math.max(...values) : 2;
  const actualRange = maxVal - minVal;

  const getDSSValue = (day: string, hour: number) => {
    const item = dataMap.get(`${day}-${hour}`);
    if (!item || item.dssValue === null) return null;
    return item.dssValue as number;
  };

  const normalize = (v: number) => {
    if (values.length === 0) return 0.5;
    if (actualRange === 0) return 0.5;
    return Math.max(0, Math.min(1, (v - minVal) / actualRange));
  };

  const getColorClass = (val: number | null) => {
    if (val === null) return 'bg-slate-700/30';
    const n = normalize(val);
    if (n < 0.33) return 'bg-white';
    if (n < 0.66) return 'bg-red-200';
    return 'bg-red-600';
  };

  const getTooltip = (day: string, hour: number) => {
    const item = dataMap.get(`${day}-${hour}`);
    if (!item || item.dssValue === null) return `${day} ${hour}:00 - No data`;
    const v = item.dssValue as number;
    const n = normalize(v);
    return `${day} ${hour}:00 - DSS: ${v.toFixed(2)} | normalized: ${n.toFixed(2)}`;
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
          <span className="text-3xl mr-3">📈</span>
          Performance
        </motion.h3>
        <div className="text-sm text-slate-400">Your performance times</div>
      </div>

      <div className="space-y-4">
        {/* Legend (same coloring as Power Hours) */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Lower DSS</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-slate-700/30 rounded"></div>
            <div className="w-3 h-3 bg-white border border-slate-600 rounded"></div>
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <div className="w-3 h-3 bg-red-600 rounded"></div>
          </div>
          <span className="text-slate-400">Higher DSS</span>
        </div>

        {/* Heatmap Grid - identical layout */}
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }}>
          {/* Hour labels */}
          <div></div>
          {hours.map(hour => (
            <div key={hour} className="text-xs text-slate-500 text-center py-1">{hour}</div>
          ))}

          {/* Day rows */}
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="text-sm text-slate-300 font-medium flex items-center justify-end pr-2">{day}</div>
              {hours.map(hour => {
                const v = getDSSValue(day, hour);
                return (
                  <motion.div
                    key={`${day}-${hour}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (days.indexOf(day) * 24 + hour) * 0.001, duration: 0.3 }}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 ${getColorClass(v)}`}
                    title={getTooltip(day, hour)}
                    whileHover={{ scale: 1.2 }}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  );
}


