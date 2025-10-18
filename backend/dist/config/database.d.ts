declare let db: any;
export declare function initializeDatabase(): Promise<void>;
export declare function query(text: string, params?: unknown[]): Promise<any>;
export declare function queryWithParams(text: string, params?: unknown[]): Promise<any>;
export declare function ensureDirectDownloadUrlColumn(): Promise<void>;
export declare function ensureQualityColumns(): Promise<void>;
export default db;
//# sourceMappingURL=database.d.ts.map