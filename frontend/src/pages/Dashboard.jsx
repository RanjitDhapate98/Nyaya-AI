import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary } from '../components/common/Feedback';
import { Disclaimer, PageHeader } from '../components/common/UI';
import AnalyticsFilters, { EMPTY_ANALYTICS_FILTERS } from '../components/dashboard/AnalyticsFilters';
import KpiGrid from '../components/dashboard/KpiGrid';
import { RecentCases, UpcomingHighRisk } from '../components/dashboard/RecentCases';
import { AreaChartCard, BarChartCard, DonutChart } from '../components/charts/Charts';
import { useAuth } from '../context/AuthContext';
import { SYNTHETIC_DATA_NOTE } from '../constants';

export default function Dashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(EMPTY_ANALYTICS_FILTERS);
  const { data, loading, error, refetch } = useAsync(() => analyticsService.summary(filters), [JSON.stringify(filters)]);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome, ${user?.name?.split(' ')[0] || ''}`}
        subtitle="Live delay-risk indicators across all registered cases."
        actions={<Link to="/analytics" className="btn-secondary"><BarChart3 className="h-4 w-4" /> Full analytics</Link>}
      />
      <AnalyticsFilters value={filters} onChange={setFilters} />
      <AsyncBoundary loading={loading && !data} error={error} onRetry={refetch}>
        {data && (
          <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <KpiGrid kpis={data.kpis} />
            <div className="grid gap-6 lg:grid-cols-2">
              <DonutChart title="Cases by risk" subtitle="Latest model classification per case" data={data.byRisk} risk />
              <BarChartCard title="Cases by type" data={data.byType} />
            </div>
            <AreaChartCard
              title="Delay trend by filing month"
              subtitle="Cases filed and HIGH-risk cases per month"
              data={data.delayTrend}
              xKey="month"
              areas={[{ key: 'cases', name: 'Cases filed', color: '#56658a' }, { key: 'highRisk', name: 'HIGH risk', color: '#b42318' }]}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <RecentCases cases={data.recentCases} />
              <UpcomingHighRisk cases={data.upcomingHighRisk} />
            </div>
            <Disclaimer tone="info">{SYNTHETIC_DATA_NOTE} Risk figures are model estimates for decision support, not legal determinations.</Disclaimer>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}
