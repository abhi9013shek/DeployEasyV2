import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import { spawn } from 'child_process';
import prisma from '../config/database';
import { IDeploymentService, IDockerClient } from '../types';
import { dockerClient as defaultDockerClient } from './dockerClient';
import { projectDetector as defaultProjectDetector, ProjectDetector } from './projectDetector';
import { IKubernetesClient, KubernetesClient as defaultKubernetesClient } from './kubernetesClient';
import { generateK8sResourceNames, KubernetesManifestGenerator } from './kubernetesManifestGenerator';
import { awsEcrService } from './awsEcrService';

export class DockerDeploymentService implements IDeploymentService {
  constructor(
    private dockerClient: IDockerClient = defaultDockerClient,
    private projectDetector: ProjectDetector = defaultProjectDetector,
    private k8sClient: IKubernetesClient = new defaultKubernetesClient()
  ) {}

  async startDeployment(deploymentId: string): Promise<void> {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!deployment) {
      console.error(`[DockerDeploymentService] Deployment not found: ${deploymentId}`);
      return;
    }

    const { project } = deployment;
    const userAccessToken = project.user.accessToken;

    const tmpDir = path.join(os.tmpdir(), `deployeasy-${deployment.id}`);
    let logs = `[${new Date().toISOString()}] Deployment queued (ID: ${deployment.id})\n`;

    const k8sNames = generateK8sResourceNames(project.name);
    let isNewDeploymentWorkload = false;

    const appendLog = async (message: string) => {
      const timestamped = `[${new Date().toISOString()}] ${message}\n`;
      logs += timestamped;
      try {
        await prisma.deployment.update({
          where: { id: deploymentId },
          data: { logs },
        });
      } catch (e) {
        console.error(`Failed to update deployment logs in DB:`, e);
      }
    };

