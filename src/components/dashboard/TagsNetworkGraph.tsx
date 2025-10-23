"use client";

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';

interface TagNode {
  id: string;
  label: string;
  category: string;
  frequency: number;
  x: number;
  y: number;
  size: number;
}

interface TagConnection {
  from: string;
  to: string;
  strength: number;
  width: number;
}

interface TagsNetworkGraphProps {
  moodEntries: any[];
  userPreferences: any;
  timeRange: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface LearnedConnection {
  id: string;
  activity: string;
  outcome: string;
  strength: number;
  positiveCount: number;
  negativeCount: number;
}

export default function TagsNetworkGraph({ moodEntries, userPreferences, timeRange }: TagsNetworkGraphProps) {
  const [nodes, setNodes] = useState<TagNode[]>([]);
  const [connections, setConnections] = useState<TagConnection[]>([]);
  const [learnedConnections, setLearnedConnections] = useState<LearnedConnection[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // Fullscreen lifecycle: escape to exit and lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    if (isFullscreen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    fetchLearnedConnections();
    generateNetworkData();
  }, [moodEntries, userPreferences, timeRange]);

  const fetchLearnedConnections = async () => {
    try {
      const response = await fetch('/api/learn-connections?userId=dummy-user');
      if (response.ok) {
        const data = await response.json();
        setLearnedConnections(data);
      }
    } catch (error) {
      console.error('Error fetching learned connections:', error);
    }
  };

