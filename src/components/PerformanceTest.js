import React, { useState, useEffect } from 'react';
import { useOptimizedData } from '../hooks/useOptimizedData';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

const PerformanceTest = () => {
  const { measureAsyncFunction } = usePerformanceMonitor('PerformanceTest');
  const [testResults, setTestResults] = useState({});

  // Test optimized data fetching
  const { data: products, loading: productsLoading } = useOptimizedData('/api/products', {
    cacheKey: 'performance-test-products'
  });

  const { data: searchResults, loading: searchLoading } = useOptimizedData('/api/search?q=test', {
    cacheKey: 'performance-test-search'
  });

  // Performance tests
  const runPerformanceTests = measureAsyncFunction(async () => {
    const results = {};
    
    // Test 1: API Response Time
    const apiStart = performance.now();
    try {
      const response = await fetch('/api/products?limit=100');
      await response.json();
      results.apiResponseTime = performance.now() - apiStart;
    } catch (error) {
      results.apiResponseTime = 'Error';
    }

    // Test 2: Search Performance
    const searchStart = performance.now();
    try {
      const searchResponse = await fetch('/api/search?q=product');
      await searchResponse.json();
      results.searchResponseTime = performance.now() - searchStart;
    } catch (error) {
      results.searchResponseTime = 'Error';
    }

    // Test 3: Large Array Processing
    const arrayStart = performance.now();
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    const filtered = largeArray.filter(item => item.name.includes('5'));
    results.arrayProcessingTime = performance.now() - arrayStart;
    results.filteredCount = filtered.length;

    // Test 4: Map vs Array.find performance
    const mapTestArray = Array.from({ length: 1000 }, (_, i) => ({ id: `id-${i}`, value: i }));
    const mapLookup = new Map(mapTestArray.map(item => [item.id, item]));
    
    // Array.find test
    const arrayFindStart = performance.now();
    for (let i = 0; i < 100; i++) {
      mapTestArray.find(item => item.id === `id-${i * 10}`);
    }
    results.arrayFindTime = performance.now() - arrayFindStart;
    
    // Map.get test
    const mapGetStart = performance.now();
    for (let i = 0; i < 100; i++) {
      mapLookup.get(`id-${i * 10}`);
    }
    results.mapGetTime = performance.now() - mapGetStart;
    results.mapVsArraySpeedup = `${(results.arrayFindTime / results.mapGetTime).toFixed(2)}x faster`;

    setTestResults(results);
  }, 'runPerformanceTests');

  useEffect(() => {
    runPerformanceTests();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-lg mb-3">Performance Monitor</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Products API:</span>
          <span className={productsLoading ? 'text-yellow-600' : 'text-green-600'}>
            {productsLoading ? 'Loading...' : `${products?.length || 0} items`}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Search API:</span>
          <span className={searchLoading ? 'text-yellow-600' : 'text-green-600'}>
            {searchLoading ? 'Loading...' : 'Ready'}
          </span>
        </div>

        {Object.keys(testResults).length > 0 && (
          <>
            <hr className="my-2" />
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>API Response:</span>
                <span className="font-mono">
                  {typeof testResults.apiResponseTime === 'number' 
                    ? `${testResults.apiResponseTime.toFixed(2)}ms`
                    : testResults.apiResponseTime
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Search Response:</span>
                <span className="font-mono">
                  {typeof testResults.searchResponseTime === 'number'
                    ? `${testResults.searchResponseTime.toFixed(2)}ms`
                    : testResults.searchResponseTime
                  }
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Array Processing:</span>
                <span className="font-mono">{testResults.arrayProcessingTime?.toFixed(2)}ms</span>
              </div>
              
              <div className="flex justify-between">
                <span>Array.find:</span>
                <span className="font-mono">{testResults.arrayFindTime?.toFixed(2)}ms</span>
              </div>
              
              <div className="flex justify-between">
                <span>Map.get:</span>
                <span className="font-mono">{testResults.mapGetTime?.toFixed(2)}ms</span>
              </div>
              
              <div className="flex justify-between">
                <span>Map Speedup:</span>
                <span className="font-mono text-green-600">{testResults.mapVsArraySpeedup}</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      <button
        onClick={runPerformanceTests}
        className="mt-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      >
        Run Tests
      </button>
    </div>
  );
};

export default PerformanceTest;