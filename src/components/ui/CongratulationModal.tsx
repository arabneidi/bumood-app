"use client";

import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';

interface Congratulation {
  id: string;
  type: string;
  title: string;
  message: string;
  actionMessage: string;
  icon: string;
  stars: number;
  isRead: boolean;
  createdAt: string;
}

interface CongratulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  congratulation: Congratulation | null;
  onMarkAsRead: (id: string) => void;
}

export default function CongratulationModal({ 
  isOpen, 
  onClose, 
  congratulation, 
  onMarkAsRead 
}: CongratulationModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !congratulation || !isVisible) {
    return null;
  }

  const handleClose = () => {
    if (!congratulation.isRead) {
      onMarkAsRead(congratulation.id);
    }
    onClose();
  };

  const getStarDisplay = (stars: number) => {
    return '⭐'.repeat(stars);
  };

  const getBackgroundGradient = (type: string) => {
    switch (type) {
      case 'goal_completed':
        return 'from-green-500 to-emerald-600';
      case 'achievement_unlocked':
        return 'from-yellow-500 to-orange-500';
      case 'streak_milestone':
        return 'from-red-500 to-pink-500';
      case 'progress_milestone':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-auto">
        <Card className={`bg-gradient-to-br ${getBackgroundGradient(congratulation.type)} text-white border-0 shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="text-center p-6">
            {/* Icon and Stars */}
            <div className="mb-4">
              <div className="text-6xl mb-2">{congratulation.icon}</div>
              {congratulation.stars > 0 && (
                <div className="text-2xl mb-2">
                  {getStarDisplay(congratulation.stars)}
                </div>
              )}
            </div>

            {/* Main Message */}
            <h2 className="text-2xl font-bold mb-4 leading-tight">
              {congratulation.message}
            </h2>

            {/* Action Message */}
            <p className="text-lg mb-6 opacity-90 leading-relaxed">
              {congratulation.actionMessage}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleClose}
                className="bg-white text-gray-800 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Awesome! 🎉
              </Button>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Hook to manage congratulations
export function useCongratulations(userId: string) {
  const [congratulations, setCongratulations] = useState<Congratulation[]>([]);
  const [currentCongratulation, setCurrentCongratulation] = useState<Congratulation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCongratulations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/congratulations?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCongratulations(data);
        
        // Show the first unread congratulation
        const unreadCongratulation = data.find((c: Congratulation) => !c.isRead);
        if (unreadCongratulation) {
          setCurrentCongratulation(unreadCongratulation);
          setIsModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching congratulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/congratulations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true })
      });

      if (response.ok) {
        setCongratulations(prev => 
          prev.map(c => c.id === id ? { ...c, isRead: true } : c)
        );
      }
    } catch (error) {
      console.error('Error marking congratulation as read:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCongratulation(null);
  };

  const showNextCongratulation = () => {
    const nextUnread = congratulations.find(c => !c.isRead && c.id !== currentCongratulation?.id);
    if (nextUnread) {
      setCurrentCongratulation(nextUnread);
      setIsModalOpen(true);
    } else {
      closeModal();
    }
  };

  useEffect(() => {
    fetchCongratulations();
  }, [userId]);

  return {
    congratulations,
    currentCongratulation,
    isModalOpen,
    loading,
    fetchCongratulations,
    markAsRead,
    closeModal,
    showNextCongratulation
  };
}
