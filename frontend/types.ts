
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}


export type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';

export interface ConversionResponse {
  success: boolean;
  jobId: string;
  status: string;
  message: string;
}

export interface StatusResponse {
  success: boolean;
  jobId: string;
  status: string;
  message?: string;
  video_title?: string;
  mp3_filename?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
