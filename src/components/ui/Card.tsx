import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export default function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  const baseClasses = 'bg-white rounded-2xl shadow-lg border border-gray-100';
  const hoverClasses = hover ? 'transform transition-all duration-300 hover:scale-105 hover:shadow-xl' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-indigo-50 to-blue-50' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}>
      {children}
    </div>
  );
}

