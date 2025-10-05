
import { Job, JobStatus } from '../types';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const startConversion = async (url: string): Promise<{ id: string }> => {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
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