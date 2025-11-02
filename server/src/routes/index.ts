import { Router } from 'express';
import authRoutes from './auth';
import centerRoutes from './centers';
import guestRoutes from './guests';
import notificationRoutes from './notifications';
import statsRoutes from './stats';
import auditRoutes from './audit';

const router = Router();

// Register routes
router.use('/auth', authRoutes);
router.use('/centers', centerRoutes);
router.use('/guests', guestRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);
router.use('/audit', auditRoutes);

export default router;