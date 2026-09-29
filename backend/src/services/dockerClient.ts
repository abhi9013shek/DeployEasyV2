import { spawn } from 'child_process';
import { DockerBuildOptions, DockerRunOptions, IDockerClient } from '../types';

export class DockerClient implements IDockerClient {
  async buildImage(options: DockerBuildOptions): Promise<{ imageId?: string; logs: string }> {
    const { imageTag, contextPath, dockerfilePath, onLog } = options;
    const args = ['build', '-t', imageTag];

    if (dockerfilePath) {
      args.push('-f', dockerfilePath);
    }
    args.push(contextPath);

    const result = await this.runCommand('docker', args, { cwd: contextPath, onLog });
    
    // Extract Image ID if possible
    const match = result.logs.match(/(?:Successfully built|writing image sha256:)\s*([a-f0-9]{12,64})/i);
    const imageId = match ? match[1] : undefined;

    return { imageId, logs: result.logs };
  }

  async smokeTestContainer(options: DockerRunOptions): Promise<{ success: boolean; logs: string; error?: string }> {
    const { imageTag, containerName = `smoke-${Date.now()}`, timeoutMs = 15000 } = options;

    const runArgs = ['run', '-d', '--name', containerName];
    if (options.envVars) {
      for (const [key, val] of Object.entries(options.envVars)) {
        runArgs.push('-e', `${key}=${val}`);
      }
    }
    runArgs.push(imageTag);

    try {
      // 1. Run container in detached mode
      const startResult = await this.runCommand('docker', runArgs);
      const containerId = startResult.logs.trim().split('\n').pop() || containerName;

      // 2. Wait for timeout to verify it doesn't immediately crash
      await new Promise((resolve) => setTimeout(resolve, Math.min(timeoutMs, 5000)));

      // 3. Inspect container state
      const inspectResult = await this.runCommand('docker', ['inspect', '--format', '{{.State.Running}}', containerId]);
      const isRunning = inspectResult.logs.trim().toLowerCase() === 'true';

      // 4. Fetch logs
      const logsResult = await this.runCommand('docker', ['logs', '--tail', '50', containerId]);

      // 5. Cleanup container (stop & rm)
      await this.runCommand('docker', ['rm', '-f', containerId]).catch(() => {});

      if (!isRunning) {
        return {
          success: false,
          logs: logsResult.logs,
          error: 'Container exited prematurely during smoke test',
        };
      }

      return {
        success: true,
        logs: logsResult.logs,
      };
    } catch (err: any) {
      // Force cleanup
      await this.runCommand('docker', ['rm', '-f', containerName]).catch(() => {});
      return {
        success: false,
        logs: err.message || '',
        error: `Smoke test failed to start container: ${err.message}`,
      };
    }
  }

  private runCommand(
    command: string,
    args: string[],
    options?: { cwd?: string; onLog?: (line: string) => void }
  ): Promise<{ code: number; logs: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: options?.cwd, shell: false });
      let output = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (options?.onLog) options.onLog(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (options?.onLog) options.onLog(text);
      });

      child.on('error', (err) => reject(err));

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ code: 0, logs: output });
        } else {
          reject(new Error(`Command '${command} ${args.join(' ')}' exited with code ${code}.\n${output}`));
        }
      });
    });
  }
}

export const dockerClient = new DockerClient();
