import { useNavigate } from 'react-router-dom';
import { Deployment } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, formatDuration } from '../utils';

interface DeploymentTableProps {
  deployments: Deployment[];
  showProject?: boolean;
}

export function DeploymentTable({ deployments, showProject = true }: DeploymentTableProps) {
  const navigate = useNavigate();

  if (deployments.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-surface-400 border-b border-surface-700/50">
            {showProject && <th className="pb-3 font-medium">Project</th>}
            <th className="pb-3 font-medium">Version</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium hidden sm:table-cell">Trigger</th>
            <th className="pb-3 font-medium hidden md:table-cell">Duration</th>
            <th className="pb-3 font-medium">Started</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/30">
          {deployments.map((d) => (
            <tr
              key={d.id}
              onClick={() => navigate(`/deployments/${d.id}`)}
              className="cursor-pointer hover:bg-surface-800/30 transition-colors"
            >
              {showProject && (
                <td className="py-3 pr-4">
                  <span className="font-medium text-white">{d.project?.name || '—'}</span>
                </td>
              )}
              <td className="py-3 pr-4">
                <span className="font-mono text-surface-300">{d.version}</span>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={d.status} />
              </td>
              <td className="py-3 pr-4 hidden sm:table-cell text-surface-400 capitalize">{d.trigger}</td>
              <td className="py-3 pr-4 hidden md:table-cell text-surface-400">{formatDuration(d.duration)}</td>
              <td className="py-3 text-surface-400">{formatDateTime(d.startedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
