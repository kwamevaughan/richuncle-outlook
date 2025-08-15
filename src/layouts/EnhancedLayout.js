import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TopProgressBar from '../components/TopProgressBar';
import PageTransition from '../components/PageTransition';
import { LoadingOverlay } from '../components/LoadingStates';

export default function EnhancedLayout({ 
  children, 
  showProgressBar = true,
  progressColor = "blue",
  transitionDuration = 300,
  loadingText = "Loading...",
  showLoadingText = true,
  className = ""
}) {
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Handle initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle route changes
  useEffect(() => {
    const handleStart = () => {
      setIsPageLoading(true);
    };

    const handleComplete = () => {
      setIsPageLoading(false);
    };

    const handleError = () => {
      setIsPageLoading(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router]);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Top Progress Bar */}
      {showProgressBar && (
        <TopProgressBar 
          isLoading={isPageLoading} 
          color={progressColor}
          height="2px"
          showSpinner={false}
          autoComplete={true}
        />
      )}

      {/* Initial Loading Overlay */}
      {isInitialLoad && (
        <LoadingOverlay 
          isVisible={true}
          text="Initializing..."
          backdrop={true}
        />
      )}

      {/* Page Content with Transitions */}
      <PageTransition
        color={progressColor}
        showProgressBar={false} // We're handling this at layout level
        transitionDuration={transitionDuration}
        loadingText={loadingText}
        showLoadingText={showLoadingText}
      >
        {children}
      </PageTransition>

      {/* Global Loading Overlay for API calls */}
      {isPageLoading && (
        <div className="fixed inset-0 min-h-screen bg-white/60 backdrop-blur-sm z-[9997] flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Loading page...
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 