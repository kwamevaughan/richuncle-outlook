import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import TopProgressBar from './TopProgressBar';
import { sidebarNav } from '@/data/nav';

export default function PageTransition({ 
  children, 
  color = "blue",
  showProgressBar = true,
  transitionDuration = 300,
  loadingText = "Loading...",
  showLoadingText = true
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentLoadingText, setCurrentLoadingText] = useState(loadingText);
  const timeoutRef = useRef(null);

  // Get page name from route using nav.js data
  const getPageName = (url) => {
    // Handle root path
    if (url === '/') {
      return 'Dashboard';
    }

    // Flatten all navigation items for easier searching
    const allNavItems = sidebarNav.flatMap(entry => {
      if (entry.items) {
        return entry.items;
      } else {
        return [entry];
      }
    });

    // Try to find exact match first
    let page = allNavItems.find(item => item.href === url);
    
    if (page) {
      return page.label;
    }

    // If no exact match, try to match by path segments
    const urlSegments = url.split('/').filter(segment => segment);
    const lastSegment = urlSegments[urlSegments.length - 1];
    
    // Look for items that end with the last segment
    page = allNavItems.find(item => {
      if (!item.href) return false;
      const itemSegments = item.href.split('/').filter(segment => segment);
      return itemSegments[itemSegments.length - 1] === lastSegment;
    });

    if (page) {
      return page.label;
    }

    // Handle special cases for reports with tabs
    if (url.includes('/reports?tab=')) {
      const tabMatch = url.match(/tab=([^&]+)/);
      if (tabMatch) {
        const tabName = tabMatch[1];
        // Map tab names to readable labels
        const tabLabels = {
          'sales': 'Sales Report',
          'inventory': 'Inventory Report',
          'purchases': 'Purchases Report',
          'customers': 'Customers Report',
          'suppliers': 'Suppliers Report',
          'products': 'Products Report',
          'expenses': 'Expenses Report',
          'profit-loss': 'Profit & Loss Report',
          'tax': 'Tax Report',
          'annual': 'Annual Report',
          'z-report': 'Z-Report'
        };
        return tabLabels[tabName] || 'Reports';
      }
      return 'Reports';
    }

    // Handle discount tabs
    if (url.includes('/discount?tab=')) {
      const tabMatch = url.match(/tab=([^&]+)/);
      if (tabMatch) {
        const tabName = tabMatch[1];
        if (tabName === 'discounts') return 'Discounts';
        if (tabName === 'plans') return 'Discount Plans';
      }
      return 'Discounts';
    }

    // If still no match, format the last segment nicely
    const pageSlug = lastSegment || 'overview';
    return pageSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle route changes
  useEffect(() => {
    const handleStart = (url) => {
      // Prevent transition for query changes on the same page
      if (router.pathname === url.split('?')[0]) {
        return;
      }
      setIsLoading(true);
      setLoadingProgress(0);
      setIsTransitioning(true);
      
      // Set dynamic loading text based on the page being loaded
      const pageName = getPageName(url);
      setCurrentLoadingText(`Loading ${pageName}...`);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 100);

      // Store interval reference for cleanup
      timeoutRef.current = progressInterval;
    };

    const handleComplete = () => {
      setLoadingProgress(100);
      setIsLoading(false);
      
      // Keep transition state for smooth completion
      setTimeout(() => {
        setIsTransitioning(false);
        setLoadingProgress(0);
      }, transitionDuration);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsTransitioning(false);
      setLoadingProgress(0);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
      
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [router, transitionDuration]);

  return (
    <>
      {/* Top Progress Bar */}
      {showProgressBar && (
        <TopProgressBar 
          isLoading={isLoading} 
          progress={loadingProgress}
          color={color}
          height="2px"
          showSpinner={false}
          autoComplete={false}
        />
      )}

      {/* Page Content with Transition */}
      <div 
        className={`transition-all duration-${transitionDuration} ease-in-out ${
          isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {children}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 min-h-screen bg-white/80 backdrop-blur-sm z-[9998] flex items-center justify-center">
          <div className="text-center">
            {/* Loading Spinner */}
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full" />
              </div>
            </div>
            
            {/* Loading Text */}
            {showLoadingText && (
              <p className="text-lg font-medium text-gray-700 animate-pulse">
                {currentLoadingText}
              </p>
            )}
            
            {/* Progress Bar */}
            <div className="w-64 bg-gray-200 rounded-full h-2 mt-4 mx-auto overflow-hidden">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            {/* Progress Percentage */}
            <p className="text-sm text-gray-500 mt-2">
              {Math.round(loadingProgress)}%
            </p>
          </div>
        </div>
      )}
    </>
  );
} 