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
        date: `${itemDate.getUTCFullYear()}-${String(itemDate.getUTCMonth() + 1).padStart(2, '0')}-${String(itemDate.getUTCDate()).padStart(2, '0')}`,
        mc: item.mc === null || item.mc === undefined ? null : parseFloat(item.mc.toFixed(2)),
        dss: item.dss === null || item.dss === undefined ? null : parseFloat(item.dss.toFixed(2))
      };
    });
  }, [data]);

  return (
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
  );
}

// Memoize the chart to prevent re-render unless data/height actually change
const MCDSSChart = React.memo(MCDSSChartInner);

export default MCDSSChart;
