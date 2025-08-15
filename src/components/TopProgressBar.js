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

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* Main progress bar */}
      <div 
        className={`${selectedColor} transition-all duration-300 ease-out`}
        style={{ 
          width: `${currentProgress}%`,
          height: height,
          boxShadow: `0 0 10px ${color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#6b7280'}`
        }}
      />
      
      {/* Spinner indicator */}
      {showSpinner && isLoading && (
        <div className="absolute top-2 right-4">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      
      {/* Progress percentage (optional) */}
      {progress > 0 && (
        <div className="absolute top-2 left-4 text-xs text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
          {Math.round(currentProgress)}%
        </div>
      )}
    </div>
  );
} 