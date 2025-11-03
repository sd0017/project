import { Router } from 'express';
import * as VideosController from '../controllers/videos.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public routes
router.get('/', VideosController.getAllVideos);
router.get('/:id', VideosController.getVideoById);

// Protected routes (admin/government only)
router.post('/',
  authMiddleware,
  requireRole(['admin', 'government']),
  VideosController.uploadVideo
);
router.put('/:id',
  authMiddleware,
  requireRole(['admin', 'government']),
  VideosController.updateVideo
);
router.delete('/:id',
  authMiddleware,
  requireRole(['admin', 'government']),
  VideosController.deleteVideo
);

export default router;