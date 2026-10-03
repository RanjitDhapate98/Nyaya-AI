import { AlertOctagon, CalendarClock, FolderOpen, Gauge, ShieldCheck, Timer } from 'lucide-react';
import { StatCard } from '../common/UI';
import { formatNumber } from '../../utils/format';
import { RISK_COLORS } from '../../constants';

export default function KpiGrid({ kpis }) {
  const pct = (n) => (kpis.totalCases ? `${Math.round((n / kpis.totalCases) * 100)}% of cases` : '');
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Total cases" value={formatNumber(kpis.totalCases)} hint={`${formatNumber(kpis.pendingCases)} pending · ${formatNumber(kpis.unassessed)} not yet assessed`} icon={FolderOpen} />
      <StatCard label="High risk" value={formatNumber(kpis.highRisk)} hint={pct(kpis.highRisk)} icon={AlertOctagon} accent={RISK_COLORS.HIGH} />
      <StatCard label="Medium risk" value={formatNumber(kpis.mediumRisk)} hint={pct(kpis.mediumRisk)} icon={Gauge} accent={RISK_COLORS.MEDIUM} />
      <StatCard label="Low risk" value={formatNumber(kpis.lowRisk)} hint={pct(kpis.lowRisk)} icon={ShieldCheck} accent={RISK_COLORS.LOW} />
      <StatCard label="Average case age" value={kpis.avgCaseAgeDays != null ? `${formatNumber(kpis.avgCaseAgeDays)} d` : '—'} hint={kpis.avgCaseAgeDays ? `≈ ${(kpis.avgCaseAgeDays / 365).toFixed(1)} years since filing` : ''} icon={CalendarClock} accent="#b8892b" />
      <StatCard label="Average adjournments" value={formatNumber(kpis.avgAdjournments, 1)} hint={`Avg. hearings ${formatNumber(kpis.avgHearings, 1)} · Avg. est. delay ${kpis.avgPredictedDelayDays != null ? `${formatNumber(kpis.avgPredictedDelayDays)} d` : '—'}`} icon={Timer} accent="#56658a" />
    </div>
  );
}
