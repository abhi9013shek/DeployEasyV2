import { ActivityTimeline } from '../components/ActivityTimeline';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { useFetch } from '../hooks/useFetch';
import { activityApi } from '../services/activityApi';

export function ActivityPage() {
  const { data: activities, loading, error, refetch } = useFetch(() => activityApi.getAll());

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity</h1>
        <p className="text-surface-400 text-sm mt-1">Recent events across your projects</p>
      </div>

      <div className="card">
        {loading ? (
          <LoadingState message="Loading activity..." />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !activities || activities.length === 0 ? (
          <EmptyState title="No activity" message="Activity will appear here as you use the platform." />
        ) : (
          <ActivityTimeline activities={activities} />
        )}
      </div>
    </div>
  );
}
