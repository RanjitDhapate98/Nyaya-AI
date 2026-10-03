export const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const formatNumber = (n, digits = 0) => (n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: digits }));

export const formatPercent = (p, digits = 0) => (p == null ? '—' : `${(p * 100).toFixed(digits)}%`);

export const formatDays = (d) => {
  if (d == null) return '—';
  if (d >= 365) return `${formatNumber(d)} days (~${(d / 365).toFixed(1)} yrs)`;
  return `${formatNumber(d)} days`;
};

export const daysUntil = (d) => (d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null);

export const formatFeatureValue = (feature, value) => {
  if (value == null) return 'n/a';
  if (typeof value !== 'number') return String(value);
  if (feature === 'adjournmentRatio') return `${Math.round(value * 100)}%`;
  if (feature === 'hearingsPerYear') return `${value.toFixed(1)}/yr`;
  if (/Days|Hearing$/.test(feature) && feature !== 'numberOfHearings') return `${Math.round(value)} d`;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};
