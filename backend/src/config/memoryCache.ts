import logger from './logger';

interface CacheItem {
  value: any;
  expiresAt?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

class MemoryCacheManager {
  private cache: Map<string, CacheItem> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  // Basic cache operations
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
      this.cache.set(key, { value, expiresAt });
      this.stats.sets++;
      logger.debug(`Cache SET: ${key}`);
    } catch (error) {
      logger.error(`Memory cache SET error for key ${key}:`, error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const item = this.cache.get(key);
      if (!item) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return item.value as T;
    } catch (error) {
      logger.error(`Memory cache GET error for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      const existed = this.cache.has(key);
      this.cache.delete(key);
      if (existed) {
        this.stats.deletes++;
        return 1;
      }
      return 0;
    } catch (error) {
      logger.error(`Memory cache DEL error for key ${key}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const item = this.cache.get(key);
      if (!item) return false;
      
      // Check if expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.cache.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Memory cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Hash operations (simulated with prefixed keys)
  async hset(key: string, field: string, value: any): Promise<void> {
    const hashKey = `${key}:${field}`;
    await this.set(hashKey, value);
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    const hashKey = `${key}:${field}`;
    return await this.get<T>(hashKey);
  }

  async hdel(key: string, field: string): Promise<number> {
    const hashKey = `${key}:${field}`;
    return await this.del(hashKey);
  }

  // List operations (simulated with arrays stored as values)
  private getList(key: string): any[] {
    const item = this.cache.get(key);
    return item ? (Array.isArray(item.value) ? item.value : []) : [];
  }

  private setList(key: string, list: any[]): void {
    this.cache.set(key, { value: list });
  }

  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const list = this.getList(key);
      list.unshift(...values);
      this.setList(key, list);
      return list.length;
    } catch (error) {
      logger.error(`Memory cache LPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    try {
      const list = this.getList(key);
      if (list.length === 0) return null;
      return list.pop() as T;
    } catch (error) {
      logger.error(`Memory cache RPOP error for key ${key}:`, error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      const list = this.getList(key);
      return list.length;
    } catch (error) {
      logger.error(`Memory cache LLEN error for key ${key}:`, error);
      return 0;
    }
  }

  // Set operations (simulated with Set objects)
  private getSet(key: string): Set<string> {
    const item = this.cache.get(key);
    return item ? (item.value instanceof Set ? item.value : new Set()) : new Set();
  }

  private setSet(key: string, set: Set<string>): void {
    this.cache.set(key, { value: set });
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const set = this.getSet(key);
      let added = 0;
      for (const member of members) {
        if (!set.has(member)) {
          set.add(member);
          added++;
        }
      }
      this.setSet(key, set);
      return added;
    } catch (error) {
      logger.error(`Memory cache SADD error for key ${key}:`, error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const set = this.getSet(key);
      let removed = 0;
      for (const member of members) {
        if (set.has(member)) {
          set.delete(member);
          removed++;
        }
      }
      this.setSet(key, set);
      return removed;
    } catch (error) {
      logger.error(`Memory cache SREM error for key ${key}:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      const set = this.getSet(key);
      return Array.from(set);
    } catch (error) {
      logger.error(`Memory cache SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  // Pub/Sub operations (simulated with EventEmitter)
  private subscribers: Map<string, ((message: any) => void)[]> = new Map();

  async publish(channel: string, message: any): Promise<number> {
    try {
      const subs = this.subscribers.get(channel) || [];
      subs.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          logger.error(`Error in pub/sub callback for channel ${channel}:`, error);
        }
      });
      return subs.length;
    } catch (error) {
      logger.error(`Memory cache PUBLISH error for channel ${channel}:`, error);
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, []);
      }
      this.subscribers.get(channel)!.push(callback);
      logger.debug(`Subscribed to channel: ${channel}`);
    } catch (error) {
      logger.error(`Memory cache SUBSCRIBE error for channel ${channel}:`, error);
      throw error;
    }
  }

  // Atomic operations
  async incr(key: string): Promise<number> {
    try {
      const current = await this.get<number>(key) || 0;
      const newValue = current + 1;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      logger.error(`Memory cache INCR error for key ${key}:`, error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      const current = await this.get<number>(key) || 0;
      const newValue = current - 1;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      logger.error(`Memory cache DECR error for key ${key}:`, error);
      return 0;
    }
  }

  // Expiration operations
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const item = this.cache.get(key);
      if (!item) return false;
      
      item.expiresAt = Date.now() + (seconds * 1000);
      this.cache.set(key, item);
      return true;
    } catch (error) {
      logger.error(`Memory cache EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const item = this.cache.get(key);
      if (!item || !item.expiresAt) return -1;
      
      const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    } catch (error) {
      logger.error(`Memory cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      return await Promise.all(keys.map(key => this.get<T>(key)));
    } catch (error) {
      logger.error(`Memory cache MGET error for keys ${keys.join(', ')}:`, error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>): Promise<void> {
    try {
      await Promise.all(
        Object.entries(keyValuePairs).map(([key, value]) => this.set(key, value))
      );
    } catch (error) {
      logger.error(`Memory cache MSET error:`, error);
      throw error;
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      logger.error('Memory cache PING error:', error);
      return false;
    }
  }

  // Get connection status
  isHealthy(): boolean {
    return true;
  }

  // Get cache statistics
  getStats(): CacheStats & { size: number } {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.subscribers.clear();
      this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
      logger.info('Memory cache cleared');
    } catch (error) {
      logger.error('Error clearing memory cache:', error);
    }
  }

  // Cleanup expired items
  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired cache items`);
    }
  }

  // Close connections (cleanup)
  async disconnect(): Promise<void> {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.cache.clear();
      this.subscribers.clear();
      logger.info('Memory cache disconnected');
    } catch (error) {
      logger.error('Error disconnecting memory cache:', error);
    }
  }

  // Compatibility methods for Redis client interface
  getClient(): any {
    return this;
  }

  getSubscriber(): any {
    return this;
  }

  getPublisher(): any {
    return this;
  }
}

// Export singleton instance
export const memoryCache = new MemoryCacheManager();
export default memoryCache;
