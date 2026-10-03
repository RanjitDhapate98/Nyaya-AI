import { useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary } from '../components/common/Feedback';
import { Disclaimer, PageHeader } from '../components/common/UI';
import AnalyticsFilters, { EMPTY_ANALYTICS_FILTERS } from '../components/dashboard/AnalyticsFilters';
import KpiGrid from '../components/dashboard/KpiGrid';
import { AreaChartCard, BarChartCard, DonutChart, LineChartCard, StackedRiskBar } from '../components/charts/Charts';
import { SYNTHETIC_DATA_NOTE } from '../constants';

export default function Analytics() {
  const [filters, setFilters] = useState(EMPTY_ANALYTICS_FILTERS);
  const summary = useAsync(() => analyticsService.summary(filters), [JSON.stringify(filters)]);
  const trend = useAsync(() => analyticsService.predictionTrend(), []);
  const d = summary.data;

  return (
    <>
      <PageHeader eyebrow="Insights" title="Analytics" subtitle="All figures are computed live from the database for the selected filters." />
      <AnalyticsFilters value={filters} onChange={setFilters} />
      <AsyncBoundary loading={summary.loading && !d} error={summary.error} onRetry={summary.refetch}>
        {d && (
          <div className={`space-y-6 ${summary.loading ? 'opacity-60' : ''}`}>
            <KpiGrid kpis={d.kpis} />
            <div className="grid gap-6 lg:grid-cols-2">
              <DonutChart title="Cases by risk" data={d.byRisk} risk />
              <DonutChart title="Cases by status" data={d.byStatus} />
            </div>
            <StackedRiskBar title="Risk distribution by case type" subtitle="Latest classification per case" data={d.riskByType} height={320} />
            <div className="grid gap-6 lg:grid-cols-2">
              <BarChartCard title="Cases by court" data={d.byCourt} horizontal />
              <BarChartCard title="Cases by stage" data={d.byStage} color="#56658a" />
            </div>
            <LineChartCard
              title="Delay trends"
              subtitle="Average model-estimated delay (days) and adjournments by filing month"
              data={d.delayTrend}
              xKey="month"
              lines={[{ key: 'avgPredictedDelayDays', name: 'Avg. est. delay (days)', color: '#b42318' }, { key: 'avgAdjournments', name: 'Avg. adjournments (right axis)', color: '#b8892b', axis: 'right' }]}
              height={300}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <AreaChartCard
                title="Predictions over time"
                subtitle="Prediction runs per month by risk level"
                data={trend.data?.trend || []}
                xKey="month"
                stacked
                areas={[{ key: 'HIGH', name: 'High', color: '#b42318' }, { key: 'MEDIUM', name: 'Medium', color: '#b54708' }, { key: 'LOW', name: 'Low', color: '#067647' }]}
              />
              <BarChartCard title="Top states" data={d.byState} horizontal color="#232b40" />
            </div>
            <Disclaimer tone="info">{SYNTHETIC_DATA_NOTE} Analytics describe model outputs and recorded data; they are not judicial performance assessments.</Disclaimer>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}
