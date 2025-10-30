"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';

interface DSSResult {
  dssScore: number;
  components: {
    learningMomentum: number;
    recoveryIndex: number;
    connectionScore: number;
  };
}

export default function DSSDashboard() {
  const [dssData, setDssData] = useState<DSSResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDSSData();
  }, []);

  const fetchDSSData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's DSS data
      const response = await fetch('/api/dss?userId=dummy-user');
      const data = await response.json();
      
      if (data.success) {
        // Use explicit currentDSS from API to avoid any fallback confusion
        const current = data?.data?.currentDSS ?? data?.data;
        setDssData(current);
      }
    } catch (error) {
      console.error('Error fetching DSS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    if (score >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 7) return 'Excellent';
    if (score >= 5) return 'Good';
    if (score >= 3) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <Card className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-4">Daily Success Score</h3>
        <div className="text-4xl font-bold mb-2">
          <span className={getScoreColor(dssData?.dssScore || 0)}>
            {dssData?.dssScore !== undefined && dssData.dssScore !== null 
              ? dssData.dssScore.toFixed(2) 
              : 'N/A'
            }
          </span>
        </div>
        <p className={`text-sm font-medium ${getScoreColor(dssData?.dssScore || 0)}`}>
          {getScoreLabel(dssData?.dssScore || 0)}
        </p>
        <div className="text-xs text-gray-500 mt-2">
          DSS = 0.5×zLM + 0.3×zRI + 0.2×zCN
        </div>
      </Card>
    </motion.div>
  );
}