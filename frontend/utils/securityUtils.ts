/**
 * Security Utilities
 * Protection against JavaScript injection, XSS, and other attacks
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @returns sanitized HTML
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*>/gi, '') // Remove embed tags
    .replace(/<link\b[^<]*>/gi, '') // Remove link tags
    .replace(/<meta\b[^<]*>/gi, '') // Remove meta tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitize text content to prevent injection attacks
 * @param text - The text to sanitize
 * @returns sanitized text
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate and sanitize URL to prevent malicious redirects
 * @param url - The URL to validate
 * @returns sanitized URL or null if invalid
 */
export const sanitizeURL = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Block dangerous domains
    const dangerousDomains = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'ftp:'
    ];
    
    if (dangerousDomains.some(domain => url.toLowerCase().includes(domain))) {
      return null;
    }
    
    return url;
  } catch (error) {
    return null;
  }
};

/**
 * Validate input to prevent injection attacks
 * @param input - The input to validate
 * @param type - The expected input type
 * @returns validation result
 */
export const validateInput = (input: string, type: 'text' | 'email' | 'url' | 'number'): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sanitized = sanitizeText(input);
  
  switch (type) {
    case 'text':
      return sanitized.length > 0 && sanitized.length <= 1000;
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(sanitized);
    case 'url':
      return sanitizeURL(input) !== null;
    case 'number':
      return !isNaN(Number(sanitized)) && isFinite(Number(sanitized));
    default:
      return false;
  }
};

/**
 * Escape HTML entities to prevent XSS
 * @param text - The text to escape
 * @returns escaped text
 */
export const escapeHTML = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const entityMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return text.replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
};

/**
 * Validate crypto address format
 * @param address - The address to validate
 * @param type - The crypto type
 * @returns validation result
 */
export const validateCryptoAddress = (address: string, type: string): boolean => {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const patterns: { [key: string]: RegExp } = {
    bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    tron: /^T[A-Za-z1-9]{33}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    bsc: /^0x[a-fA-F0-9]{40}$/
  };

  const pattern = patterns[type];
  return pattern ? pattern.test(address) : false;
};

/**
 * Generate secure random string
 * @param length - The length of the string
 * @returns secure random string
 */
export const generateSecureRandom = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for older browsers
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
};

/**
 * Check for suspicious patterns in user input
 * @param input - The input to check
 * @returns array of suspicious patterns found
 */
export const detectSuspiciousPatterns = (input: string): string[] => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /@import/i,
    /document\./i,
    /window\./i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i
  ];

  const found: string[] = [];
  
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(input)) {
      found.push(`Pattern ${index + 1}: ${pattern.source}`);
    }
  });

  return found;
};

/**
 * Log security incident
 * @param type - The type of incident
 * @param data - Additional data
 */
export const logSecurityIncident = (type: string, data: any) => {
  const incident = {
    type,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
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
 * Content Security Policy helper
 * @returns CSP header value
 */
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'none'"
  ].join('; ');
};
