import { Request, Response, NextFunction } from 'express';
export declare const USER_ERROR_MESSAGES: {
    NETWORK_ERROR: string;
    TIMEOUT_ERROR: string;
    SERVER_ERROR: string;
    INVALID_URL: string;
    VIDEO_NOT_FOUND: string;
    VIDEO_PRIVATE: string;
    VIDEO_AGE_RESTRICTED: string;
    VIDEO_UNAVAILABLE: string;
    VIDEO_TOO_LONG: string;
    CONVERSION_FAILED: string;
    AUDIO_EXTRACTION_FAILED: string;
    PROCESSING_ERROR: string;
    FILE_TOO_LARGE: string;
    STORAGE_FULL: string;
    INVALID_TIME_RANGE: string;
    START_AFTER_END: string;
    END_EXCEEDS_DURATION: string;
    RATE_LIMITED: string;
    UNKNOWN_ERROR: string;
    TRY_AGAIN: string;
    CONTACT_SUPPORT: string;
};
export declare const getUserFriendlyError: (error: any) => string;
export declare const logTechnicalError: (error: any, context?: string, req?: Request) => void;
export declare const handleError: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const sendErrorResponse: (res: Response, statusCode: number, userMessage: string, technicalError?: any) => void;
//# sourceMappingURL=errorHandler.d.ts.map