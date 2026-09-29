import { DeploymentStatus, ProjectStatus } from '../types';
import { cn } from '../utils';

interface StatusBadgeProps {
  status: DeploymentStatus | ProjectStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  SUCCESS: { label: 'Success', className: 'bg-white/10 text-white border-white/30' },
  ACTIVE: { label: 'Active', className: 'bg-white/10 text-white border-white/30' },
  FAILED: { label: 'Failed', className: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  BUILDING: { label: 'Building', className: 'bg-zinc-900 text-zinc-200 border-zinc-700' },
  QUEUED: { label: 'Queued', className: 'bg-zinc-900 text-zinc-400 border-zinc-800' },
  DEPLOYING: { label: 'Deploying', className: 'bg-white/10 text-white border-white/30' },
  CREATING_IMAGE: { label: 'Creating Image', className: 'bg-zinc-900 text-zinc-200 border-zinc-700' },
  HEALTH_CHECK: { label: 'Health Check', className: 'bg-zinc-900 text-zinc-200 border-zinc-700' },
  INACTIVE: { label: 'Inactive', className: 'bg-zinc-900 text-zinc-500 border-zinc-800' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-surface-500/10 text-surface-400 border-surface-500/20' };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {(status === 'BUILDING' || status === 'DEPLOYING' || status === 'CREATING_IMAGE' || status === 'HEALTH_CHECK') && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />
      )}
      {status === 'SUCCESS' || status === 'ACTIVE' ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {config.label}
    </span>
  );
}
