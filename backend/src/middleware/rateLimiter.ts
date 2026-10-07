import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Global API Rate Limiter
 * 100 requests per minute per IP address
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Global rate limit exceeded: 100 requests per minute limit.',
      retryAfterSeconds: 60,
    });
  },
});

/**
 * High-Value Financial Transfer Rate Limiter
 * 10 transfer requests per minute per tenant API key (or IP fallback)
 */
export const transferRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ag_live_')) {
      return authHeader.split(' ')[1];
    }
    return req.ip || 'anonymous';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Transfer rate limit exceeded: Maximum 10 transfer requests per minute allowed per API key.',
      retryAfterSeconds: 60,
    });
  },
});
