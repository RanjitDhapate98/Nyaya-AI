# NyayaAI – Judicial Intelligence System

An academic BTech project: a full-stack **decision-support** system that stores judicial case records, predicts
**case delay risk (LOW / MEDIUM / HIGH)** with XGBoost, explains each prediction with **SHAP**, retrieves
**similar cases** (TF-IDF + cosine), generates **administrative recommendations**, and shows live **analytics**.

> **Disclaimer.** NyayaAI is a research / decision-support prototype. Its predictions are model estimates —
> not legal judgments, legal advice, or guarantees of any court outcome. The bundled dataset is **synthetic**
> and intended only for development/testing.

```
React (Vite, Tailwind, Recharts)  ──REST──►  Node.js / Express API  ──►  MongoDB
                                                   │
                                                   └──HTTP──►  Python FastAPI ML service
                                                                ├─ XGBoost classifier + delay regressor
                                                                ├─ SHAP TreeExplainer
                                                                └─ TF-IDF similar-case retriever
```
The browser only talks to the Node API; the API is the only client of MongoDB and the ML service.

## Quick start (local, no Docker)

Prerequisites: **Node.js 18+**, **Python 3.10+**, and **MongoDB** (local `mongod` or a MongoDB Atlas URI).

```bash
# 1) ML service  (terminal 1)
cd ml-service
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                     # Windows: copy .env.example .env
python -m training.train                                 # optional: artifacts are included; retrain if libs differ
uvicorn app.main:app --port 8000

# 2) Backend  (terminal 2)
cd backend
npm install
cp .env.example .env        # set MONGODB_URI and JWT_SECRET (16+ chars)
npm run seed:predict        # optional: admin user + 120 synthetic cases with predictions
npm run dev                 # http://localhost:5000/api

# 3) Frontend  (terminal 3)
cd frontend
npm install
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

Sign in with the seeded admin (`admin@nyaya.local` / `Admin@12345` — change it) or register:
**the first account registered becomes `admin`**, later ones choose `analyst` or `viewer`.

Verify the whole chain (API ⇄ MongoDB ⇄ FastAPI ⇄ XGBoost ⇄ SHAP ⇄ retrieval ⇄ recommendations ⇄ analytics):

```bash
cd backend && npm run test:flow
```

## Quick start (Docker)

```bash
cp .env.example .env     # set JWT_SECRET
docker compose up --build
docker compose exec backend npm run seed:predict   # optional demo data
```
Frontend http://localhost:5173 · API http://localhost:5000/api · ML docs http://localhost:8000/docs

## Changing URLs later
Everything is environment-driven — no source edits needed:

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | frontend/.env | Browser → API base URL (build-time) |
| `MONGODB_URI` | backend/.env | Local MongoDB or Atlas |
| `ML_SERVICE_URL` | backend/.env | API → ML service |
| `CORS_ORIGIN` / `FRONTEND_URL` | backend/.env | Allowed browser origin(s), comma-separated |
| `GEMINI_API_KEY` | backend/.env | Optional; empty ⇒ template/rule fallback |

## Roles
| Role | Can |
|---|---|
| admin | everything, delete any case, manage user roles (Settings) |
| analyst | create cases, edit/delete own cases, run predictions & similarity |
| viewer | read-only |

## Project layout
```
frontend/    React app (pages, components, services, context, hooks)
backend/     Express API (routes → controllers → services → models), Zod validators, seed & e2e scripts
ml-service/  FastAPI app, training pipeline, synthetic data generator, persisted model artifacts
shared/      Enumerations, JSON schema and ML API contract
docs/        architecture, API, database, ML pipeline, setup
```

## Documentation
[Setup](docs/setup.md) · [Architecture](docs/architecture.md) · [API](docs/api.md) · [Database](docs/database.md) · [ML pipeline](docs/ml-pipeline.md)
