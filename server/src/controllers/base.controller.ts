import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { AuthenticatedRequest, PaginationQuery, LocationQuery } from '../types';
import { NotFoundError, ValidationError as AppValidationError } from '../utils/errors';
import { asyncHandler } from '../middleware/error.middleware';

/**
 * Base controller class with common utility methods
 */
export abstract class BaseController {
  /**
   * Parse pagination parameters from query
   */
  protected getPaginationParams(req: Request): PaginationQuery {
    return {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };
  }

  /**
   * Parse location parameters from query
   */
  protected getLocationParams(req: Request): LocationQuery {
    const { lat, lon, radius } = req.query;
    return {
      lat: parseFloat(lat as string),
      lon: parseFloat(lon as string),
      radius: radius ? parseFloat(radius as string) : undefined
    };
  }

  /**
   * Check if user has required role
   */
  protected checkRole(req: AuthenticatedRequest, roles: string[]): boolean {
    return roles.includes(req.user.role);
  }

  /**
   * Handle validation errors
   */
  protected handleValidationErrors(errors: ValidationError[]): void {
    if (errors.length > 0) {
      throw new AppValidationError('Validation failed', {
        errors: errors.map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }
  }

  /**
   * Create a wrapped async route handler with error handling
   */
  protected createHandler(
    handler: (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => Promise<void>
  ) {
    return asyncHandler(handler);
  }
}