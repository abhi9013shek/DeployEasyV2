import prisma from '../config/database';
import { CreateDeploymentInput, IDeploymentService } from '../types';
import { AppError } from '../middleware/errorHandler';
import { dockerDeploymentService } from './dockerDeploymentService';

const STAGES = [
  'QUEUED',
  'BUILDING',
  'CREATING_IMAGE',
  'DEPLOYING',
  'HEALTH_CHECK',
  'SUCCESS',
];

class MockDeploymentService implements IDeploymentService {
  private stages: string[] = STAGES;

  async startDeployment(deploymentId: string): Promise<void> {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { project: true },
    });
    if (!deployment) return;

    for (let i = 1; i < this.stages.length; i++) {
      await this.delay(2000 + Math.random() * 1000);
      const stage = this.stages[i];

      const updateData: Record<string, unknown> = { status: stage };
      if (stage === 'SUCCESS') {
        const duration = Math.floor((Date.now() - deployment.startedAt.getTime()) / 1000);
        updateData.finishedAt = new Date();
        updateData.duration = duration;
        updateData.logs = this.generateLogs(stage);
      } else {
        updateData.logs = this.generateLogs(stage);
      }

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: updateData,
      });

      if (stage === 'SUCCESS') {
        await prisma.project.update({
          where: { id: deployment.projectId },
          data: {
            status: 'ACTIVE',
            lastDeployedAt: new Date(),
            deploymentCount: { increment: 1 },
          },
        });

        await prisma.activity.create({
          data: {
            type: 'DEPLOYMENT_SUCCESS',
            message: `${deployment.project.name} ${deployment.version} deployed successfully`,
            userId: deployment.project.userId,
          },
        });
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateLogs(upToStage: string): string {
    const allLogs: [string, string][] = [
      ['QUEUED', '[{time}] Deployment queued...'],
      ['BUILDING', '[{time}] Cloning repository...'],
      ['BUILDING', '[{time}] Repository cloned successfully.'],
      ['BUILDING', '[{time}] Installing dependencies...'],
      ['BUILDING', '[{time}] Dependencies installed.'],
      ['BUILDING', '[{time}] Building application...'],
      ['BUILDING', '[{time}] Build completed successfully.'],
      ['CREATING_IMAGE', '[{time}] Creating Docker image...'],
      ['CREATING_IMAGE', '[{time}] Docker image created.'],
      ['DEPLOYING', '[{time}] Pushing image to registry...'],
      ['DEPLOYING', '[{time}] Image pushed successfully.'],
      ['DEPLOYING', '[{time}] Deploying to cluster...'],
      ['HEALTH_CHECK', '[{time}] Running health checks...'],
      ['HEALTH_CHECK', '[{time}] Health check passed.'],
      ['SUCCESS', '[{time}] Deployment completed successfully.'],
    ];

    const stageOrder = this.stages;
    const currentIdx = stageOrder.indexOf(upToStage);
    const now = new Date();

    return allLogs
      .filter(([stage]) => stageOrder.indexOf(stage) <= currentIdx)
      .map(([, log], i) => {
        const t = new Date(now.getTime() - (allLogs.length - i) * 2000);
        const time = t.toTimeString().slice(0, 8);
        return log.replace('{time}', time);
      })
      .join('\n');
  }
}

const mockDeploymentService = new MockDeploymentService();

export const deploymentService = {
  async getAll(projectId?: string, status?: string) {
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    return prisma.deployment.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, repository: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, repository: true, branch: true },
        },
      },
    });
    if (!deployment) throw new AppError('Deployment not found', 404);
    return deployment;
  },

  async getByProjectId(projectId: string) {
    return prisma.deployment.findMany({
      where: { projectId },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getLogsByProjectId(projectId: string) {
    const latestDeployment = await prisma.deployment.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestDeployment) throw new AppError('No deployments found', 404);
    return { logs: latestDeployment.logs || '' };
  },

  async create(userId: string, data: CreateDeploymentInput) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) throw new AppError('Project not found', 404);

    const lastDeployment = await prisma.deployment.findFirst({
      where: { projectId: data.projectId },
      orderBy: { createdAt: 'desc' },
    });

    let nextVersion = 'v1.0.0';
    if (lastDeployment) {
      const parts = lastDeployment.version.replace('v', '').split('.').map(Number);
      parts[1] += 1;
      nextVersion = `v${parts.join('.')}`;
    }

    const deployment = await prisma.deployment.create({
      data: {
        version: nextVersion,
        status: 'QUEUED',
        branch: data.branch || project.branch,
        commitHash: data.commitHash || Math.random().toString(36).substring(2, 9),
        commitMsg: data.commitMsg || 'Manual deployment',
        trigger: 'manual',
        logs: `[${new Date().toTimeString().slice(0, 8)}] Deployment queued...`,
        projectId: data.projectId,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.project.update({
      where: { id: data.projectId },
      data: { status: 'BUILDING' },
    });

    await prisma.activity.create({
      data: {
        type: 'DEPLOYMENT_STARTED',
        message: `${project.name} ${nextVersion} deployment started`,
        userId,
      },
    });

    // Start real Docker deployment pipeline asynchronously
    dockerDeploymentService.startDeployment(deployment.id).catch((err) => {
      console.error(`[deploymentService] Error starting deployment ${deployment.id}:`, err);
    });

    return deployment;
  },
};
