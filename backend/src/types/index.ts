export interface ConversionJob {
  id: string;
  youtube_url: string;
  video_title?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mp3_filename?: string;
  error_message?: string;
  quality_message?: string;
  direct_download_url?: string; // Direct API download URL
  created_at: Date;
  updated_at: Date;
}

export interface ConversionRequest {
  url: string;
  quality?: string;
  trim_start?: string;
  trim_end?: string;
}

export interface ConversionResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface StatusResponse {
  jobId: string;
  status: string;
  video_title?: string;
  mp3_filename?: string;
  error_message?: string;
  quality_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
