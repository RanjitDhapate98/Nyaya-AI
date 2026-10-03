import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Card, RiskBadge } from '../common/UI';
import { EmptyState } from '../common/Feedback';
import { daysUntil, formatDate } from '../../utils/format';

export function RecentCases({ cases }) {
  return (
    <Card title="Recent cases" subtitle="Latest records added to the system" actions={<Link to="/cases" className="text-sm font-medium text-brass-600 hover:underline">View all</Link>} bodyClassName="p-0">
      {!cases?.length ? <EmptyState title="No cases yet" /> : (
        <ul className="divide-y divide-ink-100">
          {cases.map((c) => (
            <li key={c._id}>
              <Link to={`/cases/${c._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ink-50/60">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{c.title}</p>
                  <p className="text-xs text-ink-500">{c.caseNumber} · {c.caseType} · {c.court}</p>
                </div>
                <RiskBadge level={c.riskLevel} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function UpcomingHighRisk({ cases }) {
  return (
    <Card title="Upcoming hearings · high risk" subtitle="HIGH-risk cases with a scheduled hearing" bodyClassName="p-0">
      {!cases?.length ? <EmptyState icon={CalendarDays} title="None scheduled" message="No upcoming hearings for HIGH-risk cases." /> : (
        <ul className="divide-y divide-ink-100">
          {cases.map((c) => {
            const d = daysUntil(c.nextHearingDate);
            return (
              <li key={c._id}>
                <Link to={`/cases/${c._id}/prediction`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-ink-50/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{c.title}</p>
                    <p className="text-xs text-ink-500">{c.caseNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-risk-high">{d === 0 ? 'Today' : `in ${d} d`}</p>
                    <p className="text-xs text-ink-500">{formatDate(c.nextHearingDate)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
