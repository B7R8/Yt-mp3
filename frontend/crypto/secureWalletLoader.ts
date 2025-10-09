/**
 * Secure Wallet Loader
 * This module handles loading wallet addresses from environment variables
 * and provides a secure way to access wallet data
 */

export interface SecureWalletConfig {
  bitcoin: {
    mainnet: string;
    bsc: string;
    eth: string;
  };
  usdt: {
    tron: string;
    bsc: string;
    eth: string;
  };
  ethereum: {
    mainnet: string;
    bsc: string;
  };
  bnb: {
    bsc: string;
    eth: string;
  };
  solana: {
    mainnet: string;
    bsc: string;
  };
  binance: {
    userId: string;
  };
}

/**
 * Load wallet configuration from environment variables
 * This is a secure way to load wallet addresses without exposing them in the client bundle
 * All addresses are loaded from REACT_APP_* environment variables
 */
export const loadSecureWalletConfig = (): SecureWalletConfig => {
  // Load all wallet addresses from secure environment variables
  // No hardcoded addresses - maximum security
  
  return {
    bitcoin: {
      mainnet: process.env.REACT_APP_BITCOIN_MAINNET_ADDRESS || '',
      bsc: process.env.REACT_APP_BITCOIN_BSC_ADDRESS || '',
      eth: process.env.REACT_APP_BITCOIN_ETH_ADDRESS || ''
    },
    usdt: {
      tron: process.env.REACT_APP_USDT_TRON_ADDRESS || '',
      bsc: process.env.REACT_APP_USDT_BSC_ADDRESS || '',
      eth: process.env.REACT_APP_USDT_ETH_ADDRESS || ''
    },
    ethereum: {
      mainnet: process.env.REACT_APP_ETHEREUM_MAINNET_ADDRESS || '',
      bsc: process.env.REACT_APP_ETHEREUM_BSC_ADDRESS || ''
    },
    bnb: {
      bsc: process.env.REACT_APP_BNB_BSC_ADDRESS || '',
      eth: process.env.REACT_APP_BNB_ETH_ADDRESS || ''
    },
    solana: {
      mainnet: process.env.REACT_APP_SOLANA_MAINNET_ADDRESS || '',
      bsc: process.env.REACT_APP_SOLANA_BSC_ADDRESS || ''
    },
    binance: {
      userId: process.env.REACT_APP_BINANCE_USER_ID || ''
    }
  };
};

/**
 * Get wallet address for a specific crypto and network
 * @param crypto - The cryptocurrency type
 * @param network - The network type
 * @param config - The wallet configuration
 * @returns wallet address or null
 */
export const getSecureWalletAddress = (
  crypto: string,
  network: string,
  config: SecureWalletConfig
): string | null => {
  try {
    const cryptoConfig = config[crypto as keyof SecureWalletConfig];
    if (!cryptoConfig || typeof cryptoConfig !== 'object') {
      return null;
    }
    
    return cryptoConfig[network as keyof typeof cryptoConfig] as string || null;
  } catch (error) {
    console.error('Error getting secure wallet address:', error);
    return null;
  }
};

/**
 * Validate wallet configuration
 * @param config - The wallet configuration
 * @returns validation results
 */
export const validateSecureWalletConfig = (config: SecureWalletConfig): boolean => {
  try {
    // Check if all required addresses are present
    const requiredAddresses = [
      config.bitcoin.mainnet,
      config.bitcoin.bsc,
      config.bitcoin.eth,
      config.usdt.tron,
      config.usdt.bsc,
      config.usdt.eth,
      config.ethereum.mainnet,
      config.ethereum.bsc,
      config.bnb.bsc,
      config.bnb.eth,
      config.solana.mainnet,
      config.solana.bsc,
      config.binance.userId
    ];
    
    return requiredAddresses.every(address => address && address.length > 0);
  } catch (error) {
    console.error('Error validating wallet config:', error);
    return false;
  }
};

/**
 * Get all available cryptocurrencies from config
 * @param config - The wallet configuration
 * @returns array of cryptocurrency keys
 */
export const getAvailableCryptosFromConfig = (config: SecureWalletConfig): string[] => {
  return Object.keys(config).filter(key => key !== 'binance');
};

/**
 * Get all available networks for a cryptocurrency from config
 * @param crypto - The cryptocurrency type
 * @param config - The wallet configuration
 * @returns array of network keys
 */
export const getAvailableNetworksFromConfig = (
  crypto: string,
  config: SecureWalletConfig
): string[] => {
  const cryptoConfig = config[crypto as keyof SecureWalletConfig];
  if (!cryptoConfig || typeof cryptoConfig !== 'object') {
    return [];
  }
  
  return Object.keys(cryptoConfig);
};
