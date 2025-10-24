"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, RefreshCw } from "lucide-react";

interface ProTipsCardProps {
  proTip: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function ProTipsCard({ proTip, onRefresh, loading = false }: ProTipsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(147, 51, 234, 0.3)" 
            : "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(147, 51, 234, 0.2)"
        }}
        transition={{ duration: 0.3 }}
        className="relative bg-gradient-to-br from-slate-800/90 via-purple-900/80 to-blue-900/90 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-2xl overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(147,51,234,0.1)_25%,rgba(147,51,234,0.1)_26%,transparent_27%,transparent_74%,rgba(147,51,234,0.1)_75%,rgba(147,51,234,0.1)_76%,transparent_77%)] bg-[length:20px_20px]"></div>
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"
            >
              <Lightbulb className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-purple-300">Pro Tips</h3>
              <p className="text-xs text-slate-400">Goal-oriented coaching</p>
            </div>
          </div>
          
          {onRefresh && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={loading}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div className="relative">
          {loading ? (
            <div className="space-y-3">
              <div className="h-4 bg-slate-700/50 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-slate-700/50 rounded animate-pulse w-1/2"></div>
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-slate-200 leading-relaxed text-sm"
            >
              {proTip || "Your personalized coaching tip will appear here."}
            </motion.p>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-2 left-2 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-lg"></div>
      </motion.div>
    </motion.div>
  );
}