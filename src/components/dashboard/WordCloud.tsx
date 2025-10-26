"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as cloud from 'd3-cloud';

const Wordcloud = dynamic(() => import('@visx/wordcloud').then(mod => mod.Wordcloud), { ssr: false });
const Text = dynamic(() => import('@visx/wordcloud').then(mod => mod.WordcloudText), { ssr: false });

interface WordCloudProps {
  moodEntries: any[];
  userPreferences: any;
  timeRange: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface WordData {
  text: string;
  value: number;
}

export default function WordCloud({ moodEntries, userPreferences, timeRange }: WordCloudProps) {
  const [words, setWords] = useState<WordData[]>([]);

  useEffect(() => {
    generateWordCloud();
  }, [moodEntries, timeRange]);

  const generateWordCloud = () => {
    const wordFreq: { [key: string]: number } = {};
    
    // Filter entries based on time range
    const now = new Date();
    const filteredEntries = moodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      
      switch (timeRange) {
        case 'daily':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const entryStart = new Date(entryDate.getUTCFullYear(), entryDate.getUTCMonth(), entryDate.getUTCDate());
          return entryStart.getTime() === todayStart.getTime();
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return entryDate >= weekAgo;
        case 'monthly':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return entryDate >= monthAgo;
        case 'yearly':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return entryDate >= yearAgo;
        default:
          return true;
      }
    });

    // Process activities
    filteredEntries.forEach(entry => {
      if (entry.activities) {
        const activities = Array.isArray(entry.activities) ? entry.activities : JSON.parse(entry.activities || '[]');
        activities.forEach((activity: string) => {
          if (activity) {
            wordFreq[activity] = (wordFreq[activity] || 0) + 1;
          }
        });
      }
    });

    // Process subcategories
    filteredEntries.forEach(entry => {
      if (entry.selectedSubcategories) {
        const subcategories = Array.isArray(entry.selectedSubcategories) ? entry.selectedSubcategories : JSON.parse(entry.selectedSubcategories || '[]');
        subcategories.forEach((subcategory: string) => {
          if (subcategory) {
            wordFreq[subcategory] = (wordFreq[subcategory] || 0) + 1;
          }
        });
      }
    });

    // Process favorites
    const favoriteFields = ['favoriteWriters', 'favoriteMusicians', 'favoriteSportsFigures', 'favoriteArtists', 'favoritePhilosophers'];
    favoriteFields.forEach(field => {
      filteredEntries.forEach(entry => {
        if (entry[field]) {
          const favorites = Array.isArray(entry[field]) ? entry[field] : JSON.parse(entry[field] || '[]');
          favorites.forEach((favorite: string) => {
            if (favorite) {
              wordFreq[favorite] = (wordFreq[favorite] || 0) + 1;
            }
          });
        }
      });
    });

    // Process interests
    filteredEntries.forEach(entry => {
      if (entry.interests) {
        const interests = Array.isArray(entry.interests) ? entry.interests : JSON.parse(entry.interests || '[]');
        interests.forEach((interest: string) => {
          if (interest) {
            wordFreq[interest] = (wordFreq[interest] || 0) + 1;
          }
        });
      }
    });

    // Convert to array format
    const wordsArray = Object.entries(wordFreq).map(([text, value]) => ({
      text,
      value
    }));

    setWords(wordsArray);
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl shadow-2xl">
        <div className="text-6xl mb-4">☁️</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Tags Yet</h3>
        <p className="text-gray-300">
          Add more entries to see your word cloud!
        </p>
      </div>
    );
  }

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9DFBF'];

  const fontSize = (word: WordData) => {
    const size = Math.sqrt(word.value) * 20;
    return Math.max(size, 10); // Minimum size so all words are visible
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl shadow-2xl p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <span className="mr-3 text-3xl">☁️</span>
          Word Cloud
        </h3>
      </div>

      <div className="bg-white/5 rounded-xl p-0" style={{ height: '400px', width: '100%', overflow: 'hidden' }}>
        <svg width="100%" height="100%" viewBox="0 0 1000 550" preserveAspectRatio="xMidYMid slice">
          <Wordcloud
            words={words as any}
            width={1000}
            height={550}
            fontSize={fontSize as any}
            font="Arial"
            padding={0}
            spiral="rectangular"
            rotate={() => Math.random() < 0.5 ? 0 : 90}
            random={Math.random}
          >
                                      {(cloudWords) =>
               cloudWords.map((w, i) => {
                 const actualRotate = w.rotate || 0;
                 return (
                   <g
                     key={w.text}
                     transform={`translate(${w.x}, ${w.y}) rotate(${actualRotate})`}
                     className="cursor-pointer hover:opacity-70 transition-opacity"
                   >
                     <text
                       fontSize={w.size}
                       fontFamily={w.font}
                       fill={colors[i % colors.length]}
                       textAnchor="middle"
                       fontWeight="bold"
                     >
                       {w.text}
                     </text>
                   </g>
                                  );
               })
             }
            </Wordcloud>
        </svg>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center space-x-6 text-sm text-indigo-200">
          <div>
            <span className="font-semibold">Total Tags:</span> {words.length}
          </div>
          <div>
            <span className="font-semibold">Period:</span>{' '}
            {timeRange === 'daily' ? 'Today' :
             timeRange === 'weekly' ? 'Last 7 days' :
             timeRange === 'monthly' ? 'Last 30 days' :
             'Last 365 days'}
          </div>
        </div>
      </div>


    </div>
  );
}
