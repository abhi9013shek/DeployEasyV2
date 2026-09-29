import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { deploymentController } from '../controllers/deploymentController';

const router = Router();

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.delete);
router.post('/:id/webhook-secret/regenerate', projectController.regenerateWebhookSecret);

// Project-scoped deployment routes
router.get('/:id/deployments', deploymentController.getByProjectId);
router.get('/:id/logs', deploymentController.getLogsByProjectId);

export default router;
