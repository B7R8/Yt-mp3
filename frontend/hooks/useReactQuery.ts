// Example usage of @tanstack/react-query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Type definitions for API responses
interface JobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

// Example query hook
export const useVideoInfo = (url: string) => {
  return useQuery({
    queryKey: ['videoInfo', url],
    queryFn: async () => {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video info');
      }
      return response.json();
    },
    enabled: !!url,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Example mutation hook
export const useConvertVideo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { url: string; quality?: string }) => {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Conversion failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch video info queries
      queryClient.invalidateQueries({ queryKey: ['videoInfo'] });
    },
  });
};

// Example for job status polling
export const useJobStatus = (jobId: string) => {
  return useQuery<JobStatus>({
    queryKey: ['jobStatus', jobId],
    queryFn: async (): Promise<JobStatus> => {
      const response = await fetch(`/api/job-status/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }
      return response.json();
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Stop polling if job is completed or failed
      const data = query.state.data;
      return data?.status === 'completed' || data?.status === 'failed' ? false : 2000;
    },
    refetchIntervalInBackground: false,
  });
};
