import React from 'react';
import { MoodEntry } from '@prisma/client';

interface HeatmapChartProps {
  data: MoodEntry[];
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  // Group data by week
  const weeks: { [key: string]: MoodEntry[] } = {};
  
  data.forEach(entry => {
    const date = new Date(entry.createdAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = [];
    }
    weeks[weekKey].push(entry);
  });

  const weekData = Object.entries(weeks)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-8); // Last 8 weeks

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'bg-green-500';
    if (mood >= 6) return 'bg-yellow-400';
    if (mood >= 4) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const getMoodIntensity = (mood: number) => {
    if (mood >= 8) return 'opacity-100';
    if (mood >= 6) return 'opacity-80';
    if (mood >= 4) return 'opacity-60';
    return 'opacity-40';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Mood Heatmap</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Low</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-1">
        {weekData.map(([weekKey, entries]) => {
          const avgMood = entries.reduce((sum, entry) => sum + entry.valence, 0) / entries.length;
          return (
            <div key={weekKey} className="space-y-1">
              <div className="text-xs text-gray-500 text-center">
                {`${new Date(weekKey).getUTCFullYear()}-${String(new Date(weekKey).getUTCMonth() + 1).padStart(2, '0')}-${String(new Date(weekKey).getUTCDate()).padStart(2, '0')}`}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayEntry = entries.find(entry => {
                    const entryDate = new Date(entry.createdAt);
                    return entryDate.getDay() === dayIndex;
                  });
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-4 h-4 rounded-sm ${
                        dayEntry 
                          ? `${getMoodColor(dayEntry.valence)} ${getMoodIntensity(dayEntry.valence)}`
                          : 'bg-gray-200'
                      }`}
                      title={dayEntry ? `Mood: ${dayEntry.valence}/10` : 'No data'}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



