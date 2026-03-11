# Hotel WiFi Management SaaS

A multi-tenant Hotel WiFi Management platform integrating with **MikroTik RouterOS**. Manage hotspot users, captive portals, bandwidth profiles, vouchers, and real-time session monitoring across multiple hotels.

---

## Features

- **Multi-tenant** — SuperAdmin + per-hotel Manager/Staff roles
- **MikroTik RouterOS integration** — add/disable hotspot users, sync bandwidth profiles, poll active sessions
- **PMS Webhook** — hotel PMS posts check-in/checkout events via HMAC-signed webhooks
- **Captive Portal** — branded guest WiFi login (room+name or voucher code) in 6 languages
- **Real-time dashboard** — Socket.IO live router status, bandwidth charts, session table
- **Vouchers** — bulk generate, PDF print, rate-limit by MAC via Redis
- **CSV/PDF export** — session logs, voucher sheets

---

## Architecture

```
                         ┌─────────────────────────────┐
                         │   Coolify / Nginx (SSL)      │
                         │   your-domain.com            │
                         └──────────┬──────────────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                       │
         /api/* + /socket.io   / (frontend)       /portal/*
              │                     │                       │
     ┌────────▼──────┐   ┌──────────▼──────┐   ┌──────────▼──────┐
     │   Backend      │   │  Next.js Admin  │   │ Captive Portal  │
     │ Express + TS   │   │   Dashboard     │   │  Vite + React   │
     │ Prisma + PG    │   └─────────────────┘   └─────────────────┘
     │ Socket.IO      │
     │ node-routeros  │
     └────┬───────────┘
          │
    ┌─────┴──────┐
    │  PostgreSQL │  Redis
    └────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Admin UI | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Captive Portal | Vite + React, i18next (EN/TH/ZH/JA/KO/AR) |
| Real-time | Socket.IO |
| Infrastructure | Docker Compose, Nginx |
| Deployment | Coolify (self-hosted PaaS) |

---

## Local Development

### Prerequisites
- Node.js 20+, npm 10+
- Docker & Docker Compose

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_ORG/hotel-wifi-saas.git
cd hotel-wifi-saas
npm install --legacy-peer-deps
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum fill in:

```env
# Generate with: openssl rand -hex 32
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<another-64-char-random-string>

# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=<exactly-64-hex-chars>
```

### 3. Start Postgres & Redis

```bash
docker compose up postgres redis -d
```

### 4. Database Setup

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate
# → enter migration name: "initial"

# Seed demo data
npm run db:seed

cd ..
```

### 5. Start All Services

```bash
npm run dev
```

| Service | URL |
|---|---|
| Admin Dashboard | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Captive Portal | http://localhost:5174/portal/sample-hotel |
| API Health | http://localhost:4000/health |

### Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@hotelwifi.io` | `superadmin123` |
| Hotel Manager | `manager@sample-hotel.com` | `admin123` |

---

## Deployment on Coolify (from GitHub)

### Overview

