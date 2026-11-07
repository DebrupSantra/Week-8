# Task Management Application

A full-stack task management application built with React, TypeScript, Spring Boot, and PostgreSQL. The repository contains independently buildable frontend and backend modules and is deployable with Docker Compose.

## Features

- Account registration, login, logout, and current-user lookup.
- BCrypt password hashing, short-lived JWT access tokens, and one-time rotating refresh tokens.
- Refresh tokens are stored as SHA-256 hashes and delivered only through HttpOnly cookies.
- Private task CRUD with status, priority, due date, comments, search, filters, sorting, and pagination.
- Three-column task board with pointer and keyboard drag-and-drop.
- Dashboard totals, completion rate, overdue count, and recently updated tasks.
- Responsive dashboard, task board, task details, profile, and settings pages.
- Light and dark themes, form validation, toast notifications, confirmation dialogs, error boundary, and loading skeletons.
- Authenticated STOMP/SockJS notifications delivered to per-user queues after database transactions commit.
- Flyway-managed PostgreSQL schema, automated tests, Docker deployment, and GitHub Actions CI.

## Technology stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, Zustand, `@dnd-kit`, React Hook Form, Zod, STOMP.js, SockJS.
- **Backend:** Java 21+, Spring Boot 3.4, Spring Web, Spring Security, Spring Data JPA, Spring WebSocket, Bean Validation, Flyway, JJWT.
- **Database:** PostgreSQL 17.
- **Tests:** JUnit 5, Mockito, Spring Boot Test, Vitest, React Testing Library, Playwright.
- **Deployment:** Docker, Docker Compose, Nginx, GitHub Actions.

## Architecture

```text
Browser ── React application
   ├── REST (Bearer access token) ──┐
   └── STOMP/SockJS (Bearer token) ─┤
                                    ▼
                              Spring Boot API
                            ├── REST controllers / DTOs
                            ├── Authentication and authorization
                            ├── Application services and after-commit events
                            ├── Spring Data JPA
                            └── Flyway ── PostgreSQL
```

The backend is authoritative for authorization and task state. API responses use DTOs; JPA entities are not returned directly. Task and comment queries are scoped to the authenticated user. The browser keeps access tokens in memory and never stores passwords or refresh tokens in local storage. Refresh tokens are rotated and revoked server-side.

### Database schema

- `users`: UUID, full name, normalized unique email, BCrypt password hash, and creation timestamp.
- `tasks`: UUID, title, description, status, priority, optional due date, timestamps, and assigned user foreign key.
- `comments`: UUID, content, task foreign key, author foreign key, and creation timestamp.
- `refresh_tokens`: UUID, SHA-256 token hash, user foreign key, expiry, revocation flag, and creation timestamp.

Schema changes are versioned in `backend/src/main/resources/db/migration/`.

### Project structure

```text
backend/
  src/main/java/com/taskmanager/
    api/          REST controllers, DTOs, response and exception handling
    domain/       JPA entities and enums
    realtime/     STOMP authentication, broker setup, event delivery
    repository/   Spring Data repositories
    security/     JWT request filter and HTTP security configuration
    service/      Authentication, task, and refresh-token logic
  src/main/resources/
    db/migration/ Flyway SQL migrations
  src/test/       H2-backed integration tests
frontend/
  src/
    components/   Layout, common UI, task cards and dialogs
    hooks/        WebSocket subscription
    pages/        Auth, dashboard, board, task detail, profile, settings
    services/     Axios client and typed API services
    store/        Auth, theme, and toast state
    types/         API contracts
  e2e/            Playwright browser workflows
docker-compose.yml
.github/workflows/ci.yml
```

## API

Successful responses are wrapped as `{"data": ...}`. Errors use `timestamp`, `status`, `message`, and a `fields` map for validation failures.

### Authentication

- `POST /api/auth/register` — JSON: `fullName`, `email`, `password`; returns an access token and sets the refresh cookie.
- `POST /api/auth/login` — JSON: `email`, `password`; returns an access token and sets the refresh cookie.
- `POST /api/auth/refresh` — rotates the HttpOnly refresh cookie and returns a new access token.
- `POST /api/auth/logout` — revokes the presented refresh token, clears the cookie, and returns `204`.
- `GET /api/auth/me` — current account; requires a Bearer access token.

