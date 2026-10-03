import { Bot, CalendarClock, Cpu, FileText, Timer } from 'lucide-react';
import { Card, Tag } from '../common/UI';
import RiskGauge, { ProbabilityBars } from './RiskGauge';
import { formatDateTime, formatDays } from '../../utils/format';

function Metric({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-ink-100 p-3">
      <Icon className="mt-0.5 h-4 w-4 text-brass-500" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
        <p className="text-sm font-medium text-ink-900">{value}</p>
        {hint && <p className="text-xs text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}

export default function PredictionSummary({ prediction }) {
  const probs = prediction.classProbabilities || {};
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Delay risk" subtitle="Model classification" className="lg:col-span-1">
        <RiskGauge riskLevel={prediction.riskLevel} probability={prediction.probability} classProbabilities={probs} />
        <div className="mt-5"><ProbabilityBars classProbabilities={probs} /></div>
      </Card>
      <Card title="Prediction details" className="lg:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={Timer} label="Predicted delay" value={formatDays(prediction.predictedDelayDays)} hint="Estimated remaining duration (regression model)" />
          <Metric icon={Cpu} label="Model version" value={prediction.modelVersion} hint={prediction.modelType} />
          <Metric icon={CalendarClock} label="Generated" value={formatDateTime(prediction.createdAt)} />
          <Metric icon={FileText} label="Explainability" value={prediction.explanation?.method || 'SHAP'} hint={prediction.explanation?.basis} />
        </div>
        {prediction.explanation?.narrative && (
          <div className="mt-5 rounded-lg bg-ink-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-ink-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Plain-language explanation</p>
              <Tag tone={prediction.explanation.narrativeSource === 'gemini' ? 'brass' : 'neutral'}>
                {prediction.explanation.narrativeSource === 'gemini' ? 'Gemini' : 'Template'}
              </Tag>
            </div>
            <p className="text-sm leading-relaxed text-ink-800">{prediction.explanation.narrative}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
