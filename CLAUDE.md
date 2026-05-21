# CLAUDE.md — Toscana Events Codebase Guide

This file provides AI assistants with context about the Toscana Events codebase: structure, conventions, workflows, and key architectural decisions.

---

## Project Overview

**Toscana Events** is a private dining event inquiry builder for Toscana Grill. Guests plan their event through a **Claude Haiku 4.5 chatbot concierge** (`/build` page) that fills out a live inquiry form alongside the chat. Submissions are stored in Supabase, trigger Postmark email notifications, and are reviewed by admins through a protected dashboard. Every chat conversation is persisted to `chat_transcripts` for audit + lead recovery.

The chatbot is the primary intake — there is no longer a multi-step manual form. The live form on the right of the chat page is editable but is driven by the bot's `update_inquiry_fields` tool calls.

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
| Chat AI | Anthropic Claude Haiku 4.5 (SSE streaming + tool use) |
| Bot abuse gate | Cloudflare Turnstile (invisible captcha) + HMAC-signed session tokens |
| Availability | Apify OpenTable Booker scraper |
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
│   ├── ChatPage.tsx             # Primary guest intake: chatbot + live inquiry form (/build)
│   ├── EventBuilderPage.tsx     # LEGACY multi-step form (still routed but unused as default)
│   ├── AdminLoginPage.tsx
│   ├── AdminInquiriesPage.tsx   # View & manage submitted inquiries
│   ├── AdminMenuPage.tsx        # CRUD for menu items / categories
│   ├── AdminTemplatesPage.tsx   # CRUD for menu templates
│   ├── AdminRoomsPage.tsx       # CRUD for room layouts
│   └── AdminTranscriptsPage.tsx # View all chatbot conversations (audit / lead recovery)
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
│   ├── inquiryController.ts            # Submit inquiry, pricing calc, list/get/update. Links chat transcripts via chatSessionId.
│   ├── menuController.ts               # Menu categories, items, templates CRUD
│   ├── roomController.ts               # Room layouts CRUD
│   ├── draftController.ts              # Draft save/load (partial inquiry state, legacy form)
│   ├── seedController.ts               # DB initialization / seeding
│   ├── chatController.ts               # ⭐ Claude SSE streaming + tool loop + transcript persistence. The system prompt lives here (buildSystemPrompt). Also exports issueChatSession for Turnstile-gated token issuance.
│   ├── availabilityController.ts       # Thin HTTP wrapper around availability service
│   └── adminChatTranscriptController.ts # Admin: list + view full chat transcripts
├── services/
│   ├── mailService.ts          # Postmark: send email helper
│   ├── emailTemplates.ts       # HTML + plain-text email builders
│   ├── availabilityService.ts  # Apify OpenTable call (also used directly by chat tool handler — no self-loop HTTP)
│   ├── turnstile.ts            # Cloudflare Turnstile siteverify call
│   └── chatSession.ts          # HMAC-signed session tokens (1-hour TTL, timing-safe verify)
├── types/
│   └── tables.ts            # DB row types (snake_case). Includes ChatTranscriptRow + TranscriptTurn/TranscriptToolCall.
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
    ├── adminChatTranscriptRoutes.ts
    ├── chatRoutes.ts          # POST /api/chat (SSE) + POST /api/chat/session (token issuance)
    ├── availabilityRoutes.ts
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
| POST | `/api/inquiries` | Submit event inquiry (accepts optional `chatSessionId` to link transcript) |
| POST | `/api/chat/session` | Issue signed chat session token (gated by Turnstile in prod). Body: `{ sessionId, turnstileToken }` → `{ token }`. Rate-limited 10/15min/IP. |
| POST | `/api/chat` | SSE stream chat reply. Requires `Authorization: Bearer <session token>`. Body: `{ messages, sessionId }`. Rate-limited 12/min/IP. |
| GET | `/api/availability` | Check OpenTable availability for a date + party size (Apify-backed). Rate-limited 30/min/IP. |
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
| GET | `/api/admin/chat-transcripts` | Paginated list of chatbot conversations (newest first) |
| GET | `/api/admin/chat-transcripts/:id` | Full transcript including tool calls + field updates |

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
| `chat_transcripts` | `id`, `session_id` (unique), `created_at`, `updated_at`, `last_message_at`, `inquiry_id` (FK → event_inquiries, nullable), `contact_email`, `contact_name`, `message_count`, `transcript` (JSONB — `TranscriptTurn[]`) |

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
| `ADMIN_NOTIFICATION_EMAIL` | No | — | Where admin inquiry-notification emails go |
| `ANTHROPIC_API_KEY` | No (in dev) / Yes (prod) | — | If unset, `/api/chat` returns 503. Required for the chatbot to work. |
| `CHAT_SESSION_SECRET` | Yes in production | auto-generated in dev | HMAC secret for signing chat session tokens. Backend throws on boot if unset in prod. Dev auto-generates ephemeral. |
| `TURNSTILE_SECRET_KEY` | Yes in production | — | Cloudflare Turnstile secret. If unset in prod, `/api/chat/session` returns 503 "Chat verification is not configured." In dev, Turnstile is bypassed. |
| `APIFY_TOKEN` | No | — | Apify token for OpenTable availability scraper. Without it, `check_availability` reports "team will confirm." |
| `OPENTABLE_RESTAURANT_ID` | No | — | OpenTable restaurant ID for availability lookups. |
| `NODE_ENV` | No | `development` | Render sets this to `production` automatically. |
| `PORT` | No | `5001` | HTTP server port |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Comma-separated CORS origins |

