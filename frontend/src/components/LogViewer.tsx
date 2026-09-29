import { Terminal } from 'lucide-react';

interface LogViewerProps {
  logs: string;
}

export function LogViewer({ logs }: LogViewerProps) {
  const lines = logs.split('\n').filter(Boolean);

  return (
    <div className="rounded-xl border border-surface-700/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-800/80 border-b border-surface-700/50">
        <Terminal className="h-4 w-4 text-surface-400" />
        <span className="text-sm text-surface-400 font-medium">Deployment Logs</span>
      </div>
      <div className="bg-surface-900/80 p-4 overflow-x-auto max-h-96 overflow-y-auto font-mono text-sm">
        {lines.map((line, idx) => (
          <div key={idx} className="flex gap-3 py-0.5 hover:bg-surface-800/30 px-1 -mx-1 rounded">
            <span className="text-surface-600 select-none shrink-0 w-6 text-right">{idx + 1}</span>
            <span className={
              line.includes('ERROR') || line.includes('failed')
                ? 'text-zinc-400 font-semibold'
                : line.includes('successfully') || line.includes('completed') || line.includes('passed')
                ? 'text-white font-medium'
                : 'text-zinc-400'
            }>
              {line}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
