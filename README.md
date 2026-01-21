# Toscana Private Dining Builder

Private dining shouldn't feel like a spreadsheet. This project turns a complex inquiry into a guided, elegant flow that helps guests finish faster, reduces back-and-forth, and improves conversion for restaurants hosting events.

## Why it helps conversion
- **Fewer drop-offs:** Guests answer a few fields at a time, with clear helper text.
- **Better decisions:** Menus and seating are visual, not confusing checklists.
- **Faster follow-up:** Admins get structured inquiries with pricing and clear next steps.
- **Trust building:** A polished UI plus immediate confirmation emails set expectations.

## What it does
- Step-by-step inquiry builder for private dining
- Menu selection with course templates
- Seating layout selection with room-based grids
- Draft saving and resume
- Admin inquiry review with status updates
- Email notifications for guests and staff

## Tech overview
- **Frontend:** React + Vite + TypeScript
- **Backend:** Express + TypeScript
- **Data:** Supabase (Postgres)
- **Email:** Postmark
- **Deploy:** Vercel (frontend), Render (backend)

## Local setup (high level)
1) Create a Supabase project and copy your API keys.
2) Configure backend environment variables (see below).
3) Install dependencies and start both apps.

### Install
```bash
npm install
npm run install:all
```

### Run dev servers
- Backend: `npm run dev --workspace backend` (port 5001)
- Frontend: `npm run dev --workspace frontend` (port 5173)
- Or run both: `npm run dev`

## Environment variables (backend)
Create `backend/.env`:
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
POSTMARK_SERVER_TOKEN=...
EMAIL_FROM=info@toscanagrill.ca
PORT=5001
CLIENT_ORIGIN=http://localhost:5173
```

## Environment variables (frontend)
Create `frontend/.env`:
```
VITE_API_BASE=http://localhost:5001/api
```

## Operational notes
- The backend acts as the single API for data + auth.
- Inquiry submissions trigger guest + admin emails.
- Pricing is calculated server-side and can be customized to your policy.

## Deployment summary
- Set `VITE_API_BASE` in Vercel to your backend URL (e.g. `https://your-render-url/api`).
- Set `CLIENT_ORIGIN` in Render to your frontend domain (comma-separated if needed).
- Redeploy both.
