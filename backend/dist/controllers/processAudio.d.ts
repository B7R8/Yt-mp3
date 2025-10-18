import { Request, Response } from 'express';
export interface ProcessAudioResponse {
    jobId: string;
    status: string;
    downloadUrl?: string;
}
export interface DownloadResponse {
    success: boolean;
    message?: string;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
}
/**
 * Process audio file from URL
 * POST /api/process
 */
export declare function processAudio(req: Request, res: Response): Promise<void>;
/**
 * Download processed audio file
 * GET /api/download/:token
 */
export declare function downloadAudio(req: Request, res: Response): Promise<void>;
/**
 * Get job status
 * GET /api/job/:jobId
 */
export declare function getJobStatus(req: Request, res: Response): Promise<void>;
/**
 * Cleanup expired jobs (called by cron)
 */
export declare function cleanupExpiredJobs(): Promise<void>;
//# sourceMappingURL=processAudio.d.ts.map