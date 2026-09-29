import { FolderKanban, Rocket, CheckCircle2, XCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DeploymentTable } from '../components/DeploymentTable';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { LoadingState, ErrorState } from '../components/States';
import { useFetch } from '../hooks/useFetch';
import { projectsApi } from '../services/projectsApi';
import { deploymentsApi } from '../services/deploymentsApi';
import { activityApi } from '../services/activityApi';

export function DashboardPage() {
  const { data: projects, loading: pLoading, error: pError } = useFetch(() => projectsApi.getAll());
  const { data: deployments, loading: dLoading, error: dError } = useFetch(() => deploymentsApi.getAll());
  const { data: activities, loading: aLoading, error: aError } = useFetch(() => activityApi.getAll());

  const loading = pLoading || dLoading || aLoading;
  const error = pError || dError || aError;

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={error} />;

  const stats = {
    totalProjects: projects?.length || 0,
    totalDeployments: deployments?.length || 0,
    runningApps: projects?.filter((p) => p.status === 'ACTIVE').length || 0,
    failedDeployments: deployments?.filter((d) => d.status === 'FAILED').length || 0,
  };

  const recentDeployments = deployments?.slice(0, 5) || [];
  const recentActivities = activities?.slice(0, 8) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-surface-400 text-sm mt-1">Overview of your deployment infrastructure</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Projects" value={stats.totalProjects} icon={FolderKanban} color="brand" />
        <StatCard title="Total Deployments" value={stats.totalDeployments} icon={Rocket} color="emerald" />
        <StatCard title="Running Apps" value={stats.runningApps} icon={CheckCircle2} color="amber" />
        <StatCard title="Failed Deployments" value={stats.failedDeployments} icon={XCircle} color="red" />
      </div>

      {/* Recent deployments & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Deployments</h2>
          <DeploymentTable deployments={recentDeployments} />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <ActivityTimeline activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}
