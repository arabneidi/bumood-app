"use client";

import { useState, useEffect } from "react";
import { MoodEntry } from "@prisma/client";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Star, Zap, Target, AlertTriangle } from "lucide-react";

export default function CalendarPage() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetch("/api/mood-entries")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Calendar: Received mood entries:', data);
        setMoodEntries(Array.isArray(data) ? data : []);
        setLoading(false);
        // Automatically select today's date when data is loaded
        setSelectedDate(new Date());
      })
      .catch(err => {
        console.error('Calendar: Error fetching mood entries:', err);
        setMoodEntries([]);
        setLoading(false);
        // Still select today's date even if there's an error
        setSelectedDate(new Date());
      });
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getMoodForDate = (date: Date) => {
    // Create date strings in local timezone to avoid timezone issues
    const dateStr = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    
    // Find all entries for this date
    const entriesForDate = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      const entryDateStr = entryDate.getFullYear() + '-' + 
        String(entryDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(entryDate.getDate()).padStart(2, '0');
      return entryDateStr === dateStr;
    });
    
    if (entriesForDate.length === 0) return null;
    if (entriesForDate.length === 1) return entriesForDate[0];
    
    // Calculate daily averages for multiple entries
    const avgValence = entriesForDate.reduce((sum, entry) => sum + entry.valence, 0) / entriesForDate.length;
    const avgEnergy = entriesForDate.reduce((sum, entry) => sum + entry.energy, 0) / entriesForDate.length;
    const avgFocus = entriesForDate.reduce((sum, entry) => sum + entry.focus, 0) / entriesForDate.length;
    const avgStress = entriesForDate.reduce((sum, entry) => sum + entry.stress, 0) / entriesForDate.length;
    const avgSleep = entriesForDate.reduce((sum, entry) => sum + (entry.sleep || 0), 0) / entriesForDate.length;

    // Period aggregation: mark day as onPeriod if ANY entry is on period
    const dayOnPeriod = entriesForDate.some(e => !!e.onPeriod);
    // If any entry has periodDay=1, prioritize showing the blood icon for the start day
    const dayPeriodDay = dayOnPeriod
      ? (entriesForDate.find(e => e.periodDay === 1)?.periodDay ?? entriesForDate.find(e => e.onPeriod)?.periodDay ?? 1)
      : null;
    
    // Combine all notes
    const allNotes = entriesForDate
      .map(entry => entry.notes)
      .filter(note => note && note.trim())
      .join(' | ');
    
    // Return a synthetic entry with averaged values
    return {
      ...entriesForDate[0], // Use first entry as base structure
      valence: Math.round(avgValence * 10) / 10, // Round to 1 decimal
      energy: Math.round(avgEnergy * 10) / 10,
      focus: Math.round(avgFocus * 10) / 10,
      stress: Math.round(avgStress * 10) / 10,
      sleep: Math.round(avgSleep * 10) / 10,
      notes: allNotes || entriesForDate[0].notes,
      // Add metadata to indicate this is averaged
      _isAveraged: true,
      _entryCount: entriesForDate.length,
      // Ensure calendar reflects period status for the day
      onPeriod: dayOnPeriod,
      periodDay: dayOnPeriod ? dayPeriodDay : null
    };
  };

  const getMoodColor = (mood: MoodEntry | undefined) => {
    if (!mood) return "bg-slate-800/40 backdrop-blur-xl border border-slate-600/50";
    
    // Special color for period days
    if (mood.onPeriod) {
      return "bg-gradient-to-br from-pink-500 to-rose-600"; // Pink/rose for period days
    }
    
    // Use the same calculation as dashboard: Life Rhythm Score (0-100)
    const lifeRhythmScore = Math.round((mood.valence + mood.energy + mood.focus + ((mood.sleep || 8) / 2)) / 3.5 * 10);
    // Life Rhythm Score ranges from 0 to 100
    if (lifeRhythmScore >= 80) return "bg-gradient-to-br from-green-400 to-emerald-500";  // 80%+
    if (lifeRhythmScore >= 60) return "bg-gradient-to-br from-blue-400 to-cyan-500";      // 60%+
    if (lifeRhythmScore >= 40) return "bg-gradient-to-br from-yellow-400 to-orange-400";  // 40%+
    if (lifeRhythmScore >= 20) return "bg-gradient-to-br from-orange-400 to-red-400";     // 20%+
    return "bg-gradient-to-br from-red-500 to-pink-600";  // Below 20%
  };

  const getMoodEmoji = (mood: MoodEntry | undefined, date: Date) => {
    if (!mood) return "";
    
    // Show blood icon for any period day (not just day 1)
    if (mood.onPeriod) {
      return "🩸"; // Blood drop for period days
    }
    
    // Use the same calculation as dashboard: Life Rhythm Score (0-100)
    const lifeRhythmScore = Math.round((mood.valence + mood.energy + mood.focus + ((mood.sleep || 8) / 2)) / 3.5 * 10);
    // Life Rhythm Score ranges from 0 to 100
    if (lifeRhythmScore >= 90) return "😍";  // 90%+
    if (lifeRhythmScore >= 80) return "😊";  // 80%+
    if (lifeRhythmScore >= 70) return "🙂";  // 70%+
    if (lifeRhythmScore >= 60) return "😐";  // 60%+
    if (lifeRhythmScore >= 50) return "😕";  // 50%+
    if (lifeRhythmScore >= 40) return "😟";  // 40%+
    if (lifeRhythmScore >= 30) return "😰";  // 30%+
    if (lifeRhythmScore >= 20) return "😢";  // 20%+
    return "😭";  // Below 20%
  };

  const getMoodScore = (mood: MoodEntry | undefined) => {
    if (!mood) return "";
    // Use the same calculation as dashboard: Life Rhythm Score
    // (valence + energy + focus + (sleep / 2)) / 3.5 * 10
    const lifeRhythmScore = Math.round((mood.valence + mood.energy + mood.focus + ((mood.sleep || 8) / 2)) / 3.5 * 10);
    return lifeRhythmScore;
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const days = getDaysInMonth(currentMonth);
  const selectedEntry = selectedDate ? getMoodForDate(selectedDate) : null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-bold text-center mb-12">Mood Calendar</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 text-white rounded-2xl"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold">
                {currentMonth.getUTCFullYear()} {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-4 bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 text-white rounded-2xl"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-3 mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-bold bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 text-slate-300 rounded-2xl">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
              {days.map((day, index) => {
                if (!day) return <div key={index} className="h-20"></div>;
                
                const moodEntry = getMoodForDate(day);
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                const moodEmoji = getMoodEmoji(moodEntry, day);
                const moodScore = getMoodScore(moodEntry);
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`h-20 relative rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-2 ${
                      moodEntry ? getMoodColor(moodEntry) : 'bg-slate-800/40 backdrop-blur-xl border border-slate-600/50'
                    } ${isSelected ? 'ring-4 ring-blue-400' : ''}`}
                  >
                    <span className="text-sm font-bold text-white mb-1">{day.getDate()}</span>
                    {moodEntry && (
                      <span className="text-2xl">{moodEmoji}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50">
            <h3 className="text-2xl font-bold mb-6">
              {selectedDate ? `${selectedDate.getUTCFullYear()} ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : 'Select a date'}
            </h3>
            
            {selectedEntry ? (
              <div className="space-y-4">
                {(selectedEntry as any)._isAveraged && (
                  <div className="bg-blue-500/20 border border-blue-400/50 rounded-2xl p-3 text-center">
                    <div className="text-sm text-blue-300">
                      📊 Daily Average ({(selectedEntry as any)._entryCount} entries)
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-500/20 border border-purple-400/50 rounded-2xl">
                    <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{selectedEntry.valence}</div>
                    <div className="text-sm text-slate-300">Valence</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/20 border border-green-400/50 rounded-2xl">
                    <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{selectedEntry.energy}</div>
                    <div className="text-sm text-slate-300">Energy</div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/20 border border-blue-400/50 rounded-2xl">
                    <Target className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{selectedEntry.focus}</div>
                    <div className="text-sm text-slate-300">Focus</div>
                  </div>
                  <div className="text-center p-4 bg-red-500/20 border border-red-400/50 rounded-2xl">
                    <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{selectedEntry.stress}</div>
                    <div className="text-sm text-slate-300">Stress</div>
                  </div>
                </div>
                {selectedEntry.notes && (
                  <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-200 mb-2">Notes</h4>
                    <p className="text-sm text-slate-300">{selectedEntry.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-300 text-center">Click on a date to view details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


