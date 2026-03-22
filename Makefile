# MaintenX AI — Makefile
# Usage: make <target>

.PHONY: help up down dev seed logs clean test lint

help:
	@echo ""
	@echo "  ⚙  MaintenX AI — Available Commands"
	@echo "  ─────────────────────────────────────"
	@echo "  make up       Start all services (Docker)"
	@echo "  make down     Stop all services"
	@echo "  make dev      Start with hot-reload (Docker dev mode)"
	@echo "  make seed     Populate database with demo data"
	@echo "  make logs     Stream all logs"
	@echo "  make test     Run all tests"
	@echo "  make lint     Run ESLint on backend"
	@echo "  make clean    Remove containers + volumes"
	@echo "  make build    Rebuild all Docker images"
	@echo ""

up:
	docker compose up -d
	@echo "✅ MaintenX running at http://localhost:3000"

down:
	docker compose down

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

seed:
	docker exec maintenx-backend node seed.js

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-ai:
	docker compose logs -f ai-service

build:
	docker compose build --no-cache

clean:
	docker compose down -v
	@echo "🗑  Containers and volumes removed"

test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running AI service tests..."
	cd ai-service && python -m pytest tests/ -v

lint:
	cd backend && npm run lint

shell-backend:
	docker exec -it maintenx-backend sh

shell-mongo:
	docker exec -it maintenx-mongo mongosh maintenx

install:
	cd backend && npm install
	cd ai-service && pip install -r requirements.txt
