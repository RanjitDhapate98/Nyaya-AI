import { RotateCcw } from 'lucide-react';
import { CASE_TYPES, COURTS } from '../../constants';

export const EMPTY_ANALYTICS_FILTERS = { from: '', to: '', caseType: '', riskLevel: '', court: '' };

export default function AnalyticsFilters({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const active = Object.values(value).some(Boolean);
  return (
    <div className="card mb-6 grid grid-cols-2 gap-3 p-4 md:grid-cols-6">
      <div>
        <label className="label" htmlFor="af-from">Filed from</label>
        <input id="af-from" type="date" className="input" value={value.from} onChange={set('from')} max={value.to || undefined} />
      </div>
      <div>
        <label className="label" htmlFor="af-to">Filed to</label>
        <input id="af-to" type="date" className="input" value={value.to} onChange={set('to')} min={value.from || undefined} />
      </div>
      <div>
        <label className="label" htmlFor="af-type">Case type</label>
        <select id="af-type" className="input" value={value.caseType} onChange={set('caseType')}>
          <option value="">All types</option>
          {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="af-risk">Risk</label>
        <select id="af-risk" className="input" value={value.riskLevel} onChange={set('riskLevel')}>
          <option value="">All risk levels</option>
          {['HIGH', 'MEDIUM', 'LOW', 'UNASSESSED'].map((t) => <option key={t} value={t}>{t === 'UNASSESSED' ? 'Not assessed' : t}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="af-court">Court</label>
        <select id="af-court" className="input" value={value.court} onChange={set('court')}>
          <option value="">All courts</option>
          {COURTS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex items-end">
        <button type="button" className="btn-secondary w-full" disabled={!active} onClick={() => onChange(EMPTY_ANALYTICS_FILTERS)}>
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );
}
