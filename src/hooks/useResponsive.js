import { useState, useEffect } from "react";

const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  const [deviceType, setDeviceType] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
  });

  useEffect(() => {
    // Function to update window size and device type
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({
        width,
        height,
      });

      // Update device type based on standard breakpoints
      setDeviceType({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024 && width < 1920,
        isLargeDesktop: width >= 1920,
      });
    }

    // Only run on client side
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Helper functions for common breakpoints
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  };

  const isBreakpoint = (breakpoint) => {
    if (typeof window === "undefined") return false;
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isBetweenBreakpoints = (minBreakpoint, maxBreakpoint) => {
    if (typeof window === "undefined") return false;
    return (
      windowSize.width >= breakpoints[minBreakpoint] &&
      windowSize.width < breakpoints[maxBreakpoint]
    );
  };

  // Responsive utilities
  const shouldCollapseSidebar = deviceType.isMobile || deviceType.isTablet;
  const shouldUseCardLayout = deviceType.isMobile || deviceType.isTablet;
  const shouldShowFullTable = !deviceType.isMobile && !deviceType.isTablet;

  // Content container classes based on device
  const getContentContainerClass = (sidebarOpen = false) => {
    if (deviceType.isMobile || deviceType.isTablet) {
      return "px-2 sm:px-4";
    }
    return sidebarOpen ? "ml-60 px-6" : "ml-16 px-6";
  };

  // Table container classes
  const getTableContainerClass = () => {
    if (deviceType.isMobile) {
      return "overflow-hidden";
    }
    if (deviceType.isTablet) {
      return "overflow-x-auto max-w-full";
    }
    return "overflow-x-auto";
  };

  return {
    windowSize,
    ...deviceType,
    isBreakpoint,
    isBetweenBreakpoints,
    shouldCollapseSidebar,
    shouldUseCardLayout,
    shouldShowFullTable,
    getContentContainerClass,
    getTableContainerClass,
    breakpoints,
  };
};

export default useResponsive;
