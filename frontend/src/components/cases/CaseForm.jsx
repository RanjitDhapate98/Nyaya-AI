import { useState } from 'react';
import { Save } from 'lucide-react';
import { CASE_TYPES, COURTS, PRIORITIES, STAGES, STATES, STATUSES } from '../../constants';
import { SelectInput, TextArea, TextInput } from '../common/FormField';
import { Spinner } from '../common/Feedback';
import { validateCase } from '../../utils/validation';
import { toInputDate } from '../../utils/format';

export const EMPTY_CASE = {
  caseNumber: '', title: '', court: '', state: '', district: '', caseType: '', filingDate: '',
  currentStage: '', status: 'Pending', priority: 'Normal', petitioner: '', respondent: '', judge: '',
  numberOfHearings: '0', numberOfAdjournments: '0', lastHearingDate: '', nextHearingDate: '',
  legalSections: '', description: '',
};

export const caseToForm = (c) => ({
  ...EMPTY_CASE,
  ...Object.fromEntries(Object.keys(EMPTY_CASE).map((k) => [k, c[k] ?? EMPTY_CASE[k]])),
  filingDate: toInputDate(c.filingDate),
  lastHearingDate: toInputDate(c.lastHearingDate),
  nextHearingDate: toInputDate(c.nextHearingDate),
  numberOfHearings: String(c.numberOfHearings ?? 0),
  numberOfAdjournments: String(c.numberOfAdjournments ?? 0),
  legalSections: (c.legalSections || []).join('; '),
});

export const formToPayload = (v) => ({
  ...v,
  caseNumber: v.caseNumber.trim(),
  numberOfHearings: Number(v.numberOfHearings),
  numberOfAdjournments: Number(v.numberOfAdjournments),
  lastHearingDate: v.lastHearingDate || undefined,
  nextHearingDate: v.nextHearingDate || undefined,
  legalSections: v.legalSections.split(/[;\n]/).map((s) => s.trim()).filter(Boolean),
});

function Section({ title, children }) {
  return (
    <fieldset className="card p-5">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-4 text-base font-semibold text-ink-900">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  );
}

export default function CaseForm({ initial = EMPTY_CASE, onSubmit, submitting, serverErrors = {}, submitLabel = 'Save case' }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const allErrors = { ...serverErrors, ...errors };
  const today = new Date().toISOString().slice(0, 10);

  const onChange = (e) => {
    const next = { ...values, [e.target.name]: e.target.value };
    setValues(next);
    if (touched) setErrors(validateCase(next));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validateCase(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = document.querySelector(`[name="${Object.keys(errs)[0]}"]`);
      first?.focus();
      return;
    }
    onSubmit(formToPayload(values));
  };

  const f = (name) => ({ name, value: values[name], onChange, error: allErrors[name] });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Section title="Case identification">
        <TextInput label="Case number" required placeholder="e.g. CIV/2024/00123" maxLength={60} {...f('caseNumber')} />
        <div className="md:col-span-2"><TextInput label="Case title" required placeholder="Petitioner v. Respondent" maxLength={250} {...f('title')} /></div>
        <SelectInput label="Case type" required options={CASE_TYPES} {...f('caseType')} />
        <SelectInput label="Court" required options={COURTS} {...f('court')} />
        <TextInput label="Judge" placeholder="Presiding judge / bench" maxLength={120} {...f('judge')} />
        <SelectInput label="State" required options={values.state && !STATES.includes(values.state) ? [values.state, ...STATES] : STATES} {...f('state')} />
        <TextInput label="District" maxLength={60} {...f('district')} />
      </Section>

      <Section title="Parties">
        <TextInput label="Petitioner" required maxLength={200} {...f('petitioner')} />
        <TextInput label="Respondent" required maxLength={200} {...f('respondent')} />
      </Section>

      <Section title="Proceedings">
        <TextInput label="Filing date" required type="date" max={today} {...f('filingDate')} />
        <SelectInput label="Current stage" required options={STAGES} {...f('currentStage')} />
        <SelectInput label="Status" required options={STATUSES} {...f('status')} />
        <SelectInput label="Priority" required options={PRIORITIES} {...f('priority')} />
        <TextInput label="Number of hearings" required type="number" min={0} step={1} inputMode="numeric" {...f('numberOfHearings')} />
        <TextInput label="Number of adjournments" required type="number" min={0} step={1} inputMode="numeric" {...f('numberOfAdjournments')} />
        <TextInput label="Last hearing date" type="date" max={today} min={values.filingDate || undefined} {...f('lastHearingDate')} />
        <TextInput label="Next hearing date" type="date" min={values.lastHearingDate || values.filingDate || undefined} {...f('nextHearingDate')} />
      </Section>

      <Section title="Legal details">
        <div className="md:col-span-2 lg:col-span-3">
          <TextInput label="Legal sections" placeholder="e.g. IPC 420; CrPC 439" hint="Separate multiple sections with semicolons" {...f('legalSections')} />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <TextArea label="Case description" rows={5} maxLength={5000} placeholder="Brief factual summary used for similar-case retrieval" hint={`${values.description.length}/5000 characters`} {...f('description')} />
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}