    const markFailed = async (reason: string, failureDetails?: string) => {
      const finishedAt = new Date();
      const duration = Math.floor((finishedAt.getTime() - deployment.startedAt.getTime()) / 1000);
      const fullReason = failureDetails ? `${reason}: ${failureDetails}` : reason;

      await appendLog(`DEPLOYMENT FAILED: ${fullReason}`);

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'FAILED',
          finishedAt,
          duration,
          logs,
          failureReason: reason,
        },
      });

      await prisma.project.update({
        where: { id: project.id },
        data: { status: 'FAILED' },
      });

      await prisma.activity.create({
        data: {
          userId: project.userId,
          projectId: project.id,
          type: 'DEPLOYMENT_FAILED',
          message: `${project.name} ${deployment.version} deployment failed: ${reason}`,
        },
      });

      // Cleanup K8s resources if this was a new workload that failed to roll out
      if (isNewDeploymentWorkload) {
        await appendLog('Cleaning up failed Kubernetes resources...');
        await this.k8sClient.deleteWorkload(k8sNames);
      }

      // Cleanup temp directory
      this.cleanupDir(tmpDir);
    };

    try {
      // 1. Update status to BUILDING
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'BUILDING' },
      });

      // 2. Prepare Git URL and Clone
      let repoInput = project.repository.trim();
      // Remove any leading/trailing slashes or github.com prefix if user entered full URL
      repoInput = repoInput.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/|\/$/g, '');

      let rawRepoUrl = `https://github.com/${repoInput}.git`;
      let authenticatedRepoUrl = rawRepoUrl;

      if (userAccessToken) {
        authenticatedRepoUrl = `https://x-access-token:${userAccessToken}@github.com/${repoInput}.git`;
      }

      await appendLog(`Cloning repository https://github.com/${repoInput} (Branch: ${deployment.branch || project.branch})...`);

      let cloneErrorLogs = '';
      const cloneSuccess = await this.cloneRepository(
        authenticatedRepoUrl,
        deployment.branch || project.branch,
        tmpDir,
        (logLine) => {
          const redacted = userAccessToken ? logLine.replace(new RegExp(userAccessToken, 'g'), '***TOKEN***') : logLine;
          cloneErrorLogs += redacted;
          logs += redacted;
        }
      );

      if (!cloneSuccess) {
        await markFailed('Repository clone failed', cloneErrorLogs.trim() || `Could not clone https://github.com/${repoInput}`);
        return;
      }

      await appendLog('Repository cloned successfully.');

      // 3. Detect Project Strategy & Container Port
      await appendLog('Detecting project configuration and framework...');
      const detectedInfo = await this.projectDetector.detect(tmpDir);

      if (detectedInfo.type === 'unsupported') {
        await markFailed('Unsupported project type', detectedInfo.details);
        return;
      }

      await appendLog(`Project details: ${detectedInfo.details || detectedInfo.type}`);

      let dockerfilePath: string | undefined;
      if (!detectedInfo.hasDockerfile) {
        await appendLog('No Dockerfile found. Auto-generating production Dockerfile...');
        dockerfilePath = this.projectDetector.generateDockerfile(detectedInfo, tmpDir);
        await appendLog('Dockerfile generated successfully.');
      } else {
        await appendLog('Using existing repository Dockerfile.');
      }

      // Determine application port (default 3000 for Node.js apps)
      const containerPort = this.detectContainerPort(tmpDir, dockerfilePath) || 3000;
      await appendLog(`Target container port: ${containerPort}`);

      // 4. Build Docker Image & Push to AWS ECR
      const cleanProjectName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const localImageTag = `deployeasy/${cleanProjectName}:${deployment.id.slice(0, 8)}`;

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'CREATING_IMAGE' },
      });

      await appendLog(`Building Docker image for AWS ECR: ${localImageTag}...`);
      const buildResult = await this.dockerClient.buildImage({
        imageTag: localImageTag,
        contextPath: tmpDir,
        dockerfilePath,
        onLog: (line: string) => { logs += line; },
      });

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'PUSHING_IMAGE' },
      });

      await appendLog('Authenticating with AWS ECR & Pushing Docker image...');
      const ecrRepoName = process.env.AWS_ECR_REPOSITORY || 'deployeasy-apps';
      const ecrRes = await awsEcrService.pushImageToEcr({
        localImageTag,
        ecrRepoName,
        onLog: (line: string) => { logs += line; },
      });

      const ecrImageUri = ecrRes.ecrImageUri;
      await appendLog(`ECR image push successful. Image URI: ${ecrImageUri}`);

      // 5. Update status to DEPLOYING & Apply Kubernetes EKS Manifests
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'DEPLOYING' },
      });

      const existingDeploymentCount = await prisma.deployment.count({
        where: { projectId: project.id, status: 'SUCCESS' },
      });
      isNewDeploymentWorkload = existingDeploymentCount === 0;

      await appendLog(`Generating AWS EKS Kubernetes manifests for ${k8sNames.deploymentName}...`);

      const depManifest = KubernetesManifestGenerator.generateDeploymentManifest(k8sNames, ecrImageUri, containerPort);
      const svcManifest = KubernetesManifestGenerator.generateServiceManifest(k8sNames, containerPort);

      const applyDepRes = await this.k8sClient.applyManifest(depManifest);
      logs += applyDepRes.logs;
      if (!applyDepRes.success) {
        await markFailed('Kubernetes Deployment manifest apply failed', applyDepRes.logs);
        return;
      }

      const applySvcRes = await this.k8sClient.applyManifest(svcManifest);
      logs += applySvcRes.logs;
      if (!applySvcRes.success) {
        await markFailed('Kubernetes Service manifest apply failed', applySvcRes.logs);
        return;
      }

      // 6. Update status to HEALTH_CHECK & Rollout Readiness Check
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: 'HEALTH_CHECK' },
      });

      await appendLog(`Verifying deployment rollout status for ${k8sNames.deploymentName}...`);
      const rolloutRes = await this.k8sClient.checkRolloutStatus(k8sNames.deploymentName, 60);
      logs += rolloutRes.logs;

      if (!rolloutRes.success) {
        await markFailed('Kubernetes deployment rollout failed or timed out', rolloutRes.logs);
        return;
      }

      await appendLog('Kubernetes deployment rollout complete and Pods are ready.');

      // 7. Poll AWS LoadBalancer Hostname/IP & Verify HTTP Access
      await appendLog('Waiting for AWS LoadBalancer endpoint assignment...');
      const lbUrl = await this.k8sClient.getLoadBalancerUrl(k8sNames.serviceName, 180);

      if (!lbUrl) {
        await markFailed('AWS LoadBalancer endpoint assignment timed out');
        return;
      }

      await appendLog(`AWS LoadBalancer endpoint assigned: ${lbUrl}`);
      await appendLog(`Polling AWS LoadBalancer HTTP reachability (up to 3 minutes, 5s retries)...`);

      const probeResult = await this.verifyHttpReachability(lbUrl, 180000, appendLog);
      if (!probeResult.success) {
        await markFailed(`HTTP health check failed: ${probeResult.lastError || 'Did not return 2xx status'}`);
        return;
      }

      const verifiedLiveUrl = probeResult.finalUrl || lbUrl;
      await appendLog(`HTTP health check succeeded with 2xx status at ${verifiedLiveUrl}!`);

      // 8. Finalize Deployment as SUCCESS
      const finishedAt = new Date();
      const duration = Math.floor((finishedAt.getTime() - deployment.startedAt.getTime()) / 1000);

      await appendLog('AWS Deployment completed successfully!');

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'SUCCESS',
          finishedAt,
          duration,
          logs,
          imageRepo: process.env.AWS_ECR_REPOSITORY || 'deployeasy-apps',
          imageTag: deployment.id.slice(0, 8),
          imageId: buildResult.imageId,
          k8sDeploymentName: k8sNames.deploymentName,
          k8sServiceName: k8sNames.serviceName,
          liveUrl: verifiedLiveUrl,
        },
      });

      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: 'ACTIVE',
          lastDeployedAt: finishedAt,
          liveUrl: verifiedLiveUrl,
        },
      });

      await prisma.activity.create({
        data: {
          userId: project.userId,
          projectId: project.id,
          type: 'DEPLOYMENT_SUCCESS',
          message: `${project.name} ${deployment.version} deployed successfully to ${verifiedLiveUrl}`,
        },
      });

      // Cleanup repository workspace
      this.cleanupDir(tmpDir);
    } catch (err: any) {
      await markFailed('Unexpected deployment error', err.message);
    }
  }

  private detectContainerPort(dirPath: string, dockerfilePath?: string): number | null {
    try {
      const targetFile = dockerfilePath || path.join(dirPath, 'Dockerfile');
      if (fs.existsSync(targetFile)) {
        const content = fs.readFileSync(targetFile, 'utf-8');
        const match = content.match(/EXPOSE\s+(\d+)/i);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    } catch {
      // Fallback
    }
    return 3000;
  }

  private verifyHttpReachability(
    url: string,
    totalTimeoutMs: number = 180000,
    onLog?: (line: string) => Promise<void>
  ): Promise<{ success: boolean; finalUrl?: string; lastError?: string }> {
    const startTime = Date.now();
    const retryDelayMs = 5000;
    let attempt = 0;
    let lastErrorReason = 'No attempt executed';

    return new Promise((resolve) => {
      const probe = async () => {
        attempt++;
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);

        if (Date.now() - startTime > totalTimeoutMs) {
          if (onLog) {
            await onLog(`[HTTP Health Probe] Total polling timeout (${totalTimeoutMs / 1000}s) reached. Last error: ${lastErrorReason}\n`);
          }
          resolve({ success: false, lastError: lastErrorReason });
          return;
        }

        const performRequest = (targetUrl: string, redirectCount = 0): Promise<{ success: boolean; statusCode?: number; errMessage?: string; redirectUrl?: string }> => {
          return new Promise((reqResolve) => {
            if (redirectCount > 5) {
              reqResolve({ success: false, errMessage: 'Too many HTTP redirects (>5)' });
              return;
            }

            const req = http.get(targetUrl, { timeout: 8000 }, (res) => {
              const statusCode = res.statusCode || 0;

              // Handle redirects (301, 302, 307, 308)
              if ([301, 302, 307, 308].includes(statusCode) && res.headers.location) {
                const nextUrl = res.headers.location.startsWith('http')
                  ? res.headers.location
                  : new URL(res.headers.location, targetUrl).toString();
                performRequest(nextUrl, redirectCount + 1).then(reqResolve);
                return;
              }

              if (statusCode >= 200 && statusCode < 300) {
                reqResolve({ success: true, statusCode });
              } else {
                reqResolve({ success: false, statusCode, errMessage: `HTTP Status ${statusCode}` });
              }
            });

            req.on('error', (err: any) => {
              let msg = err.message || 'Unknown network error';
              if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
                msg = `DNS Resolution Failure (${err.code})`;
              } else if (err.code === 'ECONNREFUSED') {
                msg = `Connection Refused (${err.code})`;
              } else if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
                msg = `Connection Timeout (${err.code})`;
              }
              reqResolve({ success: false, errMessage: msg });
            });

            req.on('timeout', () => {
              req.destroy();
              reqResolve({ success: false, errMessage: 'Request Timeout (8000ms)' });
            });
          });
        };

        const result = await performRequest(url);

        if (result.success) {
          if (onLog) {
            await onLog(`[HTTP Health Probe] Attempt #${attempt} (${elapsedSec}s elapsed): SUCCESS (HTTP ${result.statusCode})\n`);
          }
          resolve({ success: true, finalUrl: url });
        } else {
          lastErrorReason = result.errMessage || 'Probing failed';
          if (onLog) {
            await onLog(`[HTTP Health Probe] Attempt #${attempt} (${elapsedSec}s elapsed): Pending - ${lastErrorReason}. Retrying in 5s...\n`);
          }
          setTimeout(probe, retryDelayMs);
        }
      };

      probe();
    });
  }

  private cloneRepository(
    authenticatedUrl: string,
    branch: string,
    targetDir: string,
    onLog: (line: string) => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const args = ['clone', '--depth', '1', '--branch', branch, authenticatedUrl, targetDir];
      const child = spawn('git', args, { shell: false });

      child.stdout.on('data', (data) => onLog(data.toString()));
      child.stderr.on('data', (data) => onLog(data.toString()));

      child.on('error', (err) => {
        onLog(`Git error: ${err.message}\n`);
        resolve(false);
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  private cleanupDir(dirPath: string) {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.error(`Failed to clean up temporary directory ${dirPath}:`, e);
    }
  }
}

export const dockerDeploymentService = new DockerDeploymentService();
