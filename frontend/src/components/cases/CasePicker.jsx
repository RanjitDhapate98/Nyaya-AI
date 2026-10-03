import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { caseService } from '../../services/caseService';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { AsyncBoundary, EmptyState } from '../common/Feedback';
import { Card, RiskBadge } from '../common/UI';
import Pagination from '../common/Pagination';

/** Searchable case list that links each case to `${linkPrefix}/:id${linkSuffix}`. */
export default function CasePicker({ title, subtitle, linkSuffix, actionLabel, extraParams = {} }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounce(search);
  const { data, loading, error, refetch } = useAsync(
    () => caseService.list({ search: q, page, limit: 8, ...extraParams }),
    [q, page, JSON.stringify(extraParams)],
  );

  return (
    <Card title={title} subtitle={subtitle} bodyClassName="p-0">
      <div className="border-b border-ink-100 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input type="search" className="input pl-9" placeholder="Search cases…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search cases" />
        </div>
      </div>
      <AsyncBoundary loading={loading} error={error} onRetry={refetch} isEmpty={!data?.cases?.length}
        empty={<EmptyState title="No cases found" message="Create a case or adjust the search." action={<Link to="/cases/new" className="btn-primary">Create case</Link>} />}>
        <ul className="divide-y divide-ink-100">
          {data?.cases?.map((c) => (
            <li key={c._id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-900">{c.title}</p>
                <p className="text-xs text-ink-500">{c.caseNumber} · {c.caseType} · {c.currentStage}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <RiskBadge level={c.riskLevel} />
                <Link to={`/cases/${c._id}${linkSuffix}`} className="btn-secondary px-3 py-1.5">
                  {actionLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <Pagination page={page} totalPages={data?._meta?.pagination?.totalPages} total={data?._meta?.pagination?.total} onChange={setPage} />
      </AsyncBoundary>
    </Card>
  );
}
