import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { webhookService } from '../services/webhookService';
import prisma from '../config/database';
import { dockerDeploymentService } from '../services/dockerDeploymentService';

vi.mock('../services/dockerDeploymentService', () => ({
  dockerDeploymentService: {
    startDeployment: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('webhookService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.deployment.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  it('normalizes repository URLs correctly', () => {
    expect(webhookService.normalizeRepo('https://github.com/expressjs/express.git')).toBe('expressjs/express');
    expect(webhookService.normalizeRepo('expressjs/express')).toBe('expressjs/express');
    expect(webhookService.normalizeRepo(' HTTPs://GitHub.com/User/Repo/ ')).toBe('user/repo');
  });

  it('generates strong random webhook secrets', () => {
    const secret = webhookService.generateSecret();
    expect(secret).toMatch(/^whsec_[a-f0-9]{48}$/);
  });

  it('verifies valid HMAC SHA-256 signatures correctly', () => {
    const secret = 'whsec_test_secret_123';
    const body = JSON.stringify({ ref: 'refs/heads/main' });
    const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const signature = `sha256=${hmac}`;

    expect(webhookService.verifySignature(body, signature, secret)).toBe(true);
    expect(webhookService.verifySignature(body, 'sha256=invalid', secret)).toBe(false);
  });

  it('ignores webhook payload without repository full_name', async () => {
    const res = await webhookService.processPushEvent({}, '', '');
    expect(res.status).toBe('IGNORED');
  });

  it('returns UNKNOWN_PROJECT if project does not exist', async () => {
    const payload = { repository: { full_name: 'unknown/repo' } };
    const res = await webhookService.processPushEvent(payload, '', '');
    expect(res.status).toBe('UNKNOWN_PROJECT');
  });

  it('validates HMAC signature and fails if invalid', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser', email: 'test@example.com' },
    });
    const secret = 'whsec_secret123';
    await prisma.project.create({
      data: {
        name: 'test-app',
        repository: 'owner/test-app',
        branch: 'main',
        webhookSecret: secret,
        userId: user.id,
      },
    });

    const payload = { repository: { full_name: 'owner/test-app' } };
    const res = await webhookService.processPushEvent(payload, 'sha256=wrong', JSON.stringify(payload));
    expect(res.status).toBe('INVALID_SIGNATURE');
  });

  it('returns DISABLED if autoDeploy is false', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser2', email: 'test2@example.com' },
    });
    await prisma.project.create({
      data: {
        name: 'test-app-2',
        repository: 'owner/test-app-2',
        branch: 'main',
        autoDeploy: false,
        userId: user.id,
      },
    });

    const payload = { repository: { full_name: 'owner/test-app-2' } };
    const res = await webhookService.processPushEvent(payload, '', JSON.stringify(payload));
    expect(res.status).toBe('DISABLED');
  });

  it('returns BRANCH_MISMATCH if pushed branch does not match configured branch', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser3', email: 'test3@example.com' },
    });
    await prisma.project.create({
      data: {
        name: 'test-app-3',
        repository: 'owner/test-app-3',
        branch: 'main',
        userId: user.id,
      },
    });

    const payload = {
      repository: { full_name: 'owner/test-app-3' },
      ref: 'refs/heads/feature-branch',
    };
    const res = await webhookService.processPushEvent(payload, '', JSON.stringify(payload));
    expect(res.status).toBe('BRANCH_MISMATCH');
  });

  it('handles delivery idempotency correctly (DUPLICATE_DELIVERY)', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser4', email: 'test4@example.com' },
    });
    const project = await prisma.project.create({
      data: {
        name: 'test-app-4',
        repository: 'owner/test-app-4',
        branch: 'main',
        userId: user.id,
      },
    });

    const deliveryId = 'deliv_123456';
    await prisma.deployment.create({
      data: {
        version: 'v1.0.0',
        projectId: project.id,
        githubDeliveryId: deliveryId,
        trigger: 'webhook',
      },
    });

    const payload = {
      repository: { full_name: 'owner/test-app-4' },
      ref: 'refs/heads/main',
    };
    const res = await webhookService.processPushEvent(payload, '', JSON.stringify(payload), deliveryId);
    expect(res.status).toBe('DUPLICATE_DELIVERY');
  });

  it('creates deployment and triggers pipeline on valid push event', async () => {
    const user = await prisma.user.create({
      data: { username: 'testuser5', email: 'test5@example.com' },
    });
    const secret = 'whsec_valid_secret';
    const project = await prisma.project.create({
      data: {
        name: 'test-app-5',
        repository: 'https://github.com/owner/test-app-5.git',
        branch: 'main',
        webhookSecret: secret,
        userId: user.id,
      },
    });

    const payload = {
      repository: { full_name: 'owner/test-app-5' },
      ref: 'refs/heads/main',
      after: 'abc123456789def',
      head_commit: { message: 'feat: add new feature' },
    };

    const rawBody = JSON.stringify(payload);
    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const res = await webhookService.processPushEvent(payload, signature, rawBody, 'deliv_new_999');

    expect(res.status).toBe('TRIGGERED');
    expect(res.deploymentId).toBeDefined();

    const deployment = await prisma.deployment.findUnique({ where: { id: res.deploymentId } });
    expect(deployment?.trigger).toBe('webhook');
    expect(deployment?.commitHash).toBe('abc123456789def');
    expect(deployment?.commitMsg).toBe('feat: add new feature');
    expect(deployment?.githubDeliveryId).toBe('deliv_new_999');

    expect(dockerDeploymentService.startDeployment).toHaveBeenCalledWith(res.deploymentId);
  });
});
