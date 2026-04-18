// src/utils/memoryManager.ts
interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private cache = new Map<string, CacheItem<any>>();
  private maxCacheSize = 100;
  private ttl = 5 * 60 * 1000; // 5 minutes

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  set<T>(key: string, data: T): void {
    // Clean expired items
    this.cleanup();

    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    let totalAccess = 0;
    for (const item of this.cache.values()) {
      totalAccess += item.accessCount;
    }
    return totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0;
  }
}

export const memoryManager = MemoryManager.getInstance();

// React Hook for caching
export function useCache<T>() {
  const setCache = useCallback((key: string, data: T) => {
    memoryManager.set(key, data);
  }, []);

  const getCache = useCallback(<T>(key: string): T | null => {
    return memoryManager.get<T>(key);
  }, []);

  const deleteCache = useCallback((key: string) => {
    return memoryManager.delete(key);
  }, []);

  return { setCache, getCache, deleteCache };
}