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
