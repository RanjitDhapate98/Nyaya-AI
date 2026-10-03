import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Brain, RefreshCw, Waypoints } from 'lucide-react';
import { predictionService } from '../services/predictionService';
import { useAsync } from '../hooks/useAsync';
import { AsyncBoundary, EmptyState, ErrorState, Spinner } from '../components/common/Feedback';
import { Card, Disclaimer, PageHeader } from '../components/common/UI';
import PredictionSummary from '../components/prediction/PredictionSummary';
import FeatureContributionChart from '../components/prediction/FeatureContributionChart';
import SimilarCaseList from '../components/similarCases/SimilarCaseList';
import RecommendationList from '../components/recommendations/RecommendationList';
import { useAuth } from '../context/AuthContext';
import { PREDICTION_DISCLAIMER, RECOMMENDATION_DISCLAIMER } from '../constants';

export default function Prediction() {
  const { id } = useParams();
  const { canEdit } = useAuth();
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);
  const { data, loading, error, refetch, setData } = useAsync(() => predictionService.latestForCase(id), [id]);

  const run = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const result = await predictionService.run(id);
      setData({ ...data, ...result, stale: false, historyCount: (data?.historyCount || 0) + 1 });
      toast.success(`Prediction complete: ${result.prediction.riskLevel} risk`);
      (result.warnings || []).forEach((w) => toast(w, { icon: '⚠️' }));
    } catch (err) {
      setRunError(err);
      toast.error(err.message);
    } finally {
      setRunning(false);
    }
  };

  const c = data?.case;
  const p = data?.prediction;

  return (
    <AsyncBoundary loading={loading} error={error} onRetry={refetch} loadingLabel="Loading prediction…">
      {c && (
        <>
          <Link to={`/cases/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800"><ArrowLeft className="h-4 w-4" /> Case details</Link>
          <PageHeader
            eyebrow="AI delay-risk prediction"
            title={c.title}
            subtitle={`${c.caseNumber} · ${c.caseType} · ${c.currentStage} · ${c.court}`}
            actions={canEdit && (
              <button type="button" className={p ? 'btn-secondary' : 'btn-accent'} onClick={run} disabled={running}>
                {running ? <Spinner className="h-4 w-4" /> : p ? <RefreshCw className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                {running ? 'Running model…' : p ? 'Re-run prediction' : 'Run prediction'}
              </button>
            )}
          />

          <div className="mb-6"><Disclaimer>{PREDICTION_DISCLAIMER}</Disclaimer></div>
          {data.stale && <div className="mb-6"><Disclaimer tone="info">The case was edited after this prediction. Re-run it to reflect the latest data.</Disclaimer></div>}
          {runError && <div className="mb-6"><ErrorState error={runError} onRetry={run} title="Prediction failed" /></div>}

          {!p ? (
            <Card>
              <EmptyState icon={Brain} title="No prediction yet"
                message={canEdit ? 'Run the model to classify delay risk, explain the result with SHAP, retrieve similar cases and generate recommendations.' : 'An analyst or admin has not run a prediction for this case yet.'}
                action={canEdit && <button type="button" className="btn-accent" onClick={run} disabled={running}>{running ? <Spinner className="h-4 w-4 text-white" /> : <Brain className="h-4 w-4" />} Run prediction</button>} />
            </Card>
          ) : (
            <div className={`space-y-6 ${running ? 'opacity-60' : ''}`}>
              <PredictionSummary prediction={p} />
              <FeatureContributionChart contributions={p.featureContributions} riskLevel={p.riskLevel} />
              <div className="grid gap-6 xl:grid-cols-2">
                <Card title="Similar cases" subtitle="Top matches · TF-IDF + cosine similarity" bodyClassName="p-0"
                  actions={<Link to={`/cases/${id}/similar`} className="btn-ghost px-2 py-1 text-xs"><Waypoints className="h-3.5 w-3.5" /> Explore</Link>}>
                  <SimilarCaseList items={data.similarCases} compact />
                </Card>
                <Card title="Recommendations" subtitle="Administrative decision-support suggestions" bodyClassName="p-0">
                  <RecommendationList items={data.recommendations} />
                  <div className="border-t border-ink-100 p-4"><Disclaimer tone="info">{RECOMMENDATION_DISCLAIMER}</Disclaimer></div>
                </Card>
              </div>
              <p className="text-xs text-ink-400">{data.historyCount} prediction run(s) recorded for this case.</p>
            </div>
          )}
        </>
      )}
    </AsyncBoundary>
  );
}
