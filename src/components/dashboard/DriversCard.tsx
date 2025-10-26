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
      <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-orange-500/20">
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 flex items-center"
        >
          <Target className="w-6 h-6 mr-2 text-orange-500" />
          Activity Drivers
        </motion.h3>

        {/* AI Insights Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 pt-4 border-t border-slate-600/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Brain className="w-5 h-5 text-purple-500 mr-2" />
              <h4 className="text-lg font-semibold text-purple-400">AI Insights</h4>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={getAiInsights}
              disabled={aiLoading}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-300 mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isCached ? 'Refresh AI Analysis' : 'Get AI Analysis'}
                </div>
              )}
            </motion.button>
          </div>

          {showAiInsights && aiInsights && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20"
            >
              {/* Cache Status Indicator */}
              {isCached && (
                <div className="flex items-center mb-3 text-xs text-purple-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Cached analysis • Last updated: {cacheTimestamp ? new Date(cacheTimestamp).toLocaleString() : 'Unknown'}</span>
                </div>
              )}
              
              <div 
                className="prose prose-sm max-w-none text-slate-300 prose-headings:text-purple-400 prose-strong:text-white prose-ul:text-slate-300 prose-li:text-slate-300"
                dangerouslySetInnerHTML={{ __html: aiInsights }}
              />
            </motion.div>
          )}

          <p className="text-xs text-slate-400 text-center mt-4">
            Analysis based on last 4 weeks • Updated {new Date(data.lastCalculated).toLocaleDateString()}
          </p>
        </motion.div>
      </Card>

      {/* Activity Drivers Chart */}
      <ActivityDriversChart 
        driversData={data} 
        userInfo={userInfo}
      />
    </motion.div>
  );
}
