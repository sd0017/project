import { Router } from 'express';
import * as GuestsController from '../controllers/guests.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public routes with auth (rescue centers and admins)
router.get('/',
  authMiddleware,
  requireRole(['rescue-center', 'admin', 'government']),
  GuestsController.getAllGuests
);
router.get('/:id',
  authMiddleware,
  requireRole(['rescue-center', 'admin', 'government']),
  GuestsController.getGuestById
);
router.get('/search/aadhar',
  authMiddleware,
  requireRole(['rescue-center', 'admin', 'government']),
  GuestsController.searchGuests
);

// Protected routes (rescue centers only)
router.post('/',
  authMiddleware,
  requireRole(['rescue-center', 'admin']),
  GuestsController.createGuest
);
router.put('/:id',
  authMiddleware,
  requireRole(['rescue-center', 'admin']),
  GuestsController.updateGuest
);
router.delete('/:id',
  authMiddleware,
  requireRole(['rescue-center', 'admin']),
  GuestsController.deleteGuest
);

// Transfer route (requires special permission)
router.post('/:id/transfer',
  authMiddleware,
  requireRole(['rescue-center', 'admin']),
  GuestsController.transferGuest
);

export default router;