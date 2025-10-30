export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
// no caching; compute per request

function toLocalMidnight(d: Date) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const window = (searchParams.get('window') as 'weekly' | 'monthly' | 'yearly') || 'weekly';

    // Define date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    if (window === 'weekly') startDate.setDate(endDate.getDate() - 6);
    else if (window === 'monthly') startDate.setDate(1);
    else startDate.setMonth(0, 1);

    const apiStart = Date.now();
    // For weekly, include extra 7 days before window start to allow rolling 7-day histories per cell
    const isWeekly = window === 'weekly';
    const historyStart = new Date(startDate);
    if (isWeekly) historyStart.setDate(historyStart.getDate() - 7);
    // We'll use activity time inside them to bucket per-hour
    const entries = await db.moodEntry.findMany({
      where: { userId, createdAt: { gte: historyStart, lte: endDate } },
      select: { id: true, createdAt: true, activityEntries: true, selectedTimeSlots: true, activities: true, sleep: true },
      orderBy: { createdAt: 'desc' }
    });
    const fetchMs = Date.now() - apiStart;
    // Fetch active predefined activities once to classify LM/RI/CN
    const predefined = await db.predefinedActivity.findMany({ where: { isActive: true } });
    const activityToComponent = new Map<string, string>();
    for (const p of predefined) activityToComponent.set(String(p.name).toLowerCase(), p.dssComponent);

    // Helper to format YYYY-MM-DD
    const fmtDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Aggregate per (dayKey, hour)
    type HourAgg = { slotPresent: boolean; lmActivityCount: number; tasksCompleted: number; socialTouchpoints: number; recoveryAction: boolean };
    const hourAgg = new Map<string, HourAgg>(); // key = `${dateKey}-${hour}`

    const addAgg = (dateKey: string, hour: number, upd: Partial<HourAgg>) => {
      const k = `${dateKey}-${hour}`;
      const cur = hourAgg.get(k) || { slotPresent: false, lmActivityCount: 0, tasksCompleted: 0, socialTouchpoints: 0, recoveryAction: false };
      hourAgg.set(k, {
        slotPresent: cur.slotPresent || !!upd.slotPresent,
        lmActivityCount: cur.lmActivityCount + (upd.lmActivityCount || 0),
        tasksCompleted: cur.tasksCompleted + (upd.tasksCompleted || 0),
        socialTouchpoints: cur.socialTouchpoints + (upd.socialTouchpoints || 0),
        recoveryAction: cur.recoveryAction || !!upd.recoveryAction
      });
    };

    // Walk entries and bucket into hourAgg using activity time (exactTime/hour) and selectedTimeSlots
    for (const e of entries) {
      const entryDate = new Date(e.createdAt);
      const entryDateKey = fmtDateKey(entryDate);

      // selectedTimeSlots -> mark slot present at that hour on entry's local date
      if (e.selectedTimeSlots) {
        try {
          const slots = typeof e.selectedTimeSlots === 'string' ? JSON.parse(e.selectedTimeSlots) : e.selectedTimeSlots;
          if (Array.isArray(slots)) {
            const hoursSet = new Set<number>();
            for (const s of slots) {
              const m = String(s).match(/(\d+)/);
              if (m) {
                const h = parseInt(m[1]);
                if (!Number.isNaN(h)) hoursSet.add(h);
              }
            }
            Array.from(hoursSet).forEach((h) => addAgg(entryDateKey, h, { slotPresent: true }));
          }
        } catch {}
      }

      // activityEntries -> classify per activity name and hour
      if (e.activityEntries) {
        try {
          const arr = typeof e.activityEntries === 'string' ? JSON.parse(e.activityEntries) : e.activityEntries;
          if (Array.isArray(arr)) {
            for (const a of arr) {
              const aHour: number | undefined = typeof a?.hour === 'number' ? a.hour : undefined;
              const aNameRaw: string | undefined = a?.activity || a?.name;
              // Prefer exactTime's date if present; fallback to entry date
              let keyDate = entryDateKey;
              if (a?.exactTime) {
                const et = new Date(a.exactTime);
                keyDate = fmtDateKey(et);
              }
              if (aHour !== undefined && aNameRaw) {
                const aName = aNameRaw.toLowerCase();
                const comp = activityToComponent.get(aName);
                if (comp === 'LM') addAgg(keyDate, aHour, { tasksCompleted: 1, lmActivityCount: 1 });
                else if (comp === 'Connection') addAgg(keyDate, aHour, { socialTouchpoints: 30 });
                else if (comp === 'RI') addAgg(keyDate, aHour, { recoveryAction: true });
              }
            }
          }
        } catch {}
      }
    }

    // Per-hour z-score helper (sigma floor 30)
    const zScore = (value: number, history: number[]): number => {
      const valid = history.filter(v => Number.isFinite(v));
      if (valid.length === 0) return 0;
      const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
      const variance = valid.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / valid.length;
      const std = Math.max(Math.sqrt(variance), 30);
      return (value - mean) / std;
    };

    // Optional debug for a specific label/hour
    const debug = searchParams.get('debug') === 'true';
    const targetLabel = searchParams.get('label'); // Sun..Sat
    const targetHour = searchParams.get('hour') ? parseInt(String(searchParams.get('hour'))) : undefined;
    const targetDate = searchParams.get('date'); // YYYY-MM-DD (optional alternative)

    let debugPayload: any | undefined = undefined;
    if (debug && (targetHour !== undefined) && (targetLabel || targetDate)) {
      // Resolve the dateKey for the requested cell inside the window
      let chosenDate: Date | null = null;
      if (targetDate) {
        const [yy, mm, dd] = targetDate.split('-').map(Number);
        chosenDate = new Date(yy as number, (mm as number) - 1, dd as number);
      } else if (targetLabel) {
        // Find the latest day in window matching the label
        const tmp = new Date(endDate);
        while (tmp >= startDate) {
          const lab = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][tmp.getDay()];
          if (lab === targetLabel) { chosenDate = new Date(tmp); break; }
          tmp.setDate(tmp.getDate() - 1);
        }
      }
      if (chosenDate) {
        const dateKey = fmtDateKey(chosenDate);
        const label = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][chosenDate.getDay()];
        const k = `${dateKey}-${targetHour}`;
        const agg = hourAgg.get(k) || { slotPresent: false, lmActivityCount: 0, tasksCompleted: 0, socialTouchpoints: 0, recoveryAction: false };

        // Re-derive contributions for this hour for transparency
        const slotHours: number[] = [];
        const activitiesContrib: Array<{ name: string; component: string; exactTime?: string; hour?: number }> = [];
        for (const e of entries) {
          // slots
          if (e.selectedTimeSlots) {
            try {
              const slots = typeof e.selectedTimeSlots === 'string' ? JSON.parse(e.selectedTimeSlots) : e.selectedTimeSlots;
              if (Array.isArray(slots)) {
                for (const s of slots) {
                  const m = String(s).match(/(\d+)/);
                  if (m) {
                    const h = parseInt(m[1]);
                    if (!Number.isNaN(h) && h === targetHour) {
                      const ek = fmtDateKey(new Date(e.createdAt));
                      if (ek === dateKey) slotHours.push(h);
                    }
                  }
                }
              }
            } catch {}
          }
          // activities
          if (e.activityEntries) {
            try {
              const arr = typeof e.activityEntries === 'string' ? JSON.parse(e.activityEntries) : e.activityEntries;
              if (Array.isArray(arr)) {
                for (const a of arr) {
                  const aHour = typeof a?.hour === 'number' ? a.hour : undefined;
                  const aNameRaw: string | undefined = a?.activity || a?.name;
                  const effectiveDateKey = a?.exactTime ? fmtDateKey(new Date(a.exactTime)) : fmtDateKey(new Date(e.createdAt));
                  if (aNameRaw && aHour === targetHour && effectiveDateKey === dateKey) {
                    const key = aNameRaw.toLowerCase();
                    const comp = activityToComponent.get(key) || 'unknown';
                    activitiesContrib.push({ name: aNameRaw, component: comp, exactTime: a?.exactTime, hour: aHour });
                  }
                }
              }
            } catch {}
          }
        }

        const deepworkMinutesDbg = agg.slotPresent && agg.lmActivityCount > 0 ? 60 : 0;
        const lmNow = deepworkMinutesDbg + 10 * agg.tasksCompleted;
        const riNow = (agg.recoveryAction ? 1 : 0);
        const cnNow = agg.socialTouchpoints;

        const lmHist: number[] = [];
        const riHist: number[] = [];
        const cnHist: number[] = [];
        {
          if (isWeekly) {
            for (let back = 1; back <= 7; back++) {
              const p = new Date(chosenDate);
              p.setDate(p.getDate() - back);
              const prevKey = `${fmtDateKey(p)}-${targetHour}`;
              const prevAgg = hourAgg.get(prevKey);
              if (prevAgg) {
                const prevDeepwork = prevAgg.slotPresent && prevAgg.lmActivityCount > 0 ? 60 : 0;
                lmHist.push(prevDeepwork + 10 * prevAgg.tasksCompleted);
                riHist.push(prevAgg.recoveryAction ? 1 : 0);
                cnHist.push(prevAgg.socialTouchpoints);
              }
            }
          } else {
            const prev = new Date(chosenDate);
            prev.setDate(prev.getDate() - 1);
            while (prev >= startDate) {
              const prevKey = `${fmtDateKey(prev)}-${targetHour}`;
              const prevAgg = hourAgg.get(prevKey);
              if (prevAgg) {
                const prevDeepwork = prevAgg.slotPresent && prevAgg.lmActivityCount > 0 ? 60 : 0;
                lmHist.push(prevDeepwork + 10 * prevAgg.tasksCompleted);
                riHist.push(prevAgg.recoveryAction ? 1 : 0);
                cnHist.push(prevAgg.socialTouchpoints);
              }
              prev.setDate(prev.getDate() - 1);
            }
          }
        }
        let zLM = 0, zRI = 0, zCN = 0;
        if (lmHist.length >= 3 && riHist.length >= 3 && cnHist.length >= 3) {
          zLM = zScore(lmNow, lmHist);
          zRI = zScore(riNow, riHist);
          zCN = zScore(cnNow, cnHist);
        } else {
          // Not enough history within the window to compute a stable mean/std
        }
        const dssValue = (lmNow || riNow || cnNow) && (lmHist.length >= 3 && riHist.length >= 3 && cnHist.length >= 3)
          ? (0.5 * zLM + 0.3 * zRI + 0.2 * zCN)
          : null;

        // Build detailed hour-aligned breakdown before this date (from window start)
        const prevDays: Array<{
          dateKey: string;
          activities: Array<{ name: string; component: string; hour: number; exactTime?: string }>;
          components: { lm: number; ri: number; cn: number };
        }> = [];
        {
          const prev = new Date(chosenDate);
          prev.setDate(prev.getDate() - 1);
          while (prev >= startDate) {
            const prevKey = fmtDateKey(prev);
            const hKey = `${prevKey}-${targetHour}`;
            const aggPrev = hourAgg.get(hKey) || { slotPresent: false, lmActivityCount: 0, tasksCompleted: 0, socialTouchpoints: 0, recoveryAction: false };

            const acts: Array<{ name: string; component: string; hour: number; exactTime?: string }> = [];
            for (const e2 of entries) {
              if (e2.activityEntries) {
                try {
                  const arr2 = typeof e2.activityEntries === 'string' ? JSON.parse(e2.activityEntries) : e2.activityEntries;
                  if (Array.isArray(arr2)) {
                    for (const a2 of arr2) {
                      const h2 = typeof a2?.hour === 'number' ? a2.hour : undefined;
                      const nmRaw: string | undefined = a2?.activity || a2?.name;
                      const effKey = a2?.exactTime ? fmtDateKey(new Date(a2.exactTime)) : fmtDateKey(new Date(e2.createdAt));
                      if (nmRaw && h2 === targetHour && effKey === prevKey) {
                        const keyNm = nmRaw.toLowerCase();
                        const comp2 = activityToComponent.get(keyNm) || 'unknown';
                        acts.push({ name: nmRaw, component: comp2, hour: h2, exactTime: a2?.exactTime });
                      }
                    }
                  }
                } catch {}
              }
            }

            const deepPrev = aggPrev.slotPresent && aggPrev.lmActivityCount > 0 ? 60 : 0;
            const lmPrev = deepPrev + 10 * aggPrev.tasksCompleted;
            const riPrev = aggPrev.recoveryAction ? 1 : 0;
            const cnPrev = aggPrev.socialTouchpoints;
            prevDays.push({ dateKey: prevKey, activities: acts, components: { lm: lmPrev, ri: riPrev, cn: cnPrev } });

            prev.setDate(prev.getDate() - 1);
          }
        }

        debugPayload = {
          dateKey,
          dayLabel: label,
          hour: targetHour,
          componentsNow: { lmNow, riNow, cnNow },
          histories: { lmHist, riHist, cnHist },
          zScores: { zLM, zRI, zCN },
          dssValue,
          contributions: {
            slotHours,
            activities: activitiesContrib
          },
          prevDays
        };
      }
    }

    // Build results by scanning each day/hour in range and computing DSS per hour with window-aligned hour histories
    const result: Array<{ day: string; hour: number; dssValue: number | null }> = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const dateKey = fmtDateKey(cursor);
      const dayLabel = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][cursor.getDay()];
      for (let h = 0; h < 24; h++) {
        const k = `${dateKey}-${h}`;
        const agg = hourAgg.get(k) || { slotPresent: false, lmActivityCount: 0, tasksCompleted: 0, socialTouchpoints: 0, recoveryAction: false };

        // Current hour raw components
        const deepworkMinutes = agg.slotPresent && agg.lmActivityCount > 0 ? 60 : 0;
        const lmNow = deepworkMinutes + 10 * agg.tasksCompleted;
        const riNow = (agg.recoveryAction ? 1 : 0); // do NOT include daily sleep in per-hour; only hour-specific recovery actions
        const cnNow = agg.socialTouchpoints;

        // Build history for the same hour: weekly uses last 7 days; monthly/yearly from window start to day before
        const lmHist: number[] = [];
        const riHist: number[] = [];
        const cnHist: number[] = [];
        {
          if (isWeekly) {
            for (let back = 1; back <= 7; back++) {
              const p = new Date(cursor);
              p.setDate(p.getDate() - back);
              const prevKey = `${fmtDateKey(p)}-${h}`;
              const prevAgg = hourAgg.get(prevKey);
              if (prevAgg) {
                const prevDeepwork = prevAgg.slotPresent && prevAgg.lmActivityCount > 0 ? 60 : 0;
                lmHist.push(prevDeepwork + 10 * prevAgg.tasksCompleted);
                riHist.push(prevAgg.recoveryAction ? 1 : 0);
                cnHist.push(prevAgg.socialTouchpoints);
              }
            }
          } else {
            const prev = new Date(cursor);
            prev.setDate(prev.getDate() - 1);
            while (prev >= startDate) {
              const prevKey = `${fmtDateKey(prev)}-${h}`;
              const prevAgg = hourAgg.get(prevKey);
              if (prevAgg) {
                const prevDeepwork = prevAgg.slotPresent && prevAgg.lmActivityCount > 0 ? 60 : 0;
                lmHist.push(prevDeepwork + 10 * prevAgg.tasksCompleted);
                riHist.push(prevAgg.recoveryAction ? 1 : 0);
                cnHist.push(prevAgg.socialTouchpoints);
              }
              prev.setDate(prev.getDate() - 1);
            }
          }
        }

        let dssValue: number | null = null;
        const hasData = lmNow > 0 || riNow > 0 || cnNow > 0;
        if (hasData) {
          let zLM = 0, zRI = 0, zCN = 0;
          if (lmHist.length >= 3 && riHist.length >= 3 && cnHist.length >= 3) {
            zLM = zScore(lmNow, lmHist);
            zRI = zScore(riNow, riHist);
            zCN = zScore(cnNow, cnHist);
          } else {
            // Not enough history in this window; leave dssValue as null
          }
          if (lmHist.length >= 3 && riHist.length >= 3 && cnHist.length >= 3) {
            dssValue = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN;
          } else {
            dssValue = null;
          }
        }

        result.push({ day: dayLabel, hour: h, dssValue });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    
    return NextResponse.json({ data: result, window, period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }, debug: debugPayload });
  } catch (error: any) {
    console.error('❌ Error fetching performance hours data:', error);
    return NextResponse.json({ error: 'Failed to fetch performance hours data', details: error?.message }, { status: 500 });
  }
}


