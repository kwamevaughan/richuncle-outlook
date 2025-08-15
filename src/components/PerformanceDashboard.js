import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor, useMemoryMonitor } from '../hooks/usePerformanceMonitor';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgResponseTime: 0,
    peakMemory: 0,
    activeUsers: 0
  });

  const [alerts, setAlerts] = useState([]);
  const { logMemoryUsage } = useMemoryMonitor();

  // Performance thresholds
  const THRESHOLDS = {
    responseTime: 500, // ms
    memoryUsage: 500, // MB
    cacheHitRate: 0.8, // 80%
    concurrentUsers: 50
  };

  useEffect(() => {
    // Monitor performance metrics
    const interval = setInterval(() => {
      const newAlerts = [];
      
      // Check response time
      if (metrics.avgResponseTime > THRESHOLDS.responseTime) {
        newAlerts.push({
          type: 'warning',
          message: `High response time: ${metrics.avgResponseTime}ms`,
          recommendation: 'Consider adding Redis caching'
        });
      }

      // Check memory usage
      if (metrics.peakMemory > THRESHOLDS.memoryUsage) {
        newAlerts.push({
          type: 'warning',
          message: `High memory usage: ${metrics.peakMemory}MB`,
          recommendation: 'Consider Redis for external caching'
        });
      }

      // Check cache hit rate
      const hitRate = metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses);
      if (hitRate < THRESHOLDS.cacheHitRate) {
        newAlerts.push({
          type: 'info',
          message: `Low cache hit rate: ${(hitRate * 100).toFixed(1)}%`,
          recommendation: 'Optimize cache strategy'
        });
      }

      // Check concurrent users
      if (metrics.activeUsers > THRESHOLDS.concurrentUsers) {
        newAlerts.push({
          type: 'critical',
          message: `High concurrent users: ${metrics.activeUsers}`,
          recommendation: 'Time to consider Redis + load balancing'
        });
      }

      setAlerts(newAlerts);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [metrics]);

  // Redis recommendation logic
  const shouldConsiderRedis = () => {
    return (
      metrics.avgResponseTime > THRESHOLDS.responseTime ||
      metrics.peakMemory > THRESHOLDS.memoryUsage ||
      metrics.activeUsers > THRESHOLDS.concurrentUsers
    );
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-lg mb-3 flex items-center">
        📊 Performance Monitor
        {shouldConsiderRedis() && (
          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
            Redis Ready
          </span>
        )}
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-bold text-blue-600">{metrics.apiCalls}</div>
            <div className="text-xs">API Calls</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-bold text-green-600">
              {((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100 || 0).toFixed(1)}%
            </div>
            <div className="text-xs">Cache Hit Rate</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="font-bold text-purple-600">{metrics.avgResponseTime}ms</div>
            <div className="text-xs">Avg Response</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="font-bold text-yellow-600">{metrics.activeUsers}</div>
            <div className="text-xs">Active Users</div>
          </div>
        </div>

        {/* Redis Recommendation */}
        {shouldConsiderRedis() && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="font-semibold text-orange-800 text-sm">🚀 Scale-Up Recommendation</div>
            <div className="text-xs text-orange-700 mt-1">
              Your app is performing well but showing signs it's ready for Redis caching:
            </div>
            <ul className="text-xs text-orange-700 mt-2 space-y-1">
              <li>• Distributed caching across servers</li>
              <li>• Better memory management</li>
              <li>• Session persistence</li>
              <li>• Real-time sync across stores</li>
            </ul>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-3 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  alert.type === 'critical'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <div className="font-semibold">{alert.message}</div>
                <div className="mt-1">{alert.recommendation}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;