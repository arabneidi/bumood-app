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

  if (!data || !data.components || !data.zScores) {
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
        {data && console.log('DSS Radar Debug - Invalid data structure:', data)}
      </motion.div>
    );
  }

  const { learningMomentum, recoveryIndex, connectionScore } = data.components;
  const { zLM, zRI, zCN } = data.zScores;
  
  // Normalize z-scores to -1 to 1 range for better visualization
  // Find the maximum absolute z-score to normalize against
  const maxAbsValue = Math.max(Math.abs(zLM), Math.abs(zRI), Math.abs(zCN));
  
  // Normalize each z-score to -1 to 1 range
  const normalizeValue = (value: number) => {
    if (maxAbsValue === 0) return 0;
    return value / maxAbsValue;
  };
  
  const normalized_zLM = normalizeValue(zLM);
  const normalized_zRI = normalizeValue(zRI);
  const normalized_zCN = normalizeValue(zCN);
  
  const scaleMax = 1; // Fixed scale from -1 to 1
  
  const chartData = [
    {
      subject: 'zLM',
      value: normalized_zLM,
      fullMark: scaleMax
    },
    {
      subject: 'zRI', 
      value: normalized_zRI,
      fullMark: scaleMax
    },
    {
      subject: 'zCN',
      value: normalized_zCN,
      fullMark: scaleMax
    }
  ];

  // Debug logging
  console.log('🎯 DSS Radar Debug:', {
    rawValues: { learningMomentum, recoveryIndex, connectionScore },
    originalZScores: { zLM, zRI, zCN },
    normalizedZScores: { normalized_zLM, normalized_zRI, normalized_zCN },
    maxAbsValue: maxAbsValue,
    scaleMax: scaleMax,
    chartData: chartData
  });
  
  console.log('🎯 DSS Radar Chart Data for Display:', {
    'Learning Momentum': `z=${zLM.toFixed(2)} → normalized=${normalized_zLM.toFixed(2)}`,
    'Recovery Index': `z=${zRI.toFixed(2)} → normalized=${normalized_zRI.toFixed(2)}`,
    'Connection': `z=${zCN.toFixed(2)} → normalized=${normalized_zCN.toFixed(2)}`,
    'Scale Range': `-${scaleMax} to +${scaleMax} (normalized)`
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full h-full"
    >
      {/* Display actual values */}
      <div className="mb-4 text-center">
        <div className="flex justify-center space-x-6 text-xs">
          <div className="bg-blue-500/20 px-2 py-1 rounded">
            <span className="text-blue-300">Learning Momentum:</span> <span className="text-white font-bold">{zLM.toFixed(2)}</span>
          </div>
          <div className="bg-green-500/20 px-2 py-1 rounded">
            <span className="text-green-300">Recovery Index:</span> <span className="text-white font-bold">{zRI.toFixed(2)}</span>
          </div>
          <div className="bg-purple-500/20 px-2 py-1 rounded">
            <span className="text-purple-300">Connection:</span> <span className="text-white font-bold">{zCN.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
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
            domain={[-scaleMax, scaleMax]}
            tickCount={7}
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