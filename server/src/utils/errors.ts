/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    errorCode?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Invalid input, validation errors
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation Error', details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

/**
 * 401 Unauthorized - Authentication failure
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden - Permission denied
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Permission denied') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: any) {
    super(message, 409, true, 'CONFLICT', details);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, false, 'INTERNAL_ERROR');
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

/**
 * Convert any error to AppError
 */
export const toAppError = (error: any): AppError => {
  if (isAppError(error)) {
    return error;
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    return new ValidationError('Invalid input data', error.errors);
  }

  // Handle Mongoose duplicate key errors
  if (error.code === 11000) {
    return new ConflictError('Duplicate entry', {
      field: Object.keys(error.keyValue)[0],
      value: Object.values(error.keyValue)[0]
    });
  }

  // Handle other Mongoose errors
  if (error.name === 'CastError') {
    return new ValidationError('Invalid ID format');
  }

  // Handle JSON parse errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return new ValidationError('Invalid JSON');
  }

  // Default to internal server error
  return new InternalServerError(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  );
};