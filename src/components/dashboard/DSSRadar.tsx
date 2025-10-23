'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DSSData {
  dssScore: number;
  learningMomentum: number;
  recoveryIndex: number;
  connectionScore: number;
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
        const size = Math.min(container.offsetWidth - 40, 250);
        setDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No DSS data available
      </div>
    );
  }

  const { learningMomentum, recoveryIndex, connectionScore } = data;
  
  // Normalize values to 0-1 scale for radar chart
  const normalizeValue = (value: number) => Math.max(0, Math.min(1, (value + 3) / 6)); // Assuming values range from -3 to +3
  
  const lmNormalized = normalizeValue(learningMomentum || 0);
  const riNormalized = normalizeValue(recoveryIndex || 0);
  const cnNormalized = normalizeValue(connectionScore || 0);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) / 2 - 40;

  // Calculate points for each axis
  const getPoint = (angle: number, value: number) => {
    const x = centerX + Math.cos(angle) * radius * value;
    const y = centerY + Math.sin(angle) * radius * value;
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

  // Grid circles
  const gridCircles = [0.2, 0.4, 0.6, 0.8, 1.0].map((scale, index) => (
    <circle
      key={index}
      cx={centerX}
      cy={centerY}
      r={radius * scale}
      fill="none"
      stroke="rgba(59, 130, 246, 0.2)"
      strokeWidth="1"
    />
  ));

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
    <div className="w-full">
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-white mb-1">
          <span style={{ color: getScoreColor(data.dssScore || 0) }}>
            {data.dssScore !== null && data.dssScore !== undefined && typeof data.dssScore === 'number'
              ? data.dssScore.toFixed(2) 
              : 'N/A'}
          </span>
        </div>
        <p className="text-xs text-gray-300">
          {getScoreLabel(data.dssScore || 0)}
        </p>
      </div>

      <div id="dss-radar-container" className="flex justify-center">
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible">
          {/* Grid circles */}
          {gridCircles}
          
          {/* Axis lines */}
          {axisLines}
          
          {/* Radar area */}
          <motion.path
            d={radarPath}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          
          {/* Data points */}
          <motion.circle
            cx={lmPoint.x}
            cy={lmPoint.y}
            r="6"
            fill="#3B82F6"
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            onMouseEnter={() => setHoveredSegment('LM')}
            onMouseLeave={() => setHoveredSegment(null)}
            className="cursor-pointer"
          />
          <motion.circle
            cx={riPoint.x}
            cy={riPoint.y}
            r="6"
            fill="#10B981"
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            onMouseEnter={() => setHoveredSegment('RI')}
            onMouseLeave={() => setHoveredSegment(null)}
            className="cursor-pointer"
          />
          <motion.circle
            cx={cnPoint.x}
            cy={cnPoint.y}
            r="6"
            fill="#F59E0B"
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
            onMouseEnter={() => setHoveredSegment('CN')}
            onMouseLeave={() => setHoveredSegment(null)}
            className="cursor-pointer"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs font-medium text-white">LM</span>
          </div>
          <div className="text-sm font-bold text-blue-400">
            {learningMomentum !== null && learningMomentum !== undefined && typeof learningMomentum === 'number'
              ? learningMomentum.toFixed(1) 
              : 'N/A'}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-white">RI</span>
          </div>
          <div className="text-sm font-bold text-green-400">
            {recoveryIndex !== null && recoveryIndex !== undefined && typeof recoveryIndex === 'number'
              ? recoveryIndex.toFixed(1) 
              : 'N/A'}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-xs font-medium text-white">CN</span>
          </div>
          <div className="text-sm font-bold text-orange-400">
            {connectionScore !== null && connectionScore !== undefined && typeof connectionScore === 'number'
              ? connectionScore.toFixed(1) 
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredSegment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bg-slate-800/90 backdrop-blur-sm border border-blue-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg"
          style={{
            left: '50%',
            top: '10px',
            transform: 'translateX(-50%)',
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
    </div>
  );
}
