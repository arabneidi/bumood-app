import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MoodEntry } from '@prisma/client';

interface ActivityChartProps {
  data: MoodEntry[];
  type?: 'bar' | 'pie';
  height?: number;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
const DARK_COLORS = ['#475569', '#64748b', '#475569', '#64748b', '#475569', '#64748b', '#475569', '#64748b']; // Grey shades for dark mode

export default function ActivityChart({ data, type = 'bar', height = 300 }: ActivityChartProps) {
  // Check if dark mode is active
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  const activeColors = isDarkMode ? DARK_COLORS : COLORS;
  // Get activity counts
  const allActivities = data.flatMap(entry => {
    // Activities are already parsed by the API
    if (Array.isArray(entry.activities)) {
      return entry.activities;
    }
    // Fallback: if they're still strings (shouldn't happen), parse them
    try {
      return JSON.parse(entry.activities as string || '[]');
    } catch {
      return [];
    }
  });
  const activityCounts = allActivities.reduce((acc, activity) => {
    acc[activity] = (acc[activity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(activityCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([activity, count], index) => ({
      activity,
      count,
      color: activeColors[index % activeColors.length]
    }));

  // Show empty state if no activities
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-lg font-medium">No Activities Yet</p>
          <p className="text-sm">Start tracking activities in your mood entries to see distribution here</p>
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ activity, percent }) => `${activity} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDarkMode ? '#1e293b' : 'white',
              border: isDarkMode ? '1px solid #475569' : '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              color: isDarkMode ? '#cbd5e1' : '#1f2937'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#475569" : "#e5e7eb"} />
        <XAxis 
          dataKey="activity" 
          stroke={isDarkMode ? "#94a3b8" : "#6b7280"}
          tick={{ fill: isDarkMode ? "#cbd5e1" : "#6b7280" }}
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          stroke={isDarkMode ? "#94a3b8" : "#6b7280"}
          tick={{ fill: isDarkMode ? "#cbd5e1" : "#6b7280" }}
          fontSize={12} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDarkMode ? '#1e293b' : 'white',
            border: isDarkMode ? '1px solid #475569' : '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            color: isDarkMode ? '#cbd5e1' : '#1f2937'
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}



