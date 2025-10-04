import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10');

export const conversionRateLimit = rateLimit({
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

export const statusRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many status requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});
