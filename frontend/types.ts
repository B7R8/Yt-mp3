
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  title?: string;
  url?: string;
  error?: string;
  quality_message?: string;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type Quality = '64K' | '128K' | '192K' | '256K' | '320K';
