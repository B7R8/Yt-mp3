/**
 * Secure QR Code Generator for Crypto Wallets
 * This utility generates QR codes for wallet addresses without exposing sensitive data
 */

export interface QRCodeData {
  address: string;
  symbol: string;
  network: string;
  qrData: string;
}

/**
 * Generate QR code data for a wallet address
 * @param address - The wallet address
 * @param symbol - The cryptocurrency symbol
 * @param network - The network name
 * @returns QRCodeData object
 */
export const generateQRData = (address: string, symbol: string, network: string): QRCodeData => {
  // For Bitcoin, use bitcoin: protocol
  if (symbol === 'BTC' && network === 'Bitcoin') {
    return {
      address,
      symbol,
      network,
      qrData: `bitcoin:${address}`
    };
  }
  
  // For other cryptocurrencies, use plain address
  return {
    address,
    symbol,
    network,
    qrData: address
  };
};

/**
 * Generate QR code URL using a secure service
 * @param data - The data to encode in QR code
 * @param size - The size of the QR code (default: 200)
 * @returns QR code image URL
 */
export const generateQRCodeURL = (data: string, size: number = 200): string => {
  // Using a secure, reliable QR code service
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&ecc=M&margin=10&color=000000&bgcolor=ffffff`;
};

/**
 * Generate QR code for wallet address
 * @param walletData - The wallet data
 * @param size - The size of the QR code
 * @returns QR code image URL
 */
export const generateWalletQRCode = (walletData: QRCodeData, size: number = 200): string => {
  return generateQRCodeURL(walletData.qrData, size);
};

/**
 * Validate wallet address format
 * @param address - The wallet address to validate
 * @param type - The type of wallet (bitcoin, ethereum, tron, solana)
 * @returns boolean indicating if address is valid
 */
export const validateWalletAddress = (address: string, type: string): boolean => {
  const patterns = {
    bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    tron: /^T[A-Za-z1-9]{33}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    bsc: /^0x[a-fA-F0-9]{40}$/
  };
  
  return patterns[type as keyof typeof patterns]?.test(address) || false;
};

/**
 * Get network type from address format
 * @param address - The wallet address
 * @returns network type
 */
export const getNetworkType = (address: string): string => {
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
