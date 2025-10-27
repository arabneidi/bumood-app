'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import ActivityDriversChart from './ActivityDriversChart';
import { TrendingUp, TrendingDown, Target, Zap, Brain, Sparkles } from 'lucide-react';

interface DriverResult {
  tag: string;
  occurrences: number;
  presentDays: number;
  absentDays: number;
  dssEffect: number;
  mcEffect: number;
  overallEffect: number;
  isHelpful: boolean;
}

interface DriversAnalysis {
  helpful: DriverResult[];
  harmful: DriverResult[];
  lastCalculated: Date;
}

interface DriversCardProps {
  data: DriversAnalysis | null;
  loading: boolean;
  userInfo?: any;
}

export default function DriversCard({ data, loading, userInfo }: DriversCardProps) {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);

  const getAiInsights = async () => {
    if (!data) return;
    
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driversData: data,
          userInfo: userInfo,
          timeRange: '4 weeks'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setAiInsights(result.aiInsights);
        setIsCached(result.isCached || false);
        setCacheTimestamp(result.cacheTimestamp || null);
        setShowAiInsights(true);
      }
    } catch (error) {
      console.error('Error getting AI insights:', error);
    } finally {
      setAiLoading(false);
    }
  };
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-orange-500/20">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!data || (data.helpful.length === 0 && data.harmful.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-orange-500/20">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4 flex items-center"
          >
            <Target className="w-6 h-6 mr-2 text-orange-500" />
            Activity Drivers
          </motion.h3>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-slate-300">
              Not enough data to analyze activity drivers yet. 
              <br />
              Add more mood entries with tags to see which activities help or hurt your performance.
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      {/* Activity Drivers Chart */}
      <ActivityDriversChart 
        driversData={data} 
        userInfo={userInfo}
        aiInsights={aiInsights}
        showAiInsights={showAiInsights}
        aiLoading={aiLoading}
        isCached={isCached}
        cacheTimestamp={cacheTimestamp}
        onGetAiInsights={getAiInsights}
      />
    </motion.div>
  );
}
