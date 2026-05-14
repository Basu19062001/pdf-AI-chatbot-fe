SHELL := /bin/bash

.PHONY: help install dev lint test build preview clean docker-build docker-up docker-down docker-logs docker-restart docker-prod-build

help:
	@echo "Available commands:"
	@echo "  make install          Install frontend dependencies"
	@echo "  make dev              Run Vite development server"
	@echo "  make lint             Run ESLint"
	@echo "  make test             Run Vitest"
	@echo "  make build            Build production assets"
	@echo "  make preview          Preview production build locally"
	@echo "  make clean            Remove build artifacts"
	@echo "  make docker-build     Build the development Docker image"
	@echo "  make docker-up        Start frontend with docker compose"
	@echo "  make docker-down      Stop frontend docker compose stack"
	@echo "  make docker-logs      Tail frontend container logs"
	@echo "  make docker-restart   Restart frontend docker compose stack"
	@echo "  make docker-prod-build Build the production Docker image"

install:
	npm install

dev:
	npm run dev

lint:
	npm run lint

test:
	npm run test

build:
	npm run build

preview:
	npm run preview -- --host 0.0.0.0

clean:
	rm -rf dist coverage

docker-build:
	docker compose build frontend

docker-up:
	docker compose up --build frontend

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f frontend

docker-restart:
	docker compose down
	docker compose up --build frontend

docker-prod-build:
	docker build --target production -t pdf-ai-chatbot-fe:production .

