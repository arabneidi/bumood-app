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
      .then(res => res.json())
      .then(data => {
        setMoodEntries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
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
    const dateStr = date.toISOString().split('T')[0];
    return moodEntries.find(entry => 
      new Date(entry.createdAt).toISOString().split('T')[0] === dateStr
    );
  };

  const getMoodColor = (mood: MoodEntry | undefined) => {
    if (!mood) return "bg-gray-100";
    const valence = mood.valence;
    if (valence >= 8) return "bg-gradient-to-br from-green-400 to-emerald-500";
    if (valence >= 6) return "bg-gradient-to-br from-blue-400 to-cyan-500";
    if (valence >= 4) return "bg-gradient-to-br from-yellow-400 to-orange-400";
    if (valence >= 2) return "bg-gradient-to-br from-orange-400 to-red-400";
    return "bg-gradient-to-br from-red-500 to-pink-600";
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
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                if (!day) return <div key={index} className="h-16"></div>;
                
                const moodEntry = getMoodForDate(day);
                const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`h-16 relative rounded-2xl transition-all duration-300 ${
                      moodEntry ? getMoodColor(moodEntry) : 'bg-slate-800/40 backdrop-blur-xl border border-slate-600/50'
                    } ${isSelected ? 'ring-4 ring-blue-400' : ''}`}
                  >
                    <span className="text-sm font-bold text-white">{day.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1 bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50">
            <h3 className="text-2xl font-bold mb-6">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </h3>
            
            {selectedEntry ? (
              <div className="space-y-4">
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


