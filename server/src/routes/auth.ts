import { Router } from 'express';
import { register, login, governmentLogin, rescueCenterLogin, me } from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/government-login', governmentLogin);
router.post('/rescue-login', rescueCenterLogin);

// Protected routes
router.use(requireAuth);
router.get('/me', me);

export default router;
