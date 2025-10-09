/**
 * Secure Wallet Service
 * Handles wallet data loading and QR code generation
 */

import { generateWalletQRCode, generateQRData, validateWalletAddress, QRCodeData } from './qrGenerator';
import { loadSecureWalletConfig } from './secureWalletLoader';
import { getSecureWalletAddress, getSecureQRCode, checkApiHealth } from './secureWalletApi';
import { verifyAddress, sanitizeAddress, doubleVerifyAddress } from './addressVerification';

export interface WalletNetwork {
  name: string;
  address: string;
  symbol: string;
  qrData: string;
}

export interface Wallet {
  name: string;
  icon: string;
  color: string;
  networks: Record<string, WalletNetwork>;
}

export interface WalletData {
  [key: string]: Wallet;
}

// Cache for wallet data
let walletDataCache: { data: WalletData; timestamp: number } | null = null;
const WALLET_CACHE_DURATION = 60000; // 1 minute

/**
 * Load wallet data from secure API
 * This function loads wallet data from the secure backend API
 * Maximum security - verified addresses only
 */
export const loadWalletData = async (): Promise<WalletData> => {
  try {
    // Check cache first
    if (walletDataCache && Date.now() - walletDataCache.timestamp < WALLET_CACHE_DURATION) {
      return walletDataCache.data;
    }

    // First check if secure API is available
    const isApiHealthy = await checkApiHealth();
    
    if (!isApiHealthy) {
      console.warn('Secure API not available, falling back to environment variables');
      const envData = loadWalletDataFromEnv();
      
      // Cache the environment data
      walletDataCache = {
        data: envData,
        timestamp: Date.now()
      };
      
      return envData;
    }
    
    // Load from secure API
    const apiData = await loadWalletDataFromApi();
    
    // Cache the API data
    walletDataCache = {
      data: apiData,
      timestamp: Date.now()
    };
    
    return apiData;
  } catch (error) {
    console.error('Error loading wallet data from API:', error);
    // Fallback to environment variables
    const envData = loadWalletDataFromEnv();
    
    // Cache the environment data
    walletDataCache = {
      data: envData,
      timestamp: Date.now()
    };
    
    return envData;
  }
};

/**
 * Load wallet data from secure API
 */
const loadWalletDataFromApi = async (): Promise<WalletData> => {
  const walletData: WalletData = {};
  
  try {
    // Load each cryptocurrency from secure API
    const cryptos = ['bitcoin', 'usdt', 'ethereum', 'bnb', 'solana'];
    
    for (const crypto of cryptos) {
      const networks = getNetworksForCrypto(crypto);
      const cryptoData: any = {
        name: getCryptoName(crypto),
        icon: crypto,
        color: getCryptoColor(crypto),
        networks: {}
      };
      
      for (const network of networks) {
        try {
          const address = await getSecureWalletAddress(crypto, network);
          
          // Double verify the address
          if (doubleVerifyAddress(address, crypto, network)) {
            cryptoData.networks[network] = {
              name: getNetworkName(crypto, network),
              address: sanitizeAddress(address),
              symbol: getSymbol(crypto, network),
              qrData: crypto === 'bitcoin' && network === 'bitcoin' 
                ? `bitcoin:${address}` 
                : address
            };
          } else {
            console.error(`Address verification failed for ${crypto}-${network}`);
          }
        } catch (error) {
          console.error(`Failed to load ${crypto}-${network}:`, error);
        }
      }
      
      if (Object.keys(cryptoData.networks).length > 0) {
        walletData[crypto] = cryptoData;
      }
    }
    
    return walletData;
  } catch (error) {
    console.error('Error loading wallet data from API:', error);
    throw error;
  }
};

/**
 * Fallback: Load wallet data from environment variables
 */
