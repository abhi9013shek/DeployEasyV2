import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { DeploymentPipeline } from '../components/DeploymentPipeline';
import { LogViewer } from '../components/LogViewer';
import { LoadingState, ErrorState } from '../components/States';
import { useFetch } from '../hooks/useFetch';
import { deploymentsApi } from '../services/deploymentsApi';
import { formatDateTime, formatDuration } from '../utils';

export function DeploymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: deployment, loading, error, refetch } = useFetch(
    () => deploymentsApi.getById(id!),
    [id]
  );

  if (loading) return <LoadingState message="Loading deployment..." />;
  if (error || !deployment) return <ErrorState message={error || 'Deployment not found'} onRetry={refetch} />;

  const isInProgress = ['QUEUED', 'BUILDING', 'CREATING_IMAGE', 'DEPLOYING', 'HEALTH_CHECK'].includes(deployment.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {deployment.project?.name} {deployment.version}
            </h1>
            <StatusBadge status={deployment.status} size="md" />
          </div>
          <p className="text-surface-400 text-sm mt-0.5">
            Deployment #{deployment.id.slice(0, 8)}
          </p>
        </div>
        {isInProgress && (
          <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Pipeline */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Deployment Pipeline</h2>
        <DeploymentPipeline currentStatus={deployment.status} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Logs */}
          {deployment.logs && <LogViewer logs={deployment.logs} />}
        </div>

        <div className="card h-fit">
          <h3 className="font-semibold text-white mb-4">Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-400">Project</span>
              <button
                onClick={() => navigate(`/projects/${deployment.projectId}`)}
                className="text-brand-400 hover:text-brand-300 font-medium"
              >
                {deployment.project?.name}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Version</span>
              <span className="text-white font-mono">{deployment.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Branch</span>
              <span className="text-white">{deployment.branch}</span>
            </div>
            {deployment.commitHash && (
              <div className="flex justify-between">
                <span className="text-surface-400">Commit</span>
                <span className="text-white font-mono">{deployment.commitHash}</span>
              </div>
            )}
            {deployment.commitMsg && (
              <div className="flex justify-between">
                <span className="text-surface-400">Message</span>
                <span className="text-surface-200 text-right max-w-[180px] truncate">{deployment.commitMsg}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-surface-400">Trigger</span>
              <span className="text-white capitalize">{deployment.trigger}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Started</span>
              <span className="text-white">{formatDateTime(deployment.startedAt)}</span>
            </div>
            {deployment.finishedAt && (
              <div className="flex justify-between">
                <span className="text-surface-400">Finished</span>
                <span className="text-white">{formatDateTime(deployment.finishedAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-surface-400">Duration</span>
              <span className="text-white">{formatDuration(deployment.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
