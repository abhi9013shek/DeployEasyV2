import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/projectService';
import { userService } from '../services/userService';

export const projectController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getDemoUser();
      if (!user) return res.status(401).json({ success: false, message: 'No user found' });

      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;
      const projects = await projectService.getAll(user.id, status, search);
      return res.json({ success: true, data: projects });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const project = await projectService.getById(id);
      return res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getDemoUser();
      if (!user) return res.status(401).json({ success: false, message: 'No user found' });

      const project = await projectService.create(user.id, req.body);
      return res.status(201).json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const project = await projectService.update(id, req.body);
      return res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await projectService.delete(id);
      return res.json({ success: true, data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  },

  async regenerateWebhookSecret(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const data = await projectService.regenerateWebhookSecret(id);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
