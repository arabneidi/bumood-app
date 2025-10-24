'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface DSSData {
  dssScore: number;
  components: {
    learningMomentum: number;
    recoveryIndex: number;
    connectionScore: number;
  };
}

interface DSSRadarProps {
  data: DSSData | null;
  loading: boolean;
}

export default function DSSRadar({ data, loading }: DSSRadarProps) {
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-48"
      >
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500"
        ></motion.div>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center h-48 text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-4xl mb-4"
        >
          📊
        </motion.div>
        <p className="text-slate-300 text-lg">No DSS data available</p>
      </motion.div>
    );
  }

  const { learningMomentum, recoveryIndex, connectionScore } = data.components;
  
  // Normalize values to 0.0 to 1.0 scale (since all DSS components are positive)
  const maxValue = Math.max(learningMomentum || 0, recoveryIndex || 0, connectionScore || 0);
  
  // Map values from 0-maxValue to 0-1 range (all positive values)
  const normalizeToZeroToOne = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return value / maxValue; // 0 to 1
  };
  
  const lmNormalized = normalizeToZeroToOne(typeof learningMomentum === 'number' ? learningMomentum : 0, maxValue);
  const riNormalized = normalizeToZeroToOne(typeof recoveryIndex === 'number' ? recoveryIndex : 0, maxValue);
  const cnNormalized = normalizeToZeroToOne(typeof connectionScore === 'number' ? connectionScore : 0, maxValue);
  
  // Debug logging
  console.log('DSS Radar Debug (0 to 1 scale):', {
    learningMomentum,
    recoveryIndex, 
    connectionScore,
    maxValue,
    lmNormalized,
    riNormalized,
    cnNormalized
  });

  // Prepare data for recharts radar chart
  const chartData = [
    {
      subject: 'Learning Momentum',
      value: lmNormalized,
      fullMark: 1
    },
    {
      subject: 'Recovery Index', 
      value: riNormalized,
      fullMark: 1
    },
    {
      subject: 'Connection Score',
      value: cnNormalized,
      fullMark: 1
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 20 }}>
          <PolarGrid 
            gridType="circle"
            radialLines={false}
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth={1}
          />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={0} 
            domain={[0, 1]}
            tickCount={6}
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickFormatter={(value) => value.toFixed(1)}
            axisLine={false}
            tickLine={false}
          />
          <Radar
            name="DSS Components"
            dataKey="value"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}