"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCache = void 0;
const logger_1 = __importDefault(require("./logger"));
class MemoryCacheManager {
    constructor() {
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
        // Pub/Sub operations (simulated with EventEmitter)
        this.subscribers = new Map();
        // Cleanup expired items every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);
    }
    // Basic cache operations
    async set(key, value, ttlSeconds) {
        try {
            const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
            this.cache.set(key, { value, expiresAt });
            this.stats.sets++;
            logger_1.default.debug(`Cache SET: ${key}`);
        }
        catch (error) {
            logger_1.default.error(`Memory cache SET error for key ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
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
            return item.value;
        }
        catch (error) {
            logger_1.default.error(`Memory cache GET error for key ${key}:`, error);
            return null;
        }
    }
    async del(key) {
        try {
            const existed = this.cache.has(key);
            this.cache.delete(key);
            if (existed) {
                this.stats.deletes++;
                return 1;
            }
            return 0;
        }
        catch (error) {
            logger_1.default.error(`Memory cache DEL error for key ${key}:`, error);
            return 0;
        }
    }
    async exists(key) {
        try {
            const item = this.cache.get(key);
            if (!item)
                return false;
            // Check if expired
            if (item.expiresAt && Date.now() > item.expiresAt) {
                this.cache.delete(key);
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.default.error(`Memory cache EXISTS error for key ${key}:`, error);
            return false;
        }
    }
    // Hash operations (simulated with prefixed keys)
    async hset(key, field, value) {
        const hashKey = `${key}:${field}`;
        await this.set(hashKey, value);
    }
    async hget(key, field) {
        const hashKey = `${key}:${field}`;
        return await this.get(hashKey);
    }
    async hdel(key, field) {
        const hashKey = `${key}:${field}`;
        return await this.del(hashKey);
    }
    // List operations (simulated with arrays stored as values)
    getList(key) {
        const item = this.cache.get(key);
        return item ? (Array.isArray(item.value) ? item.value : []) : [];
    }
    setList(key, list) {
        this.cache.set(key, { value: list });
    }
    async lpush(key, ...values) {
        try {
            const list = this.getList(key);
            list.unshift(...values);
            this.setList(key, list);
            return list.length;
        }
        catch (error) {
            logger_1.default.error(`Memory cache LPUSH error for key ${key}:`, error);
            return 0;
        }
    }
    async rpop(key) {
        try {
            const list = this.getList(key);
            if (list.length === 0)
                return null;
            return list.pop();
        }
        catch (error) {
            logger_1.default.error(`Memory cache RPOP error for key ${key}:`, error);
            return null;
        }
    }
    async llen(key) {
        try {
            const list = this.getList(key);
            return list.length;
        }
        catch (error) {
            logger_1.default.error(`Memory cache LLEN error for key ${key}:`, error);
            return 0;
        }
    }
    // Set operations (simulated with Set objects)
    getSet(key) {
        const item = this.cache.get(key);
        return item ? (item.value instanceof Set ? item.value : new Set()) : new Set();
    }
    setSet(key, set) {
        this.cache.set(key, { value: set });
    }
    async sadd(key, ...members) {
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
        }
        catch (error) {
            logger_1.default.error(`Memory cache SADD error for key ${key}:`, error);
            return 0;
        }
    }
    async srem(key, ...members) {
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
        }
        catch (error) {
            logger_1.default.error(`Memory cache SREM error for key ${key}:`, error);
            return 0;
        }
    }
    async smembers(key) {
        try {
            const set = this.getSet(key);
            return Array.from(set);
        }
        catch (error) {
            logger_1.default.error(`Memory cache SMEMBERS error for key ${key}:`, error);
            return [];
        }
    }
    async publish(channel, message) {
        try {
            const subs = this.subscribers.get(channel) || [];
            subs.forEach(callback => {
                try {
                    callback(message);
                }
                catch (error) {
                    logger_1.default.error(`Error in pub/sub callback for channel ${channel}:`, error);
                }
            });
            return subs.length;
        }
        catch (error) {
            logger_1.default.error(`Memory cache PUBLISH error for channel ${channel}:`, error);
            return 0;
        }
    }
    async subscribe(channel, callback) {
        try {
            if (!this.subscribers.has(channel)) {
                this.subscribers.set(channel, []);
            }
            this.subscribers.get(channel).push(callback);
            logger_1.default.debug(`Subscribed to channel: ${channel}`);
        }
        catch (error) {
            logger_1.default.error(`Memory cache SUBSCRIBE error for channel ${channel}:`, error);
            throw error;
        }
    }
    // Atomic operations
    async incr(key) {
        try {
            const current = await this.get(key) || 0;
            const newValue = current + 1;
            await this.set(key, newValue);
            return newValue;
        }
        catch (error) {
            logger_1.default.error(`Memory cache INCR error for key ${key}:`, error);
            return 0;
        }
    }
    async decr(key) {
        try {
            const current = await this.get(key) || 0;
            const newValue = current - 1;
            await this.set(key, newValue);
            return newValue;
        }
        catch (error) {
            logger_1.default.error(`Memory cache DECR error for key ${key}:`, error);
            return 0;
        }
    }
    // Expiration operations
    async expire(key, seconds) {
        try {
            const item = this.cache.get(key);
            if (!item)
                return false;
            item.expiresAt = Date.now() + (seconds * 1000);
            this.cache.set(key, item);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Memory cache EXPIRE error for key ${key}:`, error);
            return false;
        }
    }
    async ttl(key) {
        try {
            const item = this.cache.get(key);
            if (!item || !item.expiresAt)
                return -1;
            const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
            return remaining > 0 ? remaining : -2;
        }
        catch (error) {
            logger_1.default.error(`Memory cache TTL error for key ${key}:`, error);
            return -1;
        }
    }
    // Batch operations
    async mget(keys) {
        try {
            return await Promise.all(keys.map(key => this.get(key)));
        }
        catch (error) {
            logger_1.default.error(`Memory cache MGET error for keys ${keys.join(', ')}:`, error);
            return keys.map(() => null);
        }
    }
    async mset(keyValuePairs) {
        try {
            await Promise.all(Object.entries(keyValuePairs).map(([key, value]) => this.set(key, value)));
        }
        catch (error) {
            logger_1.default.error(`Memory cache MSET error:`, error);
            throw error;
        }
    }
    // Health check
    async ping() {
        try {
            return true;
        }
        catch (error) {
            logger_1.default.error('Memory cache PING error:', error);
            return false;
        }
    }
    // Get connection status
    isHealthy() {
        return true;
    }
    // Get cache statistics
    getStats() {
        return {
            ...this.stats,
            size: this.cache.size
        };
    }
    // Clear all cache
    async clear() {
        try {
            this.cache.clear();
            this.subscribers.clear();
            this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
            logger_1.default.info('Memory cache cleared');
        }
        catch (error) {
            logger_1.default.error('Error clearing memory cache:', error);
        }
    }
    // Cleanup expired items
    cleanupExpired() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, item] of this.cache.entries()) {
            if (item.expiresAt && now > item.expiresAt) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger_1.default.debug(`Cleaned up ${cleaned} expired cache items`);
        }
    }
    // Close connections (cleanup)
    async disconnect() {
        try {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }
            this.cache.clear();
            this.subscribers.clear();
            logger_1.default.info('Memory cache disconnected');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting memory cache:', error);
        }
    }
    // Compatibility methods for Redis client interface
    getClient() {
        return this;
    }
    getSubscriber() {
        return this;
    }
    getPublisher() {
        return this;
    }
}
// Export singleton instance
exports.memoryCache = new MemoryCacheManager();
exports.default = exports.memoryCache;
//# sourceMappingURL=memoryCache.js.map