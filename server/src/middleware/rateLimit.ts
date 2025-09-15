import rateLimit from 'express-rate-limit';

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

export const strictRateLimitMiddleware = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many requests from this IP for this endpoint, please try again later.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

export const generationRateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'Too many generation requests, please wait before trying again.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});