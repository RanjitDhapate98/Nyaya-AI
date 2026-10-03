import { Scale } from 'lucide-react';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-950 p-12 text-ink-100 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-brass-500/20" />
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full border border-brass-500/10" />
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brass-500/15 p-2.5"><Scale className="h-6 w-6 text-brass-400" /></div>
          <div>
            <p className="font-serif text-xl font-semibold text-white">NyayaAI</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400">Judicial Intelligence System</p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="font-serif text-4xl leading-tight text-white">Spot delay risk early. Explain every estimate.</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-300">
            Delay-risk classification with XGBoost, SHAP feature contributions, similar-case retrieval and
            administrative recommendations — in one decision-support workspace.
          </p>
        </div>
        <p className="text-xs leading-relaxed text-ink-500">
          Academic BTech research prototype. Outputs are model estimates for decision support and are not legal judgments,
          legal advice or guarantees of any court outcome.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Scale className="h-6 w-6 text-brass-500" />
            <span className="font-serif text-xl font-semibold">NyayaAI</span>
          </div>
          <h1 className="text-3xl font-semibold text-ink-950">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink-600">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
