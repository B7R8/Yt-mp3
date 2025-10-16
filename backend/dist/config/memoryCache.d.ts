interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
}
declare class MemoryCacheManager {
    private cache;
    private stats;
    private cleanupInterval;
    constructor();
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    del(key: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    hset(key: string, field: string, value: any): Promise<void>;
    hget<T>(key: string, field: string): Promise<T | null>;
    hdel(key: string, field: string): Promise<number>;
    private getList;
    private setList;
    lpush(key: string, ...values: any[]): Promise<number>;
    rpop<T>(key: string): Promise<T | null>;
    llen(key: string): Promise<number>;
    private getSet;
    private setSet;
    sadd(key: string, ...members: string[]): Promise<number>;
    srem(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    private subscribers;
    publish(channel: string, message: any): Promise<number>;
    subscribe(channel: string, callback: (message: any) => void): Promise<void>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    mset(keyValuePairs: Record<string, any>): Promise<void>;
    ping(): Promise<boolean>;
    isHealthy(): boolean;
    getStats(): CacheStats & {
        size: number;
    };
    clear(): Promise<void>;
    private cleanupExpired;
    disconnect(): Promise<void>;
    getClient(): any;
    getSubscriber(): any;
    getPublisher(): any;
}
export declare const memoryCache: MemoryCacheManager;
export default memoryCache;
//# sourceMappingURL=memoryCache.d.ts.map