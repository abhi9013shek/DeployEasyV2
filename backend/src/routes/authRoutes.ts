import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.get('/github', authController.redirectToGitHub);
router.get('/github/callback', authController.handleCallback);
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);

export default router;
