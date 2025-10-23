'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Coffee, Moon, BookOpen, Brain, Zap } from 'lucide-react';

interface ProTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'sleep' | 'productivity' | 'study' | 'wellness' | 'energy';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface ProTipsCardProps {
  powerHoursData?: any;
  userInfo?: any;
  loading?: boolean;
}

export default function ProTipsCard({ powerHoursData, userInfo, loading }: ProTipsCardProps) {
  if (loading) {
    return (
      <div className="p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-600/50 rounded-2xl">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded mb-4 w-32"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Generate pro tips based on power hours data and user patterns
  const generateProTips = (): ProTip[] => {
    const tips: ProTip[] = [];

    if (!powerHoursData?.data || powerHoursData.data.length === 0) {
      return [
        {
          id: 'start-tracking',
          title: 'Start Tracking Your Activities',
          description: 'Begin logging your daily activities to unlock personalized insights and power hour recommendations.',
          icon: '📊',
          category: 'productivity',
          priority: 'high',
          reasoning: 'No data available yet to provide personalized tips.'
        }
      ];
    }

    const data = powerHoursData.data;
    const insights = powerHoursData.insights;

    // Analyze power hours patterns
    const nightHours = data.filter((item: any) => item.hour >= 22 || item.hour <= 6);
    const morningHours = data.filter((item: any) => item.hour >= 6 && item.hour <= 12);
    const afternoonHours = data.filter((item: any) => item.hour >= 12 && item.hour <= 18);
    const eveningHours = data.filter((item: any) => item.hour >= 18 && item.hour <= 22);

    const nightProductivity = nightHours.reduce((sum: number, item: any) => sum + item.productivity, 0) / nightHours.length;
    const morningProductivity = morningHours.reduce((sum: number, item: any) => sum + item.productivity, 0) / morningHours.length;
    const afternoonProductivity = afternoonHours.reduce((sum: number, item: any) => sum + item.productivity, 0) / afternoonHours.length;
    const eveningProductivity = eveningHours.reduce((sum: number, item: any) => sum + item.productivity, 0) / eveningHours.length;

    // Tip 1: Sleep debt and caffeine
    if (nightProductivity > 0.3) {
      tips.push({
        id: 'sleep-debt-caffeine',
        title: 'Avoid Caffeine Before Sleep',
        description: 'You\'re most productive at night. Avoid caffeine after 6 PM to maintain healthy sleep patterns.',
        icon: '☕',
        category: 'sleep',
        priority: 'high',
        reasoning: 'High night productivity detected - maintaining sleep quality is crucial.'
      });
    }

    // Tip 2: Study schedule optimization based on LM activities
    if (insights?.mostProductiveHours?.length > 0) {
      const bestHours = insights.mostProductiveHours.slice(0, 2);
      const hourRanges = bestHours.map((h: any) => `${h.hour}:00`).join(' and ');
      
      // Check if user has LM-focused activities
      const hasLMActivities = powerHoursData?.activityAnalysis?.lmPatterns?.size > 0;
      const lmActivities = Array.from(powerHoursData?.activityAnalysis?.lmPatterns?.keys() || []);
      
      if (hasLMActivities && lmActivities.length > 0) {
        tips.push({
          id: 'study-schedule',
          title: 'Optimize Your Learning Schedule',
          description: `Schedule your ${lmActivities.join(', ')} activities during ${hourRanges} - your peak learning hours.`,
          icon: '📚',
          category: 'study',
          priority: 'high',
          reasoning: `Based on your ${lmActivities.join(', ')} patterns, you're most productive at ${hourRanges}.`
        });
      } else {
        tips.push({
          id: 'study-schedule',
          title: 'Optimize Your Study Schedule',
          description: `Schedule your most important tasks during ${hourRanges} - your peak productivity hours.`,
          icon: '📚',
          category: 'study',
          priority: 'high',
          reasoning: `Based on your power hours analysis, you're most productive at ${hourRanges}.`
        });
      }
    }

    // Tip 3: Morning vs evening productivity
    if (morningProductivity > eveningProductivity && morningProductivity > 0.2) {
      tips.push({
        id: 'morning-focus',
        title: 'Tackle Hard Tasks in the Morning',
        description: 'You\'re most productive in the morning. Schedule your most challenging work before noon.',
        icon: '🌅',
        category: 'productivity',
        priority: 'medium',
        reasoning: 'Morning productivity is higher than evening productivity.'
      });
    } else if (eveningProductivity > morningProductivity && eveningProductivity > 0.2) {
      tips.push({
        id: 'evening-focus',
        title: 'Save Deep Work for Evening',
        description: 'You\'re most productive in the evening. Schedule your deep work sessions after 6 PM.',
        icon: '🌙',
        category: 'productivity',
        priority: 'medium',
        reasoning: 'Evening productivity is higher than morning productivity.'
      });
    }

    // Tip 4: Energy management
    if (afternoonProductivity < 0.1) {
      tips.push({
        id: 'afternoon-break',
        title: 'Take Strategic Afternoon Breaks',
        description: 'Your productivity dips in the afternoon. Use this time for lighter tasks or breaks.',
        icon: '🧘',
        category: 'wellness',
        priority: 'medium',
        reasoning: 'Low afternoon productivity detected - optimize for energy management.'
      });
    }

    // Tip 5: Activity-specific recommendations
    if (powerHoursData?.activityAnalysis?.lmPatterns?.size > 0) {
      const lmPatterns = powerHoursData.activityAnalysis.lmPatterns;
      const topActivity = Array.from(lmPatterns.entries())
        .sort((a, b) => b[1].frequency - a[1].frequency)[0];
      
      if (topActivity) {
        const [activity, data] = topActivity;
        const peakHours = data.peakHours.map(h => `${h}:00`).join(', ');
        
        tips.push({
          id: 'activity-pattern',
          title: `Leverage Your ${activity.charAt(0).toUpperCase() + activity.slice(1)} Pattern`,
          description: `You do ${activity} most during ${peakHours}. Use these hours for your most important ${activity} tasks.`,
          icon: '🎯',
          category: 'productivity',
          priority: 'medium',
          reasoning: `Your ${activity} activity peaks at ${peakHours} - leverage this natural rhythm.`
        });
      }
    }

    // Tip 6: Weekend vs weekday patterns
    if (insights?.bestDay) {
      const bestDay = insights.bestDay.day;
      if (bestDay === 'Sat' || bestDay === 'Sun') {
        tips.push({
          id: 'weekend-productivity',
          title: 'Leverage Weekend Productivity',
          description: `You're most productive on ${bestDay}. Consider scheduling important projects for weekends.`,
          icon: '📅',
          category: 'productivity',
          priority: 'low',
          reasoning: `Best productivity day is ${bestDay} - unusual but valuable insight.`
        });
      }
    }

    return tips.slice(0, 4); // Limit to 4 tips
  };

  const proTips = generateProTips();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low': return 'border-green-500/50 bg-green-500/10';
      default: return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sleep': return <Moon className="w-5 h-5" />;
      case 'productivity': return <Zap className="w-5 h-5" />;
      case 'study': return <BookOpen className="w-5 h-5" />;
      case 'wellness': return <Brain className="w-5 h-5" />;
      case 'energy': return <Coffee className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 bg-slate-800/40 backdrop-blur-xl border border-slate-600/50 rounded-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h3
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent flex items-center"
        >
          <span className="text-3xl mr-3">💡</span>
          Pro Tips
        </motion.h3>
        <div className="text-sm text-slate-400">
          Personalized recommendations
        </div>
      </div>

      <div className="space-y-4">
        {proTips.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`p-4 rounded-xl border ${getPriorityColor(tip.priority)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                {getCategoryIcon(tip.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-slate-200">{tip.title}</h4>
                  <span className="text-2xl">{tip.icon}</span>
                </div>
                <p className="text-slate-300 mb-2">{tip.description}</p>
                <div className="text-xs text-slate-400 italic">
                  💭 {tip.reasoning}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {proTips.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-400">Start tracking your activities to get personalized pro tips!</p>
        </div>
      )}
    </motion.div>
  );
}
