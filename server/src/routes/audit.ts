import { Router } from 'express';
import { AuditController } from '../controllers';
import { requireAuth } from '../middleware/auth';

const router = Router();
const controller = new AuditController();

// All audit routes require authentication
router.use(requireAuth);

router.get('/resource/:resourceType/:resourceId', controller.getResourceLogs);
router.get('/user/:userId', controller.getUserLogs);
router.get('/system', controller.getSystemLogs);

export default router;