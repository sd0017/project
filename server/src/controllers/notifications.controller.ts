import { Request, Response } from 'express';
import mongoose from 'mongoose';
import NotificationModel from '../models/Notification';
import { getIo } from '../socket';

function getUserIdFromReq(req: Request) {
  const user = (req as any).user;
  return user && user._id ? String(user._id) : null;
}

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, priority, unreadOnly, page = '1', limit = '20' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (unreadOnly === 'true' || unreadOnly === true) filter.read = false;

    const total = await NotificationModel.countDocuments(filter);
    const notifications = await NotificationModel.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.json({ notifications, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
  } catch (err) {
    console.error('getUserNotifications error', err);
    return res.status(500).json({ error: 'Unable to fetch notifications' });
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    // Only admin (or system processes) should create notifications via API
    const user = (req as any).user;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { userId, title, message, type = 'info', priority = 'medium', metadata = {}, expiresAt } = req.body;
    if (!userId || !title || !message) return res.status(400).json({ error: 'userId, title and message are required' });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const notification = new NotificationModel({ userId: new mongoose.Types.ObjectId(userId), title, message, type, priority, metadata, expiresAt: expiresAt || null });
    await notification.save();

    const io = getIo();
    // Emit to a room name pattern 'user:<id>' — frontend should join this room on connect
    io?.to(`user:${userId}`).emit('notification:new', { notification });

    return res.status(201).json({ notification });
  } catch (err) {
    console.error('createNotification error', err);
    return res.status(500).json({ error: 'Unable to create notification' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid notification id' });

    const notif = await NotificationModel.findById(id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (String(notif.userId) !== userId) return res.status(403).json({ error: 'Forbidden' });

    notif.read = true;
    await notif.save();

    return res.json({ notification: notif });
  } catch (err) {
    console.error('markAsRead error', err);
    return res.status(500).json({ error: 'Unable to mark notification as read' });
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid notification id' });

    const notif = await NotificationModel.findById(id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (String(notif.userId) !== userId) return res.status(403).json({ error: 'Forbidden' });

    await notif.deleteOne();
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteNotification error', err);
    return res.status(500).json({ error: 'Unable to delete notification' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const count = await NotificationModel.countDocuments({ userId: new mongoose.Types.ObjectId(userId), read: false });
    return res.json({ unreadCount: count });
  } catch (err) {
    console.error('getUnreadCount error', err);
    return res.status(500).json({ error: 'Unable to fetch unread count' });
  }
};

export default {
  getUserNotifications,
  createNotification,
  markAsRead,
  deleteNotification,
  getUnreadCount,
};
