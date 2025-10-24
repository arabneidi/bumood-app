'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('dss-radar-container');
      if (container) {
        const size = Math.min(container.offsetWidth - 40, 250); // Max size 250px
        setDimensions({ width: size, height: size });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
  
  // Normalize values to -1.0 to 1.0 scale like the Success Compass chart
  // Convert raw values to z-scores and then map to -1 to 1 range
  const normalizeToMinusOneToOne = (value: number, maxValue: number) => {
    // Map value from 0-maxValue to -1 to 1 range
    // 0 maps to -1, maxValue maps to 1
    return (2 * value / maxValue) - 1;
  };

  const maxValue = Math.max(learningMomentum || 0, recoveryIndex || 0, connectionScore || 0);
  
  const lmNormalized = normalizeToMinusOneToOne(typeof learningMomentum === 'number' ? learningMomentum : 0, maxValue);
  const riNormalized = normalizeToMinusOneToOne(typeof recoveryIndex === 'number' ? recoveryIndex : 0, maxValue);
  const cnNormalized = normalizeToMinusOneToOne(typeof connectionScore === 'number' ? connectionScore : 0, maxValue);
  
  // Debug logging
  console.log('DSS Radar Debug (-1 to 1 scale):', {
    learningMomentum,
    recoveryIndex, 
    connectionScore,
    maxValue,
    lmNormalized,
    riNormalized,
    cnNormalized
  });

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) / 2 - 40;

  // Calculate points for each axis using -1 to 1 scale
  const getPoint = (angle: number, value: number) => {
    // Convert -1 to 1 scale to 0 to 1 for positioning
    const normalizedValue = (value + 1) / 2;
    const x = centerX + Math.cos(angle) * radius * normalizedValue;
    const y = centerY + Math.sin(angle) * radius * normalizedValue;
    return { x, y };
  };

  // Three axes: LM, RI, CN (120 degrees apart)
  const lmAngle = -Math.PI / 2; // Top
  const riAngle = -Math.PI / 2 + (2 * Math.PI / 3); // Bottom right
  const cnAngle = -Math.PI / 2 + (4 * Math.PI / 3); // Bottom left

  const lmPoint = getPoint(lmAngle, lmNormalized);
  const riPoint = getPoint(riAngle, riNormalized);
  const cnPoint = getPoint(cnAngle, cnNormalized);

  // Create path for the radar area
  const radarPath = `M ${lmPoint.x} ${lmPoint.y} L ${riPoint.x} ${riPoint.y} L ${cnPoint.x} ${cnPoint.y} Z`;

  // Grid circles for -1 to 1 scale
  const gridCircles = [-1.0, -0.8, -0.6, -0.4, -0.2, 0.2, 0.4, 0.6, 0.8, 1.0].map((scale, index) => {
    // Convert -1 to 1 scale to 0 to 1 for positioning
    const normalizedScale = (scale + 1) / 2;
    return (
      <circle
        key={index}
        cx={centerX}
        cy={centerY}
        r={radius * normalizedScale}
        fill="none"
        stroke="rgba(59, 130, 246, 0.2)"
        strokeWidth="1"
      />
    );
  });

  // Scale labels for -1 to 1 (show only key values to avoid clutter)
  const scaleLabels = [-1.0, -0.5, 0, 0.5, 1.0].map((scale, index) => {
    const normalizedScale = (scale + 1) / 2;
    const labelRadius = radius * normalizedScale + 20; // Position labels outside the circles
    return (
      <text
        key={`label-${index}`}
        x={centerX + labelRadius}
        y={centerY - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs fill-slate-300 font-medium"
        fontSize="11"
      >
        {scale}
      </text>
    );
  });

  // Axis lines
  const axisLines = [
    { angle: lmAngle, label: 'LM', color: '#3B82F6' },
    { angle: riAngle, label: 'RI', color: '#10B981' },
    { angle: cnAngle, label: 'CN', color: '#F59E0B' }
  ].map((axis, index) => {
    const endX = centerX + Math.cos(axis.angle) * radius;
    const endY = centerY + Math.sin(axis.angle) * radius;
    const labelX = centerX + Math.cos(axis.angle) * (radius + 20);
    const labelY = centerY + Math.sin(axis.angle) * (radius + 20);

    return (
      <g key={index}>
        <line
          x1={centerX}
          y1={centerY}
          x2={endX}
          y2={endY}
          stroke={axis.color}
          strokeWidth="2"
          opacity="0.3"
        />
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-bold fill-white"
        >
          {axis.label}
        </text>
      </g>
    );
  });

  const getScoreColor = (score: number) => {
    if (score >= 1) return '#10B981'; // Green
    if (score >= 0) return '#3B82F6'; // Blue
    if (score >= -1) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 1) return 'Excellent';
    if (score >= 0) return 'Good';
    if (score >= -1) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center mb-6"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-3xl font-bold text-white mb-2"
        >
          <span style={{ color: getScoreColor(data.dssScore || 0) }}>
            {data.dssScore !== null && data.dssScore !== undefined && typeof data.dssScore === 'number'
              ? data.dssScore.toFixed(2) 
              : 'N/A'}
          </span>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-slate-300 font-medium"
        >
          {getScoreLabel(data.dssScore || 0)}
        </motion.p>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        id="dss-radar-container" 
        className="flex justify-center mb-6"
      >
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible drop-shadow-lg">
          {/* Grid circles */}
          {gridCircles}
          
          {/* Scale labels */}
          {scaleLabels}
          
          {/* Axis lines */}
          {axisLines}

          {/* Data points */}
          <circle
            cx={lmPoint.x}
            cy={lmPoint.y}
            r="6"
            fill="#3B82F6"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredSegment('LM')}
            onMouseLeave={() => setHoveredSegment(null)}
          />
          <circle
            cx={riPoint.x}
            cy={riPoint.y}
            r="6"
            fill="#10B981"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredSegment('RI')}
            onMouseLeave={() => setHoveredSegment(null)}
          />
          <circle
            cx={cnPoint.x}
            cy={cnPoint.y}
            r="6"
            fill="#F59E0B"
            className="cursor-pointer"
            onMouseEnter={() => setHoveredSegment('CN')}
            onMouseLeave={() => setHoveredSegment(null)}
          />

          {/* Radar area */}
          <path
            d={radarPath}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3B82F6"
            strokeWidth="2"
            className="cursor-pointer"
          />
        </svg>
      </motion.div>

      {/* Legend */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-3 gap-4 text-center"
      >
        <motion.div 
          whileHover={{ scale: 1.05, y: -2 }}
          className="space-y-2 p-3 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300"
        >
          <div className="flex items-center justify-center space-x-2">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-blue-500 shadow-lg"
            ></motion.div>
            <span className="text-sm font-bold text-white">Learning Momentum</span>
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="text-lg font-bold text-blue-400"
          >
            {learningMomentum !== null && learningMomentum !== undefined && typeof learningMomentum === 'number'
              ? learningMomentum.toFixed(1) 
              : 'N/A'}
          </motion.div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.05, y: -2 }}
          className="space-y-2 p-3 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300"
        >
          <div className="flex items-center justify-center space-x-2">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.7, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-green-500 shadow-lg"
            ></motion.div>
            <span className="text-sm font-bold text-white">Recovery Index</span>
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, type: "spring" }}
            className="text-lg font-bold text-green-400"
          >
            {recoveryIndex !== null && recoveryIndex !== undefined && typeof recoveryIndex === 'number'
              ? recoveryIndex.toFixed(1) 
              : 'N/A'}
          </motion.div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.05, y: -2 }}
          className="space-y-2 p-3 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300"
        >
          <div className="flex items-center justify-center space-x-2">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.3, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-orange-500 shadow-lg"
            ></motion.div>
            <span className="text-sm font-bold text-white">Connection</span>
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.0, type: "spring" }}
            className="text-lg font-bold text-orange-400"
          >
            {connectionScore !== null && connectionScore !== undefined && typeof connectionScore === 'number'
              ? connectionScore.toFixed(1) 
              : 'N/A'}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Hover tooltip */}
      {hoveredSegment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bg-slate-800/90 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3 text-white text-sm shadow-xl"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          {hoveredSegment === 'LM' && (
            <div>
              <div className="font-bold text-blue-400">Learning Momentum</div>
              <div>Score: {learningMomentum !== null && learningMomentum !== undefined && typeof learningMomentum === 'number'
                ? learningMomentum.toFixed(2) 
                : 'N/A'}</div>
              <div className="text-xs text-gray-300">Deep work + Tasks</div>
            </div>
          )}
          {hoveredSegment === 'RI' && (
            <div>
              <div className="font-bold text-green-400">Recovery Index</div>
              <div>Score: {recoveryIndex !== null && recoveryIndex !== undefined && typeof recoveryIndex === 'number'
                ? recoveryIndex.toFixed(2) 
                : 'N/A'}</div>
              <div className="text-xs text-gray-300">Sleep + Recovery</div>
            </div>
          )}
          {hoveredSegment === 'CN' && (
            <div>
              <div className="font-bold text-orange-400">Connection</div>
              <div>Score: {connectionScore !== null && connectionScore !== undefined && typeof connectionScore === 'number'
                ? connectionScore.toFixed(2) 
                : 'N/A'}</div>
              <div className="text-xs text-gray-300">Social Touchpoints</div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}