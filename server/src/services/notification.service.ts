import { Types } from 'mongoose';
import Notification, { INotification, NotificationType, NotificationPriority } from '../models/Notification';
import { ApiError } from '../utils/ApiError';
import { getIo } from '../socket';

export interface ICreateNotification {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

class NotificationService {
  /**
   * Creates a new notification for a user
   */
  async createNotification(data: ICreateNotification): Promise<INotification> {
    try {
      const notification = await Notification.create({
        ...data,
        read: false,
        createdAt: new Date()
      });

      // Emit socket event to user
      const io = getIo();
      io.to(`user:${data.userId}`).emit('notification:new', notification);

      return notification;
    } catch (error) {
      throw new ApiError(500, 'Error creating notification');
    }
  }

  /**
   * Sends the same notification to multiple users
   */
  async sendBulkNotifications(
    userIds: string[],
    notificationData: Omit<ICreateNotification, 'userId'>
  ): Promise<INotification[]> {
    try {
      const notifications = await Notification.insertMany(
        userIds.map(userId => ({
          ...notificationData,
          userId: new Types.ObjectId(userId),
          read: false,
          createdAt: new Date()
        }))
      );

      // Emit socket events to each user
      const io = getIo();
      notifications.forEach(notification => {
        io.to(`user:${notification.userId}`).emit('notification:new', notification);
      });

      return notifications;
    } catch (error) {
      throw new ApiError(500, 'Error sending bulk notifications');
    }
  }

  /**
   * Schedules a notification to be sent at a specific time
   */
  async scheduleNotification(
    notification: ICreateNotification,
    sendAt: Date
  ): Promise<INotification> {
    try {
      if (sendAt <= new Date()) {
        throw new ApiError(400, 'Schedule time must be in the future');
      }

      const scheduledNotification = await Notification.create({
        ...notification,
        scheduledFor: sendAt,
        status: 'scheduled',
        read: false,
        createdAt: new Date()
      });

      // Schedule the notification delivery
      const delay = sendAt.getTime() - Date.now();
      setTimeout(async () => {
        try {
          const notif = await Notification.findById(scheduledNotification._id);
          if (notif && notif.status === 'scheduled') {
            notif.status = 'sent';
            await notif.save();

            // Emit socket event
            const io = getIo();
            io.to(`user:${notification.userId}`).emit('notification:new', notif);
          }
        } catch (error) {
          console.error('Error delivering scheduled notification:', error);
        }
      }, delay);

      return scheduledNotification;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error scheduling notification');
    }
  }

  /**
   * Deletes expired notifications
   */
  async deleteExpiredNotifications(): Promise<number> {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      return result.deletedCount;
    } catch (error) {
      throw new ApiError(500, 'Error deleting expired notifications');
    }
  }

  /**
   * Marks notifications as read for a user
   */
  async markAsRead(notificationIds: string[]): Promise<void> {
    try {
      await Notification.updateMany(
        { _id: { $in: notificationIds } },
        { $set: { read: true } }
      );
    } catch (error) {
      throw new ApiError(500, 'Error marking notifications as read');
    }
  }

  /**
   * Gets unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        userId: new Types.ObjectId(userId),
        read: false
      });
    } catch (error) {
      throw new ApiError(500, 'Error getting unread notification count');
    }
  }
}

export const notificationService = new NotificationService();