import { Router } from 'express';
import * as EmergencyController from '../controllers/emergency.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Emergency call endpoints
router.post('/call',
  authMiddleware,
  EmergencyController.initiateEmergencyCall
);

router.get('/call/:id',
  authMiddleware,
  EmergencyController.getEmergencyCallStatus
);

router.put('/call/:id',
  authMiddleware,
  requireRole(['rescue-center', 'admin']),
  EmergencyController.updateEmergencyCallStatus
);

// SOS alerts
router.post('/sos',
  authMiddleware,
  EmergencyController.sendSosAlert
);

router.get('/sos/nearby',
  authMiddleware,
  requireRole(['rescue-center', 'admin']),
  EmergencyController.getNearbySosAlerts
);

// Emergency resources
router.get('/resources/nearby',
  EmergencyController.getNearbyEmergencyResources
);

export default router;