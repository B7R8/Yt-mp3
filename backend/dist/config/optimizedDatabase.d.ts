import { Database } from 'sqlite';
import { EventEmitter } from 'events';
declare class OptimizedDatabase extends EventEmitter {
    private pool;
    private dbPath;
    private isInitialized;
    constructor();
    initialize(): Promise<void>;
    private initializeSchema;
    getConnection(): Promise<Database>;
    releaseConnection(connection: Database): void;
    withConnection<T>(callback: (db: Database) => Promise<T>): Promise<T>;
    get(query: string, params?: any[]): Promise<any>;
    all(query: string, params?: any[]): Promise<any[]>;
    run(query: string, params?: any[]): Promise<any>;
    exec(query: string): Promise<void>;
    batchRun(queries: {
        query: string;
        params: any[];
    }[]): Promise<void>;
    getCachedConversion(cacheKey: string): Promise<any>;
    setCachedConversion(cacheKey: string, youtubeUrl: string, quality: string, filePath: string, fileSize: number, trimStart?: string, trimEnd?: string): Promise<void>;
    updateCacheAccess(cacheKey: string): Promise<void>;
    cleanupOldCache(maxAgeHours?: number): Promise<number>;
    getPoolStats(): {
        totalConnections: number;
        availableConnections: number;
        inUseConnections: number;
    };
    close(): Promise<void>;
}
export declare const optimizedDb: OptimizedDatabase;
export default optimizedDb;
//# sourceMappingURL=optimizedDatabase.d.ts.map