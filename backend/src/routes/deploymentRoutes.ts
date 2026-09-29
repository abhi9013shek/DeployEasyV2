import { Router } from 'express';
import { deploymentController } from '../controllers/deploymentController';

const router = Router();

router.get('/', deploymentController.getAll);
router.get('/:id', deploymentController.getById);
router.post('/', deploymentController.create);

export default router;
