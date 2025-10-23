'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoodEntry } from '@prisma/client';

interface ModernRadarChartProps {
  data: MoodEntry[];
  height?: number;
}

export default function ModernRadarChart({ data, height = 300 }: ModernRadarChartProps) {
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('wellness-radar-container');
      if (container) {
        const size = Math.min(container.offsetWidth - 40, 250);
        setDimensions({ width: size, height: size });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (data.length === 0) {
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
        <p className="text-slate-300 text-lg">No wellness data available</p>
      </motion.div>
    );
  }

  // Calculate averages
  const avgData = {
    valence: data.reduce((sum, entry) => sum + entry.valence, 0) / data.length,
    energy: data.reduce((sum, entry) => sum + entry.energy, 0) / data.length,
    focus: data.reduce((sum, entry) => sum + entry.focus, 0) / data.length,
    sleep: (data.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / data.length) * 1.25,
    stress: data.reduce((sum, entry) => sum + entry.stress, 0) / data.length,
  };

  // Normalize values to 0-1 scale for radar chart
  const normalizeValue = (value: number) => Math.max(0, Math.min(1, value / 10));

  const valenceNormalized = normalizeValue(avgData.valence);
  const energyNormalized = normalizeValue(avgData.energy);
  const focusNormalized = normalizeValue(avgData.focus);
  const sleepNormalized = normalizeValue(avgData.sleep);
  const stressNormalized = normalizeValue(avgData.stress);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) / 2 - 40;

  // Calculate points for each axis (5 axes: 72 degrees apart)
  const getPoint = (angle: number, value: number) => {
    const x = centerX + Math.cos(angle) * radius * value;
    const y = centerY + Math.sin(angle) * radius * value;
    return { x, y };
  };

  // Five axes: Valence, Energy, Focus, Sleep, Stress
  const valenceAngle = -Math.PI / 2; // Top
  const energyAngle = -Math.PI / 2 + (2 * Math.PI / 5); // Top right
  const focusAngle = -Math.PI / 2 + (4 * Math.PI / 5); // Bottom right
  const sleepAngle = -Math.PI / 2 + (6 * Math.PI / 5); // Bottom left
  const stressAngle = -Math.PI / 2 + (8 * Math.PI / 5); // Top left

  const valencePoint = getPoint(valenceAngle, valenceNormalized);
  const energyPoint = getPoint(energyAngle, energyNormalized);
  const focusPoint = getPoint(focusAngle, focusNormalized);
  const sleepPoint = getPoint(sleepAngle, sleepNormalized);
  const stressPoint = getPoint(stressAngle, stressNormalized);

  // Create path for the radar area
  const radarPath = `M ${valencePoint.x} ${valencePoint.y} L ${energyPoint.x} ${energyPoint.y} L ${focusPoint.x} ${focusPoint.y} L ${sleepPoint.x} ${sleepPoint.y} L ${stressPoint.x} ${stressPoint.y} Z`;

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
    { angle: valenceAngle, label: 'Valence', color: '#3B82F6' },
    { angle: energyAngle, label: 'Energy', color: '#10B981' },
    { angle: focusAngle, label: 'Focus', color: '#F59E0B' },
    { angle: sleepAngle, label: 'Sleep', color: '#8B5CF6' },
    { angle: stressAngle, label: 'Stress', color: '#EF4444' }
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
    if (score >= 8) return '#10B981'; // Green
    if (score >= 6) return '#3B82F6'; // Blue
    if (score >= 4) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
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
          <span style={{ color: getScoreColor((avgData.valence + avgData.energy + avgData.focus + avgData.sleep + (10 - avgData.stress)) / 5) }}>
            {((avgData.valence + avgData.energy + avgData.focus + avgData.sleep + (10 - avgData.stress)) / 5).toFixed(1)}
          </span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-slate-300 font-medium"
        >
          {getScoreLabel((avgData.valence + avgData.energy + avgData.focus + avgData.sleep + (10 - avgData.stress)) / 5)}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        id="wellness-radar-container"
        className="flex justify-center mb-6"
      >
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible drop-shadow-lg">
          {/* Grid circles */}
          {gridCircles}

          {/* Axis lines */}
          {axisLines}

          {/* Radar area */}
          <motion.path
            d={radarPath}
            fill="rgba(59, 130, 246, 0.4)"
            stroke="#3B82F6"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Data points */}
          {[
            { point: valencePoint, label: 'Valence', color: '#3B82F6' },
            { point: energyPoint, label: 'Energy', color: '#10B981' },
            { point: focusPoint, label: 'Focus', color: '#F59E0B' },
            { point: sleepPoint, label: 'Sleep', color: '#8B5CF6' },
            { point: stressPoint, label: 'Stress', color: '#EF4444' }
          ].map((item, index) => (
            <circle
              key={index}
              cx={item.point.x}
              cy={item.point.y}
              r={5}
              fill={item.color}
              stroke="white"
              strokeWidth="1.5"
              onMouseEnter={() => setHoveredSegment(item.label)}
              onMouseLeave={() => setHoveredSegment(null)}
              className="cursor-pointer"
            />
          ))}
        </svg>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-5 gap-2 text-center"
      >
        {[
          { label: 'Valence', value: avgData.valence, color: '#3B82F6' },
          { label: 'Energy', value: avgData.energy, color: '#10B981' },
          { label: 'Focus', value: avgData.focus, color: '#F59E0B' },
          { label: 'Sleep', value: avgData.sleep, color: '#8B5CF6' },
          { label: 'Stress', value: avgData.stress, color: '#EF4444' }
        ].map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05, y: -2 }}
            className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300"
          >
            <div className="flex items-center justify-center space-x-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5 + index * 0.2, repeat: Infinity }}
                className="w-2 h-2 rounded-full shadow-lg"
                style={{ backgroundColor: item.color }}
              ></motion.div>
              <span className="text-xs font-bold text-white">{item.label}</span>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1, type: "spring" }}
              className="text-sm font-bold"
              style={{ color: item.color }}
            >
              {item.value.toFixed(1)}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Hover tooltip */}
      {hoveredSegment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-800/90 backdrop-blur-sm border border-blue-500/30 rounded-lg text-white text-xs whitespace-nowrap z-10"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10
          }}
        >
          {hoveredSegment === 'Valence' && (
            <div>
              <div className="font-bold text-blue-400">Valence</div>
              <div>Score: {avgData.valence.toFixed(2)}</div>
              <div className="text-xs text-gray-300">Mood positivity</div>
            </div>
          )}
          {hoveredSegment === 'Energy' && (
            <div>
              <div className="font-bold text-green-400">Energy</div>
              <div>Score: {avgData.energy.toFixed(2)}</div>
              <div className="text-xs text-gray-300">Physical energy</div>
            </div>
          )}
          {hoveredSegment === 'Focus' && (
            <div>
              <div className="font-bold text-orange-400">Focus</div>
              <div>Score: {avgData.focus.toFixed(2)}</div>
              <div className="text-xs text-gray-300">Mental focus</div>
            </div>
          )}
          {hoveredSegment === 'Sleep' && (
            <div>
              <div className="font-bold text-purple-400">Sleep</div>
              <div>Score: {avgData.sleep.toFixed(2)}</div>
              <div className="text-xs text-gray-300">Sleep quality</div>
            </div>
          )}
          {hoveredSegment === 'Stress' && (
            <div>
              <div className="font-bold text-red-400">Stress</div>
              <div>Score: {avgData.stress.toFixed(2)}</div>
              <div className="text-xs text-gray-300">Stress level</div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
