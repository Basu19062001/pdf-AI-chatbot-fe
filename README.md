# PDF Chatbot Frontend

Production-ready React frontend scaffold for the PDF Chatbot platform.

## Stack

- React with Vite
- React Router
- Axios
- React Hook Form
- Zod
- Vitest

## Features

- Signup and login flows aligned to the FastAPI backend
- Bearer-token authentication with refresh-token rotation
- Protected routes and public-only routes
- Session persistence across browser reloads
- Session visibility page backed by `/api/v1/auth/sessions`
- CI-ready scripts for lint, test, and build

## Getting Started

1. Copy `src/.env.example` to `src/.env`
2. Set `VITE_API_BASE_URL` to your backend API
3. Install dependencies with `npm install`
4. Start development with `npm run dev`

## Local Commands

- `make install` to install dependencies
- `make dev` to run `npm run dev`
- `make lint` to run ESLint
- `make test` to run Vitest
- `make build` to create the production bundle

## Docker

- `make docker-build` to build the development image
- `make docker-up` to start the frontend with Docker Compose
- `make docker-down` to stop the Compose stack
- `make docker-logs` to follow container logs
- `make docker-prod-build` to build the production image

The local Compose setup reads environment variables from `src/.env` and exposes the Vite dev server on `http://localhost:5173`.

## Backend Contract

The frontend expects these backend routes:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions`
- `POST /api/v1/auth/logout`

## Notes

- The backend now needs CORS enabled for browser-based local development. This workspace includes that middleware hookup in the backend app configuration.
- Signup returns a user profile only, so the frontend redirects users to login after account creation.
