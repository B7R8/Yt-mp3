"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisManager = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("./logger"));
class RedisManager {
    constructor() {
        this.isConnected = false;
        const config = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            keepAlive: 30000,
            connectTimeout: 10000,
            commandTimeout: 5000
        };
        // Main client for caching and general operations
        this.client = new ioredis_1.default(config);
        // Separate clients for pub/sub to avoid blocking
        this.subscriber = new ioredis_1.default(config);
        this.publisher = new ioredis_1.default(config);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('connect', () => {
            logger_1.default.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('error', (error) => {
            logger_1.default.error('Redis client error:', error);
            this.isConnected = false;
        });
        this.client.on('close', () => {
            logger_1.default.warn('Redis client connection closed');
            this.isConnected = false;
        });
        this.subscriber.on('connect', () => {
            logger_1.default.info('Redis subscriber connected');
        });
        this.subscriber.on('error', (error) => {
            logger_1.default.error('Redis subscriber error:', error);
        });
        this.publisher.on('connect', () => {
            logger_1.default.info('Redis publisher connected');
        });
        this.publisher.on('error', (error) => {
            logger_1.default.error('Redis publisher error:', error);
        });
    }
    async connect() {
        try {
            await Promise.all([
                this.client.connect(),
                this.subscriber.connect(),
                this.publisher.connect()
            ]);
            logger_1.default.info('All Redis connections established');
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    // Cache operations
    async set(key, value, ttlSeconds) {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
        }
        catch (error) {
            logger_1.default.error(`Redis SET error for key ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.default.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }
    async del(key) {
        try {
            return await this.client.del(key);
        }
        catch (error) {
            logger_1.default.error(`Redis DEL error for key ${key}:`, error);
            return 0;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Redis EXISTS error for key ${key}:`, error);
            return false;
        }
    }
    // Hash operations for complex data
    async hset(key, field, value) {
        try {
            const serialized = JSON.stringify(value);
            await this.client.hset(key, field, serialized);
        }
        catch (error) {
            logger_1.default.error(`Redis HSET error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }
    async hget(key, field) {
        try {
            const value = await this.client.hget(key, field);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.default.error(`Redis HGET error for key ${key}, field ${field}:`, error);
            return null;
        }
    }
    async hdel(key, field) {
        try {
            return await this.client.hdel(key, field);
        }
        catch (error) {
            logger_1.default.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
            return 0;
        }
    }
    // List operations for job queues
    async lpush(key, ...values) {
        try {
            const serialized = values.map(v => JSON.stringify(v));
            return await this.client.lpush(key, ...serialized);
        }
        catch (error) {
            logger_1.default.error(`Redis LPUSH error for key ${key}:`, error);
            return 0;
        }
    }
    async rpop(key) {
        try {
            const value = await this.client.rpop(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            logger_1.default.error(`Redis RPOP error for key ${key}:`, error);
            return null;
        }
    }
    async llen(key) {
        try {
            return await this.client.llen(key);
        }
        catch (error) {
            logger_1.default.error(`Redis LLEN error for key ${key}:`, error);
            return 0;
        }
    }
    // Set operations for tracking
    async sadd(key, ...members) {
        try {
            return await this.client.sadd(key, ...members);
        }
        catch (error) {
            logger_1.default.error(`Redis SADD error for key ${key}:`, error);
            return 0;
        }
    }
    async srem(key, ...members) {
        try {
            return await this.client.srem(key, ...members);
        }
        catch (error) {
            logger_1.default.error(`Redis SREM error for key ${key}:`, error);
            return 0;
        }
    }
    async smembers(key) {
        try {
            return await this.client.smembers(key);
        }
        catch (error) {
            logger_1.default.error(`Redis SMEMBERS error for key ${key}:`, error);
            return [];
        }
    }
    // Pub/Sub operations
    async publish(channel, message) {
        try {
            const serialized = JSON.stringify(message);
            return await this.publisher.publish(channel, serialized);
        }
        catch (error) {
            logger_1.default.error(`Redis PUBLISH error for channel ${channel}:`, error);
            return 0;
        }
    }
    async subscribe(channel, callback) {
        try {
            await this.subscriber.subscribe(channel);
            this.subscriber.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    try {
                        const parsed = JSON.parse(message);
                        callback(parsed);
                    }
                    catch (error) {
                        logger_1.default.error(`Error parsing Redis message for channel ${channel}:`, error);
                    }
                }
            });
        }
        catch (error) {
            logger_1.default.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
            throw error;
        }
    }
    // Atomic operations
    async incr(key) {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            logger_1.default.error(`Redis INCR error for key ${key}:`, error);
            return 0;
        }
    }
    async decr(key) {
        try {
            return await this.client.decr(key);
        }
        catch (error) {
            logger_1.default.error(`Redis DECR error for key ${key}:`, error);
            return 0;
        }
    }
    // Expiration operations
    async expire(key, seconds) {
        try {
            const result = await this.client.expire(key, seconds);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Redis EXPIRE error for key ${key}:`, error);
            return false;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(key);
        }
        catch (error) {
            logger_1.default.error(`Redis TTL error for key ${key}:`, error);
            return -1;
        }
    }
    // Batch operations
    async mget(keys) {
        try {
            const values = await this.client.mget(...keys);
            return values.map(v => v ? JSON.parse(v) : null);
        }
        catch (error) {
            logger_1.default.error(`Redis MGET error for keys ${keys.join(', ')}:`, error);
            return keys.map(() => null);
        }
    }
    async mset(keyValuePairs) {
        try {
            const serialized = [];
            for (const [key, value] of Object.entries(keyValuePairs)) {
                serialized.push(key, JSON.stringify(value));
            }
            await this.client.mset(...serialized);
        }
        catch (error) {
            logger_1.default.error(`Redis MSET error:`, error);
            throw error;
        }
    }
    // Health check
    async ping() {
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            logger_1.default.error('Redis PING error:', error);
            return false;
        }
    }
    // Get connection status
    isHealthy() {
        return this.isConnected;
    }
    // Close connections
    async disconnect() {
        try {
            await Promise.all([
                this.client.disconnect(),
                this.subscriber.disconnect(),
                this.publisher.disconnect()
            ]);
            logger_1.default.info('All Redis connections closed');
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from Redis:', error);
        }
    }
    // Get Redis client for advanced operations
    getClient() {
        return this.client;
    }
    getSubscriber() {
        return this.subscriber;
    }
    getPublisher() {
        return this.publisher;
    }
}
// Export singleton instance
exports.redisManager = new RedisManager();
exports.default = exports.redisManager;
//# sourceMappingURL=redis.js.map