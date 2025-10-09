// Streaming API service for high-performance audio conversion
export interface StreamingConversionRequest {
  url: string;
  quality: string;
  trim?: {
    start: string;
    end: string;
  };
}

export interface ConversionInfo {
  success: boolean;
  jobId: string;
  metadata: {
    title: string;
    duration: number;
    durationFormatted: string;
  };
  quality: string;
  message?: string;
  streamingUrl: string;
}

export interface JobStatus {
  success: boolean;
  jobId: string;
  status: string;
  video_title?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get conversion information before streaming
 */
export const getConversionInfo = async (request: StreamingConversionRequest): Promise<ConversionInfo> => {
  const response = await fetch('/api/stream-convert-info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Stream audio conversion directly to client
 */
export const streamAudioConversion = async (
  request: StreamingConversionRequest,
  onProgress?: (loaded: number, total: number) => void
): Promise<Blob> => {
  const response = await fetch('/api/stream-convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  // Handle streaming with progress tracking
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  let loaded = 0;

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    if (onProgress && total > 0) {
      onProgress(loaded, total);
    }
  }

  // Combine all chunks into a single blob
  const blob = new Blob(chunks, { type: 'audio/mpeg' });
  return blob;
};

/**
 * Get job status
 */
export const getJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await fetch(`/api/stream-status/${jobId}`, {
    headers: {
      'Accept': 'application/json; charset=utf-8',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Download MP3 file from blob
 */
export const downloadMP3 = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.mp3') ? filename : `${filename}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Complete streaming conversion workflow
 */
export const performStreamingConversion = async (
  request: StreamingConversionRequest,
  onProgress?: (loaded: number, total: number) => void,
  onInfo?: (info: ConversionInfo) => void
): Promise<void> => {
  try {
    // Step 1: Get conversion info
    const info = await getConversionInfo(request);
    if (onInfo) onInfo(info);

    // Step 2: Stream the audio
    const blob = await streamAudioConversion(request, onProgress);

    // Step 3: Download the file
    downloadMP3(blob, info.metadata.title);

  } catch (error) {
    console.error('Streaming conversion failed:', error);
    throw error;
  }
};
