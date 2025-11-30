import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';

/**
 * Request Logging Middleware
 * Logs all incoming API requests with timing information
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request start
  logger.debug('API', `Incoming request: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    const duration = Date.now() - startTime;
    
    // Log request completion
    logger.apiRequest(req.method, req.path, res.statusCode, duration);
    
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};

/**
 * Security Headers Middleware
 * Adds security-related HTTP headers
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );

  next();
};

/**
 * Rate Limiting State (Simple in-memory implementation)
 * For production, use Redis or similar
 */
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

/**
 * Rate Limiting Middleware
 * Limits requests per IP address
 */
export const rateLimiter = (options: {
  windowMs?: number;
  maxRequests?: number;
} = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const maxRequests = options.maxRequests || 100;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(ip);
    
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(ip, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxRequests) {
      logger.warn('RATE_LIMIT', `Rate limit exceeded for IP: ${ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
};

/**
 * Clean up rate limit store periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000); // Clean up every minute
