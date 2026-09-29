export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreateProjectInput {
  name: string;
  repository: string;
  branch?: string;
  framework?: string;
  buildCommand?: string;
  startCommand?: string;
  envVars?: string;
}

export interface UpdateProjectInput {
  name?: string;
  branch?: string;
  framework?: string;
  buildCommand?: string;
  startCommand?: string;
  envVars?: string;
  status?: string;
  autoDeploy?: boolean;
  webhookSecret?: string;
}

export interface CreateDeploymentInput {
  projectId: string;
  branch?: string;
  commitHash?: string;
  commitMsg?: string;
  trigger?: string;
}

export interface DeploymentLogsResponse {
  projectId: string;
  deploymentId: string | null;
  logs: string;
}

export interface DetectedProjectInfo {
  type: 'nodejs' | 'dockerfile' | 'unsupported';
  framework?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
  buildScript?: string;
  startScript?: string;
  hasDockerfile: boolean;
  details?: string;
}

export interface DockerBuildOptions {
  imageTag: string;
  contextPath: string;
  dockerfilePath?: string;
  buildArgs?: Record<string, string>;
  onLog?: (line: string) => void;
}

export interface DockerRunOptions {
  imageTag: string;
  containerName?: string;
  envVars?: Record<string, string>;
  timeoutMs?: number;
}

export interface IDockerClient {
  buildImage(options: DockerBuildOptions): Promise<{ imageId?: string; logs: string }>;
  smokeTestContainer(options: DockerRunOptions): Promise<{ success: boolean; logs: string; error?: string }>;
}

// Deployment service interface
export interface IDeploymentService {
  startDeployment(deploymentId: string): Promise<void>;
}

