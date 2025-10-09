import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import logger from '../config/logger';

const router = Router();

// Rate limiting for wallet API
const walletRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 10, // Very permissive in development
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for all requests in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return false;
  }
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CSRF protection middleware
const csrfProtection = (req: Request, res: Response, next: any) => {
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const userAgent = req.get('User-Agent');
  
  // Debug logging
  logger.info('CSRF protection check', { 
    nodeEnv: process.env.NODE_ENV,
    origin, 
    referer, 
    ip: req.ip, 
    userAgent,
    path: req.path 
  });
  
  // For development, be very permissive
  if (process.env.NODE_ENV === 'development') {
    logger.info('CSRF protection: Development mode - allowing request', { 
      origin, 
      referer, 
      ip: req.ip, 
      userAgent,
      path: req.path 
    });
    return next();
  }
  
  // Allow requests from your domain
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://saveytb.com',
    'https://www.saveytb.com'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    return next();
  }
  
  // Allow requests from same origin (more flexible check)
  if (origin && referer) {
    const originHost = new URL(origin).hostname;
    const refererHost = new URL(referer).hostname;
    if (originHost === refererHost) {
      return next();
    }
  }
  
  // Allow requests without origin (direct API calls, Postman, etc.)
  if (!origin && userAgent && !userAgent.includes('Mozilla')) {
    return next();
  }
  
  logger.warn('CSRF protection: Invalid origin', { origin, referer, ip: req.ip, userAgent, path: req.path });
  return res.status(403).json({
    success: false,
    message: 'Invalid request origin'
  });
};

// Input validation middleware
const validateInput = (req: Request, res: Response, next: any) => {
  const { crypto, network } = req.params;
  
  // Validate crypto parameter
  const validCryptos = ['bitcoin', 'usdt', 'ethereum', 'bnb', 'solana'];
  if (!crypto || !validCryptos.includes(crypto)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid cryptocurrency type'
    });
  }
  
  // Validate network parameter - expanded to include all possible networks
  const validNetworks = ['bitcoin', 'bsc', 'ethereum', 'tron', 'solana', 'mainnet', 'eth'];
  if (!network || !validNetworks.includes(network)) {
    logger.warn('Invalid network parameter', { crypto, network, validNetworks, ip: req.ip });
    return res.status(400).json({
      success: false,
      message: 'Invalid network type'
    });
  }
  
  next();
};

// Sanitize input to prevent injection attacks
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
};

// Get verified wallet addresses from environment
const getVerifiedAddresses = () => {
  // Check if we have environment variables set
  const hasEnvVars = process.env.BITCOIN_MAINNET_ADDRESS || process.env.REACT_APP_BITCOIN_MAINNET_ADDRESS;
  
  if (!hasEnvVars) {
    logger.warn('No wallet addresses found in environment variables. Using fallback addresses for testing.');
    // Return fallback addresses for testing (these should be replaced with real addresses)
    return {
      bitcoin: {
        mainnet: '15hXdrtctyAQQv5R6D4fVvGAQNurz97Kce', // Your actual Bitcoin address
        bitcoin: '15hXdrtctyAQQv5R6D4fVvGAQNurz97Kce', // Your actual Bitcoin address (same as mainnet)
        bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual BSC address
        eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual ETH address
        ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b' // Your actual ETH address
      },
      usdt: {
        tron: 'TUKVr4qfqvCQZQtTQvj3HarUx9b6hordVT', // Your actual TRON address
        bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual BSC address
        eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual ETH address
        ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b' // Your actual ETH address
      },
      ethereum: {
        mainnet: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual ETH address
        bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual BSC address
        eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual ETH address
        ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b' // Your actual ETH address
      },
      bnb: {
        bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual BSC address
        eth: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual ETH address
        ethereum: '0xfdc41466e872359b20f277ec2b042772bf22aa7b' // Your actual ETH address
      },
      solana: {
        mainnet: '3aC5HfSLH6bbZdGpD72G6bo3UixJivfB5pXqkR9xVNia', // Your actual Solana address
        bsc: '0xfdc41466e872359b20f277ec2b042772bf22aa7b', // Your actual BSC address
        solana: '3aC5HfSLH6bbZdGpD72G6bo3UixJivfB5pXqkR9xVNia' // Your actual Solana address
      },
      binance: {
        userId: process.env.BINANCE_USER_ID || process.env.REACT_APP_BINANCE_USER_ID || 'xxxxxx'
      }
    };
  }
  
  // Use environment variables if available
  return {
    bitcoin: {
      mainnet: process.env.BITCOIN_MAINNET_ADDRESS || process.env.REACT_APP_BITCOIN_MAINNET_ADDRESS,
      bsc: process.env.BITCOIN_BSC_ADDRESS || process.env.REACT_APP_BITCOIN_BSC_ADDRESS,
      eth: process.env.BITCOIN_ETH_ADDRESS || process.env.REACT_APP_BITCOIN_ETH_ADDRESS,
      ethereum: process.env.BITCOIN_ETH_ADDRESS || process.env.REACT_APP_BITCOIN_ETH_ADDRESS
    },
    usdt: {
      tron: process.env.USDT_TRON_ADDRESS || process.env.REACT_APP_USDT_TRON_ADDRESS,
      bsc: process.env.USDT_BSC_ADDRESS || process.env.REACT_APP_USDT_BSC_ADDRESS,
      eth: process.env.USDT_ETH_ADDRESS || process.env.REACT_APP_USDT_ETH_ADDRESS,
      ethereum: process.env.USDT_ETH_ADDRESS || process.env.REACT_APP_USDT_ETH_ADDRESS
    },
    ethereum: {
      mainnet: process.env.ETHEREUM_MAINNET_ADDRESS || process.env.REACT_APP_ETHEREUM_MAINNET_ADDRESS,
      bsc: process.env.ETHEREUM_BSC_ADDRESS || process.env.REACT_APP_ETHEREUM_BSC_ADDRESS,
      eth: process.env.ETHEREUM_MAINNET_ADDRESS || process.env.REACT_APP_ETHEREUM_MAINNET_ADDRESS,
      ethereum: process.env.ETHEREUM_MAINNET_ADDRESS || process.env.REACT_APP_ETHEREUM_MAINNET_ADDRESS
    },
    bnb: {
      bsc: process.env.BNB_BSC_ADDRESS || process.env.REACT_APP_BNB_BSC_ADDRESS,
      eth: process.env.BNB_ETH_ADDRESS || process.env.REACT_APP_BNB_ETH_ADDRESS,
      ethereum: process.env.BNB_ETH_ADDRESS || process.env.REACT_APP_BNB_ETH_ADDRESS
    },
    solana: {
      mainnet: process.env.SOLANA_MAINNET_ADDRESS || process.env.REACT_APP_SOLANA_MAINNET_ADDRESS,
      bsc: process.env.SOLANA_BSC_ADDRESS || process.env.REACT_APP_SOLANA_BSC_ADDRESS,
      solana: process.env.SOLANA_MAINNET_ADDRESS || process.env.REACT_APP_SOLANA_MAINNET_ADDRESS
    },
    binance: {
      userId: process.env.BINANCE_USER_ID || process.env.REACT_APP_BINANCE_USER_ID || '123456789'
    }
  };
};

