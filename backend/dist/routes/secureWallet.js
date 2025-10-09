"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = __importDefault(require("../config/logger"));
const router = (0, express_1.Router)();
// Rate limiting for wallet API
const walletRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 100 : 10, // More permissive in development
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks in development
    skip: (req) => {
        if (process.env.NODE_ENV === 'development' && req.path === '/health') {
            return true;
        }
        return false;
    }
});
// Security headers middleware
const securityHeaders = (0, helmet_1.default)({
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
const csrfProtection = (req, res, next) => {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const userAgent = req.get('User-Agent');
    // Allow requests from same origin
    if (origin && referer && origin === referer) {
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
    // Allow requests without origin (direct API calls, Postman, etc.)
    if (!origin && userAgent && !userAgent.includes('Mozilla')) {
        return next();
    }
    // For development, be more permissive
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    logger_1.default.warn('CSRF protection: Invalid origin', { origin, referer, ip: req.ip, userAgent });
    return res.status(403).json({
        success: false,
        message: 'Invalid request origin'
    });
};
// Input validation middleware
const validateInput = (req, res, next) => {
    const { crypto, network } = req.params;
    // Validate crypto parameter
    const validCryptos = ['bitcoin', 'usdt', 'ethereum', 'bnb', 'solana'];
    if (!crypto || !validCryptos.includes(crypto)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid cryptocurrency type'
        });
    }
    // Validate network parameter
    const validNetworks = ['bitcoin', 'bsc', 'ethereum', 'tron', 'solana', 'mainnet', 'eth'];
    if (!network || !validNetworks.includes(network)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid network type'
        });
    }
    next();
};
// Sanitize input to prevent injection attacks
const sanitizeInput = (input) => {
    return input
        .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .trim();
};
// Get verified wallet addresses from environment
const getVerifiedAddresses = () => {
    return {
        bitcoin: {
            mainnet: process.env.BITCOIN_MAINNET_ADDRESS || process.env.REACT_APP_BITCOIN_MAINNET_ADDRESS,
            bsc: process.env.BITCOIN_BSC_ADDRESS || process.env.REACT_APP_BITCOIN_BSC_ADDRESS,
            eth: process.env.BITCOIN_ETH_ADDRESS || process.env.REACT_APP_BITCOIN_ETH_ADDRESS
        },
        usdt: {
            tron: process.env.USDT_TRON_ADDRESS || process.env.REACT_APP_USDT_TRON_ADDRESS,
            bsc: process.env.USDT_BSC_ADDRESS || process.env.REACT_APP_USDT_BSC_ADDRESS,
            eth: process.env.USDT_ETH_ADDRESS || process.env.REACT_APP_USDT_ETH_ADDRESS
        },
        ethereum: {
            mainnet: process.env.ETHEREUM_MAINNET_ADDRESS || process.env.REACT_APP_ETHEREUM_MAINNET_ADDRESS,
            bsc: process.env.ETHEREUM_BSC_ADDRESS || process.env.REACT_APP_ETHEREUM_BSC_ADDRESS
        },
        bnb: {
            bsc: process.env.BNB_BSC_ADDRESS || process.env.REACT_APP_BNB_BSC_ADDRESS,
            eth: process.env.BNB_ETH_ADDRESS || process.env.REACT_APP_BNB_ETH_ADDRESS
        },
        solana: {
            mainnet: process.env.SOLANA_MAINNET_ADDRESS || process.env.REACT_APP_SOLANA_MAINNET_ADDRESS,
            bsc: process.env.SOLANA_BSC_ADDRESS || process.env.REACT_APP_SOLANA_BSC_ADDRESS
        },
        binance: {
            userId: process.env.BINANCE_USER_ID || process.env.REACT_APP_BINANCE_USER_ID
        }
    };
};
// Apply security middleware
router.use(securityHeaders);
router.use(walletRateLimit);
// Health check endpoint (public, no authentication needed)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Secure wallet API is healthy',
        timestamp: new Date().toISOString()
    });
});
// Apply CSRF protection to all other routes
router.use(csrfProtection);
// Get wallet address endpoint
router.get('/address/:crypto/:network', validateInput, (req, res) => {
    try {
        const crypto = sanitizeInput(req.params.crypto);
        const network = sanitizeInput(req.params.network);
        const addresses = getVerifiedAddresses();
        const cryptoAddresses = addresses[crypto];
        if (!cryptoAddresses) {
            logger_1.default.warn('Invalid crypto type requested', { crypto, network, ip: req.ip });
            return res.status(400).json({
                success: false,
                message: 'Invalid cryptocurrency type'
            });
        }
        const address = cryptoAddresses[network];
        if (!address) {
            logger_1.default.warn('Invalid network type requested', { crypto, network, ip: req.ip });
            return res.status(400).json({
                success: false,
                message: 'Invalid network type'
            });
        }
        // Log successful request
        logger_1.default.info('Wallet address requested', { crypto, network, ip: req.ip });
        res.json({
            success: true,
            data: {
                crypto,
                network,
                address,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting wallet address:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Get QR code endpoint
router.get('/qr/:crypto/:network', validateInput, (req, res) => {
    try {
        const crypto = sanitizeInput(req.params.crypto);
        const network = sanitizeInput(req.params.network);
        const addresses = getVerifiedAddresses();
        const cryptoAddresses = addresses[crypto];
        if (!cryptoAddresses) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cryptocurrency type'
            });
        }
        const address = cryptoAddresses[network];
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
        logger_1.default.info('QR code requested', { crypto, network, ip: req.ip });
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
    }
    catch (error) {
        logger_1.default.error('Error generating QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Get all wallet addresses (admin only)
router.get('/all', (req, res) => {
    try {
        // Check for admin key
        const adminKey = req.headers['x-admin-key'];
        const expectedKey = process.env.ADMIN_KEY || 'admin123';
        if (!adminKey || adminKey !== expectedKey) {
            logger_1.default.warn('Unauthorized access attempt to all addresses', { ip: req.ip });
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }
        const addresses = getVerifiedAddresses();
        logger_1.default.info('All addresses requested by admin', { ip: req.ip });
        res.json({
            success: true,
            data: addresses,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Error getting all addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=secureWallet.js.map