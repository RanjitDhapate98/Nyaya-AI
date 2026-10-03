import { useState } from 'react';
import { recommendationService } from '../services/recommendationService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary, EmptyState } from '../components/common/Feedback';
import { Card, Disclaimer, PageHeader } from '../components/common/UI';
import RecommendationList from '../components/recommendations/RecommendationList';
import Pagination from '../components/common/Pagination';
import { RECOMMENDATION_DISCLAIMER } from '../constants';

export default function Recommendations() {
  const [filters, setFilters] = useState({ priority: '', riskLevel: '' });
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useAsync(
    () => recommendationService.list({ ...filters, page, limit: 15 }),
    [filters.priority, filters.riskLevel, page],
  );
  const set = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };
  const pg = data?._meta?.pagination;

  return (
    <>
      <PageHeader eyebrow="Decision support" title="Recommendations" subtitle="Rule-engine suggestions generated with each prediction, across all cases." />
      <div className="mb-6"><Disclaimer>{RECOMMENDATION_DISCLAIMER}</Disclaimer></div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="r-priority">Priority</label>
          <select id="r-priority" className="input w-40" value={filters.priority} onChange={set('priority')}>
            <option value="">All</option>{['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="r-risk">Case risk</label>
          <select id="r-risk" className="input w-40" value={filters.riskLevel} onChange={set('riskLevel')}>
            <option value="">All</option>{['HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        {data?.summary && (
          <p className="pb-2 text-sm text-ink-500">
            {['High', 'Medium', 'Low'].map((k) => `${data.summary[k] || 0} ${k.toLowerCase()}`).join(' · ')} priority
          </p>
        )}
      </div>
      <Card bodyClassName="p-0">
        <AsyncBoundary loading={loading && !data} error={error} onRetry={refetch} isEmpty={!data?.recommendations?.length}
          empty={<EmptyState title="No recommendations yet" message="Run a prediction on a case to generate recommendations." />}>
          <RecommendationList items={data?.recommendations || []} showCase />
          <Pagination page={pg?.page} totalPages={pg?.totalPages} total={pg?.total} onChange={setPage} />
        </AsyncBoundary>
      </Card>
    </>
  );
}
