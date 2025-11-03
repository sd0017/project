import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(403, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};