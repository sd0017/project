"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const BaseController_1 = require("./BaseController");
const Notification_1 = require("../models/Notification");
class NotificationController extends BaseController_1.BaseController {
    constructor() {
        super(Notification_1.Notification);
        // Get user's notifications
        this.getUserNotifications = async (req, res) => {
            try {
                const userId = req.user?.id;
                const notifications = await Notification_1.Notification.find({
                    userId,
                    isRead: false
                }).sort({ createdAt: -1 });
                res.json({ success: true, data: notifications });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Mark notification as read
        this.markAsRead = async (req, res) => {
            try {
                const { id } = req.params;
                const userId = req.user?.id;
                const notification = await Notification_1.Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { new: true });
                if (!notification) {
                    res.status(404).json({ success: false, error: 'Notification not found' });
                    return;
                }
                res.json({ success: true, data: notification });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Mark all notifications as read
        this.markAllAsRead = async (req, res) => {
            try {
                const userId = req.user?.id;
                await Notification_1.Notification.updateMany({ userId, isRead: false }, { isRead: true });
                res.json({ success: true, message: 'All notifications marked as read' });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Send notification to user
        this.sendNotification = async (userId, title, message, type = 'info', metadata) => {
            const notification = new Notification_1.Notification({
                userId,
                title,
                message,
                type,
                metadata
            });
            return notification.save();
        };
    }
}
exports.NotificationController = NotificationController;
