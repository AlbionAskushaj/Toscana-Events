# Toscana Private Dining Builder

Full-stack monorepo for Toscana Italian Grill "Private Dining Builder". Stack: React + TypeScript + Vite (frontend), Express + TypeScript + Supabase (backend), shared TypeScript types.

## Prerequisites
- Node.js 18+
- npm
- Supabase project (acts as the database)

## Supabase setup
1) Create a new Supabase project (e.g., `toscana-private-dining`).
2) Run this SQL in the Supabase SQL editor to create tables:
```sql
create table menu_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sort_order int not null
);

create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references menu_categories(id) on delete cascade,
  name text not null,
  description text default '',
  price_per_person numeric not null,
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  is_gluten_free boolean default false,
  active boolean default true
);

create table menu_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  sort_order int not null default 0,
  courses jsonb not null default '[]'::jsonb
);

create table room_layouts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  capacity int not null,
  description text default '',
  default_table_config jsonb not null,
  tables jsonb default '[]'::jsonb,
  areas jsonb default '[]'::jsonb
);

create table event_inquiries (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  status text default 'new',
  is_buyout boolean default false,
  buyout_amount numeric,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  occasion_type text not null,
  event_date text not null,
  event_time text not null,
  guest_count int not null,
  room_layout_id uuid references room_layouts(id),
  seating_config jsonb not null,
  menu_selection jsonb not null,
  dietary_notes text default '',
  special_requests text default '',
  estimated_price_per_person numeric not null,
  estimated_subtotal numeric not null,
  estimated_service_charge numeric not null,
  estimated_tax numeric not null,
  estimated_total numeric not null
);

create table drafts (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  created_at timestamptz default now()
);

-- seed at least one admin
-- insert into admin_users (email) values ('admin@example.com');
```
3) Grab your Supabase keys:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (used by backend only)
   - `SUPABASE_ANON_KEY` (optional placeholder)
4) In `backend/.env`, set:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
POSTMARK_SERVER_TOKEN=...
EMAIL_FROM=info@toscanagrill.ca
PORT=5001
CLIENT_ORIGIN=http://localhost:5173
```

## Install dependencies
```bash
npm install
npm run install:all
```

## Run dev servers
- Backend: `npm run dev --workspace backend` (port 5001)
- Frontend: `npm run dev --workspace frontend` (port 5173)
- Or run both: `npm run dev` (uses concurrently)

## Seed sample data
After backend is running and environment is set, POST to `http://localhost:5001/api/seed` with an admin session (login at `/admin/login` first) or a bearer token to load menu categories, items, and rooms.

## API endpoints (base `/api`)
- `GET /menu/categories`
- `GET /menu/items?categoryId=&active=`
- `GET /rooms`
- `POST /inquiries` (server calculates pricing)
- `GET /inquiries`
- `GET /inquiries/:id`
- `PATCH /inquiries/:id/status` `{ status: "new" | "reviewing" | "approved" | "declined" }`

## Frontend routes
- `/` Landing
- `/build` Event builder wizard (details → menu → seating → review & submit)
- `/admin/inquiries` Simple admin list and status updates

## Notes
- Admin routes are protected by Supabase auth via the backend; add admin emails to `admin_users`.
- Pricing logic is a simple average per course with 18% service and 5% tax placeholder; adjust to your venue's policy.
