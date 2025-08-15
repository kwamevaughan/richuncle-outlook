import { useState, useEffect, useCallback, useRef } from 'react';

// Cache for storing API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useOptimizedData(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const {
    dependencies = [],
    cacheKey = endpoint,
    cacheDuration = CACHE_DURATION,
    transform = (data) => data,
    onSuccess,
    onError
  } = options;

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('useOptimizedData: Raw API response:', result);
      console.log('useOptimizedData: result.data:', result.data);
      console.log('useOptimizedData: result.data || result:', result.data || result);
      const transformedData = transform(result.data || result);
      console.log('useOptimizedData: Transformed data:', transformedData);

      // Cache the result
      cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      setData(transformedData);
      onSuccess?.(transformedData);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        onError?.(err);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, cacheKey, cacheDuration, transform, onSuccess, onError]);

  // Invalidate cache function
  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  // Refresh data function
  const refresh = useCallback(() => {
    cache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache
  };
}

// Batch data fetching hook
export function useBatchData(endpoints, options = {}) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const {
    dependencies = [],
    parallel = true
  } = options;

  const fetchBatchData = useCallback(async () => {
    setLoading(true);
    setErrors({});

    try {
      if (parallel) {
        // Fetch all endpoints in parallel
        const promises = endpoints.map(async ({ key, endpoint, transform = (d) => d }) => {
          try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            return { key, data: transform(result.data || result), error: null };
          } catch (error) {
            return { key, data: null, error: error.message };
          }
        });

        const results = await Promise.all(promises);
        
        const newData = {};
        const newErrors = {};
        
        results.forEach(({ key, data, error }) => {
          if (error) {
            newErrors[key] = error;
          } else {
            newData[key] = data;
          }
        });

        setData(newData);
        setErrors(newErrors);
      } else {
        // Fetch endpoints sequentially
        const newData = {};
        const newErrors = {};

        for (const { key, endpoint, transform = (d) => d } of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            newData[key] = transform(result.data || result);
          } catch (error) {
            newErrors[key] = error.message;
          }
        }

        setData(newData);
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoints, parallel]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData, ...dependencies]);

  return {
    data,
    loading,
    errors,
    refresh: fetchBatchData
  };
}

// Clear all cache
export function clearCache() {
  cache.clear();
}