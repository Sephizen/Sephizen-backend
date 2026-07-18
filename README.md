# Public AI Coding Assistant Backend

Production-ready backend for a public AI coding assistant using Node.js, Express, JavaScript ES modules, Supabase, Render, and Puter AI.

## What is included

- Supabase Authentication JWT verification
- Secure credit accounting backed by PostgreSQL RPC
- Chat sessions, messages, and usage logs
- File upload support with ZIP archive scanning
- Optional Redis-backed distributed rate limiting
- Structured JSON logging with request IDs
- Basic metrics endpoint for observability
- Render-ready startup and environment configuration

## Security features

- Helmet
- CORS allowlist
- Request size limits
- Rate limiting
- JWT verification against Supabase JWKS
- Row Level Security compatible queries
- Centralized error handling
- Upload validation and archive scanning
- Optional Redis rate limiting if `REDIS_URL` is set

## ZIP upload scanning

ZIP uploads are checked for:

- path traversal entries
- excessive file counts
- suspicious compression ratios
- oversized unpacked contents
- nested ZIP archives
- executable file types inside the archive

Uploads are also scanned with a simple binary-content heuristic for non-ZIP files. For stronger malware scanning, run a real antivirus service in front of this backend or on the same host and route uploads through that service.

## Database SQL

Run the files in `backend/database/` in Supabase SQL editor:

- `policies.sql`
- `credit_rpc.sql`

## Environment

Copy `.env.example` to `.env` and set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUTER_AUTH_TOKEN`
- `REDIS_URL` if you want distributed rate limiting

## Scripts

```bash
npm install
npm run start
```

## Endpoints

- `GET /api/health`
- `GET /api/metrics`
- `POST /api/auth/...`
- `GET|POST|PATCH|DELETE /api/chat/...`
- `GET /api/credits`
- `POST /api/credits/check`
- `GET /api/models`
- `GET /api/usage-logs`
- `GET /api/profile`
- `PATCH /api/profile`
- `GET|PATCH /api/settings`
- `POST /api/upload`

## Deployment on Render

- Build command: `npm install`
- Start command: `npm start`
- Node version: 20+

Make sure environment variables are configured in Render before deployment.
