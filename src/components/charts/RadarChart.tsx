import React from 'react';
import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { MoodEntry } from '@prisma/client';

interface RadarChartProps {
  data: MoodEntry[];
  height?: number;
}

export default function RadarChart({ data, height = 300 }: RadarChartProps) {
  const avgData = data.length > 0 ? {
    valence: data.reduce((sum, entry) => sum + entry.valence, 0) / data.length,
    energy: data.reduce((sum, entry) => sum + entry.energy, 0) / data.length,
    focus: data.reduce((sum, entry) => sum + entry.focus, 0) / data.length,
    sleep: (data.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / data.length) * 1.25, // Scale sleep to 0-10
    stress: data.reduce((sum, entry) => sum + entry.stress, 0) / data.length,
  } : {
    valence: 0,
    energy: 0,
    focus: 0,
    sleep: 0,
    stress: 0,
  };

  const radarData = [
    { subject: 'Valence', A: avgData.valence, fullMark: 10 },
    { subject: 'Energy', A: avgData.energy, fullMark: 10 },
    { subject: 'Focus', A: avgData.focus, fullMark: 10 },
    { subject: 'Sleep', A: avgData.sleep, fullMark: 10 },
    { subject: 'Stress', A: avgData.stress, fullMark: 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={radarData}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={12} />
        <PolarRadiusAxis stroke="#6b7280" fontSize={10} domain={[0, 10]} />
        <Radar
          name="Wellness"
          dataKey="A"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
