import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { githubAuthService } from '../services/githubAuthService';
import prisma from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'deployeasy-secret-jwt-key-2026';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const authController = {
  // Redirect to GitHub OAuth consent screen
  async redirectToGitHub(req: Request, res: Response) {
    if (!githubAuthService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env',
      });
    }
    const url = githubAuthService.getAuthorizationUrl();
    return res.redirect(url);
  },

  // OAuth callback handler
  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const code = req.query.code as string;

      if (!code) {
        return res.status(400).json({ success: false, message: 'Authorization code missing' });
      }

      // Real GitHub OAuth exchange
      const accessToken = await githubAuthService.getAccessToken(code);
      const { profile, primaryEmail } = await githubAuthService.getUserProfile(accessToken);
      const githubId = String(profile.id);

      let user = await prisma.user.findFirst({
        where: { OR: [{ githubId }, { email: primaryEmail }] },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            githubId,
            avatarUrl: profile.avatar_url,
            accessToken,
            username: profile.login,
            email: primaryEmail,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            githubId,
            username: profile.login,
            email: primaryEmail,
            avatarUrl: profile.avatar_url,
            accessToken,
          },
        });
      }

      // Create JWT session token
      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${FRONTEND_URL}/dashboard?login=success`);
    } catch (err) {
      next(err);
    }
  },

  // Get current logged-in user
  async getCurrentUser(req: Request, res: Response) {
    try {
      const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      return res.json({ success: true, data: user });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }
  },

  // Logout
  async logout(req: Request, res: Response) {
    res.clearCookie('auth_token');
    return res.json({ success: true, message: 'Logged out successfully' });
  },
};
