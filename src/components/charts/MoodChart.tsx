import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from 'recharts';
import { MoodEntry } from '@prisma/client';

interface MoodChartProps {
  data: MoodEntry[];
  type?: 'line' | 'area';
  height?: number;
}

export default function MoodChart({ data, type = 'line', height = 300 }: MoodChartProps) {
  const chartData = data.slice(0, 14).reverse().map((entry, index) => ({
    date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: entry.valence,
    energy: entry.energy,
    focus: entry.focus,
    stress: entry.stress,
    sleep: entry.sleep,
  }));

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
          <YAxis stroke="#6b7280" fontSize={12} domain={[0, 10]} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          />
          <Area
            type="monotone"
            dataKey="mood"
            name="Valence (Mood)"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorValence)"
            strokeWidth={3}
          />
          <Area
            type="monotone"
            dataKey="energy"
            name="Energy"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorEnergy)"
            strokeWidth={3}
          />
          <Area
            type="monotone"
            dataKey="focus"
            name="Focus"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorFocus)"
            strokeWidth={3}
          />
          <Area
            type="monotone"
            dataKey="stress"
            name="Stress"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorStress)"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} domain={[0, 10]} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend 
          wrapperStyle={{ 
            paddingTop: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="mood" 
          name="Valence (Mood)"
          stroke="#6366f1" 
          strokeWidth={3} 
          dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} 
        />
        <Line 
          type="monotone" 
          dataKey="energy" 
          name="Energy"
          stroke="#10b981" 
          strokeWidth={3} 
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} 
        />
        <Line 
          type="monotone" 
          dataKey="focus" 
          name="Focus"
          stroke="#3b82f6" 
          strokeWidth={3} 
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} 
        />
        <Line 
          type="monotone" 
          dataKey="stress" 
          name="Stress"
          stroke="#ef4444" 
          strokeWidth={3} 
          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}



