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
    
    const predictedNextStart = lastStart ? new Date(Date.UTC(lastStart.getUTCFullYear(), lastStart.getUTCMonth(), lastStart.getUTCDate()) + avgCycle * 24 * 3600 * 1000) : null;

    // Build small series for chart: last 90 days onPeriod flag
    const series = days.slice(-90).map((k) => ({ date: k, on: byDay[k].onPeriod }));

    // Correlate monthly stress/valence with cycle variability
    let stressAvg = 0; let valenceAvg = 0; let n = 0;
    for (const k of days.slice(-30)) {
      const day = byDay[k];
      const s = day.stress.length ? day.stress.reduce((a, b) => a + b, 0) / day.stress.length : 5;
      const v = day.valence.length ? day.valence.reduce((a, b) => a + b, 0) / day.valence.length : 5;
      stressAvg += s; valenceAvg += v; n++;
    }
    stressAvg = n ? +(stressAvg / n).toFixed(1) : null;
    valenceAvg = n ? +(valenceAvg / n).toFixed(1) : null;

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

      {/* Current Period Status */}
      {isCurrentlyOnPeriod && (
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-pink-900/40 to-rose-900/40 border border-pink-500/30 text-pink-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🩸</span>
              <div>
                <div className="font-semibold text-lg">Currently on Period</div>
                <div className="text-sm text-pink-300">Day {currentPeriodDay}</div>
              </div>
            </div>
            <button
              onClick={() => setShowPeriodEndModal(true)}
              className="px-4 py-2 bg-red-500/20 text-red-200 border border-red-400/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              End Period
            </button>
          </div>
        </div>
      )}

      {/* Mini on/off chart for last 90 days */}
      <div className="w-full overflow-hidden rounded-xl border border-pink-500/30 bg-gradient-to-r from-slate-700/50 to-slate-600/50 mb-4 shadow-lg">
        <div className="flex w-full">
          {data.series.map((d, idx) => (
            <div 
              key={idx} 
              className={"h-8 transition-all duration-300 hover:scale-110 " + (d.on ? "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/50 shadow-lg" : "bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400")} 
              style={{ width: `${100 / Math.max(data.series.length, 1)}%` }} 
            />
          ))}
        </div>
        <div className="px-3 py-2 text-xs text-slate-300 flex justify-between bg-slate-800/50">
          <span className="font-medium">90 days ago</span>
          <span className="font-medium">Today</span>
        </div>
      </div>

      {/* Predictions & correlations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 shadow-lg">
          <div className="text-xs text-pink-300 font-medium uppercase tracking-wide">Last start</div>
          <div className="text-white font-bold text-lg">{data.lastStart ? `${data.lastStart.getUTCFullYear()}/${String(data.lastStart.getUTCMonth() + 1).padStart(2, '0')}/${String(data.lastStart.getUTCDate()).padStart(2, '0')}` : '—'}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">Days since</div>
          <div className="text-pink-300 font-semibold">{data.daysSinceLast ?? '—'}</div>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-rose-500/30 hover:border-rose-400/50 transition-all duration-300 shadow-lg">
          <div className="text-xs text-rose-300 font-medium uppercase tracking-wide">Predicted next start</div>
          <div className="text-white font-bold text-lg">{data.predictedNextStart ? `${data.predictedNextStart.getUTCFullYear()}/${String(data.predictedNextStart.getUTCMonth() + 1).padStart(2, '0')}/${String(data.predictedNextStart.getUTCDate()).padStart(2, '0')}` : '—'}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">Hydration today</div>
          <div className="text-rose-300 font-semibold">{data.todayWater !== null ? `${data.todayWater} glasses` : '—'}</div>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
          <div className="text-xs text-purple-300 font-medium uppercase tracking-wide">Stress/Valence (30d avg)</div>
          <div className="text-white font-bold text-lg">{data.stressAvg !== null && data.valenceAvg !== null ? `${data.stressAvg}/10 stress, ${data.valenceAvg}/10 valence` : '—'}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">Note</div>
          <div className="text-purple-300 text-sm">Higher stress may shorten/shift cycles; we factor this when alerting.</div>
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


