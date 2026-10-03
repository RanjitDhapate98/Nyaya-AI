import { Info, ShieldAlert } from 'lucide-react';
import { RISK_COLORS } from '../../constants';

export function Card({ title, subtitle, actions, children, className = '', bodyClassName = 'p-5' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-ink-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-ink-950 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function RiskBadge({ level, size = 'sm' }) {
  const key = level || 'UNASSESSED';
  const color = RISK_COLORS[key];
  const pad = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{ color, backgroundColor: `${color}14`, border: `1px solid ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {level ? `${level}` : 'Not assessed'}
    </span>
  );
}

const TONES = {
  neutral: 'bg-ink-50 text-ink-700 border-ink-200',
  brass: 'bg-brass-50 text-brass-700 border-brass-100',
  High: 'bg-red-50 text-red-800 border-red-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export function Tag({ children, tone = 'neutral' }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TONES[tone] || TONES.neutral}`}>{children}</span>;
}

export function Disclaimer({ children, tone = 'warning' }) {
  const Icon = tone === 'warning' ? ShieldAlert : Info;
  const cls = tone === 'warning' ? 'border-brass-300/60 bg-brass-50 text-brass-700' : 'border-ink-200 bg-ink-50 text-ink-600';
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs leading-relaxed ${cls}`} role="note">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, accent = '#232b40' }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-ink-950">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </div>
        {Icon && <div className="rounded-lg p-2" style={{ backgroundColor: `${accent}12` }}><Icon className="h-5 w-5" style={{ color: accent }} /></div>}
      </div>
    </div>
  );
}

export function DefinitionList({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
          <dd className="mt-1 text-sm text-ink-900">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
