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
    const cycleStarts: Date[] = [];
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const prev = i > 0 ? days[i - 1] : undefined;
      const todayOn = byDay[d].onPeriod;
      const prevOn = prev ? byDay[prev].onPeriod : false;
      if (todayOn && !prevOn) {
        // Fix: Create date in UTC to avoid timezone shift
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

    // Last period start
    const lastStart = cycleStarts[cycleStarts.length - 1];
    
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

    // Detect current period status
    const mostRecentEntry = entries[0];
    const currentlyOnPeriod = mostRecentEntry && mostRecentEntry.onPeriod === true;
    const currentDay = currentlyOnPeriod ? (mostRecentEntry.periodDay || 1) : 0;

    // Simple heuristic alerts
    const todayKey = dateKeyUTC(new Date());
    const todayWater = byDay[todayKey]?.water ?? null;
    const todayAlcohol = byDay[todayKey]?.alcohol ?? 0;
    const preWindow = predictedNextStart ? Math.abs(Math.round((Date.UTC(predictedNextStart.getUTCFullYear(), predictedNextStart.getUTCMonth(), predictedNextStart.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / (24 * 3600 * 1000))) : null;

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
          Period Insights
        </h3>
        <div className="text-sm text-slate-300">
          Avg cycle: <span className="font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{data.avgCycle ? `${data.avgCycle} days` : '—'}</span>
        </div>
      </div>

      {/* Circular Cycle Visualization */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative w-80 h-80">
          {/* SVG Circular Ring */}
          <svg width="320" height="320" className="transform -rotate-90">
            <defs>
              {/* Radial gradients for depth */}
              <radialGradient id="periodGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="70%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </radialGradient>
              
              <radialGradient id="follicularGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#fdf2f8" />
                <stop offset="50%" stopColor="#f9a8d4" />
                <stop offset="100%" stopColor="#ec4899" />
              </radialGradient>
              
              <radialGradient id="ovularGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#5eead4" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#075985" />
              </radialGradient>
              
              <radialGradient id="lutealGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#9a3412" />
              </radialGradient>
              
              {/* Premium glow for active phase */}
              <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Soft glow for all phases */}
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Shadow filter for depth */}
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {/* Background circle with inner glow */}
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="#1e293b"
              strokeWidth="12"
              className="opacity-30"
            />
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="#334155"
              strokeWidth="8"
              className="opacity-40"
            />
            
            {/* Dynamic phase calculations based on avgCycle */}
            {(() => {
              const cycleLength = data.avgCycle || 28; // Default to 28 if no data
              const circumference = 2 * Math.PI * 140; // r=140
              
              // Phase durations (in days)
              const menstrualDays = 5;
              const follicularDays = cycleLength > 20 ? Math.floor((cycleLength - 14) / 2) : 8; // Dynamic follicular phase
              const ovulationDays = 2;
              const lutealDays = cycleLength - menstrualDays - follicularDays - ovulationDays;
              
              // Stroke dash calculations
              const menstrualDash = (menstrualDays / cycleLength) * circumference;
              const follicularDash = (follicularDays / cycleLength) * circumference;
              const ovulationDash = (ovulationDays / cycleLength) * circumference;
              const lutealDash = (lutealDays / cycleLength) * circumference;
              
              return (
                <>
                  {/* Period phase (Menstrual) - Red with premium styling */}
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    fill="none"
                    stroke="url(#periodGradient)"
                    strokeWidth={isCurrentlyOnPeriod ? "16" : "12"}
                    strokeDasharray={`${menstrualDash} ${circumference}`}
                    strokeDashoffset="0"
                    filter={isCurrentlyOnPeriod ? "url(#glow)" : "url(#softGlow)"}
                    strokeLinecap="round"
                    opacity={isCurrentlyOnPeriod ? "1" : "0.7"}
                  >
                    {isCurrentlyOnPeriod && (
                      <>
                        <animate attributeName="stroke-width" values="16;18;16" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.9;1" dur="2s" repeatCount="indefinite" />
                      </>
                    )}
                  </circle>
                  
                  {/* Follicular phase - Pink with depth */}
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    fill="none"
                    stroke="url(#follicularGradient)"
                    strokeWidth="12"
                    strokeDasharray={`${follicularDash} ${circumference}`}
                    strokeDashoffset={`-${menstrualDash}`}
                    filter="url(#softGlow)"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  
                  {/* Ovulation phase - Cyan with depth */}
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    fill="none"
                    stroke="url(#ovularGradient)"
                    strokeWidth="12"
                    strokeDasharray={`${ovulationDash} ${circumference}`}
                    strokeDashoffset={`-${menstrualDash + follicularDash}`}
                    filter="url(#softGlow)"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </>
              );
            })()}
            
            {/* Luteal phase - Orange (calculated dynamically) */}
            {(() => {
              const cycleLength = data.avgCycle || 28;
              const circumference = 2 * Math.PI * 140;
              const menstrualDays = 5;
              const follicularDays = cycleLength > 20 ? Math.floor((cycleLength - 14) / 2) : 8;
              const ovulationDays = 2;
              const menstrualDash = (menstrualDays / cycleLength) * circumference;
              const follicularDash = (follicularDays / cycleLength) * circumference;
              const ovulationDash = (ovulationDays / cycleLength) * circumference;
              const lutealDash = circumference - menstrualDash - follicularDash - ovulationDash;
              
              return (
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="none"
                  stroke="url(#lutealGradient)"
                  strokeWidth="12"
                  strokeDasharray={`${lutealDash} ${circumference}`}
                  strokeDashoffset={`-${menstrualDash + follicularDash + ovulationDash}`}
                  filter="url(#softGlow)"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              );
            })()}
            
            {/* Current position indicator - pulsing white dot */}
            {isCurrentlyOnPeriod && currentPeriodDay > 0 && (() => {
              const cycleLength = data.avgCycle || 28;
              const menstrualDays = 5;
              const circumference = 2 * Math.PI * 140;
              
              // Calculate segment dash length
              const menstrualDash = (menstrualDays / cycleLength) * circumference;
              
              // Percent through menstrual phase (0 to 1)
              const percentThroughMenstrual = (currentPeriodDay - 1) / (menstrualDays - 1);
              
              // Distance along the arc for the dot (0 to menstrualDash)
              const dotDistance = percentThroughMenstrual * menstrualDash;
              
              // Convert distance to degrees (SVG is already rotated -90°)
              const angleFromTop = (dotDistance / circumference) * 360;
              
              // Start at 180° (12 o'clock) and add the angle based on progress through the menstrual phase
              const rotationAngle = 180 + angleFromTop;
              
              console.log('🔴 Period day:', currentPeriodDay, 'Distance:', dotDistance.toFixed(1), 'Angle from top:', angleFromTop.toFixed(1), 'Rotation:', rotationAngle.toFixed(1));
              
              return (
                <g transform={`rotate(${rotationAngle}, 160, 160)`}>
                  {/* Outer glow halo */}
                  <circle
                    cx="20"
                    cy="160"
                    r="18"
                    fill="white"
                    className="opacity-15"
                    filter="url(#glow)"
                  >
                    <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Mid glow */}
                  <circle
                    cx="20"
                    cy="160"
                    r="14"
                    fill="white"
                    className="opacity-40"
                    filter="url(#softGlow)"
                  >
                    <animate attributeName="r" values="14;16;14" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Main dot with gradient */}
                  <circle
                    cx="20"
                    cy="160"
                    r="10"
                    fill="white"
                    className="drop-shadow-2xl"
                    filter="url(#shadow)"
                  >
                    <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Inner highlight */}
                  <circle
                    cx="20"
                    cy="160"
                    r="4"
                    fill="#fef2f2"
                    className="opacity-80"
                  />
                </g>
              );
            })()}
            
            {/* Direction arrow with premium styling */}
            <g className="opacity-70">
              {/* Arrow shadow */}
              <polygon
                points="272,162 287,157 287,167"
                fill="black"
                className="opacity-20"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 160 160"
                  to="360 160 160"
                  dur="15s"
                  repeatCount="indefinite"
                />
              </polygon>
              {/* Main arrow */}
              <polygon
                points="270,160 285,155 285,165"
                fill="white"
                className="drop-shadow-lg"
                filter="url(#softGlow)"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 160 160"
                  to="360 160 160"
                  dur="15s"
                  repeatCount="indefinite"
                />
              </polygon>
              {/* Arrow highlight */}
              <polygon
                points="272,160 283,156 283,164"
                fill="#fef2f2"
                className="opacity-50"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 160 160"
                  to="360 160 160"
                  dur="15s"
                  repeatCount="indefinite"
                />
              </polygon>
            </g>
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isCurrentlyOnPeriod ? (
              <>
                <div className="text-4xl mb-2">🩸</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  Period Day {currentPeriodDay}
                </div>
                <div className="text-lg text-pink-300 font-semibold mt-1">of ~5 days</div>
                <button
                  onClick={() => setShowPeriodEndModal(true)}
                  className="mt-2 px-3 py-1 text-xs bg-red-500/20 text-red-200 border border-red-400/50 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  End Period
                </button>
              </>
            ) : (
              <>
                <div className="text-3xl mb-2">📅</div>
                <div className="text-xl font-bold text-white">
                  {data.predictedNextStart ? (
                    <>
                      <div className="text-rose-400">Period in {data.predictedNextStart && data.predictedNextStart.getTime() > new Date().getTime() ? Math.round((data.predictedNextStart.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0} days</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {String(data.predictedNextStart.getUTCMonth() + 1).padStart(2, '0')}/{String(data.predictedNextStart.getUTCDate()).padStart(2, '0')}
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-400">Tracking cycle</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Phase Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-red-800" />
          <span className="text-slate-400">Menstrual</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-200 to-pink-300" />
          <span className="text-slate-400">Follicular</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500" />
          <span className="text-slate-400">Ovular</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500" />
          <span className="text-slate-400">Luteal</span>
        </div>
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


