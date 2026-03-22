# MaintenX AI — Deployment Guide

## Local Development (Fastest Start)

```bash
# 1. Clone
git clone https://github.com/your-org/maintenx.git
cd maintenx

# 2. Setup backend
cd backend
cp .env.example .env
npm install
node seed.js        # seed demo data

# 3. Run backend (Terminal 1)
npm run dev         # → http://localhost:5000

# 4. Run AI service (Terminal 2)
cd ../ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000  # → http://localhost:8000

# 5. Open frontend
open ../frontend/index.html
# Settings → API URL = http://localhost:5000
```

---

## Docker Compose (Production)

```bash
# Copy env and set secrets
cp backend/.env.example backend/.env
# Edit backend/.env: set JWT_SECRET, GOOGLE_CLIENT_ID, MONGODB_URI

# Build and start
docker compose up -d --build

# Seed demo data (first run only)
docker exec maintenx-backend node seed.js

# App is live at:
# http://localhost:3000   ← Frontend + Nginx
# http://localhost:5000   ← Backend API (direct)
# http://localhost:8000   ← AI Service (direct)
# http://localhost:27017  ← MongoDB (direct)
```

### Useful Docker commands
```bash
docker compose logs -f                  # all logs
docker compose logs -f backend          # backend only
docker compose restart backend          # restart one service
docker compose down                     # stop (keeps volumes)
docker compose down -v                  # stop + delete volumes (resets DB)
docker exec maintenx-mongo mongosh maintenx   # mongo shell
```

---

## Cloud Deployment Options

### Railway (Easiest)
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy backend
cd backend
railway new
railway up

# Deploy AI service
cd ../ai-service
railway new
railway up
```
Set environment variables in Railway dashboard.

### Render
1. Create a new Web Service for backend → connect GitHub repo → set `Root Directory: backend`
2. Create another Web Service for ai-service → `Root Directory: ai-service`
3. Create a MongoDB database (use MongoDB Atlas free tier)
4. Set all environment variables in Render dashboard

### Fly.io
```bash
# Backend
cd backend
fly launch --name maintenx-backend
fly secrets set JWT_SECRET=... MONGODB_URI=... GOOGLE_CLIENT_ID=...
fly deploy

# AI Service
cd ../ai-service
fly launch --name maintenx-ai
fly deploy
```

### AWS ECS / App Runner
Use the provided Dockerfiles. Push images to ECR, then deploy via ECS or App Runner.
Set environment variables in the task definition or App Runner configuration.

---

## MongoDB Atlas (Cloud Database)

1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP (or allow all: `0.0.0.0/0`)
4. Get connection string and set in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/maintenx?retryWrites=true&w=majority
   ```

---

## Environment Variables Checklist

### Required for Production
- [ ] `JWT_SECRET` — min 32 random characters
- [ ] `MONGODB_URI` — MongoDB Atlas or self-hosted
- [ ] `NODE_ENV=production`

### Optional but Recommended
- [ ] `GOOGLE_CLIENT_ID` — for Google OAuth login
- [ ] `AI_SERVICE_URL` — if AI service is separate host
- [ ] `ALLOWED_ORIGINS` — your frontend domain(s)

---

## Nginx SSL (HTTPS)

For production HTTPS, add SSL certificates to `nginx/ssl/` and update `nginx/nginx.conf`:

```nginx
server {
  listen 443 ssl;
  ssl_certificate     /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;
  # ... rest of config
}
```

Use [Let's Encrypt](https://letsencrypt.org/) (free) or [Certbot](https://certbot.eff.org/) to obtain certificates.
