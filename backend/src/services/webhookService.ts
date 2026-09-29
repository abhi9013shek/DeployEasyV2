import crypto from 'crypto';
import prisma from '../config/database';
import { dockerDeploymentService } from './dockerDeploymentService';

export const webhookService = {
  // Utility: Normalize repository identifiers to owner/repo
  normalizeRepo(repoStr: string): string {
    if (!repoStr) return '';
    let cleaned = repoStr.trim().toLowerCase();
    cleaned = cleaned.replace(/^https?:\/\/github\.com\//i, '');
    cleaned = cleaned.replace(/\.git$/i, '');
    cleaned = cleaned.replace(/^\/+|\/+$/g, '');
    return cleaned;
  },

  // Utility: Generate cryptographically strong random webhook secret
  generateSecret(): string {
    return 'whsec_' + crypto.randomBytes(24).toString('hex');
  },

  // HMAC SHA-256 signature verification over raw request body buffer
  verifySignature(rawBody: Buffer | string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  },

  // Core GitHub push event processor
  async processPushEvent(payload: any, signature: string, rawBody: Buffer | string, deliveryId?: string) {
    const repoFullName = payload?.repository?.full_name;
    if (!repoFullName) {
      return { status: 'IGNORED', message: 'Missing repository information in payload' };
    }

    const normalizedTarget = this.normalizeRepo(repoFullName);
    const allProjects = await prisma.project.findMany();
    const project = allProjects.find(
      (p) => this.normalizeRepo(p.repository) === normalizedTarget
    );

    if (!project) {
      return { status: 'UNKNOWN_PROJECT', message: `No project matches repository: ${repoFullName}` };
    }

    // Verify webhook secret if configured
    if (project.webhookSecret) {
      const isValid = this.verifySignature(rawBody, signature, project.webhookSecret);
      if (!isValid) {
        return { status: 'INVALID_SIGNATURE', message: 'HMAC signature verification failed' };
      }
    }

    // Auto-deploy check
    if (!project.autoDeploy) {
      return { status: 'DISABLED', message: 'Automatic deployment is disabled for this project' };
    }

    // Branch filtering (ref e.g. refs/heads/main -> main)
    const ref = payload.ref || '';
    const pushedBranch = ref.replace(/^refs\/heads\//, '');
    if (pushedBranch !== project.branch) {
      return {
        status: 'BRANCH_MISMATCH',
        message: `Pushed branch '${pushedBranch}' does not match configured branch '${project.branch}'`,
      };
    }

    // Delivery Idempotency check
    if (deliveryId) {
      const existingDelivery = await prisma.deployment.findUnique({
        where: { githubDeliveryId: deliveryId },
      });
      if (existingDelivery) {
        return {
          status: 'DUPLICATE_DELIVERY',
          message: `Webhook delivery '${deliveryId}' has already been processed`,
          deploymentId: existingDelivery.id,
        };
      }
    }

    // Extract commit info
    const commitHash = payload.after || payload.head_commit?.id || Math.random().toString(36).substring(2, 9);
    const commitMsg = payload.head_commit?.message || 'Automatic deployment from GitHub push';

    // Duplicate active commit check (optional secondary protection)
    const activeSameCommit = await prisma.deployment.findFirst({
      where: {
        projectId: project.id,
        commitHash,
        status: { in: ['QUEUED', 'BUILDING', 'CREATING_IMAGE', 'DEPLOYING', 'HEALTH_CHECK'] },
      },
    });

    if (activeSameCommit) {
      return {
        status: 'ALREADY_IN_PROGRESS',
        message: `Deployment for commit ${commitHash} is already in progress`,
        deploymentId: activeSameCommit.id,
      };
    }

    // Version increment calculation
    const lastDeployment = await prisma.deployment.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
    });

    let nextVersion = 'v1.0.0';
    if (lastDeployment) {
      const parts = lastDeployment.version.replace('v', '').split('.').map(Number);
      parts[1] += 1;
      nextVersion = `v${parts.join('.')}`;
    }

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        version: nextVersion,
        status: 'QUEUED',
        branch: project.branch,
        commitHash,
        commitMsg,
        trigger: 'webhook',
        githubDeliveryId: deliveryId || null,
        logs: `[${new Date().toTimeString().slice(0, 8)}] Webhook received. Deployment queued...`,
        projectId: project.id,
      },
    });

    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'BUILDING' },
    });

    await prisma.activity.create({
      data: {
        type: 'DEPLOYMENT_STARTED',
        message: `${project.name} ${nextVersion} deployment triggered by GitHub Webhook (${commitHash.substring(0, 7)})`,
        userId: project.userId,
      },
    });

    // Asynchronously trigger Phase 2/3 Docker & Kubernetes deployment pipeline
    dockerDeploymentService.startDeployment(deployment.id).catch((err) => {
      console.error(`[webhookService] Error executing pipeline for ${deployment.id}:`, err);
    });

    return {
      status: 'TRIGGERED',
      message: 'Deployment successfully triggered via GitHub Webhook',
      deploymentId: deployment.id,
    };
  },
};
