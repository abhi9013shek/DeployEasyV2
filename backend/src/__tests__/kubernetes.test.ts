import fs from 'fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeResourceName, generateK8sResourceNames, KubernetesManifestGenerator } from '../services/kubernetesManifestGenerator';
import { KubernetesClient } from '../services/kubernetesClient';
import { DockerDeploymentService } from '../services/dockerDeploymentService';
import { IDockerClient } from '../types';
import prisma from '../config/database';

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

describe('KubernetesManifestGenerator', () => {
  it('sanitizes project names into valid RFC 1123 DNS labels', () => {
    expect(sanitizeResourceName('My_Awesome-App!!')).toBe('my-awesome-app');
    expect(sanitizeResourceName('---test---')).toBe('test');
    expect(sanitizeResourceName('!!!')).toBe('app');
  });

  it('generates resource names correctly', () => {
    const names = generateK8sResourceNames('test1-app');
    expect(names.deploymentName).toBe('test1-app-dep');
    expect(names.serviceName).toBe('test1-app-svc');
    expect(names.ingressName).toBe('test1-app-ing');
    expect(names.hostName).toBe('test1-app.localhost');
  });

  it('generates valid Kubernetes Deployment manifest', () => {
    const names = generateK8sResourceNames('test1');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manifest = KubernetesManifestGenerator.generateDeploymentManifest(names, 'deployeasy/test1:dep-1234', 3000) as any;

    expect(manifest.kind).toBe('Deployment');
    expect(manifest.metadata.name).toBe('test1-dep');
    expect(manifest.spec.template.spec.containers[0].image).toBe('deployeasy/test1:dep-1234');
    expect(manifest.spec.template.spec.containers[0].ports[0].containerPort).toBe(3000);
  });

  it('generates valid Kubernetes Service manifest', () => {
    const names = generateK8sResourceNames('test1');
    const manifest = KubernetesManifestGenerator.generateServiceManifest(names, 8080) as any;

    expect(manifest.kind).toBe('Service');
    expect(manifest.spec.type).toBe('LoadBalancer');
    expect(manifest.spec.ports[0].port).toBe(8080);
  });

  it('generates valid Kubernetes Ingress manifest', () => {
    const names = generateK8sResourceNames('test1');
    const manifest = KubernetesManifestGenerator.generateIngressManifest(names, 3000) as any;

    expect(manifest.kind).toBe('Ingress');
    expect(manifest.spec.rules[0].host).toBe('test1.localhost');
  });
});

vi.mock('../services/awsEcrService', () => ({
  awsEcrService: {
    pushImageToEcr: vi.fn().mockResolvedValue({
      ecrImageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/deployeasy-apps:a1b2c3d4',
      logs: 'ECR push complete\n',
    }),
  },
}));

describe('DockerDeploymentService with Kubernetes Integration', () => {
  let service: DockerDeploymentService;
  let mockDockerClient: IDockerClient;
  let mockProjectDetector: any;
  let mockK8sClient: any;

  const mockDeployment = {
    id: 'dep-99999',
    version: 'v1.0.0',
    status: 'QUEUED',
    branch: 'main',
    startedAt: new Date(),
    projectId: 'proj-k8s-1',
    project: {
      id: 'proj-k8s-1',
      name: 'k8s-test-app',
      repository: 'user/k8s-test-app',
      branch: 'main',
      userId: 'user-1',
      user: {
        accessToken: 'gho_dummy_token',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDockerClient = {
      buildImage: vi.fn().mockResolvedValue({ imageId: 'img-k8s-123', logs: 'Build complete' }),
      smokeTestContainer: vi.fn().mockResolvedValue({ success: true, logs: 'Smoke test OK' }),
    };

    mockProjectDetector = {
      detect: vi.fn().mockResolvedValue({
        type: 'nodejs',
        hasDockerfile: true,
        details: 'Node.js app',
      }),
      generateDockerfile: vi.fn().mockReturnValue('/tmp/Dockerfile'),
    };

    mockK8sClient = {
      loadLocalImageToMinikube: vi.fn().mockResolvedValue({ success: true, logs: 'Loaded' }),
      applyManifest: vi.fn().mockResolvedValue({ success: true, logs: 'Applied' }),
      checkRolloutStatus: vi.fn().mockResolvedValue({ success: true, logs: 'Rollout complete' }),
      isIngressAvailable: vi.fn().mockResolvedValue(false),
      getLoadBalancerUrl: vi.fn().mockResolvedValue('http://a1b2c3d4.us-east-1.elb.amazonaws.com'),
      getServiceUrl: vi.fn().mockResolvedValue('http://127.0.0.1:32123'),
      deleteWorkload: vi.fn().mockResolvedValue(undefined),
    };

    service = new DockerDeploymentService(mockDockerClient, mockProjectDetector, mockK8sClient);

    (prisma.deployment.findUnique as any).mockResolvedValue(mockDeployment);
    (prisma.deployment.update as any).mockResolvedValue({});
    (prisma.deployment.count as any).mockResolvedValue(0);
    (prisma.project.update as any).mockResolvedValue({});
    (prisma.activity.create as any).mockResolvedValue({});

    (service as any).cloneRepository = vi.fn().mockResolvedValue(true);
    (service as any).verifyHttpReachability = vi.fn().mockResolvedValue({ success: true, finalUrl: 'http://a1b2c3d4.us-east-1.elb.amazonaws.com' });
  });

  it('runs full Kubernetes pipeline successfully', async () => {
    await service.startDeployment('dep-99999');

    expect(mockK8sClient.applyManifest).toHaveBeenCalledTimes(2); // Deployment, Service LoadBalancer
    expect(mockK8sClient.checkRolloutStatus).toHaveBeenCalledWith('k8s-test-app-dep', 60);
    expect(prisma.deployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dep-99999' },
        data: expect.objectContaining({
          status: 'SUCCESS',
          k8sDeploymentName: 'k8s-test-app-dep',
          k8sServiceName: 'k8s-test-app-svc',
          liveUrl: 'http://a1b2c3d4.us-east-1.elb.amazonaws.com',
        }),
      })
    );
  });

  it('cleans up newly created workload resources if Kubernetes rollout fails', async () => {
    mockK8sClient.checkRolloutStatus.mockResolvedValue({ success: false, logs: 'Rollout timed out' });

    await service.startDeployment('dep-99999');

    expect(mockK8sClient.deleteWorkload).toHaveBeenCalledWith(
      expect.objectContaining({
        deploymentName: 'k8s-test-app-dep',
        serviceName: 'k8s-test-app-svc',
      })
    );
    expect(prisma.deployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dep-99999' },
        data: expect.objectContaining({
          status: 'FAILED',
          failureReason: 'Kubernetes deployment rollout failed or timed out',
        }),
      })
    );
  });
});
