"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusRateLimit = exports.conversionRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10');
exports.conversionRateLimit = (0, express_rate_limit_1.default)({
    windowMs,
    max: maxRequests,
    message: {
        success: false,
        message: 'Too many conversion requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many conversion requests, please try again later',
            retryAfter: Math.ceil(windowMs / 1000)
        });
    }
});
exports.statusRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
        success: false,
        message: 'Too many status requests, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false
});
//# sourceMappingURL=rateLimiter.js.map