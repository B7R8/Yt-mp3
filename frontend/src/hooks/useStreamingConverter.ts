import { useState, useCallback } from 'react';
import { 
  StreamingConversionRequest, 
  ConversionInfo, 
  performStreamingConversion 
} from '../services/streamingApi';

export interface StreamingConverterState {
  isConverting: boolean;
  progress: number;
  info: ConversionInfo | null;
  error: string | null;
}

export const useStreamingConverter = () => {
  const [state, setState] = useState<StreamingConverterState>({
    isConverting: false,
    progress: 0,
    info: null,
    error: null,
  });

  const convert = useCallback(async (request: StreamingConversionRequest) => {
    setState({
      isConverting: true,
      progress: 0,
      info: null,
      error: null,
    });

    try {
      await performStreamingConversion(
        request,
        // Progress callback
        (loaded: number, total: number) => {
          const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
          setState(prev => ({ ...prev, progress }));
        },
        // Info callback
        (info: ConversionInfo) => {
          setState(prev => ({ ...prev, info }));
        }
      );

      setState(prev => ({
        ...prev,
        isConverting: false,
        progress: 100,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConverting: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isConverting: false,
      progress: 0,
      info: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    convert,
    reset,
  };
};
