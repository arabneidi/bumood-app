import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MCDSSData {
  date: string;
  mc: number;
  dss: number;
}

interface MCDSSChartProps {
  data: MCDSSData[];
  height?: number;
}

export default function MCDSSChart({ data, height = 300 }: MCDSSChartProps) {
  console.log('🎨 MCDSSChart received data:', {
    dataLength: data.length,
    data: data
  });
  
  const chartData = [...data].reverse().map(item => {
    // Parse YYYY-MM-DD string in local timezone (not UTC)
    const [year, month, day] = item.date.split('-').map(Number);
    const itemDate = new Date(year, month - 1, day); // Local timezone
    
    return {
      date: itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mc: parseFloat(item.mc.toFixed(2)),
      dss: parseFloat(item.dss.toFixed(2))
    };
  });
  
  console.log('🎨 MCDSSChart chartData:', chartData);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
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
          dataKey="mc" 
          name="Mood Composite"
          stroke="#6366f1" 
          strokeWidth={3} 
          dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }} 
        />
        <Line 
          type="monotone" 
          dataKey="dss" 
          name="Daily Success Score"
          stroke="#10b981" 
          strokeWidth={3} 
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
