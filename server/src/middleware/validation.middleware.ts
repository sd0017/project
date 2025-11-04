import { Request, Response, NextFunction } from 'express';
import { body, query, ValidationChain, validationResult } from 'express-validator';
import { Types } from 'mongoose';

// Define notification types until we have the actual enums
const NotificationType = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  ALERT: 'alert'
} as const;

const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

// Helper to validate MongoDB ObjectId
const isValidObjectId = (value: string) => Types.ObjectId.isValid(value);

// Reusable contact info validation
const contactInfoValidation = [
  body('contactInfo').isObject().withMessage('Contact info must be an object'),
  body('contactInfo.phone').optional()
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Invalid phone number'),
  body('contactInfo.email').optional()
    .isEmail().withMessage('Invalid email address'),
  body('contactInfo').custom((value: { phone?: string; email?: string }) => {
    if (!value.phone && !value.email) {
      throw new Error('Either phone or email must be provided');
    }
    return true;
  })
];

// Validate input and return errors if any
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      errors: errors.array().map((err: { param: string; msg: string }) => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// Center validation rules
export const validateCenterInput = [
  body('name')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),
  body('location')
    .isObject()
    .withMessage('Location must be an object'),
  body('location.address')
    .isString()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.coordinates')
    .isArray()
    .withMessage('Coordinates must be an array')
    .custom((value: number[]) => {
      if (!Array.isArray(value) || value.length !== 2 ||
          typeof value[0] !== 'number' || typeof value[1] !== 'number') {
        throw new Error('Coordinates must be [longitude, latitude]');
      }
      const [lon, lat] = value;
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw new Error('Invalid coordinates range');
      }
      return true;
    }),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),
  ...contactInfoValidation
];

// Guest validation rules
export const validateGuestInput = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  body('centerId')
    .custom(isValidObjectId)
    .withMessage('Invalid center ID'),
  ...contactInfoValidation
];

// Notification validation rules
export const validateNotificationInput = [
  body('title')
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Title is required and must not exceed 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .isLength({ max: 1000 })
    .withMessage('Message is required and must not exceed 1000 characters'),
  body('type')
    .isIn(Object.values(NotificationType))
    .withMessage('Invalid notification type'),
  body('priority')
    .isIn(Object.values(NotificationPriority))
    .withMessage('Invalid priority level'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Query parameters validation
import { PaginationQuery } from '../types';

export const validateQueryParams = (allowedFields: string[]): ValidationChain[] => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sortBy')
    .optional()
    .isIn(allowedFields)
    .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

// Location query validation
export const validateLocationQuery: ValidationChain[] = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  query('lon')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  query('radius')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Radius must be between 0 and 1000 km')
];