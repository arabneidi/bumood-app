import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export default function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  const baseClasses = 'rounded-2xl shadow-lg dark:shadow-xl dark:shadow-slate-900/50';
  const hoverClasses = hover ? 'transform transition-all duration-300 hover:scale-105 hover:shadow-xl dark:hover:shadow-2xl' : '';
  const gradientClasses = gradient ? 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-900/80' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${gradientClasses} ${className}`}>
      {children}
    </div>
  );
}

