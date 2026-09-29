import prisma from '../config/database';

export const activityService = {
  async getAll(userId: string, limit = 50) {
    return prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
