import { Router } from 'express';
import * as StatsController from '../controllers/stats.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Protected routes (auth required)
router.get('/system',
  authMiddleware,
  requireRole(['admin', 'government']),
  StatsController.getDisasterStats
);

router.get('/centers/:centerId',
  authMiddleware,
  requireRole(['rescue-center', 'admin', 'government']),
  StatsController.getCenterAnalytics
);

router.get('/resources',
  authMiddleware,
  requireRole(['admin', 'government']),
  StatsController.getResourceUtilization
);

router.get('/trends/:metric/:timeRange',
  authMiddleware,
  requireRole(['admin', 'government']),
  StatsController.getTrendData
);

export default router;