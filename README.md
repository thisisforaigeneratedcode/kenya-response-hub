# Kaa-Rada — Real-Time Disaster Management for Kenya

> **Report. Respond. Recover.**

Kaa-Rada is a real-time flood and disaster management web application built for Kenya's 47 counties. It connects citizens reporting emergencies with responders and administrators through a unified, dark-themed command-center interface.

**Live URL:** https://kaa-rada-guard.lovable.app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 (SPA) |
| Styling | Tailwind CSS (custom dark design system) |
| UI Components | shadcn/ui (Radix primitives) |
| Backend / Auth | Supabase (Auth, PostgreSQL, Realtime, Storage) |
| Maps | Leaflet.js + react-leaflet |
| Charts | Recharts |
| Icons | lucide-react |
| Animations | Framer Motion |

---

## Design System

All colors are defined in `src/index.css` and `tailwind.config.ts`. **No raw color values in components.**

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0f172a` | Page backgrounds |
| Surface | `#1e293b` | Cards, panels |
| Border subtle | `#334155` | Dividers |
| Primary (Sky Blue) | `#38bdf8` | Actions, links, medium severity |
| Success (Emerald) | `#34d399` | Resolved status, low severity |
| Warning (Amber) | `#f59e0b` | Pending status, high severity |
| Danger (Rose) | `#fb7185` | Critical severity |
| AI Purple | `#a78bfa` | AI triage panels |
| Font | Inter | Imported from Google Fonts |

**Severity Scale:** Rose (5/Critical) → Amber (4/High) → Sky Blue (3/Medium) → Emerald (1-2/Low)

---

## User Roles

Stored in the `profiles` table. Users select their role at signup.

| Role | Access |
|------|--------|
| **Citizen** | Report incidents, view own reports, message responders |
| **Responder** | Real-time incident queue, assign to self, live map, messaging |
| **Admin** | System-wide stats, user management, all incidents, broadcast alerts |

---

## Pages & Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with live counters, hero section, animated severity rings |
| `/auth` | Public | Login / Signup with role selection and county picker |
| `/report` | Citizen | Incident report form with GPS auto-detect, photo upload, AI triage |
| `/my-incidents` | Citizen | List of own reports with status timeline and messaging links |
| `/dashboard` | Responder, Admin | Real-time incident queue with filters, stats bar, detail side panel |
| `/map` | Responder, Admin | Leaflet map of Kenya with severity-coded pins and pulse animations |
| `/admin` | Admin | System stats, user management table, incidents table, broadcast form |
| `/messages/:id` | Authenticated | Threaded chat per incident (Supabase Realtime) |

---

## Database Schema (Supabase)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid | References `auth.users` |
| full_name | text | |
| role | text | `citizen`, `responder`, or `admin` |
| county | text | One of 47 Kenya counties |
| phone | text | Optional |
| created_at | timestamptz | Default now() |

### `incidents`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| reporter_id | uuid | References `auth.users` |
| title | text | |
| description | text | |
| incident_type | text | Flood, Landslide, Displacement, Infrastructure Damage, Medical Emergency |
| severity_self | int | 1-5, citizen self-assessment |
| ai_severity | int | 1-5, from AI triage (nullable) |
| ai_safety_guide | text | AI-generated safety instructions (nullable) |
| lat / lng | float8 | GPS coordinates (nullable) |
| county | text | |
| photo_url | text | Supabase Storage URL (nullable) |
| status | text | `pending` → `assigned` → `resolved` |
| created_at | timestamptz | Default now() |

### `assignments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| incident_id | uuid | FK → incidents |
| responder_id | uuid | FK → auth.users |
| assigned_at | timestamptz | |
| notes | text | Optional |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| incident_id | uuid | FK → incidents |
| sender_id | uuid | FK → auth.users |
| content | text | |
| created_at | timestamptz | |

### Storage
- **Bucket:** `incident-photos` (public read, authenticated upload)

### Realtime
- Enabled on `incidents` and `messages` tables

### Row Level Security (RLS)
- All tables have RLS enabled
- Citizens can only read/update their own profiles and incidents
- Responders can read all incidents and manage their own assignments
- Policies enforce role-based access at the database level

---

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `SeverityBadge` | `src/components/SeverityBadge.tsx` | Color-coded severity label (1-5) |
| `SeverityRing` | `src/components/SeverityRing.tsx` | Animated pulsing ring for map pins / cards |
| `IncidentCard` | `src/components/IncidentCard.tsx` | Reusable incident summary card |
| `AISafetyGuide` | `src/components/AISafetyGuide.tsx` | Purple-accented AI safety instructions panel |
| `StatusTimeline` | `src/components/StatusTimeline.tsx` | Horizontal progress: Reported → Assigned → Resolved |
| `LiveCounter` | `src/components/LiveCounter.tsx` | Animated counter for landing page stats |
| `CitizenLayout` | `src/components/CitizenLayout.tsx` | Top nav layout for citizen pages |
| `ResponderLayout` | `src/components/ResponderLayout.tsx` | Sidebar layout for responder/admin pages |
| `NavLink` | `src/components/NavLink.tsx` | Active-aware navigation link |

---

## Current Status

### ✅ Completed
- Full dark-themed UI across all pages
- Supabase Auth integration (email/password signup & login)
- Role-based routing and protected routes
- Incident reporting form with GPS auto-detect and photo upload
- AI triage UI (currently using **mock data** — returns random severity 3-5)
- Real-time incident dashboard with filters and sorting
- Live map with Leaflet.js and severity-coded pins
- Messaging system with Supabase Realtime
- Admin dashboard with Recharts visualizations
- Landing page with animated live counters
- All RLS policies configured

### 🔜 To Do
- [ ] **Wire real AI triage** — Replace mock `triageIncident()` in `src/lib/supabase.ts` with Gemini API call via Supabase Edge Function
- [ ] **Photo upload to Storage** — Wire file input to Supabase Storage bucket `incident-photos`
- [ ] **Email notifications** — Broadcast alert system for responders (admin feature)
- [ ] **Heatmap overlay** — Toggle heatmap layer on the map page
- [ ] **Push notifications** — Browser push for new critical incidents
- [ ] **User role management** — Admin ability to change user roles (UI exists, needs backend wiring)
- [ ] **Mobile responsiveness audit** — Test and polish on small screens
- [ ] **Production security review** — Audit RLS policies, add rate limiting

---

## Environment Variables

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_GEMINI_API_KEY=<for-future-ai-triage>
```

---

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui primitives
│   ├── SeverityBadge.tsx
│   ├── SeverityRing.tsx
│   ├── IncidentCard.tsx
│   ├── AISafetyGuide.tsx
│   ├── StatusTimeline.tsx
│   ├── LiveCounter.tsx
│   ├── CitizenLayout.tsx
│   ├── ResponderLayout.tsx
│   └── NavLink.tsx
├── contexts/
│   └── AuthContext.tsx   # Auth state & role management
├── integrations/
│   └── supabase/         # Auto-generated client & types
├── lib/
│   └── supabase.ts       # Types, helpers, mock AI triage
├── pages/                # Route-level page components
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx
│   ├── ReportPage.tsx
│   ├── MyIncidentsPage.tsx
│   ├── DashboardPage.tsx
│   ├── MapPage.tsx
│   ├── AdminPage.tsx
│   └── MessagesPage.tsx
├── App.tsx               # Routes & protected route wrapper
├── main.tsx
└── index.css             # Design tokens & global styles
```
