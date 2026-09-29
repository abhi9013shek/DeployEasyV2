import { DeploymentStatus } from '../types';
import { cn } from '../utils';
import { CheckCircle2, Loader2, Circle, XCircle } from 'lucide-react';

interface DeploymentPipelineProps {
  currentStatus: DeploymentStatus;
}

const stages = [
  { key: 'QUEUED', label: 'Git Clone' },
  { key: 'BUILDING', label: 'Build' },
  { key: 'CREATING_IMAGE', label: 'Create Image' },
  { key: 'DEPLOYING', label: 'Deploy' },
  { key: 'HEALTH_CHECK', label: 'Health Check' },
  { key: 'SUCCESS', label: 'Live' },
];

const stageOrder = ['QUEUED', 'BUILDING', 'CREATING_IMAGE', 'DEPLOYING', 'HEALTH_CHECK', 'SUCCESS'];

export function DeploymentPipeline({ currentStatus }: DeploymentPipelineProps) {
  const currentIdx = stageOrder.indexOf(currentStatus);
  const isFailed = currentStatus === 'FAILED';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
      {stages.map((stage, idx) => {
        const isComplete = !isFailed && currentIdx >= idx && currentStatus !== stage.key;
        const isCurrent = !isFailed && currentStatus === stage.key;
        const isFailedStage = isFailed && stageOrder[currentIdx] === stage.key;
        const isPending = isFailed ? idx > currentIdx : idx > currentIdx;

        return (
          <div key={stage.key} className="flex items-center w-full sm:w-auto">
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              isComplete && 'text-white',
              isCurrent && 'text-white bg-zinc-800 border border-zinc-700',
              isFailedStage && 'text-zinc-400 bg-zinc-900 border border-zinc-800',
              isPending && 'text-zinc-600',
              !isComplete && !isCurrent && !isFailedStage && !isPending && 'text-white'
            )}>
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : isFailedStage ? (
                <XCircle className="h-4 w-4 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              {stage.label}
            </div>
            {idx < stages.length - 1 && (
              <div className={cn(
                'hidden sm:block w-8 h-px mx-1',
                idx < currentIdx && !isFailed ? 'bg-zinc-600' : 'bg-zinc-800'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
