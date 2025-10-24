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
  zScores: {
    zLM: number;
    zRI: number;
    zCN: number;
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
  const { zLM, zRI, zCN } = data.zScores;
  
  // Check if we have true z-scores (can be negative) or normalized scores (0-1 range)
  const hasTrueZScores = zLM < 0 || zRI < 0 || zCN < 0 || zLM > 1 || zRI > 1 || zCN > 1;
  
  let lmNormalized, riNormalized, cnNormalized;
  
  if (hasTrueZScores) {
    // True z-scores: map (-3 to +3) to (-1 to +1)
    const normalizeZScore = (zScore: number) => {
      const clamped = Math.max(-3, Math.min(3, zScore));
      return clamped / 3; // -1 to 1
    };
    lmNormalized = normalizeZScore(zLM);
    riNormalized = normalizeZScore(zRI);
    cnNormalized = normalizeZScore(zCN);
  } else {
    // Normalized scores (0-1 range): map to (-1 to +1) by centering around 0
    const normalizeToCentered = (value: number) => {
      return (2 * value) - 1; // 0->-1, 0.5->0, 1->1
    };
    lmNormalized = normalizeToCentered(zLM);
    riNormalized = normalizeToCentered(zRI);
    cnNormalized = normalizeToCentered(zCN);
  }
  
  // Debug logging
  console.log('DSS Radar Debug:', {
    rawValues: { learningMomentum, recoveryIndex, connectionScore },
    zScores: { zLM, zRI, zCN },
    hasTrueZScores,
    normalized: { lmNormalized, riNormalized, cnNormalized }
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
            domain={[-1, 1]}
            tickCount={5}
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