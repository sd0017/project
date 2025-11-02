import { Router } from 'express';
import { StatsController } from '../controllers';
import { requireAuth } from '../middleware/auth';

const router = Router();
const controller = new StatsController();

// Public routes
router.get('/disaster', controller.getStats);

// Protected routes
router.use(requireAuth);
router.get('/center/:id', controller.getCenterStats);
router.get('/supplies', controller.getSupplyStats);

export default router;