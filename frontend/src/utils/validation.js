import { CASE_TYPES, COURTS, PRIORITIES, STAGES, STATUSES } from '../constants';

const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const today = () => new Date().toISOString().slice(0, 10);

/** Client-side validation mirroring backend Zod rules. Returns { field: message }. */
export function validateCase(v) {
  const e = {};
  const req = (k, label, min = 1) => {
    const s = String(v[k] ?? '').trim();
    if (!s) e[k] = `${label} is required`;
    else if (s.length < min) e[k] = `${label} must be at least ${min} characters`;
  };
  req('caseNumber', 'Case number', 3);
  if (!e.caseNumber && !/^[A-Za-z0-9/_.\- ]+$/.test(v.caseNumber)) e.caseNumber = 'Only letters, digits, / _ . - allowed';
  req('title', 'Case title', 3);
  req('state', 'State', 2);
  req('petitioner', 'Petitioner', 2);
  req('respondent', 'Respondent', 2);
  if (!COURTS.includes(v.court)) e.court = 'Select a court';
  if (!CASE_TYPES.includes(v.caseType)) e.caseType = 'Select a case type';
  if (!STAGES.includes(v.currentStage)) e.currentStage = 'Select the current stage';
  if (!STATUSES.includes(v.status)) e.status = 'Select a status';
  if (!PRIORITIES.includes(v.priority)) e.priority = 'Select a priority';

  ['numberOfHearings', 'numberOfAdjournments'].forEach((k) => {
    const label = k === 'numberOfHearings' ? 'Number of hearings' : 'Number of adjournments';
    if (v[k] === '' || v[k] == null) e[k] = `${label} is required`;
    else if (!/^\d+$/.test(String(v[k]))) e[k] = `${label} must be a whole number ≥ 0`;
    else if (Number(v[k]) > 5000) e[k] = `${label} looks unrealistic`;
  });
  if (!e.numberOfAdjournments && !e.numberOfHearings && Number(v.numberOfAdjournments) > Number(v.numberOfHearings)) {
    e.numberOfAdjournments = 'Adjournments cannot exceed hearings';
  }

  if (!v.filingDate) e.filingDate = 'Filing date is required';
  else if (!isDate(v.filingDate)) e.filingDate = 'Enter a valid date';
  else if (v.filingDate > today()) e.filingDate = 'Filing date cannot be in the future';

  if (v.lastHearingDate) {
    if (!isDate(v.lastHearingDate)) e.lastHearingDate = 'Enter a valid date';
    else if (v.lastHearingDate > today()) e.lastHearingDate = 'Cannot be in the future';
    else if (v.filingDate && v.lastHearingDate < v.filingDate) e.lastHearingDate = 'Cannot be before filing date';
  }
  if (v.nextHearingDate) {
    if (!isDate(v.nextHearingDate)) e.nextHearingDate = 'Enter a valid date';
    else if (v.lastHearingDate && v.nextHearingDate < v.lastHearingDate) e.nextHearingDate = 'Must be after last hearing';
    else if (v.filingDate && v.nextHearingDate < v.filingDate) e.nextHearingDate = 'Cannot be before filing date';
  }
  if ((v.description || '').length > 5000) e.description = 'Description must be at most 5000 characters';
  return e;
}

/** Maps backend validation details [{field,message}] onto form errors. */
export function mapServerErrors(details) {
  if (!Array.isArray(details)) return {};
  return details.reduce((acc, d) => (d.field && !acc[d.field] ? { ...acc, [d.field]: d.message } : acc), {});
}
