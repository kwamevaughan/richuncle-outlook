import React, { useState, useEffect } from 'react';

export default function TopProgressBar({ 
  isLoading = false, 
  progress = 0, 
  color = "blue",
  height = "1px",
  showSpinner = true,
  autoComplete = true 
}) {
  const [internalProgress, setInternalProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Color variants
  const colorVariants = {
    blue: "bg-blue-500",
    green: "bg-green-500", 
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
    pink: "bg-pink-500",
    gray: "bg-gray-500"
  };

  const selectedColor = colorVariants[color] || colorVariants.blue;

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setInternalProgress(0);
      
      // Simulate progress if autoComplete is enabled
      if (autoComplete) {
        const timer = setInterval(() => {
          setInternalProgress(prev => {
            if (prev >= 90) {
              clearInterval(timer);
              return 90;
            }
            return prev + Math.random() * 15;
          });
        }, 100);
        
        return () => clearInterval(timer);
      }
    } else {
      // Complete the progress bar
      setInternalProgress(100);
      
      // Hide after completion animation
      setTimeout(() => {
        setIsVisible(false);
        setInternalProgress(0);
      }, 500);
    }
  }, [isLoading, autoComplete]);

  // Use external progress if provided, otherwise use internal
  const currentProgress = progress > 0 ? progress : internalProgress;

  if (!isVisible && !isLoading) return null;

  const progressValue = autoComplete ? internalProgress : progress;
  const showPercentage = progressValue > 0 && progressValue < 100;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ height: `${height}` }}
    >
      <div 
        className={`h-full ${selectedColor} transition-all duration-300 relative`} 
        style={{ 
          width: `${progressValue}%`,
          transition: autoComplete ? 'width 0.5s ease-out' : 'width 0.3s ease-out',
          minWidth: showPercentage ? '2.5rem' : '0.25rem' // Ensure enough width for the percentage
        }}
      >
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
            {Math.round(progressValue)}%
          </div>
        )}
        {showSpinner && autoComplete && progressValue >= 100 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
} 