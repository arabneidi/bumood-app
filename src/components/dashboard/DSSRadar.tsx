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
  
  // Prepare data for recharts radar chart - use z-scores directly
  // Find the maximum absolute value to set appropriate scale
  const maxAbsValue = Math.max(Math.abs(zLM), Math.abs(zRI), Math.abs(zCN));
  const scaleMax = Math.ceil(maxAbsValue * 1.2); // Add 20% padding
  
  const chartData = [
    {
      subject: 'zLM',
      value: zLM,
      fullMark: scaleMax
    },
    {
      subject: 'zRI', 
      value: zRI,
      fullMark: scaleMax
    },
    {
      subject: 'zCN',
      value: zCN,
      fullMark: scaleMax
    }
  ];

  // Debug logging
  console.log('🎯 DSS Radar Debug (raw z-scores):', {
    rawValues: { learningMomentum, recoveryIndex, connectionScore },
    zScores: { zLM, zRI, zCN },
    scaleMax: scaleMax,
    chartData: chartData
  });
  
  console.log('🎯 DSS Radar Chart Data for Display:', {
    'Learning Momentum': `${zLM.toFixed(2)} (${learningMomentum} raw)`,
    'Recovery Index': `${zRI.toFixed(2)} (${recoveryIndex} raw)`,
    'Connection': `${zCN.toFixed(2)} (${connectionScore} raw)`,
    'Scale Range': `-${scaleMax} to +${scaleMax}`
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