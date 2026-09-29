import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activityService';
import { userService } from '../services/userService';

export const activityController = {
  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getDemoUser();
      if (!user) return res.status(401).json({ success: false, message: 'No user found' });

      const activities = await activityService.getAll(user.id);
      return res.json({ success: true, data: activities });
    } catch (err) {
      next(err);
    }
  },
};
