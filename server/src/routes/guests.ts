import { Router } from 'express';
import { GuestController } from '../controllers';
import { requireAuth } from '../middleware/auth';

const router = Router();
const controller = new GuestController();

// Public routes
router.get('/', controller.getAll);
router.get('/search', controller.searchGuests);
router.get('/:id', controller.getById);
router.get('/center/:centerId', controller.getByCenter);

// Protected routes
router.use(requireAuth);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post('/:guestId/transfer', controller.transferGuest);

export default router;
