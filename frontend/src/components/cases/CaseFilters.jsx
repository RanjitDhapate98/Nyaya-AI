import { RotateCcw, Search } from 'lucide-react';
import { CASE_TYPES, COURTS, PRIORITIES, STATES, STATUSES } from '../../constants';

export const EMPTY_CASE_FILTERS = {
  search: '', riskLevel: '', caseType: '', court: '', state: '', status: '', priority: '', from: '', to: '',
  sortBy: 'createdAt', sortOrder: 'desc',
};

const SORTS = [
  ['createdAt', 'Date added'], ['filingDate', 'Filing date'], ['caseNumber', 'Case number'],
  ['numberOfAdjournments', 'Adjournments'], ['riskProbability', 'Risk confidence'], ['predictedDelayDays', 'Est. delay'],
  ['nextHearingDate', 'Next hearing'],
];

function Select({ id, label, value, onChange, options, all }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value} onChange={onChange}>
        <option value="">{all}</option>
        {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}
      </select>
    </div>
  );
}

export default function CaseFilters({ value, onChange }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <div className="card mb-4 space-y-3 p-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Search by case number, title, party, judge or district…"
            value={value.search}
            onChange={set('search')}
            aria-label="Search cases"
          />
        </div>
        <div className="flex gap-2">
          <select className="input w-44" value={value.sortBy} onChange={set('sortBy')} aria-label="Sort by">
            {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
          </select>
          <select className="input w-32" value={value.sortOrder} onChange={set('sortOrder')} aria-label="Sort order">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <button type="button" className="btn-secondary" onClick={() => onChange(EMPTY_CASE_FILTERS)} title="Reset filters">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Select id="f-risk" label="Risk" value={value.riskLevel} onChange={set('riskLevel')} all="All" options={[['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low'], ['UNASSESSED', 'Not assessed']]} />
        <Select id="f-type" label="Case type" value={value.caseType} onChange={set('caseType')} all="All" options={CASE_TYPES} />
        <Select id="f-court" label="Court" value={value.court} onChange={set('court')} all="All" options={COURTS} />
        <Select id="f-state" label="State" value={value.state} onChange={set('state')} all="All" options={STATES} />
        <Select id="f-status" label="Status" value={value.status} onChange={set('status')} all="All" options={STATUSES} />
        <Select id="f-priority" label="Priority" value={value.priority} onChange={set('priority')} all="All" options={PRIORITIES} />
        <div>
          <label className="label" htmlFor="f-from">Filed from</label>
          <input id="f-from" type="date" className="input" value={value.from} onChange={set('from')} />
        </div>
        <div>
          <label className="label" htmlFor="f-to">Filed to</label>
          <input id="f-to" type="date" className="input" value={value.to} onChange={set('to')} />
        </div>
      </div>
    </div>
  );
}
