import { Router } from 'express';
import { CenterController } from '../controllers';
import { requireAuth } from '../middleware/auth';

const router = Router();
const controller = new CenterController();

// Public routes
router.get('/', controller.getAll);
router.get('/available', controller.getAvailableCenters);
router.get('/area', controller.getCentersInArea);
router.get('/:id', controller.getById);

// Protected routes
router.use(requireAuth);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.put('/:id/capacity', controller.updateCapacity);
router.put('/:id/supplies', controller.updateSupplies);

export default router;