const loadWalletDataFromEnv = (): WalletData => {
  try {
    // Load from secure environment variables only
    const config = loadSecureWalletConfig();
    
    // Convert secure config to wallet data format
    const walletData: WalletData = {
      bitcoin: {
        name: 'Bitcoin (BTC)',
        icon: 'bitcoin',
        color: 'from-orange-500 to-orange-600',
        networks: {
          bitcoin: {
            name: 'Bitcoin',
            address: config.bitcoin.mainnet,
            symbol: 'BTC',
            qrData: `bitcoin:${config.bitcoin.mainnet}`
          },
          bsc: {
            name: 'BNB Smart Chain (BEP20)',
            address: config.bitcoin.bsc,
            symbol: 'BTC-BSC',
            qrData: config.bitcoin.bsc
          },
          ethereum: {
            name: 'Ethereum (ERC20)',
            address: config.bitcoin.eth,
            symbol: 'BTC-ETH',
            qrData: config.bitcoin.eth
          }
        }
      },
      usdt: {
        name: 'USDT (TetherUS)',
        icon: 'usdt',
        color: 'from-green-500 to-green-600',
        networks: {
          tron: {
            name: 'Tron (TRC20)',
            address: config.usdt.tron,
            symbol: 'USDT-TRX',
            qrData: config.usdt.tron
          },
          bsc: {
            name: 'BNB Smart Chain (BEP20)',
            address: config.usdt.bsc,
            symbol: 'USDT-BSC',
            qrData: config.usdt.bsc
          },
          ethereum: {
            name: 'Ethereum (ERC20)',
            address: config.usdt.eth,
            symbol: 'USDT-ETH',
            qrData: config.usdt.eth
          }
        }
      },
      ethereum: {
        name: 'Ethereum (ETH)',
        icon: 'ethereum',
        color: 'from-blue-500 to-blue-600',
        networks: {
          ethereum: {
            name: 'Ethereum (ERC20)',
            address: config.ethereum.mainnet,
            symbol: 'ETH',
            qrData: config.ethereum.mainnet
          },
          bsc: {
            name: 'BNB Smart Chain (BEP20)',
            address: config.ethereum.bsc,
            symbol: 'ETH-BSC',
            qrData: config.ethereum.bsc
          }
        }
      },
      bnb: {
        name: 'BNB (Binance Coin)',
        icon: 'bnb',
        color: 'from-yellow-500 to-yellow-600',
        networks: {
          bsc: {
            name: 'BNB Smart Chain (BEP20)',
            address: config.bnb.bsc,
            symbol: 'BNB',
            qrData: config.bnb.bsc
          },
          ethereum: {
            name: 'Ethereum (ERC20)',
            address: config.bnb.eth,
            symbol: 'BNB-ETH',
            qrData: config.bnb.eth
          }
        }
      },
      solana: {
        name: 'SOL (Solana)',
        icon: 'solana',
        color: 'from-purple-500 to-purple-600',
        networks: {
          solana: {
            name: 'Solana',
            address: config.solana.mainnet,
            symbol: 'SOL',
            qrData: config.solana.mainnet
          },
          bsc: {
            name: 'BNB Smart Chain (BEP20)',
            address: config.solana.bsc,
            symbol: 'SOL-BSC',
            qrData: config.solana.bsc
          }
        }
      }
    };
    
    return walletData;
  } catch (error) {
    console.error('Error loading secure wallet data:', error);
    // Return empty object as fallback
    return {};
  }
};

/**
 * Get QR code for a specific wallet and network
 * @param crypto - The cryptocurrency key
 * @param network - The network key
 * @param walletData - The wallet data
 * @param size - QR code size
 * @returns QR code image URL
 */
