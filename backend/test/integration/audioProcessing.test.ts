import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import processAudioRoutes from '../../src/routes/processAudio';

// Mock the database
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

// Create a simple test app instead of importing the full app
const app = express();
app.use(express.json());
app.use('/api', processAudioRoutes);

// Integration test for audio processing endpoints
describe('Audio Processing Integration Tests', () => {
  const testTmpDir = '/tmp/test-app-media';
  let testJobId: string;
  let testToken: string;
  let mockQuery: jest.MockedFunction<any>;

  beforeAll(async () => {
    // Ensure test directory exists
    if (!require('fs').existsSync(testTmpDir)) {
      require('fs').mkdirSync(testTmpDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up test directory
    if (require('fs').existsSync(testTmpDir)) {
      const files = require('fs').readdirSync(testTmpDir);
      files.forEach((file: string) => {
        require('fs').unlinkSync(require('path').join(testTmpDir, file));
      });
      require('fs').rmdirSync(testTmpDir);
    }
  });

  beforeEach(() => {
    // Reset test variables
    testJobId = '';
    testToken = '';
    
    // Get the mocked query function
    const { query } = require('../../src/config/database');
    mockQuery = query;
    
    jest.clearAllMocks();
  });

  describe('POST /api/process', () => {
    it('should create a processing job with valid parameters', async () => {
      const requestBody = {
        sourceUrl: 'https://example.com/test-audio.mp3',
        action: 'trim',
        trim: { start: 10, duration: 30 },
        bitrate: 128,
        expireMinutes: 5 // Short expiration for testing
      };

      mockQuery.mockResolvedValue({
        rows: [{
          id: 'test-uuid-123',
          source_url: requestBody.sourceUrl,
          status: 'pending',
          action: requestBody.action,
          bitrate: requestBody.bitrate,
          trim_start: requestBody.trim.start,
          trim_duration: requestBody.trim.duration,
          download_token: 'test-token',
          expires_at: new Date()
        }]
      });

      const response = await request(app)
        .post('/api/process')
        .send(requestBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('downloadUrl');

      testJobId = response.body.data.jobId;
      testToken = response.body.data.downloadUrl.split('/').pop();
    });

    it('should reject invalid sourceUrl', async () => {
      const requestBody = {
        sourceUrl: 'not-a-valid-url',
        action: 'trim'
      };

      const response = await request(app)
        .post('/api/process')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid sourceUrl format');
    });

    it('should reject invalid action', async () => {
      const requestBody = {
        sourceUrl: 'https://example.com/test.mp3',
        action: 'invalid-action'
      };

      const response = await request(app)
        .post('/api/process')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('action is required and must be one of');
    });

    it('should reject invalid bitrate', async () => {
      const requestBody = {
        sourceUrl: 'https://example.com/test.mp3',
        action: 'reencode',
        bitrate: 999
      };

      const response = await request(app)
        .post('/api/process')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('bitrate must be one of');
    });

    it('should accept 64K bitrate', async () => {
      const requestBody = {
        sourceUrl: 'https://example.com/test.mp3',
        action: 'reencode',
        bitrate: 64
      };

      mockQuery.mockResolvedValue({
        rows: [{
          id: 'test-uuid-123',
          status: 'pending',
          download_token: 'test-token'
        }]
      });

      const response = await request(app)
        .post('/api/process')
        .send(requestBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
    });

    it('should reject invalid trim parameters', async () => {
      const requestBody = {
        sourceUrl: 'https://example.com/test.mp3',
        action: 'trim',
        trim: { start: -1, duration: 30 }
      };

      const response = await request(app)
        .post('/api/process')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('trim.start must be a non-negative number');
    });
  });

  describe('GET /api/job/:jobId', () => {
    it('should return job status for valid job ID', async () => {
      if (!testJobId) {
        // Create a test job first
        const createResponse = await request(app)
          .post('/api/process')
          .send({
            sourceUrl: 'https://example.com/test.mp3',
            action: 'none',
            expireMinutes: 5
          })
          .expect(201);
        
        testJobId = createResponse.body.data.jobId;
      }

      mockQuery.mockResolvedValue({
        rows: [{
          id: testJobId,
          status: 'ready',
          action: 'none',
          bitrate: 128,
          file_size: 1024,
          created_at: new Date(),
          expires_at: new Date()
        }]
      });

      const response = await request(app)
        .get(`/api/job/${testJobId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testJobId);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('created_at');
      expect(response.body.data).toHaveProperty('expires_at');
    });

    it('should return 404 for non-existent job ID', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/job/non-existent-job-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Job not found');
    });
  });

  describe('GET /api/download/:token', () => {
    it('should return 404 for non-existent token', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/download/non-existent-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Download token not found');
    });

    it('should return 202 for job not ready', async () => {
      if (!testToken) {
        // Mock the database response for job creation
        mockQuery.mockResolvedValue({
          rows: [{
            id: 'test-uuid-123',
            source_url: 'https://example.com/test.mp3',
            status: 'pending',
            action: 'none',
            download_token: 'test-token',
            expires_at: new Date()
          }]
        });

        // Create a test job first
        const createResponse = await request(app)
          .post('/api/process')
          .send({
            sourceUrl: 'https://example.com/test.mp3',
            action: 'none',
            expireMinutes: 5
          })
          .expect(201);
        
        testToken = createResponse.body.data.downloadUrl.split('/').pop();
      }

      mockQuery.mockResolvedValue({
        rows: [{
          id: 'test-job',
          status: 'pending',
          processed_path: '/tmp/test.mp3',
          expires_at: new Date(Date.now() + 60000) // 1 minute from now
        }]
      });

      const response = await request(app)
        .get(`/api/download/${testToken}`)
        .expect(202);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('still pending');
    });
  });

  describe('GET /api/process/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/process/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Audio processing service is healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});