import rateLimit from 'express-rate-limit';

/**
 * A rate limiter middleware to protect against brute-force attacks and API abuse.
 * It limits each IP to 100 requests per 15 minutes.
 */
export const rateLimiterMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