export const getWalletQRCode = (
  crypto: string,
  network: string,
  walletData: WalletData,
  size: number = 200
): string | null => {
  try {
    const wallet = walletData[crypto];
    if (!wallet || !wallet.networks[network]) {
      return null;
    }

    const networkData = wallet.networks[network];
    const qrData = generateQRData(networkData.address, networkData.symbol, networkData.name);
    return generateWalletQRCode(qrData, size);
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

/**
 * Get wallet address for a specific crypto and network
 * @param crypto - The cryptocurrency key
 * @param network - The network key
 * @param walletData - The wallet data
 * @returns wallet address or null
 */
export const getWalletAddress = (
  crypto: string,
  network: string,
  walletData: WalletData
): string | null => {
  try {
    const wallet = walletData[crypto];
    if (!wallet || !wallet.networks[network]) {
      return null;
    }
    return wallet.networks[network].address;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
};

/**
 * Validate all wallet addresses in the configuration
 * @param walletData - The wallet data
 * @returns validation results
 */
export const validateAllWallets = (walletData: WalletData): Record<string, boolean> => {
  const results: Record<string, boolean> = {};
  
  Object.entries(walletData).forEach(([crypto, wallet]) => {
    Object.entries(wallet.networks).forEach(([network, networkData]) => {
      const key = `${crypto}-${network}`;
      const networkType = getNetworkType(networkData.address);
      results[key] = validateWalletAddress(networkData.address, networkType);
    });
  });
  
  return results;
};

/**
 * Get network type from address format
 * @param address - The wallet address
 * @returns network type
 */
const getNetworkType = (address: string): string => {
  if (address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')) {
    return 'bitcoin';
  } else if (address.startsWith('0x')) {
    return 'ethereum';
  } else if (address.startsWith('T')) {
    return 'tron';
  } else if (address.length >= 32 && address.length <= 44) {
    return 'solana';
  }
  return 'unknown';
};

/**
 * Get all available cryptocurrencies
 * @param walletData - The wallet data
 * @returns array of cryptocurrency keys
 */
export const getAvailableCryptos = (walletData: WalletData): string[] => {
  return Object.keys(walletData);
};

/**
 * Get all available networks for a cryptocurrency
 * @param crypto - The cryptocurrency key
 * @param walletData - The wallet data
 * @returns array of network keys
 */
export const getAvailableNetworks = (crypto: string, walletData: WalletData): string[] => {
  const wallet = walletData[crypto];
  return wallet ? Object.keys(wallet.networks) : [];
};

// Helper functions for secure API
const getNetworksForCrypto = (crypto: string): string[] => {
  const networkMap: { [key: string]: string[] } = {
    bitcoin: ['bitcoin', 'bsc', 'ethereum'],
    usdt: ['tron', 'bsc', 'ethereum'],
    ethereum: ['ethereum', 'bsc'],
    bnb: ['bsc', 'ethereum'],
    solana: ['solana', 'bsc']
  };
  return networkMap[crypto] || [];
};

const getCryptoName = (crypto: string): string => {
  const nameMap: { [key: string]: string } = {
    bitcoin: 'Bitcoin (BTC)',
    usdt: 'USDT (TetherUS)',
    ethereum: 'Ethereum (ETH)',
    bnb: 'BNB (Binance Coin)',
    solana: 'SOL (Solana)'
  };
  return nameMap[crypto] || crypto;
};

const getCryptoColor = (crypto: string): string => {
  const colorMap: { [key: string]: string } = {
    bitcoin: 'from-orange-500 to-orange-600',
    usdt: 'from-green-500 to-green-600',
    ethereum: 'from-blue-500 to-blue-600',
    bnb: 'from-yellow-500 to-yellow-600',
    solana: 'from-purple-500 to-purple-600'
  };
  return colorMap[crypto] || 'from-orange-500 to-orange-600';
};

const getNetworkName = (crypto: string, network: string): string => {
  const nameMap: { [key: string]: { [key: string]: string } } = {
    bitcoin: {
      bitcoin: 'Bitcoin',
      bsc: 'BNB Smart Chain (BEP20)',
      ethereum: 'Ethereum (ERC20)'
    },
    usdt: {
      tron: 'Tron (TRC20)',
      bsc: 'BNB Smart Chain (BEP20)',
      ethereum: 'Ethereum (ERC20)'
    },
    ethereum: {
      ethereum: 'Ethereum (ERC20)',
      bsc: 'BNB Smart Chain (BEP20)'
    },
    bnb: {
      bsc: 'BNB Smart Chain (BEP20)',
      ethereum: 'Ethereum (ERC20)'
    },
    solana: {
      solana: 'Solana',
      bsc: 'BNB Smart Chain (BEP20)'
    }
  };
  return nameMap[crypto]?.[network] || network;
};

const getSymbol = (crypto: string, network: string): string => {
  const symbolMap: { [key: string]: { [key: string]: string } } = {
    bitcoin: {
      bitcoin: 'BTC',
      bsc: 'BTC-BSC',
      ethereum: 'BTC-ETH'
    },
    usdt: {
      tron: 'USDT-TRX',
      bsc: 'USDT-BSC',
      ethereum: 'USDT-ETH'
    },
    ethereum: {
      ethereum: 'ETH',
      bsc: 'ETH-BSC'
    },
    bnb: {
      bsc: 'BNB',
      ethereum: 'BNB-ETH'
    },
    solana: {
      solana: 'SOL',
      bsc: 'SOL-BSC'
    }
  };
  return symbolMap[crypto]?.[network] || `${crypto.toUpperCase()}-${network.toUpperCase()}`;
};
