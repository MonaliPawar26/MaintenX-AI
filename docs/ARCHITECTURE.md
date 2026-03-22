# MaintenX AI — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│                    frontend/index.html (SPA)                    │
│        Landing → Login → Dashboard → All Feature Pages          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Nginx (Port 3000)                          │
│          Static files + Reverse proxy + Security headers        │
└───────────────┬──────────────────────────┬──────────────────────┘
                │ /api/*                   │ /ai/*
                ▼                          ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│   Express Backend         │  │   FastAPI AI Service           │
│   Node.js 20 (Port 5000)  │  │   Python 3.11 (Port 8000)      │
│                           │  │                                │
│   Routes:                 │  │   Endpoints:                   │
│   /auth  /equipment       │  │   POST /predict                │
│   /requests /teams        │  │   POST /predict/batch          │
│   /users /ai /analytics   │  │   POST /chat (NLP)             │
│                           │  │   POST /insights               │
│   Middleware:             │  │                                │
│   JWT auth, Helmet,       │  │   ML Models:                   │
│   Rate limit, CORS        │  │   RandomForestClassifier       │
└──────────┬────────────────┘  │   GradientBoostingRegressor    │
           │                   └────────────────────────────────┘
           ▼
┌──────────────────────────┐
│      MongoDB 7.0          │
│      (Port 27017)         │
│                           │
│   Collections:            │
│   equipment requests      │
│   users teams             │
└──────────────────────────┘
```

## Data Flow

### 1. Login Flow
```
User → Frontend login form
     → POST /api/auth/demo (or /google, /login)
     → Backend validates + issues JWT
     → Frontend stores token in localStorage
     → Redirects to Dashboard
```

### 2. AI Prediction Flow
```
Equipment loaded
     → Frontend POST /api/ai/predict (with equipmentId)
     → Backend fetches equipment features from MongoDB
     → Backend POST http://ai-service:8000/predict
     → Python RandomForest predicts risk_level + score
     → Python GradientBoosting predicts failure_days
     → Backend updates equipment.aiRisk in MongoDB
     → Returns prediction to frontend
     → Frontend renders animated gauge + recommendation
```

### 3. AI Chatbot Flow
```
User types "CNC is overheating" in chat
     → Frontend POST /api/ai/chat
     → Backend POST http://ai-service:8000/chat
     → Python NLP extracts: equipment=CNC, priority=High
     → Backend finds matching Equipment in MongoDB
     → Backend creates Request (type=Corrective, status=New)
     → Increments equipment.totalFailures
     → Returns ticket ID to frontend
     → Frontend shows ticket confirmation + updates Kanban
```

### 4. Kanban Drag-and-Drop Flow
```
User drags card to new column
     → Frontend PATCH /api/requests/:id/status
     → Backend updates Request.status in MongoDB
     → Appends to statusHistory audit trail
     → If "Repaired/Scrap" → sets completedDate, overdue=false
     → Returns updated request
     → Frontend re-renders board
```

## MongoDB Schema Relationships

```
Team (1) ──────────── (N) User
  │                         │
  └─── (1) Equipment (N) ───┘
             │
             └─── (N) Request (N)
```

## Security Model

| Layer | Protection |
|-------|-----------|
| Network | Nginx reverse proxy, no direct backend/AI exposure |
| Transport | HTTPS in production (TLS via Nginx) |
| Auth | JWT HS256 tokens, 7-day expiry |
| OAuth | Google ID token verified server-side |
| API | Helmet headers, CORS whitelist, rate limiting (200/15min) |
| Database | Mongoose validation + unique indexes |
| Passwords | bcryptjs with 12 rounds salt |
| Audit | Full statusHistory trail on every request |

## Scalability Considerations

- **Horizontal scaling**: Add more Express instances behind Nginx upstream
- **Database**: MongoDB Atlas auto-scales; add read replicas for heavy analytics
- **AI Service**: Stateless FastAPI — deploy multiple instances for inference load
- **Caching**: Add Redis for session caching and prediction result caching
- **Queue**: Add BullMQ for async bulk prediction jobs
