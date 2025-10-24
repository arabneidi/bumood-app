"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { Droplets } from "lucide-react";

interface PeriodInsightsProps {
  moodEntries: any[];
  userInfo: { gender?: string } | null;
}

// Utility: date only key (UTC)
function dateKeyUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

export default function PeriodInsights({ moodEntries, userInfo }: PeriodInsightsProps) {
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertText, setAlertText] = useState<string>("");

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
      if (todayOn && !prevOn) cycleStarts.push(new Date(d));
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

    // Simple heuristic alerts
    const todayKey = dateKeyUTC(new Date());
    const todayWater = byDay[todayKey]?.water ?? null;
    const todayAlcohol = byDay[todayKey]?.alcohol ?? 0;
    const preWindow = predictedNextStart ? Math.abs(Math.round((Date.UTC(predictedNextStart.getUTCFullYear(), predictedNextStart.getUTCMonth(), predictedNextStart.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / (24 * 3600 * 1000))) : null;

    return { series, avgCycle, lastStart, predictedNextStart, daysSinceLast, todayWater, todayAlcohol, stressAvg, valenceAvg };
  }, [moodEntries]);

  // One-per-day alert logic (localStorage gate)
  useEffect(() => {
    if (!userInfo || userInfo.gender !== 'female') return;
    const gateKey = `period-alert-${dateKeyUTC(new Date())}`;
    if (localStorage.getItem(gateKey) === 'seen') return;

    // Decide alert message
    const msgs: string[] = [];
    if (data.predictedNextStart) {
      const daysUntil = Math.round((Date.UTC(data.predictedNextStart.getUTCFullYear(), data.predictedNextStart.getUTCMonth(), data.predictedNextStart.getUTCDate()) - Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())) / (24 * 3600 * 1000));
      if (daysUntil <= 3 && daysUntil >= 0) msgs.push(`Pre-period in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — prep gentle care.`);
    }
    if (data.todayAlcohol > 0) msgs.push(`Alcohol today: ${data.todayAlcohol}. Hydrate to reduce cramps risk.`);
    if ((data.todayWater ?? 0) < 4) msgs.push(`Hydration is low today — drink water to support wellbeing.`);

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
          <div className="text-white font-bold text-lg">{data.lastStart ? new Date(data.lastStart).toLocaleDateString() : '—'}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">Days since</div>
          <div className="text-pink-300 font-semibold">{data.daysSinceLast ?? '—'}</div>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-rose-500/30 hover:border-rose-400/50 transition-all duration-300 shadow-lg">
          <div className="text-xs text-rose-300 font-medium uppercase tracking-wide">Predicted next start</div>
          <div className="text-white font-bold text-lg">{data.predictedNextStart ? new Date(data.predictedNextStart).toLocaleDateString() : '—'}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">Hydration today</div>
          <div className="text-rose-300 font-semibold">{data.todayWater !== null ? `${data.todayWater} glasses` : '—'}</div>
        </div>
        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg">
          <div className="text-xs text-purple-300 font-medium uppercase tracking-wide">Stress/Valence (30d avg)</div>
          <div className="text-white font-bold text-lg">{data.stressAvg !== null && data.valenceAvg !== null ? `${data.stressAvg}/10 stress, ${data.valenceAvg}/10 happiness` : '—'}</div>
          <div className="mt-2 text-xs text-slate-400 font-medium">Note</div>
          <div className="text-purple-300 text-sm">Higher stress may shorten/shift cycles; we factor this when alerting.</div>
        </div>
      </div>

      {showAlert && (
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-pink-900/40 to-rose-900/40 border border-pink-500/30 text-pink-200 flex items-start justify-between shadow-lg">
          <div className="mr-3 font-medium">{alertText}</div>
          <button 
            onClick={() => setShowAlert(false)} 
            className="text-sm font-semibold text-pink-300 hover:text-pink-100 underline transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
      )}
    </Card>
  );
}


