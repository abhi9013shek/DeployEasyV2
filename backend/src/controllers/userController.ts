import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

export const userController = {
  async getUser(_req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getDemoUser();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};
