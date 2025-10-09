/**
 * Address Verification System
 * Protects against address manipulation and ensures only your real addresses are displayed
 */

// Your verified wallet addresses - these are the ONLY addresses that should be displayed
const VERIFIED_ADDRESSES = {
  bitcoin: {
    mainnet: '15hXdrtctyAQQv5R6D4fVvGAQNurz97Kce',
    bitcoin: '15hXdrtctyAQQv5R6D4fVvGAQNurz97Kce',
    bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b'
  },
  usdt: {
    tron: 'TUKVr4qfqvCQZQtTQvj3HarUx9b6hordVT',
    bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b'
  },
  ethereum: {
    mainnet: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b'
  },
  bnb: {
    bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b'
  },
  solana: {
    mainnet: '3aC5HfSLH6bbZdGpD72G6bo3UixJivfB5pXqkR9xVNia',
    bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b',
    solana: '3aC5HfSLH6bbZdGpD72G6bo3UixJivfB5pXqkR9xVNia'
  },
  binance: {
    userId: '555991639'
  }
};

/**
 * Verify if an address is legitimate and belongs to you
 * @param address - The address to verify
 * @param crypto - The cryptocurrency type
 * @param network - The network type
 * @returns boolean indicating if address is verified
 */
export const verifyAddress = (address: string, crypto: string, network: string): boolean => {
  try {
    // Check if crypto exists in verified addresses
    const cryptoAddresses = VERIFIED_ADDRESSES[crypto as keyof typeof VERIFIED_ADDRESSES];
    if (!cryptoAddresses) {
      console.warn(`Unknown cryptocurrency: ${crypto}`);
      return false;
    }

    // Check if network exists for this crypto
    const networkAddress = cryptoAddresses[network as keyof typeof cryptoAddresses];
    if (!networkAddress) {
      console.warn(`Unknown network: ${network} for ${crypto}`);
      return false;
    }

    // Verify the address matches exactly
    const isValid = address === networkAddress;
    
    if (!isValid) {
      console.error(`Address verification failed for ${crypto}-${network}: ${address}`);
      // Log security incident
      logSecurityIncident('ADDRESS_VERIFICATION_FAILED', {
        crypto,
        network,
        providedAddress: address,
        expectedAddress: networkAddress
      });
    }

    return isValid;
  } catch (error) {
    console.error('Address verification error:', error);
    return false;
  }
};

/**
 * Get verified address for a crypto and network
 * @param crypto - The cryptocurrency type
 * @param network - The network type
 * @returns verified address or null
 */
export const getVerifiedAddress = (crypto: string, network: string): string | null => {
  try {
    const cryptoAddresses = VERIFIED_ADDRESSES[crypto as keyof typeof VERIFIED_ADDRESSES];
    if (!cryptoAddresses) return null;

    const address = cryptoAddresses[network as keyof typeof cryptoAddresses];
    return typeof address === 'string' ? address : null;
  } catch (error) {
    console.error('Error getting verified address:', error);
    return null;
  }
};

/**
 * Validate all addresses in a wallet configuration
 * @param walletData - The wallet data to validate
 * @returns validation results
 */
export const validateAllAddresses = (walletData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  let isValid = true;

  try {
    Object.entries(walletData).forEach(([crypto, wallet]: [string, any]) => {
      if (wallet && wallet.networks) {
        Object.entries(wallet.networks).forEach(([network, networkData]: [string, any]) => {
          if (networkData && networkData.address) {
            const isVerified = verifyAddress(networkData.address, crypto, network);
            if (!isVerified) {
              isValid = false;
              errors.push(`Invalid address for ${crypto}-${network}: ${networkData.address}`);
            }
          }
        });
      }
    });
  } catch (error) {
    isValid = false;
    errors.push(`Validation error: ${error}`);
  }

  return { isValid, errors };
};

/**
 * Sanitize address to prevent XSS and injection attacks
 * @param address - The address to sanitize
 * @returns sanitized address
 */
export const sanitizeAddress = (address: string): string => {
  if (!address || typeof address !== 'string') {
    return '';
  }

  // Remove any potentially dangerous characters
  return address
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
};

/**
 * Log security incidents
 * @param type - The type of security incident
 * @param data - Additional data about the incident
 */
const logSecurityIncident = (type: string, data: any) => {
  const incident = {
    type,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    data
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Security Incident:', incident);
  }

  // In production, you might want to send this to a security monitoring service
  // sendToSecurityService(incident);
};

/**
 * Check if an address format is valid for its type
 * @param address - The address to check
 * @param type - The address type (bitcoin, ethereum, tron, solana)
 * @returns boolean indicating if format is valid
 */
export const validateAddressFormat = (address: string, type: string): boolean => {
  const patterns = {
    bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    tron: /^T[A-Za-z1-9]{33}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    bsc: /^0x[a-fA-F0-9]{40}$/
  };

  const pattern = patterns[type as keyof typeof patterns];
  return pattern ? pattern.test(address) : false;
};

/**
 * Double verification - check both format and ownership
 * @param address - The address to verify
 * @param crypto - The cryptocurrency type
 * @param network - The network type
 * @returns boolean indicating if address is completely valid
 */
export const doubleVerifyAddress = (address: string, crypto: string, network: string): boolean => {
  // First check format
  const formatValid = validateAddressFormat(address, network);
  if (!formatValid) {
    console.warn(`Invalid address format for ${crypto}-${network}: ${address}`);
    return false;
  }

  // Then check ownership
  const ownershipValid = verifyAddress(address, crypto, network);
  if (!ownershipValid) {
    console.warn(`Address not owned for ${crypto}-${network}: ${address}`);
    return false;
  }

  return true;
};
