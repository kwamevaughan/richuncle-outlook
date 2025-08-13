import { useState, useEffect, useCallback, useMemo } from "react";

const useSidebar = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(null); // Initial state is null
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [windowWidth, setWindowWidth] = useState(null);

  const [sidebarState, setSidebarState] = useState({
    hidden: false,
    offset: 0,
  });

  // Fix: Move isMobile and isTablet calculation inside useMemo to prevent hydration mismatches
  const isMobile = useMemo(() => {
    if (windowWidth === null) return false; // Default to false during SSR
    return windowWidth < 640;
  }, [windowWidth]);

  const isTablet = useMemo(() => {
    if (windowWidth === null) return false; // Default to false during SSR
    return windowWidth >= 640 && windowWidth < 1024; // sm to lg breakpoint
  }, [windowWidth]);

  const getInitialSidebarState = () => {
    if (typeof window === "undefined") return false; // SSR default
    const savedState = localStorage.getItem("sidebarOpen");
    return savedState !== null
      ? JSON.parse(savedState)
      : window.innerWidth > 768;
  };

  useEffect(() => {
    // Initialize sidebar state
    const initialState = getInitialSidebarState();
    setSidebarOpen(initialState);
    setIsLoading(false); // Once the state is set, stop loading
  }, []);

  useEffect(() => {
    if (isSidebarOpen !== null) {
      // Sync state with localStorage and apply body class only when `isSidebarOpen` is set
      localStorage.setItem("sidebarOpen", JSON.stringify(isSidebarOpen));
      if (typeof window !== "undefined") {
        document.body.classList.toggle("sidebar-open", isSidebarOpen);
        document.body.classList.toggle("sidebar-closed", !isSidebarOpen);
      }
    }
  }, [isSidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Handle sidebar visibility changes from custom events
  useEffect(() => {
    const handleSidebarChange = (e) => {
      const newHidden = e.detail.hidden;
      setSidebarState((prev) => {
        if (prev.hidden === newHidden) return prev;
        return { ...prev, hidden: newHidden };
      });
    };

    // Add event listener to listen for sidebar visibility change events
    document.addEventListener("sidebarVisibilityChange", handleSidebarChange);

    return () =>
      document.removeEventListener(
        "sidebarVisibilityChange",
        handleSidebarChange
      );
  }, []);

  const updateDragOffset = useCallback((offset) => {
    setSidebarState((prev) => {
      if (prev.offset === offset) return prev;
      return { ...prev, offset };
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isSidebarOpen,
    toggleSidebar,
    isLoading,
    sidebarState,
    updateDragOffset,
    isMobile,
    isTablet,
  };
};

export default useSidebar;
