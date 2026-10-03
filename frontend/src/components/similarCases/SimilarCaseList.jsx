import { Link } from 'react-router-dom';
import { Database, FlaskConical } from 'lucide-react';
import { RiskBadge, Tag } from '../common/UI';
import { EmptyState } from '../common/Feedback';
import { formatDays } from '../../utils/format';

function ScoreBar({ score }) {
  return (
    <div className="flex items-center gap-2" title={`Cosine similarity ${score.toFixed(3)}`}>
      <div className="h-1.5 w-20 rounded-full bg-ink-100">
        <div className="h-1.5 rounded-full bg-brass-500" style={{ width: `${Math.round(score * 100)}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-ink-700">{(score * 100).toFixed(0)}%</span>
    </div>
  );
}

export default function SimilarCaseList({ items = [], compact = false }) {
  if (!items.length) {
    return <EmptyState title="No similar cases yet" message="Run a prediction or similarity search to retrieve comparable cases." />;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {items.map((s) => {
        const fromDb = s.source === 'database' && s.similarCaseId;
        const Title = fromDb ? Link : 'span';
        return (
          <li key={s._id || s.referenceId} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Title {...(fromDb ? { to: `/cases/${s.similarCaseId}` } : {})} className={`truncate text-sm font-medium ${fromDb ? 'text-ink-900 hover:text-brass-600' : 'text-ink-900'}`}>
                    {s.title || s.caseNumber}
                  </Title>
                  {fromDb ? (
                    <Tag><Database className="mr-1 h-3 w-3" /> database</Tag>
                  ) : (
                    <Tag tone="brass"><FlaskConical className="mr-1 h-3 w-3" /> synthetic historical sample</Tag>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink-500">
                  {s.caseNumber} · {s.caseType} · {s.court || '—'} · {s.currentStage || '—'}{s.status ? ` · ${s.status}` : ''}
                </p>
                {!compact && s.explanation && <p className="mt-1.5 text-xs text-ink-600">Match: {s.explanation}</p>}
                {!compact && s.delayDays != null && <p className="mt-0.5 text-xs text-ink-500">{fromDb ? 'Model-estimated' : 'Recorded (synthetic)'} delay: {formatDays(Math.round(s.delayDays))}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <ScoreBar score={s.similarityScore} />
                <RiskBadge level={s.riskLevel} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
