import { useEffect, useRef, useCallback } from "react";

export function usePerformanceMonitor(componentName) {
  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - renderStartTime.current;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Performance] ${componentName} render #${
          renderCount.current
        }: ${renderTime.toFixed(2)}ms`
      );
    }

    renderStartTime.current = performance.now();
  });

  const measureFunction = useCallback(
    (fn, functionName) => {
      return (...args) => {
        const start = performance.now();
        const result = fn(...args);
        const end = performance.now();

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Performance] ${componentName}.${functionName}: ${(
              end - start
            ).toFixed(2)}ms`
          );
        }

        return result;
      };
    },
    [componentName]
  );

  const measureAsyncFunction = useCallback(
    (fn, functionName) => {
      return async (...args) => {
        const start = performance.now();
        const result = await fn(...args);
        const end = performance.now();

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Performance] ${componentName}.${functionName}: ${(
              end - start
            ).toFixed(2)}ms`
          );
        }

        return result;
      };
    },
    [componentName]
  );

  return {
    measureFunction,
    measureAsyncFunction,
    renderCount: renderCount.current,
  };
}

// Memory usage monitoring
export function useMemoryMonitor() {
  const logMemoryUsage = useCallback(() => {
    if (performance.memory && process.env.NODE_ENV === "development") {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } =
        performance.memory;
      console.log("[Memory]", {
        used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        usage: `${((usedJSHeapSize / jsHeapSizeLimit) * 100).toFixed(2)}%`,
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(logMemoryUsage, 10000); // Log every 10 seconds
    return () => clearInterval(interval);
  }, [logMemoryUsage]);

  return { logMemoryUsage };
}
