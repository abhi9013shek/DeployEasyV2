import { Loader2, PackageX, AlertTriangle } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <Loader2 className="h-8 w-8 text-brand-500 animate-spin mb-4" />
      <p className="text-surface-400 text-sm">{message}</p>
    </div>
  );
}

export function EmptyState({ title = 'No data', message = 'Nothing to show here yet.' }: { title?: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <PackageX className="h-12 w-12 text-surface-600 mb-4" />
      <h3 className="text-surface-300 font-medium mb-1">{title}</h3>
      <p className="text-surface-500 text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
      <h3 className="text-surface-300 font-medium mb-1">Error</h3>
      <p className="text-surface-500 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">
          Try Again
        </button>
      )}
    </div>
  );
}
