import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError as ExpressValidationError } from 'express-validator';
import { AppError, toAppError, isAppError } from '../utils/errors';
import { errorLogger } from './logger.middleware';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Convert error to AppError if it isn't one already
  const appError = isAppError(error) ? error : toAppError(error);
  
  // Log the error
  errorLogger(appError, req);

  // Don't expose internal server errors details in production
  const response = {
    success: false,
    message: appError.message,
    code: appError.errorCode,
    ...(appError.details && { details: appError.details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: appError.stack }),
    requestId: req.id
  };

  // Send error response
  res.status(appError.statusCode).json(response);
};

/**
 * Handle 404 errors for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.method} ${req.path} not found`, 404, true, 'NOT_FOUND');
  next(error);
};

/**
 * Handle validation errors from express-validator
 */
export const validationErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new AppError('Validation failed', 400, true, 'VALIDATION_ERROR', {
      errors: errors.array().map((err: ExpressValidationError) => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
    return next(error);
  }
  next();
};

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};