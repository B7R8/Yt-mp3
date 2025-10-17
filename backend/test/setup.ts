// Jest setup file
import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'postgres';
process.env.TMP_DIR = '/tmp/test-app-media';
process.env.MAX_FILE_SIZE = '10000000'; // 10MB for testing

// Mock console methods to reduce noise in tests
const mockFn = () => {};
global.console = {
  ...console,
  log: mockFn,
  debug: mockFn,
  info: mockFn,
  warn: mockFn,
  error: mockFn,
};
