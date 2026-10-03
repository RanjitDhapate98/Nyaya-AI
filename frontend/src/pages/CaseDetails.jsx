import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Brain, Pencil, Trash2, Waypoints } from 'lucide-react';
import { caseService } from '../services/caseService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary } from '../components/common/Feedback';
import { Card, DefinitionList, Disclaimer, PageHeader, RiskBadge, Tag } from '../components/common/UI';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { daysUntil, formatDate, formatDateTime, formatDays, formatPercent } from '../utils/format';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canEdit } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data, loading, error, refetch } = useAsync(() => caseService.get(id), [id]);
  const c = data?.case;
  const canModify = c && (user.role === 'admin' || (user.role === 'analyst' && c.createdBy?._id === user._id));

  const remove = async () => {
    setDeleting(true);
    try {
      await caseService.remove(id);
      toast.success('Case deleted');
      navigate('/cases', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  };

  const next = daysUntil(c?.nextHearingDate);
  return (
    <AsyncBoundary loading={loading} error={error} onRetry={refetch}>
      {c && (
        <>
          <Link to="/cases" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" /> All cases</Link>
          <PageHeader
            eyebrow={c.caseNumber}
            title={c.title}
            subtitle={`${c.caseType} · ${c.court} · ${c.district ? `${c.district}, ` : ''}${c.state}`}
            actions={(
              <>
                <Link to={`/cases/${id}/prediction`} className="btn-primary"><Brain className="h-4 w-4" /> AI prediction</Link>
                <Link to={`/cases/${id}/similar`} className="btn-secondary"><Waypoints className="h-4 w-4" /> Similar cases</Link>
                {canModify && <Link to={`/cases/${id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> Edit</Link>}
                {canModify && <button type="button" className="btn-secondary text-risk-high" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Delete</button>}
              </>
            )}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card title="Case information">
                <DefinitionList items={[
                  { label: 'Case type', value: c.caseType },
                  { label: 'Court', value: c.court },
                  { label: 'Judge', value: c.judge || '—' },
                  { label: 'State', value: c.state },
                  { label: 'District', value: c.district || '—' },
                  { label: 'Priority', value: c.priority },
                  { label: 'Petitioner', value: c.petitioner },
                  { label: 'Respondent', value: c.respondent },
                  { label: 'Status', value: c.status },
                ]} />
              </Card>
              <Card title="Proceedings">
                <DefinitionList items={[
                  { label: 'Filing date', value: formatDate(c.filingDate) },
                  { label: 'Case age', value: formatDays(c.caseAgeDays) },
                  { label: 'Current stage', value: c.currentStage },
                  { label: 'Hearings', value: c.numberOfHearings },
                  { label: 'Adjournments', value: `${c.numberOfAdjournments}${c.numberOfHearings ? ` (${Math.round((c.numberOfAdjournments / c.numberOfHearings) * 100)}%)` : ''}` },
                  { label: 'Last hearing', value: formatDate(c.lastHearingDate) },
                  { label: 'Next hearing', value: c.nextHearingDate ? `${formatDate(c.nextHearingDate)}${next != null ? ` (${next >= 0 ? `in ${next} d` : `${-next} d ago`})` : ''}` : '—' },
                ]} />
              </Card>
              <Card title="Legal details">
                <p className="label">Legal sections</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {c.legalSections?.length ? c.legalSections.map((s) => <Tag key={s}>{s}</Tag>) : <span className="text-sm text-ink-500">None recorded</span>}
                </div>
                <p className="label">Description</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-800">{c.description || 'No description provided.'}</p>
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Delay risk" subtitle="Latest model prediction">
                {c.riskLevel ? (
                  <div className="space-y-3">
                    <RiskBadge level={c.riskLevel} size="lg" />
                    <DefinitionList items={[
                      { label: 'Model confidence', value: formatPercent(c.riskProbability, 1) },
                      { label: 'Est. delay', value: formatDays(c.predictedDelayDays) },
                      { label: 'Predicted at', value: formatDateTime(c.lastPredictedAt) },
                    ]} />
                    {new Date(c.updatedAt) - new Date(c.lastPredictedAt) > 5000 && (
                      <Disclaimer>Case was edited after the last prediction. Re-run it for an up-to-date estimate.</Disclaimer>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-ink-600">
                    <p>This case has not been assessed yet.</p>
                    {canEdit && <Link to={`/cases/${id}/prediction`} className="btn-accent w-full"><Brain className="h-4 w-4" /> Run prediction</Link>}
                  </div>
                )}
              </Card>
              <Card title="Record">
                <DefinitionList items={[
                  { label: 'Created by', value: c.createdBy?.name || '—' },
                  { label: 'Created', value: formatDateTime(c.createdAt) },
                  { label: 'Updated', value: formatDateTime(c.updatedAt) },
                ]} />
                {c.isSample && <div className="mt-4"><Disclaimer tone="info">Synthetic sample record for development/testing.</Disclaimer></div>}
              </Card>
            </div>
          </div>

          <ConfirmDialog open={confirm} title="Delete case?" message="This permanently removes the case and all related predictions and recommendations."
            confirmLabel="Delete" busy={deleting} onCancel={() => setConfirm(false)} onConfirm={remove} />
        </>
      )}
    </AsyncBoundary>
  );
}
