# API reference

Base URL: `VITE_API_BASE_URL` (default `http://localhost:5000/api`). All routes except register/login/health need
`Authorization: Bearer <token>`.

Success: `{ "success": true, "data": {...}, "message": "...", "meta"?: { "pagination": {...} } }`
Error: `{ "success": false, "message": "...", "error": "..." | [{ "field", "message" }] }`

Status codes: 200 OK · 201 Created · 400 bad query/params/JSON · 401 unauthenticated · 403 forbidden ·
404 not found · 409 duplicate · 422 body validation · 429 rate limited · 500 server · 503 ML/DB unavailable.

## Health
| Method | Path | Notes |
|---|---|---|
| GET | /health | API, database state, ML service health, Gemini status |

## Auth — `/api/auth`
| Method | Path | Role | Body / notes |
|---|---|---|---|
| POST | /register | public | `{name, email, password, role?: analyst\|viewer}` → `{user, token}` (first user = admin) |
| POST | /login | public | `{email, password}` → `{user, token}` |
| POST | /logout | any | stateless; client discards token |
| GET | /me | any | current user |
| GET | /users | admin | list users |
| PATCH | /users/:id/role | admin | `{role}` |

## Cases — `/api/cases`
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | / | any | `page, limit(≤100), search, riskLevel(HIGH\|MEDIUM\|LOW\|UNASSESSED), caseType, court, state, status, priority, from, to, sortBy, sortOrder` |
| POST | / | admin, analyst | body: see `shared/schemas/case.schema.json` |
| GET | /:id | any | |
| PUT | /:id | admin, owner analyst | full replacement of editable fields |
| DELETE | /:id | admin, owner analyst | also deletes predictions, similar links, recommendations |
| POST | /:id/similar | admin, analyst | `{topK?: 1-20, includeHistorical?: bool}` → top-K similar (stored) |
| GET | /:id/similar | any | stored results |

Example similar result:
```json
{ "similarCaseId": "65f…", "source": "database", "caseNumber": "CIV/2024/12", "similarityScore": 0.84,
  "caseType": "Property", "riskLevel": "HIGH", "explanation": "same case type (Property); shared terms: land, title" }
```

## Predictions — `/api/predictions`
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | / | admin, analyst | `{caseId}` → `{prediction, case, similarCases, recommendations, warnings}` |
| GET | / | any | `page, limit, riskLevel, caseId` |
| GET | /case/:caseId | any | latest prediction + similar + recommendations + `stale` flag |
| GET | /:id | any | single prediction |
| GET | /model-info | any | metrics written by the training script |

Prediction object (excerpt):
```json
{ "riskLevel": "HIGH", "probability": 0.78, "classProbabilities": {"LOW":0.05,"MEDIUM":0.17,"HIGH":0.78},
  "predictedDelayDays": 120, "modelVersion": "xgb-v1",
  "featureContributions": [{ "feature": "numberOfAdjournments", "impact": 0.41, "direction": "increases_risk" }],
  "explanation": { "method": "SHAP TreeExplainer", "label": "Model feature contribution", "summary": ["+ ..."],
                   "narrative": "...", "narrativeSource": "template" } }
```

## Analytics — `/api/analytics`
| GET | /summary | filters `from, to, caseType, riskLevel, court, state, status` → kpis, byRisk, byType, byStatus, byCourt, byState, byStage, riskByType, delayTrend, recentCases, upcomingHighRisk |
|---|---|---|
| GET | /prediction-trend | prediction runs per month by risk |
| GET | /filters | distinct courts / types / states / statuses |

## Recommendations — `/api/recommendations`
| GET | / | `page, limit, priority, riskLevel, caseId` (cases populated) |
|---|---|---|
| GET | /case/:caseId | recommendations for one case (High → Low) |

## ML service (internal) — `ML_SERVICE_URL`
`GET /health`, `GET /model-info`, `POST /predict`, `POST /explain`, `POST /similar`.
Contract: `shared/api-contracts/ml-service.contract.json`; Swagger UI at `/docs`.
