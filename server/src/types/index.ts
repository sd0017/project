import { Request, Response, NextFunction } from 'express';
import { Document, Types } from 'mongoose';

// Base document interface
export interface IBaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

// Base model interface with timestamps
export interface ITimestampedDocument {
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB ID type
export type MongoId = Types.ObjectId | string;

// Extended Express Request with user
export interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role: string;
    email: string;
  };
}

// Controller handler type
export type ControllerHandler = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Query parameters interface
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Location query interface
export interface LocationQuery {
  lat: number;
  lon: number;
  radius?: number;
}

// Contact info interface
export interface IContactInfo {
  phone?: string;
  email?: string;
}

// GeoJSON Point type
export interface IPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}