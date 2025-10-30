"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import { Droplets } from "lucide-react";

interface PeriodInsightsProps {
  moodEntries: any[];
  userInfo: { gender?: string } | null;
}

// Utility: date only key (UTC) - fixed formatting
function dateKeyUTC(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PeriodInsights({ moodEntries, userInfo }: PeriodInsightsProps) {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertText, setAlertText] = useState<string>("");
  const [showPeriodEndModal, setShowPeriodEndModal] = useState<boolean>(false);
  const [currentPeriodDay, setCurrentPeriodDay] = useState<number>(0);
  const [isCurrentlyOnPeriod, setIsCurrentlyOnPeriod] = useState<boolean>(false);


  const data = useMemo(() => {
    const calcStart = performance.now();
    // Sort newest first
    const entries = [...moodEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Collect period days and daily aggregates
    const byDay: Record<string, { onPeriod: boolean; valence: number[]; stress: number[]; water: number; alcohol: number; activities: string[] }>
      = {};
    for (const e of entries) {
      const k = dateKeyUTC(new Date(e.createdAt));
      if (!byDay[k]) byDay[k] = { onPeriod: false, valence: [], stress: [], water: 0, alcohol: 0, activities: [] };
      byDay[k].onPeriod = byDay[k].onPeriod || !!e.onPeriod;
      byDay[k].valence.push(e.valence ?? 5);
      byDay[k].stress.push(e.stress ?? 5);
      byDay[k].water += e.waterIntake ?? 0;
      byDay[k].alcohol += e.alcohol ?? 0;
      const acts = Array.isArray(e.activities) ? e.activities : (e.activities || []);
      byDay[k].activities.push(...acts);
    }

    const days = Object.keys(byDay).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Identify cycle starts (onPeriod true where previous day not onPeriod)
    // Store both the date key (for local parsing) and UTC Date (for other calculations)
    const cycleStarts: Date[] = [];
    const cycleStartKeys: string[] = [];
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const prev = i > 0 ? days[i - 1] : undefined;
      const todayOn = byDay[d].onPeriod;
      const prevOn = prev ? byDay[prev].onPeriod : false;
      if (todayOn && !prevOn) {
        // Store date key for local date parsing (for consistent day calculation)
        cycleStartKeys.push(d);
        // Also create UTC Date for other calculations
        const [year, month, day] = d.split('-').map(Number);
        const cycleStart = new Date(Date.UTC(year, month - 1, day));
        cycleStarts.push(cycleStart);
      }
    }
    

    // Cycle lengths
    const cycleLengths: number[] = [];
    for (let i = 1; i < cycleStarts.length; i++) {
      const len = Math.round((cycleStarts[i].getTime() - cycleStarts[i - 1].getTime()) / (24 * 3600 * 1000));
      if (len > 15 && len < 60) cycleLengths.push(len);
    }
    const avgCycle = cycleLengths.length ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : null;

    // Last period start - get both the Date and the date key
    const lastStart = cycleStarts[cycleStarts.length - 1];
    const lastStartKey = cycleStartKeys[cycleStartKeys.length - 1];
    
    const today = new Date();
    const daysSinceLast = lastStart ? Math.round((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - Date.UTC(lastStart.getUTCFullYear(), lastStart.getUTCMonth(), lastStart.getUTCDate())) / (24 * 3600 * 1000)) : null;
    
    const predictedNextStart = lastStart && avgCycle ? new Date(Date.UTC(lastStart.getUTCFullYear(), lastStart.getUTCMonth(), lastStart.getUTCDate()) + avgCycle * 24 * 3600 * 1000) : null;

    // Build small series for chart: last 90 days onPeriod flag
    const series = days.slice(-90).map((k) => ({ date: k, on: byDay[k].onPeriod }));

    // Correlate monthly stress/valence with cycle variability
    let stressAvg: number | null = 0; let valenceAvg: number | null = 0; let n = 0;
    for (const k of days.slice(-30)) {
      const day = byDay[k];
      const s = day.stress.length ? day.stress.reduce((a, b) => a + b, 0) / day.stress.length : 5;
      const v = day.valence.length ? day.valence.reduce((a, b) => a + b, 0) / day.valence.length : 5;
      stressAvg += s; valenceAvg += v; n++;
    }
    stressAvg = n ? Number((stressAvg / n).toFixed(1)) : null;
    valenceAvg = n ? Number((valenceAvg / n).toFixed(1)) : null;

    // Detect current period status (day-level and inferred if within menstrual window)
    const mostRecentEntry = entries[0];
    const menstrualDays = 5; // used for chart phasing only
    let currentlyOnPeriod = false;
    let currentDay = 0;

    // Determine lastStart from cycleStarts (already computed above)
    if (lastStart) {
      // If any entry today has onPeriod=true, it's active
      const todayKey = dateKeyUTC(new Date());
      const anyTodayOn = byDay[todayKey]?.onPeriod === true;
      if (anyTodayOn) {
        currentlyOnPeriod = true;
      } else {
        // Otherwise, consider ON until explicitly ended (strictly after last start)
        // Find the most recent start entry (onPeriod === true)
        const lastStartEntry = entries.find(e => e.onPeriod === true);
        if (lastStartEntry) {
          const lastStartTime = new Date(lastStartEntry.createdAt).getTime();
          // Look for an explicit end strictly AFTER the last start
          const endAfterStart = entries.find(e => new Date(e.createdAt).getTime() > lastStartTime && e.onPeriod === false);
          currentlyOnPeriod = !endAfterStart;
        } else {
          currentlyOnPeriod = false;
        }
      }

      // Compute current day relative to lastStart if active
      // Use local dates consistently to match new entry page calculation
      if (currentlyOnPeriod && lastStartKey) {
        const today = new Date();
        // Parse the date key string directly as a local date (YYYY-MM-DD format)
        // This matches how the new entry page handles dates for consistency
        const [year, month, day] = lastStartKey.split('-').map(Number);
        const periodStart = new Date(year, month - 1, day); // Local midnight (month is 0-indexed)
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffTime = todayDateOnly.getTime() - periodStart.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        currentDay = Math.max(1, diffDays + 1);
      }
    }

    // Simple heuristic alerts
    const todayKey = dateKeyUTC(new Date());
    const todayWater = byDay[todayKey]?.water ?? null;
    const todayAlcohol = byDay[todayKey]?.alcohol ?? 0;
    const preWindow = predictedNextStart ? Math.abs(Math.round((Date.UTC(predictedNextStart.getUTCFullYear(), predictedNextStart.getUTCMonth(), predictedNextStart.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / (24 * 3600 * 1000))) : null;

    const calcTime = performance.now() - calcStart;
    // silent calc timing
    return { 
      series, 
      avgCycle, 
      lastStart, 
      predictedNextStart, 
      daysSinceLast, 
      todayWater, 
      todayAlcohol, 
      stressAvg, 
      valenceAvg,
      currentlyOnPeriod,
      currentDay,
      mostRecentEntry
    };
  }, [moodEntries]);

  // Update current period state
  useEffect(() => {
    setIsCurrentlyOnPeriod(data.currentlyOnPeriod);
    setCurrentPeriodDay(data.currentDay);
  }, [data.currentlyOnPeriod, data.currentDay]);

  // One-per-day alert logic (localStorage gate)
  useEffect(() => {
    if (!userInfo || userInfo.gender !== 'female') return;
    const gateKey = `period-alert-${dateKeyUTC(new Date())}`;
    if (localStorage.getItem(gateKey) === 'seen') return;

    // Decide alert message
    const msgs: string[] = [];
    
    // Current period alerts
    if (data.currentlyOnPeriod) {
      if (data.currentDay >= 7) {
        msgs.push(`Day ${data.currentDay} - Consider tracking flow intensity.`);
      }
      if (data.todayWater < 6) {
        msgs.push(`Hydration is crucial during your period - aim for 8+ glasses.`);
      }
      if (data.todayAlcohol > 0) {
        msgs.push(`Alcohol can worsen cramps - consider herbal tea instead.`);
      }
    } else {
      // Pre-period alerts
      if (data.predictedNextStart) {
        const daysUntil = Math.round((Date.UTC(data.predictedNextStart.getUTCFullYear(), data.predictedNextStart.getUTCMonth(), data.predictedNextStart.getUTCDate()) - Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())) / (24 * 3600 * 1000));
        if (daysUntil <= 3 && daysUntil >= 0) {
          msgs.push(`Pre-period in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — prep gentle care.`);
        }
        if (daysUntil === 0) {
          msgs.push(`Your period is predicted to start today!`);
        }
      }
      
      // General health alerts
      if (data.todayAlcohol > 0) msgs.push(`Alcohol today: ${data.todayAlcohol}. Hydrate to reduce cramps risk.`);
      if ((data.todayWater ?? 0) < 4) msgs.push(`Hydration is low today — drink water to support wellbeing.`);
    }

    if (msgs.length) {
      setAlertText(msgs.join(' '));
      setShowAlert(true);
      localStorage.setItem(gateKey, 'seen');
    }
  }, [data, userInfo]);

  // Auto-dismiss hydration alert if water increases (reactive)
  useEffect(() => {
    if (data.todayWater >= 6 && showAlert && /Hydration is low/.test(alertText)) {
      setShowAlert(false);
    }
  }, [data.todayWater, showAlert, alertText]);

  if (!userInfo || userInfo.gender !== 'female') return null;

  return (
    <Card className="p-6 bg-slate-800/40 backdrop-blur-sm border border-pink-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center">
          <Droplets className="w-6 h-6 mr-2 text-pink-500" />
          Menstrual Cycle
        </h3>
        <div className="text-sm text-slate-300">
          Avg cycle: <span className="font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{data.avgCycle ? `${data.avgCycle} days` : '—'}</span>
        </div>
      </div>

      {/* Circular Cycle Visualization */}
      <div className="mb-6 flex flex-col items-center">
        <motion.div 
          className="relative w-80 h-80"
          initial={{ y: 0, scale: 1 }}
          animate={{ 
            y: [-8, 8, -8],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* SVG Circular Ring */}
          <svg width="320" height="320" className="transform -rotate-90 drop-shadow-2xl">
            <defs>
              {/* Futuristic linear gradients with neon glow */}
              <linearGradient id="periodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="100%" stopColor="#990000" />
              </linearGradient>
              
              <linearGradient id="follicularGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fce7f3" />
                <stop offset="100%" stopColor="#fbcfe8" />
              </linearGradient>
              
              <linearGradient id="ovularGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              
              <linearGradient id="lutealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              
              {/* Pink background gradient */}
              <radialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#db2777" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#be185d" stopOpacity="0.7" />
              </radialGradient>
              
              {/* Neon glow effect */}
              <filter id="neonGlow" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Subtle glow */}
              <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* High-quality shadow filter */}
              <filter id="dropShadow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background track circle with subtle texture */}
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="#0f172a"
              strokeWidth="3"
              className="opacity-40"
            />
            
            {/* Subtle inner shadow circle */}
            <circle
              cx="160"
              cy="160"
              r="136"
              fill="none"
              stroke="url(#periodGradient)"
              strokeWidth="1"
              className="opacity-5"
            />
            
            {/* Phase markers - Tick marks at phase transitions */}
            {(() => {
              const cycleLength = data.avgCycle || 28;
              const markers = [];
              const numMarkers = 8;
              
              for (let i = 0; i <= numMarkers; i++) {
                const angle = (i / numMarkers) * 360;
                const x1 = 160 + 135 * Math.cos((angle - 90) * Math.PI / 180);
                const y1 = 160 + 135 * Math.sin((angle - 90) * Math.PI / 180);
                const x2 = 160 + 140 * Math.cos((angle - 90) * Math.PI / 180);
                const y2 = 160 + 140 * Math.sin((angle - 90) * Math.PI / 180);
                
                markers.push(
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#64748b"
                    strokeWidth="2"
                    className="opacity-30"
                  />
                );
              }
              return markers;
            })()}
            
            {/* Dynamic phase calculations based on avgCycle */}
            {(() => {
              const cycleLength = data.avgCycle || 28;
              const r = 140;
              const innerR = 100; // Inner radius for hollow circle
              
              // Phase durations (in days)
              const menstrualDays = 5;
              const follicularDays = cycleLength > 20 ? Math.floor((cycleLength - 14) / 2) : 8;
              const ovulationDays = 2;
              const lutealDays = cycleLength - menstrualDays - follicularDays - ovulationDays;
              
              // Start angles for each phase (in degrees)
              const menstrualStartAngle = -90; // Start at 12 o'clock
              const menstrualEndAngle = -90 + (menstrualDays / cycleLength) * 360;
              const follicularStartAngle = menstrualEndAngle;
              const follicularEndAngle = follicularStartAngle + (follicularDays / cycleLength) * 360;
              const ovulationStartAngle = follicularEndAngle;
              const ovulationEndAngle = ovulationStartAngle + (ovulationDays / cycleLength) * 360;
              const lutealStartAngle = ovulationEndAngle;
              const lutealEndAngle = lutealStartAngle + (lutealDays / cycleLength) * 360;
              
              // Helper function to draw a filled arc segment
              const drawArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;
                
                const x1 = 160 + outerR * Math.cos(startAngleRad);
                const y1 = 160 + outerR * Math.sin(startAngleRad);
                const x2 = 160 + outerR * Math.cos(endAngleRad);
                const y2 = 160 + outerR * Math.sin(endAngleRad);
                
                const x3 = 160 + innerR * Math.cos(endAngleRad);
                const y3 = 160 + innerR * Math.sin(endAngleRad);
                const x4 = 160 + innerR * Math.cos(startAngleRad);
                const y4 = 160 + innerR * Math.sin(startAngleRad);
                
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                
                return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
              };
              
              return (
                <>
                  {/* Menstrual phase - Filled segment */}
                  <path
                    d={drawArc(menstrualStartAngle, menstrualEndAngle, r, innerR)}
                    fill="url(#periodGradient)"
                    filter="url(#neonGlow)"
                    opacity={isCurrentlyOnPeriod ? 1 : 0.9}
                    className="transition-all duration-300"
                  >
                    {isCurrentlyOnPeriod && (
                      <>
                        <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
                      </>
                    )}
                  </path>
                  
                  {/* Follicular phase - Filled segment */}
                  <path
                    d={drawArc(follicularStartAngle, follicularEndAngle, r, innerR)}
                    fill="url(#follicularGradient)"
                    filter="url(#neonGlow)"
                    opacity="0.9"
                  />
                  
                  {/* Ovulation phase - Filled segment */}
                  <path
                    d={drawArc(ovulationStartAngle, ovulationEndAngle, r, innerR)}
                    fill="url(#ovularGradient)"
                    filter="url(#neonGlow)"
                    opacity="0.9"
                  />
                </>
              );
            })()}
            
            {/* Luteal phase - Filled segment */}
            {(() => {
              const cycleLength = data.avgCycle || 28;
              const r = 140;
              const innerR = 100;
              
              const menstrualDays = 5;
              const follicularDays = cycleLength > 20 ? Math.floor((cycleLength - 14) / 2) : 8;
              const ovulationDays = 2;
              const lutealDays = cycleLength - menstrualDays - follicularDays - ovulationDays;
              
              const lutealStartAngle = -90 + ((menstrualDays + follicularDays + ovulationDays) / cycleLength) * 360;
              const lutealEndAngle = -90 + 360;
              
              const drawArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;
                
                const x1 = 160 + outerR * Math.cos(startAngleRad);
                const y1 = 160 + outerR * Math.sin(startAngleRad);
                const x2 = 160 + outerR * Math.cos(endAngleRad);
                const y2 = 160 + outerR * Math.sin(endAngleRad);
                
                const x3 = 160 + innerR * Math.cos(endAngleRad);
                const y3 = 160 + innerR * Math.sin(endAngleRad);
                const x4 = 160 + innerR * Math.cos(startAngleRad);
                const y4 = 160 + innerR * Math.sin(startAngleRad);
                
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                
                return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
              };
              
              return (
                <path
                  d={drawArc(lutealStartAngle, lutealEndAngle, r, innerR)}
                  fill="url(#lutealGradient)"
                  filter="url(#neonGlow)"
                  opacity="0.9"
                />
              );
            })()}
            
            {/* Current position indicator - pulsing white dot */}
            {isCurrentlyOnPeriod && currentPeriodDay > 0 && (() => {
              const cycleLength = data.avgCycle || 28;
              const menstrualDays = 5;
              const r = 140;
              const innerR = 100;
              
              // Percent through menstrual phase (0 to 1)
              const percentThroughMenstrual = (currentPeriodDay - 1) / (menstrualDays - 1);
              
              // Calculate angle within menstrual phase
              const menstrualStartAngle = -90;
              const menstrualEndAngle = -90 + (menstrualDays / cycleLength) * 360;
              const menstrualAngleRange = menstrualEndAngle - menstrualStartAngle;
              
              // Angle based on progress (in degrees)
              const angleFromTop = menstrualStartAngle + (percentThroughMenstrual * menstrualAngleRange);
              
              // Convert to radians and calculate position at center of curves (between inner and outer)
              const angleRad = (angleFromTop * Math.PI) / 180;
              const centerRadius = 120; // Center of the curve segments
              const cx = 160 + centerRadius * Math.cos(angleRad);
              const cy = 160 + centerRadius * Math.sin(angleRad);
              
              return (
                <foreignObject x={cx - 24} y={cy - 24} width="48" height="48">
                  <div className="flex items-center justify-center w-full h-full">
                    <motion.span
                      className="text-4xl"
                      initial={{ scale: 1, rotate: 90 }}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [90, 90, 90]
                      }}
                      transition={{ 
                        scale: { duration: 1, repeat: Infinity },
                        rotate: { duration: 0 }
                      }}
                    >
                      🦋
                    </motion.span>
                  </div>
                </foreignObject>
              );
            })()}
          </svg>
          
          {/* Center Content - Professional Design */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isCurrentlyOnPeriod ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-6xl font-black bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent mb-2 tracking-tighter drop-shadow-2xl">
                  {currentPeriodDay}
                </div>
                <div className="text-xs text-slate-400 font-light uppercase tracking-[0.15em] mb-3">
                  Day <span className="font-semibold text-slate-300">•</span> of ~<span className="font-bold text-slate-200">5 days</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPeriodEndModal(true)}
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(244, 63, 94, 0.5)",
                      "0 0 30px rgba(244, 63, 94, 0.8)",
                      "0 0 20px rgba(244, 63, 94, 0.5)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 rounded-full hover:from-rose-400 hover:to-pink-500 transition-all shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40 border border-rose-400/30"
                >
                  End Period
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center"
              >
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Next Period
                </h3>
                {data.predictedNextStart ? (
                  <>
                    <div className="text-4xl font-black bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent mb-1 tracking-tight">
                      {data.predictedNextStart && data.predictedNextStart.getTime() > new Date().getTime() ? Math.round((data.predictedNextStart.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    </div>
                    <div className="text-sm text-slate-400 font-medium mt-1">
                      days • <span className="text-slate-300 font-semibold">
                        {String(data.predictedNextStart.getUTCMonth() + 1).padStart(2, '0')}/{String(data.predictedNextStart.getUTCDate()).padStart(2, '0')}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xl text-slate-400 font-medium">Tracking cycle</div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Phase Legend */}
      <div className="grid grid-cols-4 gap-2 text-center mt-6">
        {/* Menstrual */}
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-red-500/20 hover:border-red-400/40 transition-all duration-300"
        >
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 rounded-full shadow-lg bg-red-500" />
            <span className="text-xs font-bold text-white">Menstrual</span>
          </div>
        </motion.div>

        {/* Follicular */}
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-pink-400/20 hover:border-pink-400/40 transition-all duration-300"
        >
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 rounded-full shadow-lg bg-pink-400" />
            <span className="text-xs font-bold text-white">Follicular</span>
          </div>
        </motion.div>

        {/* Ovulation */}
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300"
        >
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 rounded-full shadow-lg bg-cyan-500" />
            <span className="text-xs font-bold text-white">Ovular</span>
          </div>
        </motion.div>

        {/* Luteal */}
        <motion.div
          whileHover={{ scale: 1.05, y: -2 }}
          className="space-y-1 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300"
        >
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 rounded-full shadow-lg bg-orange-500" />
            <span className="text-xs font-bold text-white">Luteal</span>
          </div>
        </motion.div>
      </div>

      {showAlert && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-lg bg-gradient-to-r from-pink-900/60 to-rose-900/60 border-2 border-pink-400 text-pink-200 flex items-start justify-between shadow-2xl relative overflow-hidden"
          style={{
            boxShadow: '0 0 20px rgba(244, 63, 94, 0.5), 0 0 40px rgba(244, 63, 94, 0.3)',
            animation: 'pulse-glow 2s ease-in-out infinite'
          }}
        >
          {/* Pulsing background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-rose-500/20 animate-pulse" />
          
          <style jsx>{`
            @keyframes pulse-glow {
              0%, 100% {
                box-shadow: 0 0 20px rgba(244, 63, 94, 0.5), 0 0 40px rgba(244, 63, 94, 0.3), 0 0 60px rgba(244, 63, 94, 0.1);
              }
              50% {
                box-shadow: 0 0 30px rgba(244, 63, 94, 0.7), 0 0 60px rgba(244, 63, 94, 0.5), 0 0 90px rgba(244, 63, 94, 0.3);
              }
            }
          `}</style>
          
          <div className="mr-3 font-medium relative z-10 text-base">{alertText}</div>
          <button 
            onClick={() => setShowAlert(false)} 
            className="text-sm font-semibold text-pink-300 hover:text-pink-100 underline transition-colors duration-200 relative z-10"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Period End Confirmation Modal */}
      {showPeriodEndModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-400/30 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                End Period Cycle
              </h3>
              <button
                onClick={() => setShowPeriodEndModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                Are you sure you want to end your current period cycle? This will mark Day {currentPeriodDay} as your last day.
              </p>
              <div className="p-3 bg-pink-900/20 border border-pink-500/30 rounded-lg">
                <p className="text-pink-200 text-sm">
                  💡 <strong>Tip:</strong> You can always start a new cycle later if needed.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPeriodEndModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // End the current period by updating the most recent mood entry
                    const response = await fetch('/api/mood-entries', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        id: data.mostRecentEntry?.id,
                        onPeriod: false,
                        periodDay: null
                      }),
                    });
                    
                    if (response.ok) {
                      setShowPeriodEndModal(false);
                      // Refresh the page to update data
                      window.location.reload();
                    } else {
                      console.error('Failed to end period');
                    }
                  } catch (error) {
                    console.error('Error ending period:', error);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500/20 text-red-200 border border-red-400/50 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                End Period
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}


