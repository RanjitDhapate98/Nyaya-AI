import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from './Feedback';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel, busy, danger = true }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-50 p-2"><AlertTriangle className="h-5 w-5 text-risk-high" /></div>
          <div>
            <h3 id="confirm-title" className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-ink-600">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner className="h-4 w-4 text-white" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