Registration and login return an envelope containing `accessToken`, `tokenType`, `expiresIn` (seconds), and a safe user DTO. The refresh token is never included in JSON.

### Tasks and comments

All task and comment endpoints require a Bearer access token.

- `GET /api/tasks` — supports `page`, `size` (maximum 100), `status`, `priority`, `search`, `sortBy` (`createdAt`, `updatedAt`, `dueDate`, `title`), and `direction`.
- `GET /api/tasks/summary` — total, completed, pending, overdue, completion rate, and the five most recently updated tasks.
- `GET /api/tasks/{id}`, `POST /api/tasks`, `PUT /api/tasks/{id}`, `PATCH /api/tasks/{id}/status`, `DELETE /api/tasks/{id}`.
- `GET /api/tasks/{id}/comments`, `POST /api/tasks/{id}/comments`.

Task statuses are `TODO`, `IN_PROGRESS`, `DONE`; priorities are `LOW`, `MEDIUM`, `HIGH`. A task request includes `title`, `description`, `status`, `priority`, and optional ISO date `dueDate`. A status patch uses `{"status":"IN_PROGRESS"}`; a comment request uses `{"content":"..."}`. A task not owned by the current account is returned as not found.

### WebSocket

Connect to `/ws` using SockJS, send `Authorization: Bearer <access-token>` as a STOMP CONNECT header, then subscribe to `/user/queue/tasks`. Only that authenticated account’s task events are routed to its queue. Client-originated STOMP messages and other subscriptions are rejected.

## Prerequisites

- Java 21 or later and Maven 3.9+.
- Node.js 22+ and npm.
- PostgreSQL 17 for local backend development, or Docker Engine with the Compose plugin.
- Chromium for Playwright browser tests.

## Configuration and running locally

No production database password or signing key is committed. The test profile uses a fixed non-production signing key. For Docker, copy `.env.example` to `.env`, set a unique `POSTGRES_PASSWORD`, and set `JWT_SECRET` to a Base64-encoded random key of at least 32 bytes. For example, generate values with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Put the first value in `JWT_SECRET` and a second generated value in `POSTGRES_PASSWORD`. Keep `.env` private and untracked.

To run without Docker, provide these environment variables to the backend process:

- `DATABASE_URL` (for example `jdbc:postgresql://localhost:5432/task_manager`)
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET` (Base64-encoded key, minimum 256 bits)
- Optional: `SERVER_PORT`, `CORS_ALLOWED_ORIGINS`, `JWT_ACCESS_TOKEN_TTL`, `JWT_REFRESH_TOKEN_TTL`, `REFRESH_COOKIE_SECURE`, and `REFRESH_COOKIE_SAME_SITE`.

Then run the modules in separate terminals:

```powershell
cd backend
mvn spring-boot:run

cd frontend
npm ci
npm run dev
```

The Vite development server runs on `http://localhost:5173` and proxies `/api` and `/ws` to the backend on port `8080`. Production refresh cookies should use `REFRESH_COOKIE_SECURE=true` behind HTTPS.

The frontend defaults to the same-origin `/api` and `/ws` paths. Optional Vite overrides are `VITE_API_BASE_URL` and `VITE_WS_URL`.

## Docker deployment

After setting `.env`, start the full stack:

```powershell
docker compose up --build
```

The application is served at `http://localhost:3000`; PostgreSQL data is stored in the `postgres_data` named volume. Compose requires explicit database credentials and a valid JWT signing key rather than falling back to insecure defaults. Configure HTTPS termination and set the refresh-cookie secure flag before production use.

## Tests and verification

Run from the module directories:

```powershell
# Backend integration tests, including Flyway migration validation
cd backend
mvn test

# Frontend component and validation tests
cd frontend
npm ci
npm test
npm run build

# Browser workflow (requires a running backend and PostgreSQL)
npx playwright install chromium
npm run test:e2e
```

The backend integration-test profile uses an in-memory H2 database in PostgreSQL compatibility mode and runs the Flyway migrations. The Playwright workflow covers registration, task creation and editing, drag-and-drop status change, deletion, logout, and login. GitHub Actions runs backend tests, frontend tests/build, dependency audit, and the browser workflow.
