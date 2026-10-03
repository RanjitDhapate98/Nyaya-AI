import { Link } from 'react-router-dom';
import { Brain, Eye, Pencil, Trash2 } from 'lucide-react';
import { RiskBadge, Tag } from '../common/UI';
import { formatDate, formatPercent } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function CaseTable({ cases, onDelete }) {
  const { user } = useAuth();
  const canModify = (c) => user.role === 'admin' || (user.role === 'analyst' && (c.createdBy?._id || c.createdBy) === user._id);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-ink-100">
        <thead className="bg-ink-50/70">
          <tr>
            <th className="table-th">Case</th>
            <th className="table-th">Type / Court</th>
            <th className="table-th">Stage · Status</th>
            <th className="table-th">Filed</th>
            <th className="table-th text-center">Adj./Hearings</th>
            <th className="table-th">Risk</th>
            <th className="table-th text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 bg-white">
          {cases.map((c) => (
            <tr key={c._id} className="hover:bg-ink-50/50">
              <td className="table-td max-w-[280px]">
                <Link to={`/cases/${c._id}`} className="block truncate font-medium text-ink-900 hover:text-brass-600">{c.title}</Link>
                <span className="text-xs text-ink-500">{c.caseNumber}{c.isSample && <span className="ml-1.5"><Tag>synthetic</Tag></span>}</span>
              </td>
              <td className="table-td">
                <p>{c.caseType}</p>
                <p className="text-xs text-ink-500">{c.court} · {c.state}</p>
              </td>
              <td className="table-td">
                <p>{c.currentStage}</p>
                <p className="text-xs text-ink-500">{c.status} · {c.priority} priority</p>
              </td>
              <td className="table-td whitespace-nowrap">
                <p>{formatDate(c.filingDate)}</p>
                <p className="text-xs text-ink-500">{c.caseAgeDays} days old</p>
              </td>
              <td className="table-td text-center">{c.numberOfAdjournments} / {c.numberOfHearings}</td>
              <td className="table-td">
                <RiskBadge level={c.riskLevel} />
                {c.riskProbability != null && <p className="mt-1 text-xs text-ink-500">{formatPercent(c.riskProbability)} conf.</p>}
              </td>
              <td className="table-td">
                <div className="flex justify-end gap-1">
                  <Link to={`/cases/${c._id}`} className="btn-ghost p-2" title="View"><Eye className="h-4 w-4" /></Link>
                  <Link to={`/cases/${c._id}/prediction`} className="btn-ghost p-2" title="AI prediction"><Brain className="h-4 w-4" /></Link>
                  {canModify(c) && (
                    <>
                      <Link to={`/cases/${c._id}/edit`} className="btn-ghost p-2" title="Edit"><Pencil className="h-4 w-4" /></Link>
                      <button type="button" className="btn-ghost p-2 text-risk-high hover:bg-red-50" title="Delete" onClick={() => onDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
