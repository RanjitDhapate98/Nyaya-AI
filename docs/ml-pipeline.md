# ML pipeline

> **Sample data is synthetic and intended only for development/testing.** See `ml-service/data/sample/README.md`.

```
Case input → feature extraction → preprocessing → XGBoost → risk + probability
                                                 → XGBoost regressor → predicted delay days
                                                 → SHAP TreeExplainer → feature contributions
           → TF-IDF retriever → similar cases → rule engine → recommendations → dashboard
```

## 1. Data
`training/generate_sample_data.py` creates 3,000 synthetic cases. The target `delayDays` (remaining duration) is
generated from case type, court, stage, priority, state load, adjournments, age, hearing gaps and noise;
`riskLevel` = LOW (< 420 d), MEDIUM (< 680 d), HIGH (≥ 680 d).

## 2. Feature extraction (`app/preprocessing/preprocess.py`, shared by training & serving)
| feature | derivation |
|---|---|
| caseAgeDays | referenceDate (or today) − filingDate |
| numberOfHearings, numberOfAdjournments | raw |
| adjournmentRatio | adjournments / hearings |
| hearingsPerYear | hearings / (age / 365) |
| daysSinceLastHearing | reference − lastHearingDate (age if none) |
| daysToNextHearing | nextHearingDate − reference (missing → imputed) |
| numLegalSections, descriptionLength | counts |
| caseType, court, state, currentStage, status, priority | categorical |

## 3. Preprocessing (`training/preprocessing.py`)
Validation (required columns, labels, min rows) → cleaning (dedupe, numeric coercion, adjournments ≤ hearings,
fill text) → `ColumnTransformer`: numeric = median imputer + StandardScaler; categorical = constant imputer +
OneHotEncoder(handle_unknown="ignore"). Persisted as `models/preprocessor.joblib`.

## 4. Models (`training/train.py`)
- `XGBClassifier(multi:softprob, 300 trees, depth 5, lr 0.06)` → `models/delay_model.joblib` (bundle with label encoder, version `xgb-v1`).
- `XGBRegressor` on `log1p(delayDays)` → `models/delay_regressor.joblib`.
- `--model random_forest` trains a Random Forest baseline (`rf-v1`) through the same pipeline.
- Stratified 80/20 split; metrics saved to `models/model_metadata.json` and shown in the app's Settings page.

Metrics from the training run that produced the bundled artifacts (synthetic test split, 600 rows):

| metric | value |
|---|---|
| Accuracy | 0.7283 |
| Precision (macro) | 0.7447 |
| Recall (macro) | 0.7299 |
| F1 (macro) | 0.7348 |
| Delay regressor MAE | 96.7 days |

Confusion matrix (rows = true, cols = predicted, order LOW / MEDIUM / HIGH):
`[[144, 38, 0], [47, 175, 25], [2, 51, 118]]`. Re-running training prints fresh values; these are not claims about real courts.

Evaluate saved artifacts on any CSV: `python -m training.evaluate path/to.csv`.

## 5. Explainability (`app/explainability/shap_explainer.py`)
SHAP `TreeExplainer` on the classifier. For each encoded column we take `shap[HIGH] − shap[LOW]` (margin space), sum
one-hot columns back to their original feature, and return the top-k by absolute value with `direction`
`increases_risk` / `decreases_risk`. Labelled **"Model feature contribution"** — it describes model behaviour, not causation.

## 6. Similar-case retrieval (`app/retrieval/case_retriever.py`)
Text = case type (weighted) + stage + court + description + title + legal sections. `TfidfVectorizer` (1–2 grams,
English stop words, sublinear tf) fitted on the corpus at training time (`similarity_vectorizer.joblib`), cosine
similarity for ranking. Corpus = cases in MongoDB (sent by the backend) + the synthetic historical sample (optional).
Swap in embeddings by implementing `BaseCaseRetriever` and setting `RETRIEVER_BACKEND`.

## 7. Recommendations (`backend/src/services/recommendationService.js`)
Rule engine using risk level, case age, adjournment count/ratio, hearing frequency, gap since last hearing, next
hearing date, stage, status and the risk of similar cases. Outputs priority, category, text and reason. These are
administrative suggestions — not legal advice or judicial orders.

## Using a real dataset
Put a legally obtained CSV with the documented columns into `data/raw/`, run
`python -m training.train --data data/raw/<file>.csv`, then restart the ML service.
