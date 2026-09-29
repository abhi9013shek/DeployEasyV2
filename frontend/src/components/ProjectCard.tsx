import { GitBranch, Clock, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatDate, timeAgo } from '../utils';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="card cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
            {project.name}
          </h3>
          <p className="text-sm text-surface-400 truncate mt-0.5">{project.repository}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="flex items-center gap-4 text-xs text-surface-400 mb-3">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3.5 w-3.5" />
          {project.branch}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {project.lastDeployedAt ? timeAgo(project.lastDeployedAt) : 'Never deployed'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-surface-700/30">
        <span className="text-xs text-surface-500">
          {project.deploymentCount} deployment{project.deploymentCount !== 1 ? 's' : ''} · Created {formatDate(project.createdAt)}
        </span>
        {project.liveUrl && (
          <ExternalLink className="h-3.5 w-3.5 text-surface-500 group-hover:text-brand-400 transition-colors" />
        )}
      </div>
    </div>
  );
}
