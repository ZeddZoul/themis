import morgan from 'morgan';

/**
 * A structured HTTP request logger middleware using morgan.
 * It uses the 'combined' format, which is a standard for Apache-style logs.
 * This provides detailed, production-ready logs for auditing and debugging.
 */
export const loggingMiddleware = morgan('combined');
