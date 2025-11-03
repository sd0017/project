import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Add request ID to the request object
declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

/**
 * Generate request ID and add timing
 */
export const requestContext = (req: Request, _res: Response, next: NextFunction) => {
  req.id = uuidv4();
  req.startTime = Date.now();
  next();
};

/**
 * Custom morgan token for request ID
 */
morgan.token('request-id', (req: Request) => req.id || '-');

/**
 * Custom morgan token for response time in a more readable format
 */
morgan.token('response-time-pretty', (req: Request, res: Response) => {
  if (!req.startTime) return '-';
  const duration = Date.now() - req.startTime;
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
});

/**
 * Custom morgan token for request body (sanitized)
 */
morgan.token('body', (req: Request) => {
  if (!req.body || Object.keys(req.body).length === 0) return '-';
  
  // Sanitize sensitive fields
  const sanitized = { ...req.body };
  ['password', 'token', 'secret', 'authorization'].forEach(field => {
    if (field in sanitized) sanitized[field] = '[REDACTED]';
  });
  
  return JSON.stringify(sanitized);
});

/**
 * Development format with colors and detailed information
 */
const developmentFormat = [
  '\n🔍 :request-id',
  '\n📝 :method :url',
  '\n👤 :remote-addr',
  '\n📦 :body',
  '\n⏱️  :response-time-pretty',
  '\n📈 :status',
  '\n\n'
].join(' ');

/**
 * Production format focused on essential information in a machine-readable format
 */
const productionFormat = ':request-id :remote-addr :method :url :status :response-time-pretty';

/**
 * Configure morgan logger based on environment
 */
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    // Skip health check endpoints in logs
    skip: (req: Request) => req.url === '/health' || req.url === '/api/health',
    
    // Custom stream to handle log output
    stream: {
      write: (message: string) => {
        if (process.env.NODE_ENV === 'production') {
          // In production, output JSON format for better log aggregation
          const [requestId = '-', ip = '-', method = '-', url = '-', status = '0', duration = '0'] = message.trim().split(' ');
          console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            requestId,
            ip,
            method,
            url,
            status: Number(status),
            duration,
            level: 'info',
            environment: process.env.NODE_ENV
          }));
        } else {
          // In development, use formatted console output
          console.log(message.trim());
        }
      }
    }
  }
);

/**
 * Custom error logger
 */
export const errorLogger = (err: any, req: Request) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId: req.id,
    method: req.method,
    url: req.url,
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    level: 'error',
    environment: process.env.NODE_ENV
  };

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorLog));
  } else {
    console.error('\n❌ Error occurred:', errorLog);
  }
};