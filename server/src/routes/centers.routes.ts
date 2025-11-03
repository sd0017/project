import { Router } from 'express';
import * as CentersController from '../controllers/centers.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { 
  validateCenterInput, 
  validateQueryParams,
  validateLocationQuery,
  validate 
} from '../middleware/validation.middleware';

const router = Router();

// Center model fields that can be used for sorting
const SORTABLE_FIELDS = ['name', 'capacity', 'currentOccupancy', 'createdAt', 'updatedAt'];

// Public routes
router.get('/', 
  validate(validateQueryParams(SORTABLE_FIELDS)),
  CentersController.getAllCenters
);

router.get('/:id', 
  CentersController.getCenterById
);

router.get('/:id/stats', 
  CentersController.getCenterStats
);

router.get('/nearby', 
  validate(validateLocationQuery),
  CentersController.getNearbyCenters
);

// Protected routes
router.post('/', 
  authMiddleware, 
  requireRole(['government', 'admin']), 
  validate(validateCenterInput),
  CentersController.createCenter
);

router.put('/:id', 
  authMiddleware, 
  requireRole(['government', 'admin']), 
  validate(validateCenterInput),
  CentersController.updateCenter
);

router.delete('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  CentersController.deleteCenter
);

export default router;