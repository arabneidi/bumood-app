"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import dynamic from 'next/dynamic';

// Dynamically import react-force-graph-2d to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false
});

interface TagNode {
  id: string;
  label: string;
  category: string;
  frequency: number;
  val: number;
  x?: number;
  y?: number;
}

interface TagConnection {
  source: string;
  target: string;
  strength: number;
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
  const [graphData, setGraphData] = useState<{ nodes: TagNode[], links: TagConnection[] }>({ nodes: [], links: [] });
  const [learnedConnections, setLearnedConnections] = useState<LearnedConnection[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const graphRef = React.useRef<any>(null);

  useEffect(() => {
    fetchLearnedConnections();
    generateNetworkData();
  }, [moodEntries, userPreferences, timeRange]);

  // Fullscreen lifecycle
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
    const links: TagConnection[] = [];
    
    // Filter entries based on time range
    const now = new Date();
    const filteredEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      
      switch (timeRange) {
        case 'daily':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const entryStart = new Date(entryDate.getUTCFullYear(), entryDate.getUTCMonth(), entryDate.getUTCDate());
          return entryStart.getTime() === todayStart.getTime();
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return entryDate >= weekAgo;
        case 'monthly':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return entryDate >= monthAgo;
        case 'yearly':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return entryDate >= yearAgo;
        default:
          return true;
      }
    });
    
    // Calculate activity frequencies
    const activityFreq: { [key: string]: number } = {};
    filteredEntries.forEach(entry => {
      if (entry.activities) {
        const activities = Array.isArray(entry.activities) ? entry.activities : JSON.parse(entry.activities || '[]');
        activities.forEach((activity: string) => {
          activityFreq[activity] = (activityFreq[activity] || 0) + 1;
        });
      }
    });

    // Add activity nodes with random initial positions
    Object.entries(activityFreq).forEach(([activity, freq]) => {
      if (freq > 0) {
        nodes.push({
          id: activity,
          label: activity,
          category: 'activity',
          frequency: freq,
          val: freq * 2,
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100
        });
      }
    });

    // Connect co-occurring activities
    const coOccurrenceMap: { [key: string]: { [key: string]: number } } = {};
    
    filteredEntries.forEach(entry => {
      if (entry.activities) {
        const activities = Array.isArray(entry.activities) ? entry.activities : JSON.parse(entry.activities || '[]');
        for (let i = 0; i < activities.length; i++) {
          for (let j = i + 1; j < activities.length; j++) {
            const activity1 = activities[i];
            const activity2 = activities[j];
            
            if (!coOccurrenceMap[activity1]) {
              coOccurrenceMap[activity1] = {};
            }
            if (!coOccurrenceMap[activity2]) {
              coOccurrenceMap[activity2] = {};
            }
            
            coOccurrenceMap[activity1][activity2] = (coOccurrenceMap[activity1][activity2] || 0) + 1;
            coOccurrenceMap[activity2][activity1] = (coOccurrenceMap[activity2][activity1] || 0) + 1;
          }
        }
      }
    });

    // Add links for co-occurring activities (at least 1 time)
    Object.entries(coOccurrenceMap).forEach(([activity1, coActivities]) => {
      Object.entries(coActivities).forEach(([activity2, count]) => {
        if (count >= 1 && activity1 < activity2) {
          links.push({
            source: activity1,
            target: activity2,
            strength: Math.min(count / 3, 1)
          });
        }
      });
    });

    setGraphData({ nodes, links });
  };

  const getNodeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'activity': '#00D4FF',
      'subcategory': '#00E6FF',
      'favoriteWriters': '#00FF88',
      'favoriteMusicians': '#FF6B9D',
      'favoriteSportsFigures': '#FFB800',
      'favoriteArtists': '#B800FF',
      'favoritePhilosophers': '#0066FF',
      'interests': '#FF0080',
      'outcome': '#FFD700'
    };
    return colors[category] || '#FF6B6B';
  };

  const handleNodeClick = useCallback((node: any) => {
    // Zoom to node on click
    console.log('Node clicked:', node);
  }, []);

  if (graphData.nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🕸️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Network Data Yet</h3>
        <p className="text-gray-600">
          Add more entries to see your personal network!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/30"
          onClick={() => setIsFullscreen(false)}
          aria-hidden="true"
        />
      )}
      
      <div 
        className={`${isFullscreen ? 'fixed top-0 left-0 w-full h-full z-[9999]' : 'w-full h-[800px]'} bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 ${isFullscreen ? 'rounded-none' : 'rounded-2xl'} relative shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className={`relative z-10 flex items-center justify-between p-6 ${isFullscreen ? 'border-b border-white/10 flex-shrink-0' : ''}`}>
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-3 text-2xl">🕸️</span>
            Your Personal Network
          </h3>
          <div className="flex items-center space-x-2">
            <button
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all font-medium"
              onClick={() => setIsFullscreen(v => !v)}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all font-medium"
              onClick={() => setShowLegend(v => !v)}
            >
              {showLegend ? 'Hide Legend' : 'Show Legend'}
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all font-medium"
              onClick={() => setShowLabels(v => !v)}
            >
              {showLabels ? 'Hide Labels' : 'Show Labels'}
            </button>
            {isFullscreen && <span className="hidden sm:inline text-sm text-indigo-200 ml-2">Drag nodes • Zoom with mouse wheel</span>}
          </div>
        </div>
        
        {/* Force Graph */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label || node.id;
              const nodeColor = getNodeColor(node.category);
              const fontSize = 14 / globalScale;
              
              // Measure text
              ctx.font = `bold ${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Draw text with stroke for visibility
              const labelY = node.y! + (node.__size! || 8) / globalScale + 10;
              ctx.strokeStyle = 'rgba(0,0,0,0.5)';
              ctx.lineWidth = 3 / globalScale;
              ctx.strokeText(label, node.x!, labelY);
              ctx.fillStyle = 'white';
              ctx.fillText(label, node.x!, labelY);
            }}
            nodeColor={(node: any) => {
              const color = getNodeColor(node.category);
              // Convert hex to rgba with opacity
              return color + '66'; // 66 = approximately 40% opacity in hex
            }}
            nodeVal={(node: any) => node.val}
            nodeRelSize={8}
            linkWidth={(link: any) => Math.max(2, link.strength * 4)}
            linkColor={() => 'rgba(255,255,255,0.6)'}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            onEngineStop={() => {}}
            enableNodeDrag={true}
            enablePanInteraction={true}
            enableZoomInteraction={true}
            minZoom={0.1}
            maxZoom={10}
          />
        </div>

        {/* Stats and Legend */}
        <div className={`absolute bottom-2 left-2 right-2 ${showLegend ? 'bg-white/95 backdrop-blur-sm p-3' : 'p-0'} rounded-lg ${showLegend ? '' : 'pointer-events-none'} ${isFullscreen ? 'flex-shrink-0' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-gray-700">Nodes:</span>
                <span className="text-gray-600">{graphData.nodes.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-gray-700">Connections:</span>
                <span className="text-gray-600">{graphData.links.length}</span>
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
              <div className="w-4 h-4 rounded-full bg-teal-400 shadow-lg"></div>
              <span className="font-semibold text-gray-800">Subcategories</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-lg"></div>
              <span className="font-semibold text-gray-800">Outcomes</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
