export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  githubId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { projects: number };
}

export type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'BUILDING' | 'FAILED';
export type DeploymentStatus = 'QUEUED' | 'BUILDING' | 'CREATING_IMAGE' | 'PUSHING_IMAGE' | 'DEPLOYING' | 'HEALTH_CHECK' | 'SUCCESS' | 'FAILED';
export type ActivityType = 'PROJECT_CREATED' | 'PROJECT_UPDATED' | 'PROJECT_DELETED' | 'DEPLOYMENT_STARTED' | 'DEPLOYMENT_SUCCESS' | 'DEPLOYMENT_FAILED' | 'SETTINGS_UPDATED';
export type Framework = 'REACT' | 'NEXTJS' | 'VUE' | 'ANGULAR' | 'SVELTE' | 'EXPRESS' | 'NESTJS' | 'STATIC' | 'OTHER';

export interface Project {
  id: string;
  name: string;
  repository: string;
  branch: string;
  framework: Framework;
  buildCommand: string;
  startCommand: string;
  envVars: string | null;
  status: ProjectStatus;
  target?: 'LOCAL' | 'AWS';
  liveUrl: string | null;
  deploymentCount: number;
  lastDeployedAt: string | null;
  autoDeploy: boolean;
  webhookSecret: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  deployments?: Deployment[];
}

export interface Deployment {
  id: string;
  version: string;
  status: DeploymentStatus;
  target?: 'LOCAL' | 'AWS';
  branch: string;
  commitHash: string | null;
  commitMsg: string | null;
  trigger: string;
  logs: string | null;
  duration: number | null;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    repository?: string;
    branch?: string;
  };
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  metadata: string | null;
  createdAt: string;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreateProjectInput {
  name: string;
  repository: string;
  branch: string;
  framework: string;
  target?: 'LOCAL' | 'AWS';
  buildCommand: string;
  startCommand: string;
  envVars?: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalDeployments: number;
  runningApps: number;
  failedDeployments: number;
}
