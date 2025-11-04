import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'info' | 'warning' | 'emergency' | 'success';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface INotification {
  userId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  metadata?: Record<string, any>;
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationDocument extends INotification, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['info', 'warning', 'emergency', 'success'], default: 'info' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    read: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

// Index for automatic removal if expiresAt is used (expire immediately at the expiresAt time)
// Note: MongoDB TTL index uses a single field and expireAfterSeconds; setting expireAfterSeconds to 0 means expire at field value
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const NotificationModel = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
export default NotificationModel;
import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'warning';
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['alert', 'info', 'warning'], default: 'info' },
    isRead: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

// Index for faster queries by userId
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);