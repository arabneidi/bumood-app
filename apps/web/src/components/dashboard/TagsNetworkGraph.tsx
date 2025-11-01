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
  const [grabbedNodeId, setGrabbedNodeId] = useState<string | null>(null);
  const [connectedNodeIds, setConnectedNodeIds] = useState<string[]>([]);
  // removed ref to avoid forwarding warnings
  const isDraggingRef = React.useRef<string | null>(null); // Track which node is currently being dragged
  const stateRef = React.useRef<{ grabbedNodeId: string | null; connectedNodeIds: string[] }>({
    grabbedNodeId: null,
    connectedNodeIds: []
  });
  
  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = { grabbedNodeId, connectedNodeIds };
  }, [grabbedNodeId, connectedNodeIds]);

  useEffect(() => {
    const start = performance.now();
    fetchLearnedConnections();
    generateNetworkData();
    // silence debug timings
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
    const genStart = performance.now();
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

    // Add links for co-occurring activities - only top 2 most common per node
    // First, determine top 2 for each node
    const top2Connections: { [key: string]: Set<string> } = {};
    Object.entries(coOccurrenceMap).forEach(([activity, coActivities]) => {
      const sorted = Object.entries(coActivities)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 2); // Only keep top 2
      top2Connections[activity] = new Set(sorted.map(([act]) => act));
    });

    // Add links only if in top 2 for at least one node (to keep network less crowded)
    const addedLinks = new Set<string>();
    Object.entries(coOccurrenceMap).forEach(([activity1, coActivities]) => {
      Object.entries(coActivities).forEach(([activity2, count]) => {
        if (count >= 1) {
          const linkKey = activity1 < activity2 ? `${activity1}-${activity2}` : `${activity2}-${activity1}`;
          
          // Only add if in top 2 for at least one of the nodes and not already added
          const isInTop2 = (top2Connections[activity1]?.has(activity2) || top2Connections[activity2]?.has(activity1));
          
          if (isInTop2 && !addedLinks.has(linkKey)) {
            addedLinks.add(linkKey);
            links.push({
              source: activity1,
              target: activity2,
              strength: Math.min(count / 3, 1)
            });
          }
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

    const genTime = performance.now() - genStart;
    setGraphData({ nodes, links });
  };

  const getNodeColor = (node: any) => {
    // If a node is grabbed and this node is connected to it, return yellow
    if (grabbedNodeId && connectedNodeIds.includes(node.id)) {
      return '#FFD700'; // Yellow for connected nodes
    }
    
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
    // Zoom to node on click (no console noise)
  }, []);

  const handleNodeDrag = useCallback((node: any) => {
    const nodeId = typeof node === 'string' ? node : node.id;
    
    // Check if this is a new drag (node not currently being dragged)
    if (isDraggingRef.current !== nodeId) {
      // silence debug logs during drag
      
      isDraggingRef.current = nodeId;
      setGrabbedNodeId(nodeId);
      
      
      // Find all connected nodes from filteredGraphData.links (respects subcategory visibility)
      const filteredNodes = graphData.nodes.filter(n => showSubcategories || n.category !== 'subcategory');
      const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
      
      
      const connected: string[] = [];
      
      graphData.links.forEach((link, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        
        // Only consider links between visible nodes
        if (filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId)) {
          if (sourceId === nodeId && !connected.includes(targetId)) {
            
            connected.push(targetId);
          } else if (targetId === nodeId && !connected.includes(sourceId)) {
            
            connected.push(sourceId);
          }
        }
      });
      
      
      setConnectedNodeIds(connected);
      
    }
  }, [graphData.links, graphData.nodes, showSubcategories]);

  const handleNodeDragEnd = useCallback(() => {
    isDraggingRef.current = null;
    setGrabbedNodeId(null);
    setConnectedNodeIds([]);
  }, [grabbedNodeId, connectedNodeIds]);

  const getNodeColorCallback = useCallback((node: any) => {
    return getNodeColor(node);
  }, [grabbedNodeId, connectedNodeIds, driversData]);

  // no-op: avoid ref-based refresh to reduce console noise

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
            Personal Network
          </h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3 text-xs">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-1 px-2 py-1 rounded-md bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20"
              >
                <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Nodes:</span>
                <span className="font-bold text-blue-300">{graphData.nodes.length}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-1 px-2 py-1 rounded-md bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20"
              >
                <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Connections:</span>
                <span className="font-bold text-purple-300">{graphData.links.length}</span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-1 px-2 py-1 rounded-md bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/20"
              >
                <span className="font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Period:</span>
                <span className="font-bold text-green-300">
                  {timeRange === 'daily' ? 'Today' :
                   timeRange === 'weekly' ? 'Last 7 days' :
                   timeRange === 'monthly' ? 'Last 30 days' :
                   'Last 365 days'}
                </span>
              </motion.div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                boxShadow: [
                  "0 0 10px rgba(249, 115, 22, 0.4)",
                  "0 0 20px rgba(249, 115, 22, 0.6)",
                  "0 0 30px rgba(249, 115, 22, 0.8)",
                  "0 0 20px rgba(249, 115, 22, 0.6)",
                  "0 0 10px rgba(249, 115, 22, 0.4)"
                ]
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/15 border-2 border-orange-400/40 text-white transition-all font-medium text-sm shadow-lg"
              onClick={() => setShowSubcategories(v => !v)}
            >
              <span className="font-bold bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">
                {showSubcategories ? 'Hide Subcategories' : 'Show Subcategories'}
              </span>
            </motion.button>
          </div>
        </div>
        
        {/* Force Graph */}
        <div className="absolute inset-0" style={{ top: '80px', bottom: '100px' }}>
          <ForceGraph2D
            graphData={filteredGraphData}
            width={undefined}
            height={undefined}
            nodeCanvasObjectMode={() => 'replace'}
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label || node.id;
              const fontSize = 14 / globalScale;
              
              // Calculate node radius
              const nodeRadius = (node.__size || node.val || 8) / globalScale;
              
              // Determine if this node is connected to the grabbed node (use ref to get latest state)
              const currentGrabbed = stateRef.current.grabbedNodeId;
              const currentConnected = stateRef.current.connectedNodeIds;
              const isConnected = currentGrabbed && currentConnected.includes(node.id);
              
              // silence canvas debug
              
              // Get base color
              let baseColor: string;
              if (isConnected) {
                baseColor = '#FFD700'; // Yellow for connected
              } else if (node.category === 'activity' && driversData) {
                const helpfulActivities = driversData.helpful?.map(d => d.tag) || [];
                const harmfulActivities = driversData.harmful?.map(d => d.tag) || [];
                
                if (helpfulActivities.includes(node.id)) {
                  baseColor = '#00FF88'; // Green for helpful
                } else if (harmfulActivities.includes(node.id)) {
                  baseColor = '#FF6B6B'; // Red for harmful
                } else {
                  baseColor = '#00D4FF'; // Default activity color
                }
              } else {
                const colors: { [key: string]: string } = {
                  'subcategory': '#00E6FF',
                  'favoriteWriters': '#00FF88',
                  'favoriteMusicians': '#FF6B9D',
                  'favoriteSportsFigures': '#FFB800',
                  'favoriteArtists': '#B800FF',
                  'favoritePhilosophers': '#0066FF',
                  'interests': '#FF0080',
                  'outcome': '#FFD700'
                };
                baseColor = colors[node.category] || '#FF6B6B';
              }
              
              // Draw node circle
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI);
              
              // Fill with color (no opacity for yellow to make it stand out)
              if (isConnected) {
                ctx.fillStyle = '#FFD700'; // Bright yellow for connected nodes
              } else {
                // Convert hex to rgba with opacity
                const r = parseInt(baseColor.slice(1, 3), 16);
                const g = parseInt(baseColor.slice(3, 5), 16);
                const b = parseInt(baseColor.slice(5, 7), 16);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
              }
              ctx.fill();
              
              // Add a border for connected nodes
              if (isConnected) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2 / globalScale;
                ctx.stroke();
              }
              
              // Draw text with stroke for visibility; yellow labels for connected nodes
              ctx.font = `bold ${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const labelY = node.y! + nodeRadius + 10;
              ctx.strokeStyle = 'rgba(0,0,0,0.8)';
              ctx.lineWidth = 4 / globalScale;
              ctx.strokeText(label, node.x!, labelY);
              ctx.fillStyle = isConnected ? '#FFD700' : 'white';
              ctx.fillText(label, node.x!, labelY);
            }}
            nodeColor={(node: any) => {
              // Use ref to get latest state (nodeColor might be cached)
              const currentGrabbed = stateRef.current.grabbedNodeId;
              const currentConnected = stateRef.current.connectedNodeIds;
              const isConnected = currentGrabbed && currentConnected.includes(node.id);
              if (isConnected) {
                return '#FFD70066'; // Yellow with opacity for connected nodes
              }
              const color = getNodeColorCallback(node);
              // Convert hex to rgba with opacity
              return color + '66'; // 66 = approximately 40% opacity in hex
            }}
            nodeVal={(node: any) => node.val}
            nodeRelSize={12}
            linkWidth={(link: any) => Math.max(2, link.strength * 4)}
            linkColor={() => 'rgba(255,255,255,0.6)'}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            onNodeClick={handleNodeClick}
            onNodeDrag={handleNodeDrag}
            onNodeDragEnd={handleNodeDragEnd}
            cooldownTicks={100}
            onEngineStop={() => {}}
            enableNodeDrag={true}
            enablePanInteraction={true}
            enableZoomInteraction={true}
            minZoom={0.1}
            maxZoom={10}
          />
        </div>

        {/* Legend */}
        <div className={`absolute bottom-2 left-2 right-2 ${showLegend ? 'bg-white/95 backdrop-blur-sm p-3' : 'p-0'} rounded-lg ${showLegend ? '' : 'pointer-events-none'}`}>
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
