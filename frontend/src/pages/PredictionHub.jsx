import { Link } from 'react-router-dom';
import { predictionService } from '../services/predictionService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary, EmptyState } from '../components/common/Feedback';
import { Card, Disclaimer, PageHeader, RiskBadge } from '../components/common/UI';
import CasePicker from '../components/cases/CasePicker';
import { formatDateTime, formatDays, formatPercent } from '../utils/format';
import { PREDICTION_DISCLAIMER } from '../constants';

export default function PredictionHub() {
  const recent = useAsync(() => predictionService.list({ limit: 8 }), []);
  return (
    <>
      <PageHeader eyebrow="AI prediction" title="Delay-risk predictions" subtitle="Choose a case to run or review its prediction, explanation, similar cases and recommendations." />
      <div className="mb-6"><Disclaimer>{PREDICTION_DISCLAIMER}</Disclaimer></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <CasePicker title="Select a case" subtitle="Unassessed cases are shown first" linkSuffix="/prediction" actionLabel="Predict" extraParams={{ sortBy: 'riskProbability', sortOrder: 'asc' }} />
        <Card title="Recent prediction runs" bodyClassName="p-0">
          <AsyncBoundary loading={recent.loading} error={recent.error} onRetry={recent.refetch} isEmpty={!recent.data?.predictions?.length}
            empty={<EmptyState title="No predictions yet" message="Pick a case to run the model." />}>
            <ul className="divide-y divide-ink-100">
              {recent.data?.predictions?.filter((p) => p.caseId).map((p) => (
                <li key={p._id}>
                  <Link to={`/cases/${p.caseId._id}/prediction`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ink-50/60">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{p.caseId.title}</p>
                      <p className="text-xs text-ink-500">{p.caseId.caseNumber} · {p.modelVersion} · {formatDateTime(p.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <RiskBadge level={p.riskLevel} />
                      <p className="mt-1 text-xs text-ink-500">{formatPercent(p.probability)} · {formatDays(p.predictedDelayDays)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </AsyncBoundary>
        </Card>
      </div>
    </>
  );
}