  const generateNetworkData = () => {
    const nodes: TagNode[] = [];
    const connections: TagConnection[] = [];
    
    // Filter entries based on time range
    const now = new Date();
    const filteredEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      
      switch (timeRange) {
        case 'daily':
          // Today only
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const entryStart = new Date(entryDate.getUTCFullYear(), entryDate.getUTCMonth(), entryDate.getUTCDate());
          return entryStart.getTime() === todayStart.getTime();
        case 'weekly':
          // Last 7 days
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return entryDate >= weekAgo;
        case 'monthly':
          // Last 30 days
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return entryDate >= monthAgo;
        case 'yearly':
          // Last 365 days
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return entryDate >= yearAgo;
        default:
          return true;
      }
    });
    
    // Calculate activity frequencies from filtered entries
    const activityFreq: { [key: string]: number } = {};
    filteredEntries.forEach(entry => {
      if (entry.activities) {
        const activities = Array.isArray(entry.activities) ? entry.activities : JSON.parse(entry.activities || '[]');
        activities.forEach((activity: string) => {
          activityFreq[activity] = (activityFreq[activity] || 0) + 1;
        });
      }
    });

    // Add activity nodes
    Object.entries(activityFreq).forEach(([activity, freq]) => {
      nodes.push({
        id: activity,
        label: activity,
        category: 'activity',
        frequency: freq,
        x: 0, // Will be calculated
        y: 0, // Will be calculated
        size: Math.max(20, Math.min(60, 20 + (freq * 8)))
      });
    });

    // Add category nodes from user preferences
    const categories = [
      { key: 'favoriteWriters', label: 'Writers', icon: '📚', color: 'green' },
      { key: 'favoriteMusicians', label: 'Musicians', icon: '🎵', color: 'blue' },
      { key: 'favoriteSportsFigures', label: 'Athletes', icon: '⚽', color: 'orange' },
      { key: 'favoriteArtists', label: 'Artists', icon: '🎨', color: 'purple' },
      { key: 'favoritePhilosophers', label: 'Philosophers', icon: '🤔', color: 'indigo' },
      { key: 'interests', label: 'Interests', icon: '✨', color: 'pink' }
    ];

    categories.forEach(category => {
      const items = userPreferences?.[category.key];
      if (items && items.length > 0) {
        nodes.push({
          id: category.key,
          label: `${category.icon} ${category.label}`,
          category: 'category',
          frequency: items.length,
          x: 0,
          y: 0,
          size: Math.max(30, Math.min(80, 30 + (items.length * 5)))
        });
      }
    });

    // Add specific favorite nodes
    categories.forEach(category => {
      const items = userPreferences?.[category.key];
      if (items && items.length > 0) {
        items.forEach((item: string) => {
          nodes.push({
            id: `${category.key}_${item}`,
            label: item,
            category: category.key,
            frequency: 1,
            x: 0,
            y: 0,
            size: 15
          });

          // Connect to category
          connections.push({
            from: category.key,
            to: `${category.key}_${item}`,
            strength: 1,
            width: 2
          });
        });
      }
    });

    // Connect activities to related categories
    const activityToCategoryMap: { [key: string]: string[] } = {
      'reading': ['favoriteWriters', 'interests'],
      'music': ['favoriteMusicians', 'interests'],
      'dancing': ['favoriteMusicians', 'interests'],
      'gym': ['favoriteSportsFigures', 'interests'],
      'football': ['favoriteSportsFigures', 'interests'],
      'running': ['favoriteSportsFigures', 'interests'],
      'art': ['favoriteArtists', 'interests'],
      'painting': ['favoriteArtists', 'interests'],
      'drawing': ['favoriteArtists', 'interests'],
      'philosophy': ['favoritePhilosophers', 'interests'],
      'meditation': ['favoritePhilosophers', 'interests']
    };

    Object.entries(activityFreq).forEach(([activity, freq]) => {
      const relatedCategories = activityToCategoryMap[activity] || [];
      relatedCategories.forEach(categoryKey => {
        if (userPreferences?.[categoryKey] && userPreferences[categoryKey].length > 0) {
          connections.push({
            from: activity,
            to: categoryKey,
            strength: freq,
            width: Math.max(1, Math.min(8, freq * 2))
          });
        }
      });
    });

    // Add learned connections from AI feedback
    learnedConnections.forEach(connection => {
      // Create outcome nodes if they don't exist
      const outcomeNode = nodes.find(n => n.id === connection.outcome);
      if (!outcomeNode) {
        nodes.push({
          id: connection.outcome,
          label: connection.outcome,
          category: 'outcome',
          frequency: 1,
          x: 0,
          y: 0,
          size: 20
        });
      }

      // Add learned connection
      connections.push({
        from: connection.activity,
        to: connection.outcome,
        strength: connection.strength,
        width: Math.max(2, Math.min(12, connection.strength * 6))
      });
    });

    // Position nodes in a dynamic layout
    const centerX = 300;
    const centerY = 200;
    const radius = 120;

    nodes.forEach((node, index) => {
      if (node.category === 'activity') {
        // Activities in center with dynamic positioning
        const angle = (index * 2 * Math.PI) / Math.max(Object.keys(activityFreq).length, 1);
        node.x = centerX + Math.cos(angle) * 60;
        node.y = centerY + Math.sin(angle) * 60;
      } else if (node.category === 'category') {
        // Categories in outer ring
        const categoryIndex = categories.findIndex(c => c.key === node.id);
        const angle = (categoryIndex * 2 * Math.PI) / Math.max(categories.length, 1);
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
      } else if (node.category === 'outcome') {
        // Outcomes in a separate area (right side)
        const outcomeIndex = nodes.filter(n => n.category === 'outcome').indexOf(node);
        node.x = centerX + 200 + (outcomeIndex % 3) * 80;
        node.y = centerY - 100 + Math.floor(outcomeIndex / 3) * 60;
      } else {
        // Specific favorites around their categories
        const parentCategory = node.id.split('_')[0];
        const parentNode = nodes.find(n => n.id === parentCategory);
        if (parentNode) {
          const angle = Math.random() * 2 * Math.PI;
          node.x = parentNode.x + Math.cos(angle) * 50;
          node.y = parentNode.y + Math.sin(angle) * 50;
        }
      }
    });

    setNodes(nodes);
    setConnections(connections);
  };

  const getNodeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'activity': '#00D4FF', // Bright cyan
      'favoriteWriters': '#00FF88', // Bright green
      'favoriteMusicians': '#FF6B9D', // Bright pink
      'favoriteSportsFigures': '#FFB800', // Bright orange
      'favoriteArtists': '#B800FF', // Bright purple
      'favoritePhilosophers': '#0066FF', // Bright blue
      'interests': '#FF0080', // Bright magenta
      'outcome': '#FFD700' // Gold for outcomes
    };
    return colors[category] || '#FF6B6B';
  };

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🕸️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Network Data Yet</h3>
        <p className="text-gray-600">
          Add more entries and preferences to see your personal network!
        </p>
      </div>
    );
  }

  const Container = (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[1000] p-4' : 'w-full h-96 p-6'} bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 ${isFullscreen ? 'rounded-none' : 'rounded-2xl'} relative overflow-hidden shadow-2xl`}
      onWheel={(e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomFactor = delta > 0 ? 1.1 : 0.9;
        setScale(prev => Math.max(0.4, Math.min(3, prev * zoomFactor)));
      }}
      onMouseDown={(e) => {
        setIsPanning(true);
        setPanStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
      }}
      onMouseMove={(e) => {
        if (!isPanning || !panStart) return;
        setTranslate({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }}
      onMouseUp={() => setIsPanning(false)}
      onMouseLeave={() => setIsPanning(false)}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            animate={{
              x: [0, Math.random() * 600],
              y: [0, Math.random() * 400],
              opacity: [0.1, 0.8, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <span className="mr-3 text-2xl">🕸️</span>
          Your Personal Network
        </h3>
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20"
            onClick={() => setIsFullscreen(v => !v)}
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20"
            onClick={() => setShowLegend(v => !v)}
          >
            {showLegend ? 'Hide Legend' : 'Show Legend'}
          </button>
          <span className="hidden sm:inline text-sm text-indigo-200 ml-2">Zoom: scroll • Pan: drag</span>
        </div>
      </div>
      
      <svg width="100%" height="100%" viewBox="0 0 600 400" className="absolute inset-0">
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="50%" stopColor="#B800FF" />
            <stop offset="100%" stopColor="#FF6B9D" />
          </linearGradient>
          <linearGradient id="learnedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
        </defs>

        <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
        {/* Connections */}
        {connections.map((connection, index) => {
          const fromNode = nodes.find(n => n.id === connection.from);
          const toNode = nodes.find(n => n.id === connection.to);
          
          if (!fromNode || !toNode) return null;

          // Determine if this is a learned connection (activity -> outcome)
          const isLearnedConnection = fromNode.category === 'activity' && toNode.category === 'outcome';
          const isHovered = hoveredNode === connection.from || hoveredNode === connection.to;

          return (
            <g key={index}>
              {/* Glow effect for hovered connections */}
              {isHovered && (
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isLearnedConnection ? "#FFD700" : "#00D4FF"}
                  strokeWidth={connection.width + 4}
                  opacity={0.3}
                  className="animate-pulse"
                />
              )}
              {/* Main connection line */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={isLearnedConnection ? "url(#learnedGradient)" : "url(#connectionGradient)"}
                strokeWidth={connection.width}
                opacity={hoveredNode ? (isHovered ? 1 : 0.2) : 0.8}
                className="transition-all duration-300"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <motion.g
            key={node.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: Math.random() * 0.5 }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
          >
            {/* Glow effect for hovered nodes */}
            {hoveredNode === node.id && (
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size / 2 + 8}
                fill={getNodeColor(node.category)}
                opacity={0.3}
                className="animate-pulse"
              />
            )}
            
            {/* Main node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size / 2}
              fill={getNodeColor(node.category)}
              opacity={hoveredNode ? (hoveredNode === node.id ? 1 : 0.4) : 0.9}
              className="transition-all duration-300 drop-shadow-lg"
              stroke="white"
              strokeWidth={hoveredNode === node.id ? 3 : 1}
            />
            
            {/* Node text with better contrast */}
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              fontSize={node.category === 'activity' ? 11 : 9}
              fill="white"
              fontWeight="bold"
              className="pointer-events-none drop-shadow-lg"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="0.5"
            >
              {node.label.length > 12 ? node.label.substring(0, 12) + '...' : node.label}
            </text>
          </motion.g>
        ))}
        </g>
      </svg>

      {/* Stats and Legend */}
      <div className={`absolute bottom-2 left-2 right-2 ${showLegend ? 'bg-white/95 backdrop-blur-sm p-3' : 'p-0'} rounded-lg ${showLegend ? '' : 'pointer-events-none'} `}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-700">Nodes:</span>
              <span className="text-gray-600">{nodes.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-700">Connections:</span>
              <span className="text-gray-600">{connections.length}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-700">Period:</span>
              <span className="text-gray-600">
                {timeRange === 'daily' ? 'Today' :
                 timeRange === 'weekly' ? 'Last 7 days' :
                 timeRange === 'monthly' ? 'Last 30 days' :
                 'Last 365 days'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-lg"></div>
            <span className="font-semibold text-gray-800">Activities</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-400 shadow-lg"></div>
            <span className="font-semibold text-gray-800">Writers</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-orange-400 shadow-lg"></div>
            <span className="font-semibold text-gray-800">Athletes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-purple-400 shadow-lg"></div>
            <span className="font-semibold text-gray-800">Artists</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-pink-400 shadow-lg"></div>
            <span className="font-semibold text-gray-800">Interests</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-lg"></div>
            <span className="font-semibold text-gray-800">Outcomes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg"></div>
            <span className="font-semibold text-gray-800">Learned</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return ReactDOM.createPortal(Container, document.body);
  }
  return Container;
}
