import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Search } from 'lucide-react';
import { caseService } from '../services/caseService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary, ErrorState, Spinner } from '../components/common/Feedback';
import { Card, Disclaimer, PageHeader, RiskBadge } from '../components/common/UI';
import SimilarCaseList from '../components/similarCases/SimilarCaseList';
import { useAuth } from '../context/AuthContext';

export default function SimilarCases() {
  const { id } = useParams();
  const { canEdit } = useAuth();
  const [topK, setTopK] = useState(5);
  const [includeHistorical, setIncludeHistorical] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const caseQ = useAsync(() => caseService.get(id), [id]);
  const stored = useAsync(() => caseService.getSimilar(id), [id]);

  const search = async () => {
    setBusy(true);
    setSearchError(null);
    try {
      const res = await caseService.findSimilar(id, { topK: Number(topK), includeHistorical });
      stored.setData(res);
      toast.success(res._message);
    } catch (err) {
      setSearchError(err);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const c = caseQ.data?.case;
  return (
    <AsyncBoundary loading={caseQ.loading} error={caseQ.error} onRetry={caseQ.refetch}>
      {c && (
        <>
          <Link to={`/cases/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" /> Case details</Link>
          <PageHeader eyebrow="Similar case retrieval" title={c.title} subtitle={`${c.caseNumber} · ${c.caseType} · ${c.currentStage}`}
            actions={<RiskBadge level={c.riskLevel} size="lg" />} />

          {canEdit && (
            <div className="card mb-6 flex flex-wrap items-end gap-4 p-4">
              <div>
                <label className="label" htmlFor="topk">Results</label>
                <select id="topk" className="input w-28" value={topK} onChange={(e) => setTopK(e.target.value)}>
                  {[3, 5, 10, 15].map((n) => <option key={n} value={n}>Top {n}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-ink-700">
                <input type="checkbox" className="h-4 w-4 accent-brass-500" checked={includeHistorical} onChange={(e) => setIncludeHistorical(e.target.checked)} />
                Include synthetic historical sample corpus
              </label>
              <button type="button" className="btn-primary" onClick={search} disabled={busy}>
                {busy ? <Spinner className="h-4 w-4 text-white" /> : <Search className="h-4 w-4" />} Find similar cases
              </button>
            </div>
          )}

          {searchError && <div className="mb-6"><ErrorState error={searchError} onRetry={search} /></div>}

          <Card title="Most similar cases" subtitle="Ranked by cosine similarity of TF-IDF vectors (description, type, sections, stage, court)" bodyClassName="p-0">
            <AsyncBoundary loading={stored.loading} error={stored.error} onRetry={stored.refetch}>
              <SimilarCaseList items={stored.data?.similarCases || []} />
            </AsyncBoundary>
          </Card>
          <div className="mt-6">
            <Disclaimer tone="info">
              Similarity reflects textual and categorical overlap only. It does not imply the matters are legally equivalent or will have the same outcome.
            </Disclaimer>
          </div>
        </>
      )}
    </AsyncBoundary>
  );
}
