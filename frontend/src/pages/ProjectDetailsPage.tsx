import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  GitBranch,
  Rocket,
  ExternalLink,
  ArrowLeft,
  Settings,
  Terminal,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { DeploymentTable } from '../components/DeploymentTable';
import { LoadingState, ErrorState } from '../components/States';
import { useFetch } from '../hooks/useFetch';
import { projectsApi } from '../services/projectsApi';
import { deploymentsApi } from '../services/deploymentsApi';
import { formatDate, formatDateTime } from '../utils';

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deploying, setDeploying] = useState(false);

  const { data: project, loading, error, refetch } = useFetch(
    () => projectsApi.getById(id!),
    [id]
  );

  const handleDeploy = async () => {
    if (!project) return;
    setDeploying(true);
    try {
      const deployment = await deploymentsApi.create(project.id);
      navigate(`/deployments/${deployment.id}`);
    } catch {
      alert('Failed to start deployment');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) return <LoadingState message="Loading project..." />;
  if (error || !project) return <ErrorState message={error || 'Project not found'} onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/projects')} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <StatusBadge status={project.status} size="md" />
          </div>
          <p className="text-surface-400 text-sm mt-0.5">{project.repository}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/projects/${project.id}/logs`)}
            className="btn-ghost flex items-center gap-2 text-sm hidden sm:flex"
          >
            <Terminal className="h-4 w-4" />
            View Logs
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm hidden sm:flex">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Rocket className="h-4 w-4" />
            {deploying ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </div>

      {/* Project info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Project Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-surface-500">Repository</span>
                <p className="text-surface-200 font-medium mt-0.5">{project.repository}</p>
              </div>
              <div>
                <span className="text-surface-500">Branch</span>
                <p className="text-surface-200 font-medium mt-0.5 flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5" />
                  {project.branch}
                </p>
              </div>
              <div>
                <span className="text-surface-500">Framework</span>
                <p className="text-surface-200 font-medium mt-0.5">{project.framework}</p>
              </div>
              <div>
                <span className="text-surface-500">Deployment Target</span>
                <p className="text-surface-200 font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    AWS Cloud (ECR + EKS)
                  </span>
                </p>
              </div>
              <div>
                <span className="text-surface-500">Build Command</span>
                <p className="text-surface-200 font-mono text-xs mt-0.5">{project.buildCommand}</p>
              </div>
              <div>
                <span className="text-surface-500">Start Command</span>
                <p className="text-surface-200 font-mono text-xs mt-0.5">{project.startCommand}</p>
              </div>
              <div>
                <span className="text-surface-500">Created</span>
                <p className="text-surface-200 font-medium mt-0.5">{formatDate(project.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Deployments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Deployments</h2>
            {project.deployments && project.deployments.length > 0 ? (
              <DeploymentTable deployments={project.deployments} showProject={false} />
            ) : (
              <p className="text-surface-500 text-sm">No deployments yet</p>
            )}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-white mb-3">Live URL</h3>
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {project.liveUrl}
              </a>
            ) : (
              <p className="text-surface-500 text-sm">Not deployed</p>
            )}
            <p className="text-xs text-surface-600 mt-2">Demo URL — not a live endpoint</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-3">Statistics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-400">Total Deployments</span>
                <span className="text-white font-medium">{project.deploymentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Last Deployed</span>
                <span className="text-white font-medium">{project.lastDeployedAt ? formatDateTime(project.lastDeployedAt) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-400">Status</span>
                <StatusBadge status={project.status} />
              </div>
            </div>
          </div>

          {/* Webhook & Auto Deploy card */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white">Webhook & Auto-Deploy</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-400">Automatic Deployment</span>
              <button
                onClick={async () => {
                  try {
                    await projectsApi.update(project.id, { autoDeploy: !project.autoDeploy });
                    refetch();
                  } catch {
                    alert('Failed to toggle auto deploy');
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  project.autoDeploy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-surface-800 text-surface-400 border border-surface-700'
                }`}
              >
                {project.autoDeploy ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-surface-400 font-medium">Webhook URL</span>
              <div className="p-2 bg-surface-900 border border-surface-800 rounded font-mono text-surface-300 break-all select-all">
                {window.location.origin.replace(/:5173$/, ':3001')}/api/webhooks/github
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-surface-400 font-medium">Webhook Secret</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-surface-900 border border-surface-800 rounded font-mono text-surface-400">
                  {project.webhookSecret ? `${project.webhookSecret.substring(0, 10)}****************` : 'Not configured'}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await projectsApi.regenerateWebhookSecret(project.id);
                      alert(`Secret generated: ${res.webhookSecret}\n\nCopy this secret now into GitHub Webhook settings. It will be masked on reload.`);
                      refetch();
                    } catch {
                      alert('Failed to regenerate secret');
                    }
                  }}
                  className="btn-secondary text-xs px-2.5 py-1.5"
                >
                  {project.webhookSecret ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
