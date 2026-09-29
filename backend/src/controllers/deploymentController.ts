import { Request, Response, NextFunction } from 'express';
import { deploymentService } from '../services/deploymentService';
import { userService } from '../services/userService';

export const deploymentController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, status } = req.query;
      const deployments = await deploymentService.getAll(
        projectId as string | undefined,
        status as string | undefined
      );
      return res.json({ success: true, data: deployments });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deployment = await deploymentService.getById(id);
      return res.json({ success: true, data: deployment });
    } catch (err) {
      next(err);
    }
  },

  async getByProjectId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const deployments = await deploymentService.getByProjectId(id);
      return res.json({ success: true, data: deployments });
    } catch (err) {
      next(err);
    }
  },

  async getLogsByProjectId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const logs = await deploymentService.getLogsByProjectId(id);
      return res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getDemoUser();
      if (!user) return res.status(401).json({ success: false, message: 'No user found' });

      const deployment = await deploymentService.create(user.id, req.body);
      return res.status(201).json({ success: true, data: deployment });
    } catch (err) {
      next(err);
    }
  },
};