### Frontend (`.env` in `frontend/`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE` | No | `http://localhost:5001/api` | Backend API base URL |
| `VITE_TURNSTILE_SITE_KEY` | Yes in production | — | Cloudflare Turnstile public site key. Baked into the bundle at build time — Vercel must be redeployed after changing this. |

> Note: There are no `.env.example` files in the repo. Reference this table when setting up a new environment. Render/Vercel **do not** read `.env` files from the repo — env vars must be set in their dashboards.

### Generating secrets

```bash
# CHAT_SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

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

---

## Chatbot Architecture

The chatbot is the **primary intake path** for the project — guests land on `/build`, are gated through Turnstile, then walk through an Italian-restaurant private-dining concierge conversation while a live inquiry form updates beside the chat.

### Request flow

1. **First load (`ChatPage.tsx`)** — generates a `sessionId` (UUID), renders Turnstile widget invisibly.
2. **Begin Planning click** — Turnstile token + sessionId → `POST /api/chat/session` → returns HMAC-signed session token (1-hour TTL). Stored in `localStorage` (key `toscana:chat:token:v1`).
3. **Each user message** → `POST /api/chat` with `Authorization: Bearer <token>` and body `{ messages, sessionId }`.
4. **Backend** (`chatController.chat`) — verifies token, runs the Anthropic streaming loop:
   - Streams assistant text via SSE (`[TEXT]` frames).
   - On tool use: executes `check_availability` (calls `availabilityService` directly), `get_menu_items` (Supabase lookup), or `update_inquiry_fields` (forwards JSON to frontend as `[FIELD_UPDATE]` frame).
   - After each loop iteration, builds a `TranscriptTurn` and persists via `persistTranscript()` (upsert by `session_id`).
5. **Submit Inquiry** → frontend passes `chatSessionId` in the create-inquiry payload. Backend then updates `chat_transcripts.inquiry_id` to link the transcript to the saved inquiry.

### System prompt (in `chatController.ts → buildSystemPrompt`)

Lives entirely in code — no template file. Key sections to know:

- **Opening** — sets warm, family-owned-and-locally-run tone. The bot is told to weave this into its first reply.
- **Conversation Order** — occasion → date/time → guest count → **budget** → room (+ `check_availability`) → menu style → menu → drinks → dietary → contact → closing wrap-up.
- **Pricing Etiquette** (very important) — **never quote per-person totals above $70 mid-chat**, never mention 18% service charge / 5% tax until the wrap-up, never bring up buyout minimums ($5k/$7k/$10k) until the guest asks or the closing summary. Minimums are framed positively ("easy to hit with menu + drinks").
- **Menu rules** — Italian Platter is **buffet-only** (never recommended as a set-course appetizer). Set-course appetizer defaults: Caprese, Bruschetta, Arancini, Insalata.
- **Closing & Commitment Signals** — when the guest says "let's lock that in," "sounds good," etc., the bot **stops re-opening choices** and pivots straight to contact info, then does the wrap-up summary (this is where minimums + all-in totals finally surface).
- **Availability** — bot is told to call `check_availability` proactively once date + guest count are known, and to state real results confidently.

### Tools the bot can call

| Tool | Purpose |
|---|---|
| `update_inquiry_fields` | Send any subset of inquiry fields. Backend streams them to the frontend as `[FIELD_UPDATE]`; LiveInquiryForm highlights changed fields for 1.6s. Also tracked into the transcript as `field_updates`. |
| `check_availability` | Calls `availabilityService.checkOpenTableAvailability` directly (no HTTP self-loop). Requires `APIFY_TOKEN` + `OPENTABLE_RESTAURANT_ID`; if unset, returns a graceful "team will confirm" string. |
| `get_menu_items` | Supabase query by category. The bot uses returned IDs to build `menuSelection.courses[].itemIds`. |

### Anti-abuse layers

1. **Cloudflare Turnstile** gates session-token issuance (verifies user is human).
2. **HMAC-signed session tokens** (1h TTL, `crypto.timingSafeEqual` verify) gate every chat request.
3. **Express rate limits**: `/api/chat` 12/min/IP, `/api/chat/session` 10/15min/IP.
4. **Server caps**: max 60 messages per session, `max_tokens` 512 on the LLM call.

### Transcript persistence

- `persistTranscript()` in `chatController.ts` upserts after every turn (success path **and** error path).
- Wrapped in try/catch — **never** breaks the chat if Supabase fails or the table is missing.
- Captures user messages, assistant text, tool calls (with inputs + results), and field updates.
- Admin viewer: `AdminTranscriptsPage` at `/admin/transcripts` (linked from every other admin page).

---

## Recent Work & Where We Left Off

### Latest sessions (most recent first)

**Conversion-tuning + full transcript capture (current session).** Major rewrite of the system prompt for a warmer, family-owned, budget-first tone with a "Pricing Etiquette" discipline (no per-head numbers >$70 mid-chat, minimums deferred to wrap-up, no Italian Platter for set-course, anchor-before-downgrade, drink-tickets nudge, confident-close on commitment signals). Added the `chat_transcripts` table + `persistTranscript()` helper + admin viewer page (`AdminTranscriptsPage`) so every conversation is auditable. Inquiry submission now links the transcript via `chatSessionId`.

**Turnstile + session-token gating.** Added Cloudflare Turnstile (invisible captcha) + HMAC-signed session tokens to prevent Anthropic-API-cost abuse on the unauthenticated `/api/chat` endpoint. New endpoint `POST /api/chat/session` issues tokens; `/api/chat` requires `Authorization: Bearer <token>`. Backend throws on boot in production if `CHAT_SESSION_SECRET` is missing.

**Chatbot rework.** Replaced the 8-step manual form with the Haiku 4.5 chatbot on `/build` (`ChatPage.tsx`). Removed seating selection. Live inquiry form sits beside the chat and is updated via the bot's `update_inquiry_fields` tool. SSE protocol uses `[TEXT]`, `[FIELD_UPDATE]`, `[ERROR]`, `[DONE]` frames.

**Audit fixes.** Extracted Apify OpenTable into `availabilityService` (no more HTTP self-loop from chat tool). Fixed timezone (`America/Edmonton`). Preserved streaming-message id across updates.

### ⚠️ Pending: must do before transcripts work in production

**Apply this migration in Supabase → SQL Editor:**

```sql
create table chat_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_message_at timestamptz default now(),
  inquiry_id uuid references event_inquiries(id) on delete set null,
  contact_email text,
  contact_name text,
  message_count integer not null default 0,
  transcript jsonb not null default '[]'::jsonb
);
create unique index uq_chat_transcripts_session on chat_transcripts(session_id);
create index idx_chat_transcripts_last_message on chat_transcripts(last_message_at desc);
```

Until this runs, the upsert in `persistTranscript()` will silently fail (try/catch swallows the error) — chat will keep working, but no transcripts will appear in `/admin/transcripts`.

### Deployment notes that already cost us a deploy cycle

- **Render build cache** is stale after dep changes. Backend service's Build Command is now `npm install && npm run build` (not just `npm run build`) so new deps are installed. If you ever see "Cannot find module 'X'" in Render build logs, that's why.
- **Vercel** does **not** rebuild on env-var changes. After setting `VITE_*` vars, manually redeploy — Vite bakes them into the bundle at build time.
- **SPA routing 404 fix**: `frontend/vercel.json` rewrites all paths to `/index.html` so refreshing on `/build` or `/admin/*` doesn't 404.
- **Render auto-sets `NODE_ENV=production`** — this is why the prod guards (chat session secret required, Turnstile required) trip on Render.

### Potential next steps (open product questions, not yet committed)

- **Save & resume** path for abandoned chats — `chat_transcripts` already captures everything, but there's no email-the-guest-their-recap flow yet.
- **Tighter early lead capture** — bot still asks for email at step 10 (right before submit). Could push to step 5–6 to capture more abandoned-cart leads.
- **Drink-ticket pricing in the prompt** — the bot now nudges drink tickets but says "team will follow up with pricing." Real pricing would be more conversational.
- **APIFY_TOKEN + OPENTABLE_RESTAURANT_ID** are not set in production yet — `check_availability` returns "team will confirm" until they are.
- **Untracked file** `assets/landingpage/lp_image.jpeg` is still loose in the repo — decide whether to commit or `.gitignore`.
