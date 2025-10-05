# Frontend Integration Guide

## Overview
This guide shows how to integrate the YouTube to MP3 converter API with your React frontend that includes trimming and quality selection features.

## API Service (React)

Create or update your `frontend/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ConversionRequest {
  url: string;
  quality?: string;  // '64k', '128k', '192k', '256k', '320k'
  trim_start?: string;  // 'HH:mm:ss'
  trim_end?: string;    // 'HH:mm:ss'
}

export interface ConversionResponse {
  success: boolean;
  jobId: string;
  status: string;
  message: string;
}

export interface JobStatus {
  success: boolean;
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_title?: string;
  mp3_filename?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Start a new conversion
export const startConversion = async (request: ConversionRequest): Promise<ConversionResponse> => {
  const response = await fetch(`${API_BASE_URL}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Conversion failed');
  }

  return response.json();
};

// Check job status
export const checkJobStatus = async (jobId: string): Promise<JobStatus> => {
  const response = await fetch(`${API_BASE_URL}/status/${jobId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to check status');
  }

  return response.json();
};

// Get download URL
export const getDownloadUrl = (jobId: string): string => {
  return `${API_BASE_URL}/download/${jobId}`;
};

// Poll for job completion
export const pollJobStatus = async (
  jobId: string,
  onProgress: (status: JobStatus) => void,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<JobStatus> => {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++;
        const status = await checkJobStatus(jobId);
        onProgress(status);

        if (status.status === 'completed') {
          resolve(status);
        } else if (status.status === 'failed') {
          reject(new Error(status.error_message || 'Conversion failed'));
        } else if (attempts >= maxAttempts) {
          reject(new Error('Conversion timeout'));
        } else {
          setTimeout(poll, intervalMs);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};
```

## React Component Example

Update your `Converter.tsx` component:

```typescript
import React, { useState } from 'react';
import { startConversion, pollJobStatus, getDownloadUrl } from '../services/api';

interface ConversionState {
  status: 'idle' | 'converting' | 'completed' | 'error';
  jobId?: string;
  videoTitle?: string;
  errorMessage?: string;
  progress?: string;
}

const Converter: React.FC = () => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('192k');
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:00');
  const [state, setState] = useState<ConversionState>({ status: 'idle' });

  const handleConvert = async () => {
    try {
      setState({ status: 'converting', progress: 'Starting conversion...' });

      // Start conversion
      const response = await startConversion({
        url,
        quality,
        ...(trimEnabled && {
          trim_start: startTime,
          trim_end: endTime,
        }),
      });

      // Poll for completion
      await pollJobStatus(
        response.jobId,
        (status) => {
          setState({
            status: 'converting',
            jobId: response.jobId,
            videoTitle: status.video_title,
            progress: status.status === 'processing' 
              ? 'Processing audio...' 
              : 'Downloading audio...',
          });
        },
        60, // max attempts
        2000 // interval ms
      );

      // Completed
      setState({
        status: 'completed',
        jobId: response.jobId,
        videoTitle: state.videoTitle,
      });

    } catch (error) {
      setState({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Conversion failed',
      });
    }
  };

  const handleDownload = () => {
    if (state.jobId) {
      window.location.href = getDownloadUrl(state.jobId);
    }
  };

  return (
    <div className="converter">
      {/* URL Input */}
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube URL"
        disabled={state.status === 'converting'}
      />

      {/* Quality Selection */}
      <select
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
        disabled={state.status === 'converting'}
      >
        <option value="64k">64K</option>
        <option value="128k">128K</option>
        <option value="192k">192K</option>
        <option value="256k">256K</option>
        <option value="320k">320K</option>
      </select>

      {/* Trim Toggle */}
      <label>
        <input
          type="checkbox"
          checked={trimEnabled}
          onChange={(e) => setTrimEnabled(e.target.checked)}
          disabled={state.status === 'converting'}
        />
        Trim Audio
      </label>

      {/* Trim Inputs */}
      {trimEnabled && (
        <div className="trim-controls">
          <input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="00:00:00"
            disabled={state.status === 'converting'}
          />
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="00:00:00"
            disabled={state.status === 'converting'}
          />
        </div>
      )}

      {/* Convert Button */}
      <button
        onClick={handleConvert}
        disabled={!url || state.status === 'converting'}
      >
        {state.status === 'converting' ? 'Converting...' : 'Convert'}
      </button>

      {/* Progress */}
      {state.status === 'converting' && (
        <div className="progress">
          {state.progress}
        </div>
      )}

      {/* Download Button */}
      {state.status === 'completed' && (
        <div className="completed">
          <p>{state.videoTitle || 'Conversion completed!'}</p>
          <button onClick={handleDownload}>
            Download MP3
          </button>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="error">
          {state.errorMessage}
        </div>
      )}
    </div>
  );
};

export default Converter;
```

## Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

For production:

```env
VITE_API_URL=https://your-domain.com/api
```

## TypeScript Types

Create `frontend/types/conversion.ts`:

```typescript
export interface ConversionRequest {
  url: string;
  quality?: '64k' | '128k' | '192k' | '256k' | '320k';
  trim_start?: string;
  trim_end?: string;
}

export interface ConversionResponse {
  success: boolean;
  jobId: string;
  status: string;
  message: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cleaned';

export interface Job {
  success: boolean;
  jobId: string;
  status: JobStatus;
  video_title?: string;
  mp3_filename?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}
```

## Usage Examples

### Simple Conversion (No Trimming)
```typescript
const response = await startConversion({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  quality: '192k',
});
```

### With Trimming
```typescript
const response = await startConversion({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  quality: '192k',
  trim_start: '00:00:30',
  trim_end: '00:02:45',
});
```

### With Progress Updates
```typescript
await pollJobStatus(jobId, (status) => {
  console.log(`Status: ${status.status}`);
  console.log(`Title: ${status.video_title}`);
  
  // Update UI
  setProgress(status.status);
  setVideoTitle(status.video_title);
});
```

## UI/UX Recommendations

### Loading States
```typescript
const statusMessages = {
  pending: 'Queuing conversion...',
  processing: 'Converting audio...',
  completed: 'Ready to download!',
  failed: 'Conversion failed',
};
```

### Progress Indicator
```tsx
{state.status === 'converting' && (
  <div className="progress-bar">
    <div className="spinner" />
    <span>{state.progress}</span>
  </div>
)}
```

### Download Button
```tsx
{state.status === 'completed' && (
  <button
    onClick={handleDownload}
    className="download-button"
  >
    <DownloadIcon />
    Download MP3
  </button>
)}
```

## Error Handling

### User-Friendly Messages
```typescript
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('Invalid URL')) {
      return 'Please enter a valid YouTube URL';
    }
    if (error.message.includes('timeout')) {
      return 'Conversion is taking longer than expected. Please try again.';
    }
    if (error.message.includes('unavailable')) {
      return 'This video is not available or restricted';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};
```

## Testing

### Test Cases
1. **Valid URL + No Trimming**: Should complete successfully
2. **Valid URL + Trimming**: Should complete with correct duration
3. **Invalid URL**: Should show error immediately
4. **Invalid Time Format**: Should validate before sending
5. **Network Error**: Should retry and show appropriate message

### Example Test
```typescript
// Mock API calls
jest.mock('../services/api');

test('converts video successfully', async () => {
  const mockStartConversion = startConversion as jest.MockedFunction<typeof startConversion>;
  mockStartConversion.mockResolvedValue({
    success: true,
    jobId: 'test-job-id',
    status: 'pending',
    message: 'Job started',
  });

  // Test your component
  render(<Converter />);
  // ... assertions
});
```

## Performance Tips

1. **Debounce Status Polling**: Don't poll too frequently
2. **Cancel Polling**: Clean up on component unmount
3. **Cache Results**: Store completed jobs in localStorage
4. **Lazy Load**: Only load converter component when needed

## Security Considerations

1. **Validate URLs**: Check format before sending to API
2. **Sanitize Inputs**: Don't trust user input for time values
3. **Rate Limiting**: Implement client-side rate limiting
4. **HTTPS Only**: Always use HTTPS in production

## Deployment Checklist

- [ ] Update `VITE_API_URL` to production URL
- [ ] Enable CORS for your domain on backend
- [ ] Test all conversion scenarios
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CDN for faster downloads
- [ ] Add analytics tracking

## Support & Troubleshooting

### Common Issues

**"Conversion timeout"**
- Increase `maxAttempts` in `pollJobStatus`
- Check backend server logs

**"Failed to fetch"**
- Check CORS configuration
- Verify API URL is correct
- Check network connectivity

**"Invalid time format"**
- Validate format is HH:mm:ss
- Ensure end time > start time

---

**Happy Coding!** 🚀

For more details, see `IMPLEMENTATION_GUIDE.md` and `CONVERSION_SUMMARY.md`.

