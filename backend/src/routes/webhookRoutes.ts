import { Router } from 'express';
import { webhookController } from '../controllers/webhookController';

const router = Router();

router.post('/github', webhookController.handleGitHubWebhook);

export default router;
