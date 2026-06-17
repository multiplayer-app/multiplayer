interface LRUCacheData {
  lastAccessed?: number;
  [key: string]: any;
}

interface LRUCache {
  [cacheKey: string]: LRUCacheData;
}

interface LRUConfig {
  maxEntries: number;
  maxSizeBytes: number;
  storageKey: string;
  prevStorageKey: string;
}

class LRUStorageService {
  private config: LRUConfig;

  constructor(config: LRUConfig) {
    this.config = config;
    localStorage.removeItem(config.prevStorageKey);
  }

  private getCacheSize(cache: object): number {
    return new Blob([JSON.stringify(cache)]).size;
  }

  private cleanupCache(cache: LRUCache): LRUCache {
    const entries = Object.entries(cache);

    if (entries.length <= this.config.maxEntries) {
      return cache;
    }

    const sortedEntries = entries
      .filter(([_, value]) => value && typeof value === 'object')
      .sort((a, b) => {
        const aTime = a[1].lastAccessed || 0;
        const bTime = b[1].lastAccessed || 0;
        return aTime - bTime;
      });

    const entriesToKeep = sortedEntries.slice(-this.config.maxEntries);
    return Object.fromEntries(entriesToKeep);
  }

  private validateAndCleanCache(cache: LRUCache): LRUCache {
    let cleanedCache = this.cleanupCache(cache);

    while (this.getCacheSize(cleanedCache) > this.config.maxSizeBytes && Object.keys(cleanedCache).length > 1) {
      const entries = Object.entries(cleanedCache)
        .filter(([_, value]) => value && typeof value === 'object')
        .sort((a, b) => {
          const aTime = a[1].lastAccessed || 0;
          const bTime = b[1].lastAccessed || 0;
          return aTime - bTime;
        });

      if (entries.length <= 1) break;

      const [oldestKey] = entries[0];
      delete cleanedCache[oldestKey];
    }

    return cleanedCache;
  }

  get(): LRUCache {
    try {
      const cachedData = localStorage.getItem(this.config.storageKey);
      if (!cachedData) {
        return {};
      }

      const cache = JSON.parse(cachedData);
      if (!cache || typeof cache !== 'object') {
        return {};
      }

      const cleanedCache = this.validateAndCleanCache(cache);

      if (Object.keys(cleanedCache).length !== Object.keys(cache).length) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(cleanedCache));
      }

      return cleanedCache;
    } catch (error) {
      console.warn(`Failed to retrieve cache for ${this.config.storageKey}:`, error);
      return {};
    }
  }

  set(cacheKey: string, data: any): void {
    try {
      const cache = this.get();

      const existingData = cache[cacheKey] || {};
      const dataWithTimestamp = {
        ...existingData,
        ...data,
        lastAccessed: Date.now()
      };

      cache[cacheKey] = dataWithTimestamp;

      const cleanedCache = this.validateAndCleanCache(cache);
      localStorage.setItem(this.config.storageKey, JSON.stringify(cleanedCache));
    } catch (error) {
      console.warn(`Failed to set cache for ${this.config.storageKey}:`, error);
    }
  }

  getEntry(cacheKey: string): any {
    try {
      const cache = this.get();
      return cache[cacheKey];
    } catch (error) {
      console.warn(`Failed to get entry for ${cacheKey}:`, error);
      return null;
    }
  }

  clearOldEntries(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): void {
    const now = Date.now();

    try {
      const cache = this.get();
      const cleanedCache = Object.fromEntries(
        Object.entries(cache).filter(([_, value]) => {
          const age = now - (value.lastAccessed || 0);
          return age <= maxAgeMs;
        })
      );

      if (Object.keys(cleanedCache).length !== Object.keys(cache).length) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(cleanedCache));
      }
    } catch (error) {
      console.warn(`Failed to clear old entries for ${this.config.storageKey}:`, error);
    }
  }

  getStats(): { entries: number; sizeBytes: number } {
    try {
      const cache = this.get();

      return {
        entries: Object.keys(cache).length,
        sizeBytes: this.getCacheSize(cache)
      };
    } catch (error) {
      console.warn(`Failed to get stats for ${this.config.storageKey}:`, error);
      return {
        entries: 0,
        sizeBytes: 0
      };
    }
  }
}

export const createLRUStorage = (config: LRUConfig): LRUStorageService => {
  return new LRUStorageService(config);
};

export type { LRUStorageService, LRUConfig, LRUCacheData };
