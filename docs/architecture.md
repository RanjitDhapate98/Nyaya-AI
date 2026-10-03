# Architecture

```
┌──────────────────────────┐   HTTPS/JSON (Bearer JWT)   ┌───────────────────────────────┐
│ React + Vite (frontend)  │ ──────────────────────────► │ Node.js + Express (backend)   │
│ pages / components       │                             │ helmet · cors · rate-limit    │
│ services (axios)         │ ◄────────────────────────── │ mongo-sanitize · zod · JWT    │
└──────────────────────────┘   {success,data,message}    │ routes→controllers→services   │
                                                         └───────┬───────────────┬───────┘
                                                                 │ Mongoose      │ axios (ML_SERVICE_URL)
                                                         ┌───────▼──────┐ ┌──────▼──────────────────────┐
                                                         │   MongoDB    │ │ FastAPI ML service          │
                                                         │ users, cases │ │ preprocessing (shared)      │
                                                         │ predictions  │ │ XGBoost clf + regressor     │
                                                         │ similarcases │ │ SHAP TreeExplainer          │
                                                         │ recommend.   │ │ Retriever (TF-IDF cosine)   │
                                                         └──────────────┘ └─────────────────────────────┘
```

## Request flow: "Run prediction"
1. React `POST /api/predictions {caseId}`.
2. `predictionService.runPrediction` loads the case from MongoDB.
3. `mlService.predict` sends raw case fields to FastAPI `/predict`.
4. FastAPI derives features (`app/preprocessing/preprocess.py`), applies the persisted sklearn preprocessor,
   runs the XGBoost classifier (+ delay regressor) and SHAP TreeExplainer.
5. Backend asks `geminiService` for a narrative (falls back to a template).
6. `Prediction` is saved; denormalised fields (`riskLevel`, `riskProbability`, `predictedDelayDays`) are written on the Case.
7. `similarityService` sends the case plus candidate cases from MongoDB to FastAPI `/similar`; top-K saved in `SimilarCase`.
8. `recommendationService` runs its providers (rule engine) and saves `Recommendation` documents.
9. Response returns prediction + similar cases + recommendations; analytics read the updated collections live.

## Design decisions
- **Single gateway.** The browser never talks to MongoDB or Python; the API owns auth, validation and persistence.
- **Train/serve parity.** Feature extraction lives in one Python module used by both `training/` and `app/`.
- **Pluggable retrieval.** `BaseCaseRetriever` (`index`, `search`) — add a `SentenceTransformerRetriever`/`FaissRetriever`
  and select it with `RETRIEVER_BACKEND`; nothing else changes.
- **Pluggable recommendations.** `recommendationService.PROVIDERS` is a list of `{ name, generate(context) }`; an ML/LLM
  provider can be appended or swapped in.
- **Graceful degradation.** ML down → 503 with a clear message; similarity failure doesn't discard a prediction;
  missing Gemini key → template narrative.
- **Config by environment.** Every URL/secret comes from env vars (`config/env.js` validates them at boot).

## Security
Helmet headers, CORS allow-list, global + auth rate limits, bcrypt (12 rounds), HS256 JWT with issuer check,
role-based authorization, Zod validation (strict bodies), `express-mongo-sanitize` against operator injection,
regex escaping for search, 200 kB body limit, no secrets in the frontend bundle, generic login errors.

Note: the JWT is stored in `localStorage` for simplicity. For production, prefer an httpOnly, SameSite cookie with
CSRF protection and short-lived access tokens + refresh tokens.
