import { Router } from 'express';
import { NotificationController } from '../controllers';
import { requireAuth } from '../middleware/auth';

const router = Router();
const controller = new NotificationController();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', controller.getUserNotifications);
router.put('/:id/read', controller.markAsRead);
router.put('/read-all', controller.markAllAsRead);

export default router;