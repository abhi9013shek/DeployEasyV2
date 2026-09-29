import { IDeploymentService } from '../types';
import prisma from '../config/database';
import { CreateDeploymentInput, DeploymentLogsResponse } from '../types';

const DEPLOYMENT_STAGES = [
  { status: 'QUEUED', message: 'Deployment queued', delay: 1000 },
  { status: 'BUILDING', message: 'Cloning repository and building application...', delay: 3000 },
  { status: 'CREATING_IMAGE', message: 'Building Docker container image...', delay: 3000 },
  { status: 'DEPLOYING', message: 'Applying Kubernetes manifests...', delay: 2000 },
  { status: 'HEALTH_CHECK', message: 'Verifying application health check...', delay: 2000 },
  { status: 'SUCCESS', message: 'Deployment completed successfully!', delay: 0 },
];

export class MockDeploymentService implements IDeploymentService {
  async getAll(projectId?: string, status?: string) {
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    return prisma.deployment.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!deployment) throw new Error('Deployment not found');
    return deployment;
  }

  async getByProjectId(projectId: string) {
    return prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateDeploymentInput) {
    const project = await prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) throw new Error('Project not found');

    const count = await prisma.deployment.count({ where: { projectId: input.projectId } });
    const version = `v1.${count + 1}.0`;
    const commitHash = Math.random().toString(36).substring(2, 9);

    const deployment = await prisma.deployment.create({
      data: {
        projectId: input.projectId,
        version,
        status: 'QUEUED',
        branch: input.branch || project.branch,
        commitHash: input.commitHash || commitHash,
        commitMsg: input.commitMsg || `Manual deployment ${version}`,
        trigger: input.trigger || 'manual',
        logs: `[${new Date().toISOString()}] Deployment ${version} initiated.\n`,
      },
    });

    await prisma.project.update({
      where: { id: input.projectId },
      data: {
        status: 'BUILDING',
        deploymentCount: { increment: 1 },
      },
    });

    await prisma.activity.create({
      data: {
        userId: project.userId,
        projectId: project.id,
        type: 'DEPLOYMENT_STARTED',
        message: `Started deployment ${version} for ${project.name}`,
      },
    });

    // Run simulated deployment pipeline asynchronously
    this.runMockPipeline(deployment.id, project.id, project.userId, version);

    return deployment;
  }

  private async runMockPipeline(
    deploymentId: string,
    projectId: string,
    userId: string,
    version: string
  ) {
    let logs = `[${new Date().toISOString()}] Deployment pipeline started.\n`;

    for (const stage of DEPLOYMENT_STAGES) {
      if (stage.delay > 0) {
        await new Promise((res) => setTimeout(res, stage.delay));
      }

      logs += `[${new Date().toISOString()}] ${stage.message}\n`;

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: stage.status,
          logs,
          ...(stage.status === 'SUCCESS' ? { finishedAt: new Date() } : {}),
        },
      });
    }

    // Final status update
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ACTIVE',
        lastDeployedAt: new Date(),
        liveUrl: `https://${projectId.slice(0, 8)}.deployeasy.app`,
      },
    });

    await prisma.activity.create({
      data: {
        userId,
        projectId,
        type: 'DEPLOYMENT_SUCCESS',
        message: `Deployment ${version} completed successfully`,
      },
    });
  }

  async startDeployment(deploymentId: string): Promise<void> {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { project: true },
    });
    if (!deployment) return;
    return this.runMockPipeline(deployment.id, deployment.projectId, deployment.project.userId, deployment.version);
  }

  async getLogsByProjectId(projectId: string): Promise<DeploymentLogsResponse> {
    const latest = await prisma.deployment.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      projectId,
      deploymentId: latest?.id || null,
      logs: latest?.logs || 'No logs available.',
    };
  }
}

export const deploymentService = new MockDeploymentService();
