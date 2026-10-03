import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, onChange }) {
  if (!totalPages) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3 text-sm text-ink-600">
      <span>{total} result{total === 1 ? '' : 's'} · Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary px-3 py-1.5" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <button type="button" className="btn-secondary px-3 py-1.5" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
