import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MCDSSData {
  date: string;
  mc: number | null;
  dss: number | null;
}

interface MCDSSChartProps {
  data: MCDSSData[];
  height?: number;
}

function MCDSSChartInner({ data, height = 300 }: MCDSSChartProps) {
  // Memoize transformation to avoid heavy re-computation on every render
  const chartData = useMemo(() => {
    return [...data].reverse().map(item => {
      // Parse YYYY-MM-DD string in local timezone (not UTC)
      const [year, month, day] = item.date.split('-').map(Number);
      const itemDate = new Date(year, month - 1, day); // Local timezone
      
      return {
        // Use local date components to match how the date picker forms dates
        date: `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`,
        mc: item.mc === null || item.mc === undefined ? null : parseFloat(item.mc.toFixed(2)),
        dss: item.dss === null || item.dss === undefined ? null : parseFloat(item.dss.toFixed(2))
      };
    });
  }, [data]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#e5e7eb" />
        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} minTickGap={20} />
        <YAxis stroke="#6b7280" fontSize={12} width={40} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        {/* Legend removed to reduce render cost; names remain on hover tooltip */}
        <Line 
          type="monotone" 
          dataKey="mc" 
          name="Mood Composite"
          stroke="#6366f1" 
          strokeWidth={2} 
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line 
          type="monotone" 
          dataKey="dss" 
          name="Daily Success Score"
          stroke="#10b981" 
          strokeWidth={2} 
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
      {/* Legend placed below chart — match DSS Radar (Wellness) legend style */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 shadow-sm">
          <span className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#6366f1' }}></span>
          <span className="text-sm font-bold text-white">Mood Composite</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-green-500/30 hover:border-green-400/50 transition-all duration-300 shadow-sm">
          <span className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: '#10b981' }}></span>
          <span className="text-sm font-bold text-white">Daily Success Score</span>
        </div>
      </div>
    </div>
  );
}

// Memoize the chart to prevent re-render unless data/height actually change
const MCDSSChart = React.memo(MCDSSChartInner);

export default MCDSSChart;
