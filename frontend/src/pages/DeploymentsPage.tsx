import { useState } from 'react';
import { Filter } from 'lucide-react';
import { DeploymentTable } from '../components/DeploymentTable';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { useFetch } from '../hooks/useFetch';
import { deploymentsApi } from '../services/deploymentsApi';

export function DeploymentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: deployments, loading, error, refetch } = useFetch(
    () => deploymentsApi.getAll(undefined, statusFilter !== 'all' ? statusFilter : undefined),
    [statusFilter]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deployments</h1>
          <p className="text-surface-400 text-sm mt-1">History of all deployments</p>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field pl-10 pr-8 min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="building">Building</option>
            <option value="deploying">Deploying</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <LoadingState message="Loading deployments..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !deployments || deployments.length === 0 ? (
          <EmptyState title="No deployments" message="Deploy a project to see deployment history." />
        ) : (
          <DeploymentTable deployments={deployments} />
        )}
      </div>
    </div>
  );
}