// Apply security middleware
router.use(securityHeaders);
router.use(walletRateLimit);

// Health check endpoint (public, no authentication needed)
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Secure wallet API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Apply CSRF protection to all other routes
router.use(csrfProtection);

// Get wallet address endpoint
router.get('/address/:crypto/:network', validateInput, (req: Request, res: Response) => {
  try {
    const crypto = sanitizeInput(req.params.crypto);
    const network = sanitizeInput(req.params.network);
    
    logger.info('Wallet address request received', { 
      crypto, 
      network, 
      ip: req.ip, 
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      userAgent: req.get('User-Agent')
    });
    
    const addresses = getVerifiedAddresses();
    const cryptoAddresses = addresses[crypto as keyof typeof addresses];
    
    if (!cryptoAddresses) {
      logger.warn('Invalid crypto type requested', { crypto, network, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Invalid cryptocurrency type'
      });
    }
    
    const address = cryptoAddresses[network as keyof typeof cryptoAddresses];
    
    if (!address) {
      logger.warn('Invalid network type requested', { crypto, network, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Invalid network type'
      });
    }
    
    // Log successful request
    logger.info('Wallet address provided successfully', { crypto, network, ip: req.ip });
    
    res.json({
      success: true,
      data: {
        crypto,
        network,
        address,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error getting wallet address:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get QR code endpoint
router.get('/qr/:crypto/:network', validateInput, (req: Request, res: Response) => {
  try {
    const crypto = sanitizeInput(req.params.crypto);
    const network = sanitizeInput(req.params.network);
    
    const addresses = getVerifiedAddresses();
    const cryptoAddresses = addresses[crypto as keyof typeof addresses];
    
    if (!cryptoAddresses) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cryptocurrency type'
      });
    }
    
    const address = cryptoAddresses[network as keyof typeof cryptoAddresses];
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network type'
      });
    }
    
    // Generate QR code URL
    const qrData = crypto === 'bitcoin' && network === 'bitcoin' 
      ? `bitcoin:${address}` 
      : address;
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png&ecc=M&margin=10&color=000000&bgcolor=ffffff`;
    
    logger.info('QR code requested', { crypto, network, ip: req.ip });
    
    res.json({
      success: true,
      data: {
        crypto,
        network,
        address,
        qrUrl,
        qrData,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Binance User ID endpoint
router.get('/binance-id', (req: Request, res: Response) => {
  try {
    const addresses = getVerifiedAddresses();
    const binanceUserId = addresses.binance?.userId;
    
    if (!binanceUserId) {
      logger.warn('Binance User ID not found', { ip: req.ip });
      return res.status(404).json({
        success: false,
        message: 'Binance User ID not found'
      });
    }
    
    logger.info('Binance User ID requested', { ip: req.ip });
    
    res.json({
      success: true,
      data: {
        userId: binanceUserId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error getting Binance User ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all wallet addresses (admin only)
router.get('/all', (req: Request, res: Response) => {
  try {
    // Check for admin key
    const adminKey = req.headers['x-admin-key'] as string;
    const expectedKey = process.env.ADMIN_KEY || 'admin123';
    
    if (!adminKey || adminKey !== expectedKey) {
      logger.warn('Unauthorized access attempt to all addresses', { ip: req.ip });
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const addresses = getVerifiedAddresses();
    
    logger.info('All addresses requested by admin', { ip: req.ip });
    
    res.json({
      success: true,
      data: addresses,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error getting all addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
