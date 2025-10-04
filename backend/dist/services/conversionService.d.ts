import { ConversionJob, ConversionRequest } from '../types';
export declare class ConversionService {
    private downloadsDir;
    constructor();
    private ensureDownloadsDir;
    private extractVideoTitle;
    createJob(request: ConversionRequest): Promise<string>;
    getJobStatus(jobId: string): Promise<ConversionJob | null>;
    private updateJobStatus;
    private processConversion;
    getJobFilePath(jobId: string): Promise<string | null>;
    cleanupOldFiles(): Promise<void>;
}
//# sourceMappingURL=conversionService.d.ts.map