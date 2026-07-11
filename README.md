# Waypoint

**Editorial, photo-forward travel guides** — a printed guidebook on screen, not a dashboard.

Waypoint is a course project for building a full-stack web app: authors create curated map guides with places, photos, and notes, then share them via a public link. If you're taking a class that uses this repo, this README is your starting point.

## What you'll build

Waypoint lets a single author:

- Create **guides** (title, description, cover photo, public/private toggle)
- Add **places** on an interactive map (name, address, notes, rating, category)
- Attach **photos** to each place (with EXIF GPS extraction when available)
- **Publish** a guide at a shareable URL like `/g/copenhagen-again`
- Let visitors **browse** public guides without signing in

The product is intentionally narrow: one author, no social features, no collaboration. That scope keeps the codebase focused on solid fundamentals — data modeling, auth, spatial queries, and polished UI.

## Technology stack

| Layer | Technology | Why it's here |
|-------|------------|---------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) | File-based routing, Server Components, API routes, deployment on Vercel |
| UI | [React 19](https://react.dev/) + TypeScript (strict) | Component model with full type safety |
| Database & auth | [Supabase](https://supabase.com/) (PostgreSQL) | Managed Postgres, row-level security, and built-in auth |
| Geospatial | [PostGIS](https://postgis.net/) | `geography(Point, 4326)` columns and spatial indexes for map queries |
| Maps | [MapLibre GL](https://maplibre.org/) | Interactive map rendering with a custom editorial style |
| Photos | Supabase Storage + [exifr](https://github.com/MikeKovarik/exifr) | Private image storage with signed URLs; GPS from image metadata |
| Validation | [Zod](https://zod.dev/) | Runtime validation for env vars and API inputs |
| Testing | [Vitest](https://vitest.dev/) | Unit and integration tests |

Deployed target: **Vercel**. Database and storage: **Supabase** (local via the Supabase CLI, or a hosted project).

## Core concepts (worth studying)

These are the ideas the project is designed to teach:

1. **Relational + spatial data** — Guides → Places → Photos, with place locations stored as PostGIS geography points (not separate `lat`/`lng` columns).
2. **Row Level Security (RLS)** — Authors can only edit their own guides; public guides are readable by anyone.
3. **Server vs. client components** — Data fetching and auth happen on the server by default; client components only where interactivity is needed (maps, forms, hover sync).
4. **Query layer** — All database access goes through typed functions in `src/queries/`, not inline in components.
5. **Signed URLs** — Photos live in a private storage bucket; the app issues short-lived signed links so images load securely in the browser.
6. **Map ↔ list sync** — Hovering a place card highlights its pin; clicking a pin scrolls the card into view.

## Data model

```
users
    id, handle, display_name

guides
    id, user_id, title, description, cover_photo_url, is_public, slug

places
    id, guide_id, name, address, notes, rating, category, sort_order,
    location  (geography Point, 4326)

photos
    id, place_id, storage_path, caption, sort_order
```

See [`CONTRACT.md`](./CONTRACT.md) for the authoritative schema rules and [`PRD.md`](./PRD.md) for product scope.

## Project structure

```
src/
  app/              # Next.js routes (pages, API routes, server actions)
  components/       # Reusable UI (map, place cards, photo gallery)
  lib/              # Utilities (auth, geocoding, EXIF, env validation)
  queries/          # Typed Supabase query functions
  types/            # Shared TypeScript types
  __tests__/        # Vitest unit and integration tests
supabase/
  migrations/       # SQL schema, RLS policies, PostGIS functions
  seed-acceptance.sql
seed/photos/        # Sample images for the Copenhagen demo guide
scripts/            # Seed and utility scripts
docs/               # API documentation
```

Key routes:

| Route | Purpose |
|-------|---------|
| `/guides` | Author's guide list |
| `/guides/new` | Create a guide (auth required) |
| `/guides/[guideId]` | Guide editor (map + places) |
| `/g/[slug]` | Public read-only guide |
| `/sign-in` | Author sign-in |
| `/api/places/nearby` | Spatial query: places near a point |
| `/api/places/in-bounds` | Spatial query: places visible on the map |

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** (comes with Node)
- **Docker** (for local Supabase)
- **[Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)** (`brew install supabase/tap/supabase` on macOS)

Your instructor may provide a hosted Supabase project instead of local setup — check your course materials.

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd waypoint
npm install
```

### 2. Environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (safe for the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | For seed scripts | Service role key (server-only; never expose to the client) |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical URL for SEO/sitemap (defaults to localhost in dev) |

Env vars are validated at startup via Zod in `src/lib/env.ts` — if something is missing, you'll get a clear error on boot.

### 3. Start Supabase locally

```bash
supabase start
```

Apply migrations (if not already applied):

```bash
supabase db reset
```

After `supabase start`, the CLI prints local API URL and keys. Paste those into `.env.local`.

### 4. Seed demo content (optional)

Load a sample Copenhagen guide with photos:

```bash
npm run seed:content
```

This creates a storage bucket, an author account, and eight places with images from `seed/photos/`.

For acceptance-test fixtures (spatial query test data):

```bash
npm run seed:acceptance
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page redirects to `/guides`.

### 6. Sign in

Authoring routes (`/guides/new`, `/guides/[id]`) require authentication. Use the credentials your instructor provides, or create a user in the Supabase dashboard (Authentication → Users) and set a password with:

```bash
node scripts/set-author-password.mjs
```

## Running tests

```bash
# Unit tests
npm test

# Watch mode (while developing)
npm run test:watch

# Integration tests (needs Supabase running + acceptance seed)
npm run seed:acceptance
npm run test:integration
```

Acceptance criteria are documented in [`TEST_PLAN.md`](./TEST_PLAN.md).

## Documentation to read before coding

Read these in order when you start working on features:

1. [`PRD.md`](./PRD.md) — What the product is (and isn't)
2. [`CONTRACT.md`](./CONTRACT.md) — Data model and build rules
3. [`DESIGN.md`](./DESIGN.md) — Visual spec (colors, typography, components)
4. [`AGENTS.md`](./AGENTS.md) — Engineering conventions for this repo
5. [`docs/api/`](./docs/api/) — HTTP API reference for spatial endpoints

**Rule of thumb:** read `CONTRACT.md` before any database work, and `DESIGN.md` before any UI work.

## Suggested exploration path

If you're new to the codebase, try this order:

1. Visit a public guide at `/g/<slug>` after seeding — see the reader experience.
2. Open `src/app/g/[slug]/page.tsx` and `src/components/guide-viewer.tsx` — how map and cards stay in sync.
3. Trace a place query from `src/queries/places.ts` through to the PostGIS functions in `supabase/migrations/`.
4. Follow photo upload from `src/app/guides/[guideId]/guide-editor.tsx` → `src/lib/place-photo-upload.ts` → signed URL in `src/app/api/photos/[photoId]/signed-url/route.ts`.
5. Read the RLS policies in `supabase/migrations/20260709160441_waypoint_schema.sql` — understand who can read and write what.

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm test` | Run unit tests |
| `npm run test:integration` | Run integration tests |
| `npm run seed:content` | Load Copenhagen demo guide |
| `npm run seed:acceptance` | Load spatial test fixtures |

## Deployment

The app is designed for [Vercel](https://vercel.com/). Set the same environment variables in your Vercel project settings, point `NEXT_PUBLIC_SUPABASE_URL` at your hosted Supabase instance, and deploy. Your course may walk through this step separately.

---

Questions about scope or grading? Check your course syllabus and assignment brief first — this repo implements the product described in `PRD.md` and the rules in `CONTRACT.md`.