Coolify reads `docker-compose.yml` from your repo and builds all services. Its built-in Traefik handles SSL automatically.

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial implementation"
git remote add origin https://github.com/YOUR_ORG/hotel-wifi-saas.git
git push -u origin main
```

> Make sure `.env` is in `.gitignore` (it is by default).

### Step 2 — Connect Coolify to GitHub

1. Open your Coolify dashboard → **Sources** → **+ Add**
2. Choose **GitHub** → authorize Coolify OAuth app
3. Select your repository `hotel-wifi-saas`

### Step 3 — Create a New Service in Coolify

1. Go to **Projects** → your project → **+ New Resource**
2. Choose **Docker Compose** (not Dockerfile)
3. Select the GitHub source you added in Step 2
4. Branch: `main` (or your production branch)
5. Docker Compose location: `docker-compose.yml` (root of repo)

### Step 4 — Set Environment Variables

In Coolify → your service → **Environment Variables** tab, add **all** of the following:

| Variable | Description | Example |
|---|---|---|
| `POSTGRES_USER` | DB username | `postgres` |
| `POSTGRES_PASSWORD` | DB password | `a_strong_password` |
| `POSTGRES_DB` | DB name | `hotel_wifi` |
| `JWT_SECRET` | JWT signing key (32+ chars) | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Refresh token key (32+ chars) | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `ENCRYPTION_KEY` | AES-256 key for router passwords (exactly 64 hex chars) | `openssl rand -hex 32` |
| `CORS_ORIGIN` | Allowed frontend origins | `https://wifi.yourdomain.com` |
| `NODE_ENV` | Runtime mode | `production` |
| `NEXT_PUBLIC_API_URL` | API URL for Next.js (build-time) | `/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO URL for Next.js (leave empty if same domain) | `` |
| `VITE_API_URL` | API URL for captive portal (build-time) | `/api` |
| `NGINX_PORT` | Nginx listen port (Coolify proxies to this) | `80` |

> **Tip:** Generate secrets quickly:
> ```bash
> openssl rand -hex 32   # for JWT_SECRET / JWT_REFRESH_SECRET
> openssl rand -hex 32   # for ENCRYPTION_KEY (need exactly 64 hex chars = 32 bytes)
> ```

### Step 5 — Configure the Domain

1. In Coolify → your service → **Domains** tab
2. Set your domain, e.g. `wifi.yourdomain.com`
3. Coolify maps this domain to the **nginx** service (port 80) via Traefik
4. Select **"Generate SSL certificate"** → Coolify uses Let's Encrypt automatically

> In the Coolify UI, when it asks which service to expose, select **`nginx`** on **port 80**.

### Step 6 — Deploy

1. Click **Deploy** in Coolify
2. Coolify will:
   - Pull your repo from GitHub
   - Build all 4 Docker images (`backend`, `frontend`, `captive-portal`, `nginx`)
   - Start services in dependency order
   - Run `prisma migrate deploy` automatically (inside backend container CMD)
   - Apply SSL certificate

### Step 7 — First-Time Database Seed (optional)

After the first deploy, run the seed script once to create the SuperAdmin and sample data:

```bash
# SSH into your Coolify server
docker exec -it <backend-container-id> sh
npx prisma db seed
exit
```

Or trigger it from Coolify → **Terminal** → select the backend container.

---

## Continuous Deployment

In Coolify → your service → **Webhooks** tab:
- Copy the **Deploy Webhook URL**
- Add it to GitHub → Settings → Webhooks → Payload URL
- Event: **Push** to `main` branch
- Every `git push origin main` will auto-deploy

---

## Environment Variables Reference

### Required (must set in Coolify)

| Variable | Description |
|---|---|
| `JWT_SECRET` | HMAC-SHA256 signing key for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Signing key for refresh tokens (min 32 chars) |
| `ENCRYPTION_KEY` | AES-256-GCM key for router passwords (exactly 64 hex chars) |
| `POSTGRES_PASSWORD` | PostgreSQL password |

### Optional (have defaults)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `postgres` | DB user |
| `POSTGRES_DB` | `hotel_wifi` | DB name |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `NODE_ENV` | `production` | Runtime environment |
| `CORS_ORIGIN` | `http://localhost` | Allowed CORS origins (comma-separated) |
| `NEXT_PUBLIC_API_URL` | `/api` | API base URL (baked into Next.js at build time) |
| `VITE_API_URL` | `/api` | API base URL (baked into Vite at build time) |
| `NGINX_PORT` | `80` | External port Nginx listens on |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login (SuperAdmin or HotelAdmin) |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/auth/me` | Current user info |
| `GET/POST` | `/api/hotels` | List / create hotels (SuperAdmin) |
| `GET/PUT` | `/api/hotels/:id` | Hotel details / update |
| `POST` | `/api/hotels/:id/rotate-secret` | Rotate PMS webhook secret |
| `GET` | `/api/hotels/portal/config/:slug` | Public portal branding config |
| `GET/POST` | `/api/routers` | List / add MikroTik routers |
| `POST` | `/api/routers/:id/test` | Test router connection |
| `GET/POST` | `/api/rooms` | List / add rooms |
| `GET/POST` | `/api/vouchers` | List / generate vouchers |
| `POST` | `/api/vouchers/export-pdf` | PDF export of voucher codes |
| `POST` | `/api/portal/auth` | Captive portal authentication |
| `GET` | `/api/sessions` | WiFi session logs |
| `GET` | `/api/sessions/stats` | Aggregated stats |
| `GET` | `/api/sessions/export` | CSV export |
| `POST` | `/api/webhook/pms/:hotelSlug` | PMS check-in/out webhook |
| `GET` | `/api/superadmin/stats` | Platform-wide stats |

### PMS Webhook Payload

```http
POST /api/webhook/pms/sample-hotel
X-Webhook-Signature: sha256=HMAC_SHA256(body, webhookSecret)
Content-Type: application/json

{
  "event": "checkin",
  "roomNumber": "101",
  "guestLastName": "Smith",
  "checkoutTime": "2026-03-12T12:00:00Z"
}
```

### Captive Portal URL (from MikroTik)

```
https://wifi.yourdomain.com/portal/sample-hotel?mac=$(mac)&ip=$(ip)&link-login=$(link-login)
```

---

## Project Structure

```
hotel-wifi-saas/
├── backend/                  # Express + Prisma API
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── modules/          # auth, hotels, routers, rooms, pms,
│   │   │                     # vouchers, hotspot, sessions, superadmin
│   │   ├── services/
│   │   │   ├── mikrotik/     # RouterOS client + connection pool
│   │   │   ├── scheduler/    # node-cron session sync (30s)
│   │   │   └── socket/       # Socket.IO event emitters
│   │   ├── middleware/       # JWT auth, tenant scope, error handler
│   │   └── utils/            # encryption, voucher generator, logger
├── frontend/                 # Next.js 14 admin dashboard
│   └── src/
│       ├── app/              # App Router pages
│       ├── components/       # UI, layout, dashboard components
│       ├── hooks/            # useAuth, useSocket, useRouterStatus
│       └── stores/           # Zustand auth + hotel stores
├── captive-portal/           # Vite + React guest portal (6 languages)
│   └── src/
│       ├── pages/            # Login, Success
│       ├── components/       # PortalLayout, LanguageSelector, forms
│       └── i18n/locales/     # en, th, zh, ja, ko, ar
├── nginx/conf.d/             # Nginx reverse proxy config
├── docker-compose.yml        # All services (Coolify-ready)
└── .env.example              # All env vars documented
```

---

## License

MIT
