"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

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
  driversData?: {
    helpful?: Array<{ tag: string }>;
    harmful?: Array<{ tag: string }>;
  } | null;
}

interface LearnedConnection {
  id: string;
  activity: string;
  outcome: string;
  strength: number;
  positiveCount: number;
  negativeCount: number;
}

export default function TagsNetworkGraph({ moodEntries, userPreferences, timeRange, driversData }: TagsNetworkGraphProps) {
  const [graphData, setGraphData] = useState<{ nodes: TagNode[], links: TagConnection[] }>({ nodes: [], links: [] });
  const [learnedConnections, setLearnedConnections] = useState<LearnedConnection[]>([]);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showSubcategories, setShowSubcategories] = useState<boolean>(false);
  const graphRef = React.useRef<any>(null);

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

    // Add subcategory nodes from mood entries
    const subcategoryFreq: { [key: string]: number } = {};
    filteredEntries.forEach(entry => {
      if (entry.selectedSubcategories) {
        const subcategories = Array.isArray(entry.selectedSubcategories) ? entry.selectedSubcategories : JSON.parse(entry.selectedSubcategories || '[]');
        subcategories.forEach((subcategory: string) => {
          subcategoryFreq[subcategory] = (subcategoryFreq[subcategory] || 0) + 1;
        });
      }
    });

    // Add subcategory nodes
    Object.entries(subcategoryFreq).forEach(([subcategory, freq]) => {
      nodes.push({
        id: subcategory,
        label: subcategory,
        category: 'subcategory',
        frequency: freq,
        val: freq * 2,
        x: Math.random() * 800 + 100,
        y: Math.random() * 600 + 100
      });
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

    // Connect activities to their subcategories
    filteredEntries.forEach(entry => {
      if (entry.activities && entry.selectedSubcategories) {
        const activities = Array.isArray(entry.activities) ? entry.activities : JSON.parse(entry.activities || '[]');
        const subcategories = Array.isArray(entry.selectedSubcategories) ? entry.selectedSubcategories : JSON.parse(entry.selectedSubcategories || '[]');
        
        activities.forEach((activity: string) => {
          subcategories.forEach((subcategory: string) => {
            // Check if both nodes exist
            if (nodes.some(n => n.id === activity) && nodes.some(n => n.id === subcategory)) {
              links.push({
                source: activity,
                target: subcategory,
                strength: 0.5
              });
            }
          });
        });
      }
    });

    setGraphData({ nodes, links });
  };

  const getNodeColor = (node: any) => {
    // Check if this node is an activity and has drivers data
    if (node.category === 'activity' && driversData) {
      const helpfulActivities = driversData.helpful?.map(d => d.tag) || [];
      const harmfulActivities = driversData.harmful?.map(d => d.tag) || [];
      
      if (helpfulActivities.includes(node.id)) {
        return '#00FF88'; // Green for helpful
      }
      if (harmfulActivities.includes(node.id)) {
        return '#FF6B6B'; // Red for harmful
      }
    }
    
    // Default colors for other categories
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
    return colors[node.category] || '#FF6B6B';
  };

  const handleNodeClick = useCallback((node: any) => {
    // Zoom to node on click
    console.log('Node clicked:', node);
  }, []);

  // Filter graph data based on subcategory visibility
  const filteredGraphData = useMemo(() => {
    const filteredNodes = graphData.nodes.filter(node => showSubcategories || node.category !== 'subcategory');
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    
    // Filter links to only include those where both source and target are in the filtered nodes
    const filteredLinks = graphData.links.filter(link => {
      // Handle both string and object IDs
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
      
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });
    
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, showSubcategories]);

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
      <div 
        className="w-full h-[800px] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden"
      >
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="mr-3 text-2xl">🕸️</span>
            Your Personal Network
          </h3>
          <div className="flex items-center space-x-2">
            <button
              className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all font-medium"
              onClick={() => setShowSubcategories(v => !v)}
            >
              {showSubcategories ? 'Hide Subcategories' : 'Show Subcategories'}
            </button>
          </div>
        </div>
        
        {/* Force Graph */}
        <div className="absolute inset-0" style={{ top: '80px', bottom: '100px' }}>
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredGraphData}
            width={undefined}
            height={undefined}
            nodeCanvasObjectMode={() => 'after'}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label || node.id;
              const nodeColor = getNodeColor(node);
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
              const color = getNodeColor(node);
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
        <div className={`absolute bottom-2 left-2 right-2 ${showLegend ? 'bg-white/95 backdrop-blur-sm p-3' : 'p-0'} rounded-lg ${showLegend ? '' : 'pointer-events-none'}`}>
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 rounded-full shadow-lg bg-green-400"></div>
                <span className="text-xs font-bold text-white">Helpful Activities</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-red-500/20 hover:border-red-400/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 rounded-full shadow-lg bg-red-400"></div>
                <span className="text-xs font-bold text-white">Harmful Activities</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 rounded-full shadow-lg bg-cyan-400"></div>
                <span className="text-xs font-bold text-white">Other Activities</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-teal-500/20 hover:border-teal-400/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-1">
                <div className="w-2 h-2 rounded-full shadow-lg bg-teal-400"></div>
                <span className="text-xs font-bold text-white">Subcategories</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
