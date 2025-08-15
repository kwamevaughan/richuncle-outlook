import React from 'react';
import { Icon } from '@iconify/react';

// Skeleton loading component
export function Skeleton({ className = "", lines = 1, height = "h-4" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 rounded mb-2 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-4/6 animate-pulse" />
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, j) => (
                <div
                  key={j}
                  className={`h-4 bg-gray-200 rounded animate-pulse ${
                    j === 0 ? 'w-1/4' : j === 1 ? 'w-1/3' : 'w-1/2'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Spinner with text
export function Spinner({ 
  size = "md", 
  text = "Loading...", 
  color = "blue",
  className = "" 
}) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const colorClasses = {
    blue: "border-t-blue-500",
    green: "border-t-green-500",
    red: "border-t-red-500",
    yellow: "border-t-yellow-500",
    purple: "border-t-purple-500"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-gray-200 ${colorClasses[color]} rounded-full animate-spin mb-3`} />
      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Pulse dots
export function PulseDots({ className = "" }) {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// Shimmer effect
export function Shimmer({ className = "", width = "w-full", height = "h-4" }) {
  return (
    <div className={`${width} ${height} bg-gray-200 rounded relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

// Content loader with skeleton
export function ContentLoader({ 
  type = "card", 
  count = 1, 
  className = "",
  showHeader = true 
}) {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return <CardSkeleton className={className} />;
      case "table":
        return <TableSkeleton className={className} />;
      case "text":
        return <Skeleton lines={3} className={className} />;
      default:
        return <CardSkeleton className={className} />;
    }
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
      )}
      
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

// Loading overlay
export function LoadingOverlay({ 
  isVisible = false, 
  text = "Loading...",
  backdrop = true,
  className = "" 
}) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 min-h-screen z-[9999] flex items-center justify-center ${
      backdrop ? 'bg-white/80 backdrop-blur-sm' : ''
    } ${className}`}>
      <div className="text-center">
        <Spinner size="lg" text={text} />
      </div>
    </div>
  );
} 