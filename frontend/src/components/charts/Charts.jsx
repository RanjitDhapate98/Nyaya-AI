import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { CHART_COLORS, RISK_COLORS } from '../../constants';
import { Card } from '../common/UI';
import { EmptyState } from '../common/Feedback';

const axis = { fontSize: 12, fill: '#56658a' };
const tooltipStyle = { contentStyle: { borderRadius: 10, border: '1px solid #e9ecf2', fontSize: 12 } };

function ChartCard({ title, subtitle, height = 280, empty, children }) {
  return (
    <Card title={title} subtitle={subtitle} bodyClassName="p-4">
      {empty ? <EmptyState title="No data" message="No records match the current filters." /> : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

const colorFor = (name, i, useRisk) => (useRisk && RISK_COLORS[name]) || CHART_COLORS[i % CHART_COLORS.length];

export function DonutChart({ title, subtitle, data, risk = false, height }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={!total}>
      <PieChart>
        <Pie data={data.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none">
          {data.filter((d) => d.value > 0).map((d, i) => <Cell key={d.name} fill={colorFor(d.name, i, risk)} />)}
        </Pie>
        <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v} (${((v / total) * 100).toFixed(0)}%)`, n]} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ChartCard>
  );
}

export function BarChartCard({ title, subtitle, data, dataKey = 'value', nameKey = 'name', horizontal = false, risk = false, height, color }) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={!data?.length}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 24 : 0, right: 12, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecf2" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={axis} allowDecimals={false} />
            <YAxis type="category" dataKey={nameKey} tick={axis} width={110} />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} tick={axis} interval={0} angle={data.length > 5 ? -25 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 60 : 30} />
            <YAxis tick={axis} allowDecimals={false} />
          </>
        )}
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f5f6f9' }} />
        <Bar dataKey={dataKey} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={42}>
          {data.map((d, i) => <Cell key={d[nameKey]} fill={color || colorFor(d[nameKey], i, risk)} />)}
        </Bar>
      </BarChart>
    </ChartCard>
  );
}

export function StackedRiskBar({ title, subtitle, data, height }) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={!data?.length}>
      <BarChart data={data} margin={{ top: 8, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecf2" vertical={false} />
        <XAxis dataKey="name" tick={axis} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tick={axis} allowDecimals={false} />
        <Tooltip {...tooltipStyle} cursor={{ fill: '#f5f6f9' }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {['HIGH', 'MEDIUM', 'LOW', 'UNASSESSED'].map((k) => <Bar key={k} dataKey={k} stackId="r" fill={RISK_COLORS[k]} maxBarSize={42} />)}
      </BarChart>
    </ChartCard>
  );
}

export function LineChartCard({ title, subtitle, data, xKey, lines, height }) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={!data?.length}>
      <LineChart data={data} margin={{ top: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecf2" />
        <XAxis dataKey={xKey} tick={axis} minTickGap={20} />
        <YAxis yAxisId="left" tick={axis} />
        {lines.some((l) => l.axis === 'right') && <YAxis yAxisId="right" orientation="right" tick={axis} />}
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l, i) => (
          <Line key={l.key} yAxisId={l.axis === 'right' ? 'right' : 'left'} type="monotone" dataKey={l.key} name={l.name} stroke={l.color || CHART_COLORS[i]} strokeWidth={2} dot={false} connectNulls />
        ))}
      </LineChart>
    </ChartCard>
  );
}

export function AreaChartCard({ title, subtitle, data, xKey, areas, height, stacked = false }) {
  return (
    <ChartCard title={title} subtitle={subtitle} height={height} empty={!data?.length}>
      <AreaChart data={data} margin={{ top: 8, right: 16 }}>
        <defs>
          {areas.map((a, i) => (
            <linearGradient key={a.key} id={`grad-${a.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={a.color || CHART_COLORS[i]} stopOpacity={0.35} />
              <stop offset="95%" stopColor={a.color || CHART_COLORS[i]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecf2" />
        <XAxis dataKey={xKey} tick={axis} minTickGap={20} />
        <YAxis tick={axis} allowDecimals={false} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {areas.map((a, i) => (
          <Area key={a.key} type="monotone" dataKey={a.key} name={a.name} stackId={stacked ? 's' : undefined}
            stroke={a.color || CHART_COLORS[i]} fill={`url(#grad-${a.key})`} strokeWidth={2} />
        ))}
      </AreaChart>
    </ChartCard>
  );
}
