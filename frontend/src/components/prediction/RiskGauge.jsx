import { RISK_COLORS } from '../../constants';
import { formatPercent } from '../../utils/format';

const LEVELS = ['LOW', 'MEDIUM', 'HIGH'];

/** Semicircular indicator: three segments, the predicted level highlighted, needle placed by expected risk. */
export default function RiskGauge({ riskLevel, probability, classProbabilities = {} }) {
  const p = (k) => Number(classProbabilities?.[k] ?? 0);
  // Expected position on a 0..1 scale (LOW=1/6, MEDIUM=1/2, HIGH=5/6) weighted by class probabilities.
  const sum = p('LOW') + p('MEDIUM') + p('HIGH') || 1;
  const pos = (p('LOW') * (1 / 6) + p('MEDIUM') * 0.5 + p('HIGH') * (5 / 6)) / sum;
  const angle = Math.PI * (1 - pos);
  const cx = 120; const cy = 120; const r = 92;
  const arc = (a0, a1) => {
    const x0 = cx + r * Math.cos(a0); const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1); const y1 = cy - r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const color = RISK_COLORS[riskLevel];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 240 140" className="w-full max-w-[280px]" role="img" aria-label={`Predicted ${riskLevel} risk`}>
        {LEVELS.map((lvl, i) => {
          const a0 = Math.PI - (i * Math.PI) / 3 - 0.02;
          const a1 = Math.PI - ((i + 1) * Math.PI) / 3 + 0.02;
          return (
            <path key={lvl} d={arc(a0, a1)} stroke={RISK_COLORS[lvl]} strokeWidth={lvl === riskLevel ? 20 : 14}
              strokeOpacity={lvl === riskLevel ? 1 : 0.22} fill="none" strokeLinecap="butt" />
          );
        })}
        <line x1={cx} y1={cy} x2={cx + (r - 22) * Math.cos(angle)} y2={cy - (r - 22) * Math.sin(angle)} stroke="#151b2c" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={7} fill="#151b2c" />
        <text x={28} y={136} fontSize="10" fill="#7987a6">LOW</text>
        <text x={196} y={136} fontSize="10" fill="#7987a6">HIGH</text>
      </svg>
      <p className="-mt-1 font-serif text-3xl font-semibold" style={{ color }}>{riskLevel}</p>
      <p className="text-sm text-ink-500">Model confidence {formatPercent(probability, 1)}</p>
    </div>
  );
}

export function ProbabilityBars({ classProbabilities = {} }) {
  return (
    <div className="space-y-2.5">
      {['HIGH', 'MEDIUM', 'LOW'].map((k) => {
        const v = Number(classProbabilities?.[k] ?? 0);
        return (
          <div key={k}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-semibold" style={{ color: RISK_COLORS[k] }}>{k}</span>
              <span className="tabular-nums text-ink-600">{formatPercent(v, 1)}</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100">
              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.max(1, v * 100)}%`, backgroundColor: RISK_COLORS[k] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
