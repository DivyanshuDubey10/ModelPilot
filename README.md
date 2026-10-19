<div align="center">

# ✈️ ModelPilot

### Autonomous Machine Learning Experimentation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**ModelPilot** automates the full ML experimentation lifecycle — from raw dataset upload through constrained hyperparameter optimization to executive-grade result reporting — all in a single, beautifully designed interface.

[**Live Demo**](#) · [**API Docs**](http://localhost:8000/docs) · [**Report a Bug**](https://github.com/DivyanshuDubey10/ModelPilot/issues)

</div>

---

## 📸 Screenshots

> Dashboard · Experiment Wizard · Run Detail · Final Report

The interface follows a calm, sparse, and precise aesthetic inspired by Apple and Stripe — built entirely with vanilla CSS and custom design tokens, with no UI framework dependency.

---

## 🧠 What ModelPilot Does

Most ML workflows involve a painful loop: wrangle data, pick a model, tune hyperparameters, evaluate metrics, adjust constraints, and repeat — all manually. ModelPilot eliminates this loop.

You upload a dataset. ModelPilot profiles it, detects the problem type, and autonomously trains multiple model configurations to find the one that best satisfies your objective — while respecting hard precision constraints you define. Every decision is logged, auditable, and exportable.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🔍 **Automated Dataset Profiling** | Instant column statistics, missing value maps, data types, and duplicate counts on upload |
| 🎯 **Problem Type Detection** | Automatic binary/multiclass classification detection and class imbalance analysis |
| 🤖 **Autonomous Optimization** | Multi-configuration search across estimator trees and class weights guided by NVIDIA Nemotron LLM |
| 🔒 **Hard Constraint Enforcement** | Guarantees recommendations satisfy precision floors (e.g. *precision ≥ 70%*) before accepting a result |
| 📊 **Real-Time Result Visualization** | Interactive metric bars, expandable iteration timelines, and per-model hyperparameter breakdowns |
| 📄 **Executive Reports** | One-click decision summaries with full JSON audit artifact export |
| 📱 **Mobile-First Responsive UI** | Slide-out navigation drawer, responsive wizard steps, and adaptive layouts across all breakpoints |
| 🗃️ **Persistent Run History** | Every optimization run serialized to disk; instantly browsable and re-inspectable |

---

## 🏛️ Architecture

```
ModelPilot/
├── backend/
│   ├── agent/
│   │   ├── nvidia_client.py     # NVIDIA Nemotron LLM integration
│   │   └── planner.py           # AI-guided experiment planning & fallback logic
│   ├── api/
│   │   └── routes.py            # FastAPI router (upload, profile, optimize, history)
│   ├── database/
│   │   └── history_store.py     # JSON-based persistence for experiments & runs
│   ├── ml_engine/
│   │   ├── preprocessor.py      # Feature encoding & pipeline construction
│   │   ├── trainer.py           # Model training (Logistic Regression, Random Forest)
│   │   ├── evaluator.py         # Metric computation (precision, recall, F1, accuracy)
│   │   ├── experiment_runner.py # Single experiment orchestration
│   │   ├── profiler.py          # Dataset statistics & profiling
│   │   └── problem_detector.py  # Classification type & imbalance detection
│   └── main.py                  # FastAPI app, CORS, router registration
├── frontend/
│   └── src/
│       ├── api/                 # Typed HTTP client, endpoint functions, API types
│       ├── components/          # Shared, chart, dataset, layout, experiment components
│       ├── hooks/               # useOptimizationRun hook for real HTTP data fetching
│       ├── pages/               # Dashboard, NewExperiment, ExperimentDetail, Report, History
│       └── styles/              # Design token CSS, layout, wizard, experiment, report styles
├── tests/                       # Backend unit & integration test suite
├── experiment_runs/             # Persisted optimization run JSON files
└── experiment_history.json      # Flat chronological experiment record
```

### Data Flow

```
CSV Upload → Profiling → Target Selection → Objective Config
    ↓
POST /api/optimize
    ↓
Preprocessor → Trainer → Evaluator (× N configurations)
    ↓
Constraint Check → Best Selection → JSON Persistence
    ↓
GET /api/optimize/{run_id}
    ↓
Experiment Detail → Final Report → JSON Export
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10 or later
- **Node.js** 18 or later
- **pip** and **npm**

### 1 · Clone

```bash
git clone https://github.com/DivyanshuDubey10/ModelPilot.git
cd ModelPilot
```

### 2 · Backend

```bash
# Install Python dependencies
pip install fastapi uvicorn scikit-learn pandas python-multipart python-dotenv openai

# (Optional) Configure environment
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY for LLM-guided planning

# Start the API server
PYTHONPATH=. uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

> The FastAPI server starts at **http://127.0.0.1:8000**  
> Interactive API docs available at **http://127.0.0.1:8000/docs**

### 3 · Frontend

```bash
cd frontend
npm install

# (Optional) Configure environment
cp .env.example .env
# Edit .env to set VITE_API_URL if your backend runs on a different port

npm run dev
```

> The Vite dev server starts at **http://localhost:3000**

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service readiness check |
| `POST` | `/api/upload` | Upload CSV → profile + server-side path returned |
| `POST` | `/api/profile` | Generate statistics for a dataset by path |
| `POST` | `/api/analyze` | Detect problem type and class imbalance |
| `POST` | `/api/experiment` | Execute a single model configuration |
| `POST` | `/api/optimize` | Run full autonomous optimization loop |
| `GET` | `/api/optimize/{run_id}` | Retrieve a saved optimization run in full |
| `GET` | `/api/runs` | List all saved runs as lightweight summaries |
| `GET` | `/api/history` | Flat chronological experiment record |

**Optimize request body:**
```json
{
  "dataset_path": "backend/datasets/AIDS_Classification.csv",
  "target": "infected",
  "objective": "recall",
  "min_precision": 0.70,
  "max_experiments": 5
}
```

**Optimize response:**
```json
{
  "run_id": "uuid-here",
  "experiments_run": 5,
  "experiments": [...],
  "best_experiment": { "model_name": "random_forest", "metrics": { "recall": 0.75, "precision": 0.82 } },
  "constraint_satisfied": true,
  "optimization_summary": { "decision": "...", "next_step": "..." }
}
```

---

## ⚙️ Environment Variables

### Backend (`.env` at project root)

```env
# NVIDIA Nemotron LLM — enables AI-guided experiment planning
NVIDIA_API_KEY=your_api_key_here
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b

# CORS — comma-separated origins for production deployments
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
# Backend base URL (leave empty to use relative paths in production)
VITE_API_URL=http://localhost:8000
```

---

## 🧪 Running Tests

### Backend

```bash
PYTHONPATH=. pytest
```

```
tests/test_history_store.py        .    PASSED
tests/test_nvidia_client.py        s    SKIPPED (no NVIDIA_API_KEY)
tests/test_optimization_history.py ...  PASSED
========================= 4 passed, 1 skipped =========================
```

### Frontend

```bash
cd frontend
npm run lint      # Static analysis via oxlint — 0 errors
npm run build     # TypeScript type-check + Vite production bundle
```

---

## 🏆 Hackathon Demo Script

Follow this flow to demonstrate ModelPilot end-to-end in under 5 minutes:

**Step 1 — Dashboard** (`/`)  
Show the KPI summary cards (Best Recall, Best F1, Total Runs) populated with real historical data.

**Step 2 — New Experiment** (`/experiments/new`)  
Upload `backend/datasets/AIDS_Classification.csv`. Watch the profiler return column types, missing value counts, and row statistics instantly.

**Step 3 — Review Profile**  
Select `infected` as the target column. The problem detector confirms binary classification with class imbalance.

**Step 4 — Set Objective**  
Choose *Maximize Recall*, set *Min Precision ≥ 70%*, and run 3–5 experiments.

**Step 5 — Results** (`/experiments/:id`)  
Walk through the ranked experiment timeline. Expand individual configurations to inspect hyperparameters, metric scores, and constraint satisfaction status.

**Step 6 — Final Report** (`/experiments/:id/report`)  
Show the constraint verdict, best model summary, and export the full JSON audit artifact.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 6, Vite 8, React Router 7, Recharts, Phosphor Icons |
| **Styling** | Vanilla CSS with custom design tokens (no UI framework) |
| **Backend** | FastAPI, Python 3.10+, Uvicorn |
| **ML Engine** | scikit-learn (Logistic Regression, Random Forest), pandas |
| **AI Agent** | NVIDIA Nemotron via OpenAI-compatible API |
| **Persistence** | JSON file store (experiment history + per-run records) |
| **Testing** | pytest, fastapi.testclient, oxlint |

---

## 👥 Team

| Name | Role |
| :--- | :--- |
| **Divyanshu Dubey** | Backend · ML Engine · AI Agent (NVIDIA Nemotron integration) |
| **Rahimul Islam** | Frontend · UI/UX Design · Integration · Deployment |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ❤️ for the hackathon &nbsp;·&nbsp; ModelPilot © 2026
</div>
