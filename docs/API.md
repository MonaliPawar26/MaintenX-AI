# MaintenX AI — API Documentation

## Base URL
- **Local**: `http://localhost:5000/api`
- **Docker**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

Obtain a token via `POST /api/auth/login`, `POST /api/auth/google`, or `POST /api/auth/demo`.

---

## Equipment

### List Equipment
```http
GET /api/equipment?dept=IT&risk=high&search=printer&page=1&limit=20
```
**Query params**: `dept`, `status`, `risk` (low/medium/high), `search`, `teamId`, `page`, `limit`

### Create Equipment
```http
POST /api/equipment
Content-Type: application/json

{
  "name": "CNC Machine B",
  "serialNumber": "SN-CNC-002",
  "department": "Production",
  "location": "Factory Floor C",
  "teamName": "Mechanical",
  "technicianName": "James Wilson",
  "usageHours": 1200,
  "installationAge": 18
}
```

### Trigger AI Prediction
```http
POST /api/equipment/:id/predict
```
Returns: `{ risk_level, risk_score, failureDays, confidence }` — also updates the equipment document.

---

## Requests (Kanban)

### Kanban Board
```http
GET /api/requests/kanban
```
Returns board grouped by status: `{ "New": [...], "In Progress": [...], "Repaired": [...], "Scrap": [...] }`

### Move Card (Drag & Drop)
```http
PATCH /api/requests/:id/status
Content-Type: application/json

{
  "status": "In Progress",
  "changedBy": "Alex Chen",
  "note": "Started investigating"
}
```

---

## AI Endpoints

### Chat (NLP → Auto-Create Ticket)
```http
POST /api/ai/chat
Content-Type: application/json

{ "message": "The CNC machine is overheating and making a grinding noise — urgent" }
```
**Response:**
```json
{
  "success": true,
  "data": {
    "parsed": { "equipment_hint": "CNC Machine", "priority": "High", "confidence": 91 },
    "equipment": { "id": "...", "name": "CNC Machine A" },
    "request": { "_id": "...", "subject": "...", "status": "New" },
    "message": "✅ Ticket #MX-ABC123 created for CNC Machine A"
  }
}
```

### Bulk Predict
```http
POST /api/ai/predict-all
```
Updates all active equipment with fresh ML predictions. Returns array of results.

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Human-readable error message",
  "errors": [{ "field": "name", "message": "Name required" }]  // validation errors only
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate serial number) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
