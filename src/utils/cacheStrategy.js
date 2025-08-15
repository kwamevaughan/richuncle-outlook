// Progressive caching strategy - start simple, scale up as needed

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // Auto-cleanup to prevent memory leaks
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  // Current implementation - in-memory
  get(key) {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      this.metrics.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return item.data;
  }

  set(key, data, ttl = 5 * 60 * 1000) {
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttl,
      created: Date.now()
    });
    this.metrics.sets++;
  }

  delete(key) {
    const deleted = this.memoryCache.delete(key);
    if (deleted) this.metrics.deletes++;
    return deleted;
  }

  clear() {
    this.memoryCache.clear();
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (process.env.NODE_ENV === 'development' && cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses);
    return {
      ...this.metrics,
      hitRate: isNaN(hitRate) ? 0 : hitRate,
      size: this.memoryCache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage (rough calculation)
  estimateMemoryUsage() {
    let totalSize = 0;
    for (const [key, item] of this.memoryCache.entries()) {
      totalSize += JSON.stringify(key).length;
      totalSize += JSON.stringify(item.data).length;
      totalSize += 50; // Overhead for expiry, created, etc.
    }
    return Math.round(totalSize / 1024); // KB
  }

  // Future: Redis adapter (when you're ready to scale)
  async migrateToRedis() {
    // This would be your migration path when you need Redis
    console.log('Ready to migrate to Redis when needed');
    
    // Example migration logic:
    // 1. Initialize Redis connection
    // 2. Migrate existing cache entries
    // 3. Switch cache operations to Redis
    // 4. Maintain backward compatibility
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Export both the manager and convenience functions
export default cacheManager;

export const cache = {
  get: (key) => cacheManager.get(key),
  set: (key, data, ttl) => cacheManager.set(key, data, ttl),
  delete: (key) => cacheManager.delete(key),
  clear: () => cacheManager.clear(),
  stats: () => cacheManager.getStats()
};

// Cache decorators for easy adoption
export function withCache(fn, keyGenerator, ttl = 5 * 60 * 1000) {
  return async (...args) => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);
    
    if (cached) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  };
}

// Example usage:
// const getCachedProducts = withCache(
//   fetchProducts,
//   (filters) => `products:${JSON.stringify(filters)}`,
//   10 * 60 * 1000 // 10 minutes
// );