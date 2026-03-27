# CLAUDE.md — Toscana Events Codebase Guide

This file provides AI assistants with context about the Toscana Events codebase: structure, conventions, workflows, and key architectural decisions.

---

## Project Overview

**Toscana Events** is a private dining event inquiry builder for Toscana Grill. Guests configure their event (room selection, seating, menu, budget) through a multi-step form. Submissions are stored in Supabase, trigger Postmark email notifications, and are reviewed by admins through a protected dashboard.

---

## Monorepo Structure

```
Toscana-Events/
├── frontend/          # React + Vite SPA (guest-facing + admin UI)
├── backend/           # Express.js REST API
├── shared/            # Shared TypeScript types (used by both sides)
├── assets/            # Static images / branding
├── package.json       # Root monorepo config (npm workspaces)
├── tsconfig.json      # Root TS config (extended by both sides)
├── .nvmrc             # Node 20.x
└── README.md          # Project setup docs
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 7, React Router 6, Bootstrap 5, TypeScript 5 |
| Backend | Node.js 20, Express 4, TypeScript 5, tsx (dev runner) |
| Database | Supabase (PostgreSQL) |
| Email | Postmark |
| Deployment | Vercel (frontend), Render (backend) |

---

## Frontend (`frontend/`)

### Source Layout

```
frontend/src/
├── api/index.ts             # All API client functions (fetch wrappers)
├── auth/AuthContext.tsx     # Auth state + login/logout, wraps entire app
├── components/
│   ├── EventDetailsForm.tsx     # Multi-mode form: contact / basics / buyout
│   ├── SeatingMap.tsx           # Visual-only seating diagram
│   ├── SeatingConfigurator.tsx  # Interactive table selection
│   ├── MenuBuilder.tsx          # Course-by-course menu selection
│   ├── MenuTemplate.ts          # Default course templates
│   ├── InquiryReview.tsx        # Read-only summary before submit
│   ├── PricingSummary.tsx       # Live cost breakdown
│   ├── Stepper.tsx              # Multi-step form navigation
│   ├── Layout.tsx               # App shell: header, nav, footer
│   └── RequireAdmin.tsx         # Route guard for admin pages
├── pages/
│   ├── LandingPage.tsx
│   ├── EventBuilderPage.tsx     # Main guest form flow
│   ├── AdminLoginPage.tsx
│   ├── AdminInquiriesPage.tsx   # View & manage submitted inquiries
│   ├── AdminMenuPage.tsx        # CRUD for menu items / categories
│   ├── AdminTemplatesPage.tsx   # CRUD for menu templates
│   └── AdminRoomsPage.tsx       # CRUD for room layouts
├── types/index.ts           # Re-exports shared types + frontend-specific interfaces
├── App.tsx                  # Route definitions, Layout wrapper
├── main.tsx                 # Entry: ReactDOM.render + AuthProvider + BrowserRouter
└── index.css                # Global styles + Bootstrap overrides (28KB)
```

### Key Conventions

- **No global state manager** — use React hooks (`useState`, `useEffect`, `useMemo`, `useContext`)
- **Controlled components** — all form inputs are controlled via `onChange` handlers
- **API calls** go through `src/api/index.ts` — never fetch directly inside components
- **Types** are imported from `src/types/index.ts` (which re-exports from `@shared/types`)
- **Path alias**: `@shared/*` resolves to `../shared/*` (configured in `vite.config.ts`)
- **Bootstrap** is the primary styling system; `index.css` provides overrides and custom classes
- **No test suite** — no Vitest/Jest configuration exists; don't assume test tooling is available

### Dev Server

```bash
# From repo root
npm run dev

# Or from frontend/ directly
npm run dev   # starts Vite on http://localhost:5173
```

The frontend proxies to backend at `VITE_API_BASE` (defaults to `http://localhost:5001/api`).

---

## Backend (`backend/`)

### Source Layout

```
backend/src/
├── app.ts                   # Express app: middleware, route mounting, CORS
├── server.ts                # HTTP server startup + Supabase health check
├── config/
│   ├── env.ts               # Parses + validates all env vars
│   └── supabase.ts          # Two Supabase client instances: admin & anon
├── middleware/
│   └── requireAdmin.ts      # JWT auth guard (cookie or Bearer token)
├── controllers/
│   ├── inquiryController.ts # Submit inquiry, pricing calc, list/get/update
│   ├── menuController.ts    # Menu categories, items, templates CRUD
│   ├── roomController.ts    # Room layouts CRUD
│   ├── draftController.ts   # Draft save/load (partial inquiry state)
│   └── seedController.ts    # DB initialization / seeding
├── services/
│   ├── mailService.ts       # Postmark: send email helper
│   └── emailTemplates.ts    # HTML + plain-text email builders
├── types/
│   └── tables.ts            # DB row types (snake_case, mirrors Supabase schema)
└── routes/
    ├── authRoutes.ts
    ├── inquiryRoutes.ts
    ├── menuRoutes.ts
    ├── roomRoutes.ts
    ├── draftRoutes.ts
    ├── adminInquiryRoutes.ts
    ├── adminMenuRoutes.ts
    ├── adminRoomsRoutes.ts
    ├── adminDraftRoutes.ts
    └── seedRoutes.ts
```

### API Endpoints

#### Public

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Admin logout |
| GET | `/api/auth/session` | Validate session |
| POST | `/api/inquiries` | Submit event inquiry |
| GET | `/api/menu/categories` | List menu categories |
| GET | `/api/menu/items` | List menu items (filter by `category`, `active`) |
| GET | `/api/menu/templates` | List menu templates |
| GET | `/api/rooms` | List room layouts |
| GET | `/api/drafts` | List drafts by `?email=` |
| GET | `/api/drafts/:id` | Get draft |
| POST | `/api/drafts` | Create draft |
| PATCH | `/api/drafts/:id` | Update draft |

#### Admin (requires `requireAdmin` middleware — JWT via cookie or Bearer token)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/inquiries` | List all inquiries |
| GET | `/api/admin/inquiries/:id` | Get inquiry details |
| PATCH | `/api/admin/inquiries/:id/status` | Update inquiry status |
| POST/PATCH/DELETE | `/api/admin/menu/categories/:id?` | Category CRUD |
| POST/PATCH/DELETE | `/api/admin/menu/items/:id?` | Item CRUD |
| POST | `/api/admin/menu/items/dedupe` | Deduplicate items (`?dryRun=true`) |
| POST/PATCH/DELETE | `/api/admin/menu/templates/:id?` | Template CRUD |
| POST/PATCH/DELETE | `/api/admin/rooms/:id?` | Room CRUD |
| GET | `/api/admin/drafts` | List all drafts |
| DELETE | `/api/admin/drafts/:id` | Delete draft |

### Key Conventions

- **Route files** define HTTP routes and call controller functions — keep logic out of routes
- **Controllers** hold business logic; they use Supabase client directly (no ORM/repository layer)
- **DB types** (`backend/src/types/tables.ts`) use **snake_case** matching Supabase column names
- **Shared types** (`shared/types.ts`) use **camelCase** for the application layer
- Convert between snake_case ↔ camelCase at the API boundary (in controllers)
- Email sending is **optional**: if `POSTMARK_SERVER_TOKEN` or `EMAIL_FROM` env vars are absent, emails are silently skipped
- The `requireAdmin` middleware accepts JWT from either `sb-access-token` cookie or `Authorization: Bearer <token>` header

### Dev Server

```bash
# From repo root
npm run dev   # starts both frontend and backend via concurrently

# Or from backend/ directly
npm run dev   # tsx watch on http://localhost:5001
```

---

## Shared Types (`shared/types.ts`)

Single source of truth for domain types used by both frontend and backend.

Key interfaces:
- `MenuCategory`, `MenuItem`, `MenuTemplate`
- `RoomLayout`, `SeatingConfig`, `TableMeta`, `TableArea`
- `EventInquiry`, `CreateInquiryPayload`, `InquiryStatus`
- `MenuSelectionCourse`, `PricingSummary`

**Path alias**: both `frontend/tsconfig.json` and root `tsconfig.json` map `@shared/*` → `../shared/*`.

When adding new shared data structures, add them here first.

---

## Database Schema (Supabase / PostgreSQL)

| Table | Key Columns |
|---|---|
| `menu_categories` | `id`, `name`, `sort_order` |
| `menu_items` | `id`, `category_id`, `name`, `description`, `price_per_person`, `is_vegetarian`, `is_vegan`, `is_gluten_free`, `active` |
| `menu_templates` | `id`, `name`, `description`, `sort_order`, `courses` (JSON) |
| `room_layouts` | `id`, `name`, `capacity`, `description`, `default_table_config` (JSON), `tables` (JSON), `areas` (JSON) |
| `event_inquiries` | `id`, `created_at`, `updated_at`, `status`, contact fields, `occasion_type`, `event_date`, `event_time`, `guest_count`, `room_layout_id`, `seating_config` (JSON), `menu_selection` (JSON), `dietary_notes`, `special_requests`, pricing fields, `is_buyout`, `buyout_amount` |
| `drafts` | `id`, `email`, `data` (JSON), `created_at`, `updated_at` |

Complex nested data (seating configs, menu selections, table layouts) is stored as JSON columns for flexibility.

---

## Pricing Logic

Calculated server-side in `inquiryController.ts`:

- **Service charge**: 18% of food subtotal
- **Tax**: 5% applied to (subtotal + service charge)
- **Buyout mode**: fixed `buyout_amount` replaces per-person calculation
- **Deposit**: determined by guest count (see `emailTemplates.ts`)

Never recalculate pricing on the frontend for final storage — the server is authoritative.

---

## Authentication

- **Provider**: Supabase Auth (PostgreSQL-backed)
- **Session storage**: HTTP-only cookie (`sb-access-token`) or Bearer token
- **Admin check**: `requireAdmin` middleware validates JWT with Supabase; checks user role
- **Frontend guard**: `RequireAdmin` component wraps admin routes; `AuthContext` manages session state
- **Login flow**: `POST /api/auth/login` → sets cookie → redirects to admin dashboard

---

## Environment Variables

### Backend (`.env` in `backend/`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Admin-level Supabase key |
| `SUPABASE_ANON_KEY` | No | — | Anon key (for auth flows) |
| `POSTMARK_SERVER_TOKEN` | No | — | Email token (emails disabled if absent) |
| `EMAIL_FROM` | No | — | Sender address (emails disabled if absent) |
| `PORT` | No | `5001` | HTTP server port |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Comma-separated CORS origins |

### Frontend (`.env` in `frontend/`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE` | No | `http://localhost:5001/api` | Backend API base URL |

> Note: There are no `.env.example` files in the repo. Reference this table when setting up a new environment.

---

## Development Workflow

### Initial Setup

```bash
# Install all dependencies
npm run install:all

# Set up backend env
cp backend/.env.example backend/.env   # (file doesn't exist yet — create manually)
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Start both servers
npm run dev
```

### Scripts (root `package.json`)

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `concurrently "npm run dev --prefix frontend" "npm run dev --prefix backend"` | Start both servers |
| `npm run install:all` | installs root + workspaces | Install all dependencies |

### Frontend-only

```bash
cd frontend && npm run dev    # Vite dev server on :5173
cd frontend && npm run build  # Production build → dist/
```

### Backend-only

```bash
cd backend && npm run dev     # tsx watch mode on :5001
cd backend && npm run build   # tsc → dist/
cd backend && npm start       # Run compiled dist/server.js
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Serves `frontend/dist/`; set `VITE_API_BASE` env var |
| Backend | Render | Runs `npm start` from `backend/`; set all backend env vars |

---

## Code Conventions

- **TypeScript strict mode** is enabled — avoid `any` unless necessary
- **No linter config** (ESLint/Prettier not configured) — follow existing code style
- **No test suite** — manual testing only; don't add test file stubs
- **camelCase** for all TypeScript variables, functions, and interfaces
- **snake_case** only in database table type definitions (`backend/src/types/tables.ts`)
- **Imports**: use `@shared/` alias for shared types, relative imports otherwise
- **Error handling**: controllers return `{ error: string }` with appropriate HTTP status codes
- **Comments**: only where logic is non-obvious; avoid redundant JSDoc on simple functions

---

## Common Tasks

### Add a new API endpoint

1. Add route in `backend/src/routes/<feature>Routes.ts`
2. Implement handler in `backend/src/controllers/<feature>Controller.ts`
3. Mount route in `backend/src/app.ts`
4. Add corresponding fetch function in `frontend/src/api/index.ts`
5. Add/update types in `shared/types.ts` if new data shapes are needed

### Add a new admin page

1. Create page component in `frontend/src/pages/Admin<Feature>Page.tsx`
2. Add route in `frontend/src/App.tsx` wrapped with `<RequireAdmin>`
3. Add nav link in `frontend/src/components/Layout.tsx`

### Add a new shared type

1. Define interface in `shared/types.ts`
2. Import via `@shared/types` in both frontend and backend

### Update database schema

1. Apply migration in Supabase dashboard (no migration files tracked in repo)
2. Update `backend/src/types/tables.ts` to match new columns
3. Update `shared/types.ts` if the client-facing shape changes
4. Update relevant controller(s) to handle new fields

---

## File Naming Conventions

| Location | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `MenuBuilder.tsx` |
| React pages | PascalCase `Page.tsx` | `AdminMenuPage.tsx` |
| Non-component TS | camelCase `.ts` | `menuController.ts` |
| Route files | camelCase `Routes.ts` | `adminMenuRoutes.ts` |
| Config files | camelCase `.ts` | `supabase.ts` |
