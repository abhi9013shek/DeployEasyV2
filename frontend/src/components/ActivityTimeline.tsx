import { Activity } from '../types';
import { timeAgo } from '../utils';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  FolderPlus,
  Settings,
  Trash2,
  Edit,
} from 'lucide-react';

interface ActivityTimelineProps {
  activities: Activity[];
  limit?: number;
}

const iconMap: Record<string, { icon: typeof Rocket; color: string }> = {
  DEPLOYMENT_STARTED: { icon: Rocket, color: 'text-blue-400 bg-blue-500/10' },
  DEPLOYMENT_SUCCESS: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10' },
  DEPLOYMENT_FAILED: { icon: XCircle, color: 'text-red-400 bg-red-500/10' },
  PROJECT_CREATED: { icon: FolderPlus, color: 'text-brand-400 bg-brand-500/10' },
  PROJECT_UPDATED: { icon: Edit, color: 'text-amber-400 bg-amber-500/10' },
  PROJECT_DELETED: { icon: Trash2, color: 'text-red-400 bg-red-500/10' },
  SETTINGS_UPDATED: { icon: Settings, color: 'text-surface-400 bg-surface-500/10' },
};

export function ActivityTimeline({ activities, limit }: ActivityTimelineProps) {
  const items = limit ? activities.slice(0, limit) : activities;

  return (
    <div className="space-y-1">
      {items.map((activity, idx) => {
        const config = iconMap[activity.type] || iconMap.SETTINGS_UPDATED;
        const Icon = config.icon;
        return (
          <div key={activity.id} className="flex items-start gap-3 py-2.5 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className={`p-2 rounded-lg ${config.color} shrink-0`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-200 leading-snug">{activity.message}</p>
              <p className="text-xs text-surface-500 mt-0.5">{timeAgo(activity.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
