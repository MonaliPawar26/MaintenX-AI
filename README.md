# ⚙️ MaintenX AI — Predictive Maintenance Platform

> Full-stack AI-powered predictive maintenance SaaS. Predict equipment failures before they happen using ML, automate maintenance requests via NLP, and manage workflows with real-time Kanban — all from a single, production-grade application.

[![CI/CD](https://github.com/your-org/maintenx/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/maintenx/actions)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---
## 🌟 Solution Overview

### ❗ Problem

In traditional industrial environments:
- Maintenance is reactive (fix after failure)
- Static schedules ignore real equipment condition
- Lack of real-time insights leads to downtime
- Manual ticket creation slows response
- No intelligence in decision-making

👉 Result: High cost, downtime, inefficiency

---

### 💡 Solution — MaintenX AI

MaintenX AI provides an intelligent system that:

- 🔮 Predicts failures using Machine Learning  
- 🤖 Automates maintenance tickets using NLP  
- 📊 Visualizes real-time operational data  
- 🧠 Provides AI-driven insights & recommendations  
- 🔄 Streamlines workflows with Kanban  

---

### 🎯 Objectives

- Reduce downtime  
- Optimize maintenance  
- Improve productivity  
- Enable data-driven decisions  
- Build scalable SaaS system  

---

## 📸 Features

| Feature | Description |
|---------|-------------|
| 🏠 **Landing Page** | Full marketing page with features, pricing, testimonials, tech stack |
| 🔐 **Authentication** | Google OAuth 2.0 + email/password + JWT sessions |
| 📊 **Dashboard** | Live KPIs, AI failure alerts, 3D gear, activity feed, Kanban preview |
| 🏭 **Equipment Registry** | Asset management with ML risk scores, usage tracking, history |
| 🟦 **Kanban Board** | Real-time drag-and-drop, MongoDB sync, overdue highlighting |
| 🔮 **AI Predictions** | RandomForest + GradientBoosting failure predictions, gauges, recommendations |
| 📅 **Calendar** | Monthly maintenance scheduling, click-to-create requests |
| 📈 **Analytics** | 4 Chart.js charts: team load, equipment history, trend, risk distribution |
| 👤 **Profile Page** | Skills, certifications, performance metrics, activity timeline, edit mode |
| ⚙️ **Settings** | Display, notifications, AI preferences, security, integrations — no backend URLs exposed |
| 🤖 **AI Chatbot** | NLP pipeline → auto-creates maintenance tickets with smart assignment |

---

## 🏗️ Project Structure

```
maintenx/
├── frontend/
│   └── index.html          # Complete SPA (2400+ lines) — all pages, CSS, JS
│
├── backend/                # Node.js + Express + MongoDB
│   ├── server.js           # Main Express app, middleware, routes
│   ├── seed.js             # Populate database with demo data
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   └── logger.js       # Winston logger
│   ├── middleware/
│   │   ├── auth.js         # JWT authenticate + authorize + optionalAuth
│   │   └── validate.js     # express-validator error handler
│   ├── models/
│   │   ├── Equipment.js    # Equipment schema + AI risk + telemetry
│   │   ├── Request.js      # Maintenance requests + status history
│   │   ├── User.js         # Users + OAuth + metrics + certifications
│   │   └── Team.js         # Teams + members
│   ├── routes/
│   │   ├── auth.js         # Google OAuth, register, login, demo, /me
│   │   ├── equipment.js    # CRUD + AI predict trigger + history
│   │   ├── requests.js     # CRUD + Kanban status PATCH
│   │   ├── teams.js        # Team management
│   │   ├── users.js        # User profiles + availability
│   │   ├── ai.js           # Predict, predict-all, chat, insights, assign
│   │   └── analytics.js    # KPIs, team/equipment stats, trend, MTTR
│   ├── tests/
│   │   └── equipment.test.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── ai-service/             # Python FastAPI + scikit-learn
│   ├── main.py             # Predict, chat NLP, batch, insights endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── tests/
│       └── test_predict.py
│
├── nginx/
│   └── nginx.conf          # Reverse proxy + static serving + security headers
│
├── mongo-init/
│   └── init.js             # DB initialization + indexes
│
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD pipeline
│
├── docker-compose.yml      # Production: MongoDB + Backend + AI + Nginx
├── docker-compose.dev.yml  # Development overrides (hot reload)
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option 1 — Docker (Recommended, zero config)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/maintenx.git
cd maintenx

# 2. Copy and configure environment
cp backend/.env.example backend/.env

# 3. Start all services
docker compose up -d

# 4. Wait ~30 seconds, then seed demo data
docker exec maintenx-backend node seed.js

# 5. Open the application
open http://localhost:3000
```

### Option 2 — Local Development (no Docker)

**Prerequisites:** Node.js 18+, Python 3.10+, MongoDB running locally

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env     # edit as needed
npm install
node seed.js             # seed demo data
npm run dev              # http://localhost:5000

# Terminal 2 — AI Service
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # http://localhost:8000

# Terminal 3 — Frontend (open directly or serve)
open frontend/index.html
# or: npx serve frontend -p 3000
```

---

## 📡 API Reference

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/google`   | Verify Google ID token → JWT |
| POST | `/api/auth/register` | Email + password registration |
| POST | `/api/auth/login`    | Email + password login |
| POST | `/api/auth/demo`     | Demo login (no credentials needed) |
| GET  | `/api/auth/me`       | Get current authenticated user |

### Equipment
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/equipment`            | List (filter: dept, status, risk, search) |
| POST   | `/api/equipment`            | Create new equipment |
| GET    | `/api/equipment/:id`        | Get single equipment |
| PUT    | `/api/equipment/:id`        | Full update |
| PATCH  | `/api/equipment/:id`        | Partial update |
| DELETE | `/api/equipment/:id`        | Soft delete (set inactive) |
| GET    | `/api/equipment/:id/history`| Maintenance request history |
| POST   | `/api/equipment/:id/predict`| Trigger ML prediction |

### Maintenance Requests
| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/requests`              | List (filter: status, priority, overdue) |
| GET    | `/api/requests/kanban`       | Board grouped by status column |
| POST   | `/api/requests`              | Create request |
| PUT    | `/api/requests/:id`          | Full update |
| PATCH  | `/api/requests/:id/status`   | Kanban drag-and-drop status change |
| DELETE | `/api/requests/:id`          | Delete |

### AI Intelligence
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ai/predict`     | ML prediction for equipment ID or raw features |
| POST | `/api/ai/predict-all` | Bulk predict all active equipment |
| POST | `/api/ai/chat`        | NLP parse + auto-create maintenance ticket |
| GET  | `/api/ai/insights`    | Data-driven operational insights |
| POST | `/api/ai/assign`      | Smart technician recommendation |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics/summary`          | KPI dashboard totals |
| GET | `/api/analytics/by-team`          | Requests grouped by team |
| GET | `/api/analytics/by-equipment`     | Requests per equipment (top 10) |
| GET | `/api/analytics/trend`            | Monthly corrective vs preventive |
| GET | `/api/analytics/risk-distribution`| Fleet risk pie data |
| GET | `/api/analytics/kanban-stats`     | Request count per Kanban status |
| GET | `/api/analytics/mttr`             | Mean Time To Repair by team |

### Python AI Service
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/predict`        | RandomForest risk level + GBM failure days |
| POST | `/predict/batch`  | Batch predict for multiple equipment |
| POST | `/chat`           | NLP: equipment + priority + sentiment + urgency |
| POST | `/insights`       | AI operational recommendations |
| GET  | `/health`         | Service status + model info |
| GET  | `/docs`           | Swagger UI (auto-generated by FastAPI) |

---

## 🔐 Authentication Setup

### Google OAuth (Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add your domain to **Authorized JavaScript origins**
5. Copy the **Client ID** to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### Demo Login (Development)
No setup needed — click **"Sign In to Dashboard"** with any email, or use the Google button for a simulated flow.

---

## 🤖 ML Model Details

| Component | Algorithm | Training Data | Accuracy |
|-----------|-----------|---------------|----------|
| Risk Classifier | RandomForestClassifier (150 trees) | 3,000 synthetic samples | ~94% |
| Failure Predictor | GradientBoostingRegressor (150 trees) | Same dataset | ±3 days MAE |
| NLP Parser | Regex pipeline | Hand-crafted patterns | 85-95% |

**Input features:**
- `usage_hours` — total operational hours
- `past_failures` — count of historical failures
- `age_months` — equipment installation age
- `last_maintenance_days` — days since last maintenance

**Output:**
- `risk_level` — `low` / `medium` / `high`
- `risk_score` — 0–100 continuous score
- `estimated_failure_days` — predicted days until failure
- `confidence` — model confidence 0–100%
- `feature_importance` — per-feature contribution

---

## 🌐 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/maintenx

# Auth
JWT_SECRET=your_secret_at_least_32_chars
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id

# AI Service
AI_SERVICE_URL=http://localhost:8000

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_MAX=200
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS ES6+, Three.js r128, Chart.js 3.9, Orbitron + Syne fonts |
| Backend API | Node.js 20, Express 4.18, Mongoose 8, JWT, Helmet, Winston |
| Database | MongoDB 7.0 |
| AI Service | Python 3.11, FastAPI, scikit-learn 1.3, NumPy |
| Auth | Google OAuth 2.0, bcryptjs, JSON Web Tokens |
| Infrastructure | Docker Compose, Nginx 1.25, GitHub Actions CI/CD |

---

## 🔧 Development Commands

```bash
# Backend
npm run dev          # nodemon hot-reload
npm test             # Jest test suite
npm run seed         # Seed demo data
npm run lint         # ESLint

# AI Service
uvicorn main:app --reload    # hot-reload dev server
pytest tests/ -v             # run tests

# Docker
docker compose up -d                              # start all services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up   # dev mode
docker compose logs -f backend                    # stream backend logs
docker exec maintenx-backend node seed.js         # seed data in container
docker compose down -v                            # stop + remove volumes
```

---

## 📄 License

MIT License 

---

MaintenX AI demonstrates how AI + Full-Stack Engineering + Real-Time Systems can transform traditional maintenance into a predictive, intelligent, and automated ecosystem.

⭐ If you found this project valuable, consider starring the repository!
