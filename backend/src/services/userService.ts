import prisma from '../config/database';

export const userService = {
  async getDemoUser() {
    const user = await prisma.user.findFirst({
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });
    return user;
  },
};
