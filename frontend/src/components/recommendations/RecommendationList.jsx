import { Link } from 'react-router-dom';
import { CheckCircle2, CircleAlert, CircleDot } from 'lucide-react';
import { RiskBadge, Tag } from '../common/UI';
import { EmptyState } from '../common/Feedback';
import { formatDate } from '../../utils/format';

const ICONS = { High: CircleAlert, Medium: CircleDot, Low: CheckCircle2 };
const COLORS = { High: '#b42318', Medium: '#b54708', Low: '#067647' };

export default function RecommendationList({ items = [], showCase = false }) {
  if (!items.length) {
    return <EmptyState title="No recommendations" message="Recommendations are generated together with a prediction." />;
  }
  return (
    <ul className="divide-y divide-ink-100">
      {items.map((r) => {
        const Icon = ICONS[r.priority] || CircleDot;
        const c = r.caseId && typeof r.caseId === 'object' ? r.caseId : null;
        return (
          <li key={r._id} className="flex gap-3 px-5 py-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: COLORS[r.priority] }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-ink-900">{r.recommendation}</p>
                <Tag tone={r.priority}>{r.priority}</Tag>
                {r.category && <Tag>{r.category}</Tag>}
              </div>
              {r.reason && <p className="mt-1 text-xs text-ink-600">Reason: {r.reason}</p>}
              {showCase && c && (
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <Link to={`/cases/${c._id}/prediction`} className="font-medium text-brass-600 hover:underline">{c.caseNumber}</Link>
                  <span className="truncate">{c.title}</span>
                  <RiskBadge level={r.riskLevel} />
                  <span>· {formatDate(r.createdAt)}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
