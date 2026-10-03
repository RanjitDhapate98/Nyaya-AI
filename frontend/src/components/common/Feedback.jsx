import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin text-brass-500 ${className}`} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-ink-500" role="status">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="rounded-full bg-ink-50 p-3"><Icon className="h-6 w-6 text-ink-400" /></div>
      <p className="font-serif text-lg text-ink-800">{title}</p>
      {message && <p className="max-w-md text-sm text-ink-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  const unavailable = error?.status === 503;
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-6 py-10 text-center" role="alert">
      <AlertTriangle className="h-7 w-7 text-risk-high" />
      <p className="font-serif text-lg text-ink-900">{unavailable ? 'Service unavailable' : title}</p>
      <p className="max-w-lg text-sm text-ink-600">{error?.message || 'Unexpected error'}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-2">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

/** Renders loading / error / empty / content in one place. */
export function AsyncBoundary({ loading, error, onRetry, isEmpty, empty, children, loadingLabel }) {
  if (loading) return <LoadingState label={loadingLabel} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return empty || <EmptyState />;
  return children;
}
