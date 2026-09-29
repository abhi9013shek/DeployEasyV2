import { spawn } from 'child_process';
import { K8sResourceNames } from './kubernetesManifestGenerator';

export interface IKubernetesClient {
  loadLocalImageToMinikube(imageTag: string): Promise<{ success: boolean; logs: string }>;
  applyManifest(manifest: object): Promise<{ success: boolean; logs: string }>;
  checkRolloutStatus(deploymentName: string, timeoutSec?: number): Promise<{ success: boolean; logs: string }>;
  isIngressAvailable(): Promise<boolean>;
  getServiceUrl(serviceName: string): Promise<string | null>;
  getLoadBalancerUrl(serviceName: string, timeoutSec?: number): Promise<string | null>;
  deleteWorkload(names: K8sResourceNames): Promise<void>;
}

export class KubernetesClient implements IKubernetesClient {
  private runCommand(
    command: string,
    args: string[],
    stdinInput?: string
  ): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn(command, args, { shell: false });
      let stdout = '';
      let stderr = '';

      if (stdinInput && child.stdin) {
        child.stdin.write(stdinInput);
        child.stdin.end();
      }

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ code: code ?? 1, stdout, stderr });
      });

      child.on('error', (err) => {
        resolve({ code: 1, stdout, stderr: stderr + '\n' + err.message });
      });
    });
  }

  async loadLocalImageToMinikube(imageTag: string): Promise<{ success: boolean; logs: string }> {
    let logs = `[K8s] Synchronizing image ${imageTag} to Minikube cluster...\n`;

    // Strategy 1: Save host Docker image to stream directly into Minikube container runtime
    return new Promise((resolve) => {
      const dockerSave = spawn('docker', ['save', imageTag], { shell: false });
      const minikubeImport = spawn(
        'docker',
        ['exec', '-i', 'minikube', 'ctr', '-n', 'k8s.io', 'images', 'import', '-'],
        { shell: false }
      );

      let stderr = '';

      dockerSave.stdout.pipe(minikubeImport.stdin);

      minikubeImport.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      minikubeImport.on('close', (code) => {
        if (code === 0) {
          logs += `[K8s] Image ${imageTag} successfully loaded into Minikube.\n`;
          resolve({ success: true, logs });
        } else {
          logs += `[K8s] Failed to load image to Minikube: ${stderr}\n`;
          resolve({ success: false, logs });
        }
      });

      dockerSave.on('error', (err) => {
        logs += `[K8s] Error saving image: ${err.message}\n`;
        resolve({ success: false, logs });
      });

      minikubeImport.on('error', (err) => {
        logs += `[K8s] Error importing image to Minikube: ${err.message}\n`;
        resolve({ success: false, logs });
      });
    });
  }

  async applyManifest(manifest: object): Promise<{ success: boolean; logs: string }> {
    const yamlStr = JSON.stringify(manifest);
    const res = await this.runCommand('kubectl', ['apply', '-f', '-'], yamlStr);
    const logs = `[K8s] kubectl apply: ${res.stdout.trim() || res.stderr.trim()}\n`;
    return {
      success: res.code === 0,
      logs,
    };
  }

  async checkRolloutStatus(deploymentName: string, timeoutSec = 60): Promise<{ success: boolean; logs: string }> {
    let logs = `[K8s] Waiting for deployment rollout: ${deploymentName}...\n`;
    const res = await this.runCommand('kubectl', [
      'rollout',
      'status',
      `deployment/${deploymentName}`,
      `--timeout=${timeoutSec}s`,
    ]);

    logs += res.stdout + res.stderr;
    return {
      success: res.code === 0,
      logs,
    };
  }

  async isIngressAvailable(): Promise<boolean> {
    const res = await this.runCommand('kubectl', ['get', 'ingressclasses']);
    if (res.code !== 0 || !res.stdout.trim()) return false;
    return !res.stdout.includes('No resources found');
  }

  async getServiceUrl(serviceName: string): Promise<string | null> {
    const res = await this.runCommand('kubectl', [
      'get',
      'service',
      serviceName,
      '-o',
      'jsonpath={.spec.ports[0].port}',
    ]);

    if (res.code === 0 && res.stdout.trim()) {
      const targetPort = res.stdout.trim();
      const localPort = 30000 + Math.floor(Math.random() * 2000);

      // Spawn host port-forward to Kubernetes service
      spawn('kubectl', ['port-forward', `service/${serviceName}`, `${localPort}:${targetPort}`], {
        shell: false,
        detached: true,
        stdio: 'ignore',
      }).unref();

      // Give port-forward 1.5s to establish listener
      await new Promise((r) => setTimeout(r, 1500));
      return `http://127.0.0.1:${localPort}`;
    }

    return null;
  }

  async getLoadBalancerUrl(serviceName: string, timeoutSec = 180): Promise<string | null> {
    const startTime = Date.now();
    while ((Date.now() - startTime) < timeoutSec * 1000) {
      const res = await this.runCommand('kubectl', [
        'get',
        'service',
        serviceName,
        '-o',
        'jsonpath={.status.loadBalancer.ingress[0].hostname}',
      ]);

      if (res.code === 0 && res.stdout.trim()) {
        const hostname = res.stdout.trim();
        return `http://${hostname}`;
      }

      // Also check if IP address is returned instead of hostname
      const ipRes = await this.runCommand('kubectl', [
        'get',
        'service',
        serviceName,
        '-o',
        'jsonpath={.status.loadBalancer.ingress[0].ip}',
      ]);
      if (ipRes.code === 0 && ipRes.stdout.trim()) {
        const ip = ipRes.stdout.trim();
        return `http://${ip}`;
      }

      await new Promise((r) => setTimeout(r, 5000));
    }
    return null;
  }

  async deleteWorkload(names: K8sResourceNames): Promise<void> {
    await this.runCommand('kubectl', ['delete', 'ingress', names.ingressName, '--ignore-not-found']);
    await this.runCommand('kubectl', ['delete', 'service', names.serviceName, '--ignore-not-found']);
    await this.runCommand('kubectl', ['delete', 'deployment', names.deploymentName, '--ignore-not-found']);
  }
}
