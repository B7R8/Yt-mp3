import sqlite3 from 'sqlite3';
declare const db: sqlite3.Database;
export declare function initializeDatabase(): Promise<void>;
export declare function ensureDirectDownloadUrlColumn(): Promise<void>;
export declare function query(text: string, params?: unknown[]): Promise<{
    rows: any[];
    rowCount: number;
}>;
export declare function getRow(text: string, params?: unknown[]): Promise<{
    rows: any[];
    rowCount: number;
}>;
export declare function runQuery(text: string, params?: unknown[]): Promise<{
    rowCount: any;
}>;
export default db;
//# sourceMappingURL=sqliteDatabase.d.ts.map