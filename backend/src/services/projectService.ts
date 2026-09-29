import prisma from '../config/database';
import { CreateProjectInput, UpdateProjectInput } from '../types';
import { AppError } from '../middleware/errorHandler';

export const projectService = {
  async getAll(userId: string, status?: string, search?: string) {
    const where: Record<string, unknown> = { userId };
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { repository: { contains: search } },
      ];
    }
    return prisma.project.findMany({
      where,
      include: {
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, version: true, status: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        deployments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!project) throw new AppError('Project not found', 404);
    return project;
  },

  async create(userId: string, data: CreateProjectInput) {
    if (!data.name || !data.repository) {
      throw new AppError('Name and repository are required', 400);
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        repository: data.repository,
        branch: data.branch || 'main',
        framework: data.framework?.toUpperCase() || 'REACT',
        buildCommand: data.buildCommand || 'npm run build',
        startCommand: data.startCommand || 'npm run preview',
        envVars: data.envVars,
        liveUrl: `https://${data.name}.deployeasy.local`,
        userId,
      },
    });

    await prisma.activity.create({
      data: {
        type: 'PROJECT_CREATED',
        message: `New project "${data.name}" created`,
        userId,
      },
    });

    return project;
  },

  async update(id: string, data: UpdateProjectInput) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError('Project not found', 404);

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.branch && { branch: data.branch }),
        ...(data.framework && { framework: data.framework.toUpperCase() }),
        ...(data.buildCommand && { buildCommand: data.buildCommand }),
        ...(data.startCommand && { startCommand: data.startCommand }),
        ...(data.envVars !== undefined && { envVars: data.envVars }),
        ...(data.autoDeploy !== undefined && { autoDeploy: data.autoDeploy }),
        ...(data.webhookSecret !== undefined && { webhookSecret: data.webhookSecret }),
        ...(data.status && { status: data.status.toUpperCase() }),
      },
    });

    await prisma.activity.create({
      data: {
        type: 'PROJECT_UPDATED',
        message: `Project "${updated.name}" settings updated`,
        userId: project.userId,
      },
    });

    return updated;
  },

  async regenerateWebhookSecret(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError('Project not found', 404);

    const secret = 'whsec_' + (await import('crypto')).randomBytes(24).toString('hex');
    const updated = await prisma.project.update({
      where: { id },
      data: { webhookSecret: secret },
    });

    return { webhookSecret: updated.webhookSecret };
  },

  async delete(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError('Project not found', 404);

    await prisma.activity.create({
      data: {
        type: 'PROJECT_DELETED',
        message: `Project "${project.name}" deleted`,
        userId: project.userId,
      },
    });

    await prisma.project.delete({ where: { id } });
    return { deleted: true };
  },
};
