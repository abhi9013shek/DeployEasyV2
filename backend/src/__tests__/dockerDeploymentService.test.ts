import fs from 'fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DockerDeploymentService } from '../services/dockerDeploymentService';
import { ProjectDetector } from '../services/projectDetector';
import { IDockerClient } from '../types';
import prisma from '../config/database';

import { awsEcrService } from '../services/awsEcrService';

vi.mock('../services/awsEcrService', () => ({
  awsEcrService: {
    pushImageToEcr: vi.fn().mockResolvedValue({
      ecrImageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/deployeasy-apps:a1b2c3d4',
      logs: 'ECR push complete\n',
    }),
  },
}));

vi.mock('../config/database', () => ({
  default: {
    deployment: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    project: {
      update: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}));

describe('DockerDeploymentService', () => {
  let service: DockerDeploymentService;
  let mockDockerClient: IDockerClient;
  let mockProjectDetector: ProjectDetector;

  const mockDeployment = {
    id: 'dep-12345',
    version: 'v1.0.0',
    status: 'QUEUED',
    branch: 'main',
    startedAt: new Date(),
    projectId: 'proj-1',
    project: {
      id: 'proj-1',
      name: 'my-app',
      repository: 'user/my-app',
      branch: 'main',
      userId: 'user-1',
      user: {
        accessToken: 'gho_dummy_token_12345',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDockerClient = {
      buildImage: vi.fn().mockResolvedValue({ imageId: 'img-123', logs: 'Build complete' }),
      smokeTestContainer: vi.fn().mockResolvedValue({ success: true, logs: 'Container running' }),
    };

    mockProjectDetector = {
      detect: vi.fn().mockResolvedValue({
        type: 'nodejs',
        hasDockerfile: true,
        details: 'Node.js project with Dockerfile',
      }),
      generateDockerfile: vi.fn().mockReturnValue('/tmp/Dockerfile'),
    } as unknown as ProjectDetector;

    const mockK8sClient = {
      loadLocalImageToMinikube: vi.fn().mockResolvedValue({ success: true, logs: 'Loaded' }),
      applyManifest: vi.fn().mockResolvedValue({ success: true, logs: 'Applied' }),
      checkRolloutStatus: vi.fn().mockResolvedValue({ success: true, logs: 'Rollout complete' }),
      isIngressAvailable: vi.fn().mockResolvedValue(false),
      getLoadBalancerUrl: vi.fn().mockResolvedValue('http://a1b2c3d4.us-east-1.elb.amazonaws.com'),
      getServiceUrl: vi.fn().mockResolvedValue('http://127.0.0.1:32000'),
      deleteWorkload: vi.fn().mockResolvedValue(undefined),
    } as any;

    service = new DockerDeploymentService(mockDockerClient, mockProjectDetector, mockK8sClient);
    (service as any).verifyHttpReachability = vi.fn().mockResolvedValue({ success: true, finalUrl: 'http://a1b2c3d4.us-east-1.elb.amazonaws.com' });

    (prisma.deployment.findUnique as any).mockResolvedValue(mockDeployment);
    (prisma.deployment.update as any).mockResolvedValue({});
    (prisma.deployment.count as any).mockResolvedValue(0);
    (prisma.project.update as any).mockResolvedValue({});
    (prisma.activity.create as any).mockResolvedValue({});

    // Mock internal clone to simulate success
    (service as any).cloneRepository = vi.fn().mockImplementation((url, branch, dir, onLog) => {
      onLog(`Cloning ${url}...\n`);
      return Promise.resolve(true);
    });
  });

  it('runs successful deployment pipeline', async () => {
    await service.startDeployment('dep-12345');

    expect(prisma.deployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dep-12345' },
        data: expect.objectContaining({ status: 'SUCCESS' }),
      })
    );
    expect(mockDockerClient.buildImage).toHaveBeenCalled();
  });

  it('handles clone failure gracefully and marks deployment FAILED', async () => {
    (service as any).cloneRepository = vi.fn().mockImplementation((url, branch, dir, onLog) => {
      onLog(`Failed to clone ${url}\n`);
      return Promise.resolve(false);
    });

    await service.startDeployment('dep-12345');

    expect(prisma.deployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dep-12345' },
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Repository clone failed',
        }),
      })
    );
  });

  it('handles Docker build failure gracefully', async () => {
    (mockDockerClient.buildImage as any).mockRejectedValue(new Error('Docker daemon memory exceeded'));

    await service.startDeployment('dep-12345');

    expect(prisma.deployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dep-12345' },
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Unexpected deployment error',
        }),
      })
    );
  });

  it('handles Kubernetes rollout failure gracefully', async () => {
    const mockK8sClient = (service as any).k8sClient;
    mockK8sClient.checkRolloutStatus.mockResolvedValue({
      success: false,
      logs: 'Deployment rollout timed out',
    });

    await service.startDeployment('dep-12345');

    expect(prisma.deployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dep-12345' },
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Kubernetes deployment rollout failed or timed out',
        }),
      })
    );
  });

  it('fails on unsupported project types without guessing', async () => {
    (mockProjectDetector.detect as any).mockResolvedValue({
      type: 'unsupported',
      hasDockerfile: false,
      details: 'Detected Python project (requirements.txt). Please provide a Dockerfile.',
    });

    await service.startDeployment('dep-12345');

    expect(prisma.deployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dep-12345' },
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Unsupported project type',
        }),
      })
    );
  });

  it('redacts GitHub access tokens from logs', async () => {
    let capturedLogUrl = '';
    (service as any).cloneRepository = vi.fn().mockImplementation((url, branch, dir, onLog) => {
      onLog(`Cloning from ${url}\n`);
      capturedLogUrl = url;
      return Promise.resolve(true);
    });

    await service.startDeployment('dep-12345');

    const updateCalls = (prisma.deployment.update as any).mock.calls;
    const finalUpdateCall = updateCalls[updateCalls.length - 1][0];

    expect(finalUpdateCall.data.logs).not.toContain('gho_dummy_token_12345');
    expect(finalUpdateCall.data.logs).toContain('***TOKEN***');
  });
});

describe('ProjectDetector', () => {
  const detector = new ProjectDetector();

  it('detects unsupported project types like requirements.txt', async () => {
    const mockFs = vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
      if (p.toString().endsWith('Dockerfile')) return false;
      if (p.toString().endsWith('package.json')) return false;
      if (p.toString().endsWith('requirements.txt')) return true;
      return false;
    });

    const res = await detector.detect('/mock/path');
    expect(res.type).toBe('unsupported');
    expect(res.details).toContain('Python');

    mockFs.mockRestore();
  });
});
