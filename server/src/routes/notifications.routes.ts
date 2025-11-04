import { Router } from 'express';
import * as NotificationsController from '../controllers/notifications.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// User notifications (requires auth)
router.get('/',
  authMiddleware,
  NotificationsController.getUserNotifications
);
router.get('/unread',
  authMiddleware,
  NotificationsController.getUnreadCount
);
router.post('/read',
  authMiddleware,
  NotificationsController.markAsRead
);
router.delete('/:id',
  authMiddleware,
  NotificationsController.deleteNotification
);

// Admin only routes
router.post('/',
  authMiddleware,
  requireRole(['admin', 'government']),
  NotificationsController.createNotification
);
router.post('/bulk',
  authMiddleware,
  requireRole(['admin', 'government']),
  NotificationsController.sendBulkNotifications
);

export default router;