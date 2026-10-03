import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Minus, Plus } from 'lucide-react';
import { Card, Disclaimer } from '../common/UI';
import { SHAP_DISCLAIMER } from '../../constants';
import { formatFeatureValue } from '../../utils/format';

const UP = '#b42318';
const DOWN = '#067647';

export default function FeatureContributionChart({ contributions = [], riskLevel }) {
  const data = contributions.map((c) => ({
    ...c,
    name: `${c.label} (${formatFeatureValue(c.feature, c.value)})`,
  }));
  const max = Math.ceil(Math.max(0.1, ...data.map((d) => Math.abs(d.impact))) * 2) / 2;

  return (
    <Card title="Model feature contribution" subtitle="SHAP values · contribution toward HIGH vs LOW risk">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3" style={{ height: Math.max(220, data.length * 38) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" domain={[-max, max]} ticks={[-max, -max / 2, 0, max / 2, max]} tick={{ fontSize: 11, fill: '#56658a' }} tickFormatter={(v) => v.toFixed(1)} />
              <YAxis type="category" dataKey="name" width={210} tick={{ fontSize: 11, fill: '#232b40' }} />
              <ReferenceLine x={0} stroke="#a7b1c7" />
              <Tooltip
                cursor={{ fill: '#f5f6f9' }}
                contentStyle={{ borderRadius: 10, border: '1px solid #e9ecf2', fontSize: 12 }}
                formatter={(v) => [v.toFixed(3), 'SHAP contribution']}
              />
              <Bar dataKey="impact" radius={3} maxBarSize={22} isAnimationActive={false}>
                {data.map((d) => <Cell key={d.feature} fill={d.impact >= 0 ? UP : DOWN} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3 lg:col-span-2">
          <h3 className="font-serif text-lg">Why is this case {riskLevel} risk?</h3>
          <ul className="space-y-2">
            {contributions.slice(0, 6).map((c) => {
              const up = c.direction === 'increases_risk';
              const Icon = up ? Plus : Minus;
              return (
                <li key={c.feature} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 rounded p-0.5" style={{ backgroundColor: `${up ? UP : DOWN}18` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: up ? UP : DOWN }} />
                  </span>
                  <span className="text-ink-800">
                    <strong className="font-medium">{c.label}</strong> ({formatFeatureValue(c.feature, c.value)}) {up ? 'pushed the model toward higher risk' : 'pushed the model toward lower risk'}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-4 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: UP }} /> increases risk</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DOWN }} /> decreases risk</span>
          </div>
          <Disclaimer tone="info">{SHAP_DISCLAIMER}</Disclaimer>
        </div>
      </div>
    </Card>
  );
}
