import { Request, Response, NextFunction } from 'express';

interface RateLimit {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimit> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 15 * 60 * 1000) { // 10 requests per 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, limit] of this.limits.entries()) {
        if (now > limit.resetTime) {
          this.limits.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  middleware = (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    let limit = this.limits.get(clientIP);
    
    if (!limit || now > limit.resetTime) {
      limit = {
        count: 1,
        resetTime: now + this.windowMs
      };
      this.limits.set(clientIP, limit);
      next();
      return;
    }
    
    if (limit.count >= this.maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
      });
      return;
    }
    
    limit.count++;
    this.limits.set(clientIP, limit);
    next();
  };
}

export const shareRateLimiter = new RateLimiter(10, 15 * 60 * 1000); // 10 shares per 15 minutes
export const retrieveRateLimiter = new RateLimiter(50, 15 * 60 * 1000); // 50 retrievals per 15 minutes
