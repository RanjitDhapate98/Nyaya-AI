import toast from 'react-hot-toast';
import { Activity, CheckCircle2, Cpu, Users, XCircle } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { predictionService } from '../services/predictionService';
import { authService } from '../services/authService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary } from '../components/common/Feedback';
import { Card, DefinitionList, Disclaimer, PageHeader, Tag } from '../components/common/UI';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatPercent } from '../utils/format';

function Status({ ok, label }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return <span className={`inline-flex items-center gap-1.5 text-sm ${ok ? 'text-risk-low' : 'text-risk-high'}`}><Icon className="h-4 w-4" />{label}</span>;
}

function ModelInfo() {
  const { data, loading, error, refetch } = useAsync(() => predictionService.modelInfo(), []);
  const m = data?.metadata?.metrics;
  return (
    <Card title="Model information" subtitle="Metrics produced by training/train.py on the held-out test split" actions={<Cpu className="h-4 w-4 text-ink-400" />}>
      <AsyncBoundary loading={loading} error={error} onRetry={refetch}>
        {data && (
          <div className="space-y-5">
            <DefinitionList items={[
              { label: 'Model version', value: data.modelVersion },
              { label: 'Model type', value: data.modelType },
              { label: 'Trained at', value: formatDateTime(data.metadata?.trainedAt) },
              { label: 'Training rows', value: `${data.metadata?.trainRows} train / ${data.metadata?.testRows} test` },
              { label: 'Accuracy', value: formatPercent(m?.accuracy, 1) },
              { label: 'Macro F1', value: m?.f1_macro?.toFixed(3) },
              { label: 'Macro precision', value: m?.precision_macro?.toFixed(3) },
              { label: 'Macro recall', value: m?.recall_macro?.toFixed(3) },
              { label: 'Delay MAE', value: m?.regression ? `${m.regression.mae_days} days` : '—' },
            ]} />
            {m?.confusion_matrix && (
              <div>
                <p className="label">Confusion matrix (rows = actual, cols = predicted)</p>
                <table className="text-sm">
                  <thead><tr><th className="px-3 py-1" />{m.labels.map((l) => <th key={l} className="px-3 py-1 text-xs text-ink-500">{l}</th>)}</tr></thead>
                  <tbody>
                    {m.confusion_matrix.map((row, i) => (
                      <tr key={m.labels[i]}>
                        <th className="px-3 py-1 text-left text-xs text-ink-500">{m.labels[i]}</th>
                        {row.map((v, j) => <td key={j} className={`px-3 py-1 text-center tabular-nums ${i === j ? 'bg-ink-50 font-semibold' : ''}`}>{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data.metadata?.datasetIsSynthetic && <Disclaimer tone="info">These metrics come from synthetic sample data and do not reflect real-world judicial performance.</Disclaimer>}
          </div>
        )}
      </AsyncBoundary>
    </Card>
  );
}

function UserAdmin() {
  const { user } = useAuth();
  const { data, loading, error, refetch, setData } = useAsync(() => authService.listUsers(), []);
  const change = async (u, role) => {
    try {
      const { user: updated } = await authService.updateRole(u._id, role);
      setData({ ...data, users: data.users.map((x) => (x._id === updated._id ? updated : x)) });
      toast.success(`${updated.name} is now ${role}`);
    } catch (err) { toast.error(err.message); }
  };
  return (
    <Card title="Users & roles" subtitle="Admin only" actions={<Users className="h-4 w-4 text-ink-400" />} bodyClassName="p-0">
      <AsyncBoundary loading={loading} error={error} onRetry={refetch}>
        <ul className="divide-y divide-ink-100">
          {data?.users?.map((u) => (
            <li key={u._id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-ink-500">{u.email}</p>
              </div>
              <select className="input w-32" value={u.role} disabled={u._id === user._id} onChange={(e) => change(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                {['admin', 'analyst', 'viewer'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </li>
          ))}
        </ul>
      </AsyncBoundary>
    </Card>
  );
}

export default function Settings() {
  const { user, hasRole } = useAuth();
  const health = useAsync(() => analyticsService.health(), []);
  const h = health.data?.data;
  return (
    <>
      <PageHeader eyebrow="Settings" title="System & account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Your account">
          <DefinitionList items={[
            { label: 'Name', value: user.name },
            { label: 'Email', value: user.email },
            { label: 'Role', value: <Tag tone="brass">{user.role}</Tag> },
            { label: 'Member since', value: formatDateTime(user.createdAt) },
          ]} />
        </Card>
        <Card title="System health" actions={<button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={health.refetch}><Activity className="h-3.5 w-3.5" /> Refresh</button>}>
          <AsyncBoundary loading={health.loading} error={health.error} onRetry={health.refetch}>
            {h && (
              <DefinitionList items={[
                { label: 'API', value: <Status ok label="Online" /> },
                { label: 'Database', value: <Status ok={h.database === 'connected'} label={h.database} /> },
                { label: 'ML service', value: <Status ok={h.mlService?.reachable && h.mlService?.modelLoaded} label={h.mlService?.reachable ? `${h.mlService.status} · ${h.mlService.modelVersion}` : 'Unreachable'} /> },
                { label: 'Historical corpus', value: h.mlService?.historicalCases != null ? `${h.mlService.historicalCases} synthetic cases` : '—' },
                { label: 'Gemini', value: h.gemini },
                { label: 'API uptime', value: `${Math.round(h.uptimeSeconds / 60)} min` },
              ]} />
            )}
          </AsyncBoundary>
        </Card>
        <div className="lg:col-span-2"><ModelInfo /></div>
        {hasRole('admin') && <div className="lg:col-span-2"><UserAdmin /></div>}
      </div>
    </>
  );
}
