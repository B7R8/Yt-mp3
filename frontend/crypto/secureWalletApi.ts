/**
 * Secure Wallet API Service
 * Communicates with the secure backend API to get verified wallet addresses
 */

import { verifyAddress, sanitizeAddress, doubleVerifyAddress } from './addressVerification';

const API_BASE = '/api/secure-wallet';

interface SecureWalletResponse {
  success: boolean;
  data?: {
    crypto: string;
    network: string;
    address: string;
    qrUrl?: string;
    qrData?: string;
    timestamp: string;
  };
  message?: string;
}

/**
 * Secure API request with error handling and validation
 */
const secureRequest = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      },
      credentials: 'same-origin', // Include cookies for CSRF protection
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('Secure API request failed:', error);
    throw error;
  }
};

/**
 * Get verified wallet address from secure API
 * @param crypto - The cryptocurrency type
 * @param network - The network type
 * @returns verified wallet address
 */
export const getSecureWalletAddress = async (crypto: string, network: string): Promise<string> => {
  try {
    // Sanitize inputs to prevent injection attacks
    const sanitizedCrypto = sanitizeAddress(crypto);
    const sanitizedNetwork = sanitizeAddress(network);
    
    const response = await secureRequest<SecureWalletResponse>(`/address/${sanitizedCrypto}/${sanitizedNetwork}`);
    
    if (!response.data) {
      throw new Error('No address data received');
    }
    
    const address = response.data.address;
    
    // Double verify the address
    const isVerified = doubleVerifyAddress(address, sanitizedCrypto, sanitizedNetwork);
    if (!isVerified) {
      throw new Error('Address verification failed');
    }
    
    return address;
  } catch (error) {
    console.error('Error getting secure wallet address:', error);
    throw new Error('Failed to get verified wallet address');
  }
};

/**
 * Get secure QR code from API
 * @param crypto - The cryptocurrency type
 * @param network - The network type
 * @returns QR code URL
 */
export const getSecureQRCode = async (crypto: string, network: string): Promise<string> => {
  try {
    // Sanitize inputs
    const sanitizedCrypto = sanitizeAddress(crypto);
    const sanitizedNetwork = sanitizeAddress(network);
    
    const response = await secureRequest<SecureWalletResponse>(`/qr/${sanitizedCrypto}/${sanitizedNetwork}`);
    
    if (!response.data || !response.data.qrUrl) {
      throw new Error('No QR code data received');
    }
    
    const qrUrl = response.data.qrUrl;
    const address = response.data.address;
    
    // Verify the address before returning QR code
    const isVerified = doubleVerifyAddress(address, sanitizedCrypto, sanitizedNetwork);
    if (!isVerified) {
      throw new Error('Address verification failed for QR code');
    }
    
    return qrUrl;
  } catch (error) {
    console.error('Error getting secure QR code:', error);
    throw new Error('Failed to get verified QR code');
  }
};

/**
 * Get all wallet addresses (admin only)
 * @param adminKey - Admin authentication key
 * @returns all wallet addresses
 */
export const getAllSecureAddresses = async (adminKey: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'x-admin-key': adminKey,
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get all addresses');
    }

    return data.data;
  } catch (error) {
    console.error('Error getting all addresses:', error);
    throw new Error('Failed to get all addresses');
  }
};

// Cache for API health status
let healthCache: { status: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Check API health with caching
 * @returns health status
 */
export const checkApiHealth = async (): Promise<boolean> => {
  // Check cache first
  if (healthCache && Date.now() - healthCache.timestamp < CACHE_DURATION) {
    return healthCache.status;
  }

  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const isHealthy = data.success;
    
    // Cache the result
    healthCache = {
      status: isHealthy,
      timestamp: Date.now()
    };
    
    return isHealthy;
  } catch (error) {
    console.error('API health check failed:', error);
    
    // Cache negative result for shorter duration
    healthCache = {
      status: false,
      timestamp: Date.now()
    };
    
    return false;
  }
};

/**
 * Validate API response data
 * @param data - The response data to validate
 * @returns validation result
 */
export const validateApiResponse = (data: any): boolean => {
  try {
    // Check if data has required structure
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Check for required fields
    const requiredFields = ['crypto', 'network', 'address'];
    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] !== 'string') {
        return false;
      }
    }
    
    // Sanitize and validate address
    const sanitizedAddress = sanitizeAddress(data.address);
    if (sanitizedAddress !== data.address) {
      console.warn('Address was sanitized, potential security issue');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('API response validation failed:', error);
    return false;
  }
};

/**
 * Secure copy to clipboard with validation
 * @param text - The text to copy
 * @param crypto - The cryptocurrency type
 * @param network - The network type
 * @returns Promise<boolean>
 */
export const secureCopyToClipboard = async (text: string, crypto: string, network: string): Promise<boolean> => {
  try {
    // Sanitize the text
    const sanitizedText = sanitizeAddress(text);
    
    // Verify the address before copying
    const isVerified = doubleVerifyAddress(sanitizedText, crypto, network);
    if (!isVerified) {
      console.error('Cannot copy unverified address');
      return false;
    }
    
    // Copy to clipboard
    await navigator.clipboard.writeText(sanitizedText);
    return true;
  } catch (error) {
    console.error('Secure copy failed:', error);
    return false;
  }
};
