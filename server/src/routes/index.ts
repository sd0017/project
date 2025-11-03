import { Router } from 'express';
import authRoutes from './auth.routes';
import centersRoutes from './centers.routes';
import guestsRoutes from './guests.routes';
import notificationsRoutes from './notifications.routes';
import statsRoutes from './stats.routes';
import videosRoutes from './videos.routes';
import emergencyRoutes from './emergency.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/centers', centersRoutes);
router.use('/guests', guestsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/stats', statsRoutes);
router.use('/videos', videosRoutes);
router.use('/emergency', emergencyRoutes);

export default router;