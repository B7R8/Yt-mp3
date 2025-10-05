
import { Job, JobStatus } from '../types';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const startConversion = async (
  url: string,
  quality?: string,
  trimEnabled?: boolean,
  trimStart?: string,
  trimEnd?: string
): Promise<{ id: string }> => {
  const requestBody: {
    url: string;
    quality?: string;
    trim_start?: string;
    trim_end?: string;
  } = { url };

  // Add quality if specified (convert 128K to 128k format)
  if (quality) {
    requestBody.quality = quality.toLowerCase();
  }

  // Add trim parameters if enabled
  if (trimEnabled && trimStart && trimEnd) {
    requestBody.trim_start = trimStart;
    requestBody.trim_end = trimEnd;
  }

  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const data = await handleResponse(response);
  // Transform backend response to frontend format
  return { id: data.jobId };
};

export const getJobStatus = async (id: string): Promise<Job> => {
  const response = await fetch(`/api/status/${id}`);
  const data = await handleResponse(response);
  
  // Transform backend response to frontend Job format
  return {
    id: data.jobId,
    status: data.status as JobStatus, // Ensure proper type mapping
    progress: data.status === 'completed' ? 100 : data.status === 'processing' ? 50 : 0,
    title: data.video_title,
    url: data.youtube_url || '', // Handle missing youtube_url
    error: data.error_message
  };
};