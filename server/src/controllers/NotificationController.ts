import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Notification, INotification } from '../models/Notification';

export class NotificationController extends BaseController<INotification> {
  constructor() {
    super(Notification);
  }

  // Get user's notifications
  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
  const userId = (req as any).user?.id;
      const notifications = await Notification.find({ 
        userId,
        isRead: false 
      }).sort({ createdAt: -1 });

      res.json({ success: true, data: notifications });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Mark notification as read
  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
  const userId = (req as any).user?.id;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        res.status(404).json({ success: false, error: 'Notification not found' });
        return;
      }

      res.json({ success: true, data: notification });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Mark all notifications as read
  markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
  const userId = (req as any).user?.id;

      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Send notification to user
  sendNotification = async (
    userId: string,
    title: string,
    message: string,
    type: 'alert' | 'info' | 'warning' = 'info',
    metadata?: any
  ): Promise<INotification> => {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      metadata
    });

    return notification.save();
  };
}