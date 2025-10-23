import React from 'react';

interface MoodGridProps {
  selectedMood?: number;
  onMoodSelect: (mood: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const moodOptions = [
  { value: 1, emoji: '😢', label: 'Very Low', color: 'bg-red-100 border-red-300' },
  { value: 2, emoji: '😔', label: 'Low', color: 'bg-orange-100 border-orange-300' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'bg-yellow-100 border-yellow-300' },
  { value: 4, emoji: '🙂', label: 'Good', color: 'bg-blue-100 border-blue-300' },
  { value: 5, emoji: '😊', label: 'Very Good', color: 'bg-green-100 border-green-300' },
  { value: 6, emoji: '😄', label: 'Great', color: 'bg-emerald-100 border-emerald-300' },
  { value: 7, emoji: '🤩', label: 'Excellent', color: 'bg-teal-100 border-teal-300' },
  { value: 8, emoji: '🥳', label: 'Amazing', color: 'bg-cyan-100 border-cyan-300' },
  { value: 9, emoji: '🌟', label: 'Outstanding', color: 'bg-indigo-100 border-indigo-300' },
  { value: 10, emoji: '✨', label: 'Perfect', color: 'bg-purple-100 border-purple-300' }
];

export default function MoodGrid({ selectedMood, onMoodSelect, size = 'md' }: MoodGridProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-20 h-20 text-4xl'
  };
  
  return (
    <div className="grid grid-cols-5 gap-3">
      {moodOptions.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onMoodSelect(mood.value)}
          className={`
            ${sizeClasses[size]}
            ${mood.color}
            ${selectedMood === mood.value ? 'ring-2 ring-indigo-500 scale-110' : ''}
            rounded-2xl border-2 flex items-center justify-center
            transition-all duration-300 hover:scale-105 hover:shadow-lg
            focus:outline-none focus:ring-2 focus:ring-indigo-500
          `}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  );
}

