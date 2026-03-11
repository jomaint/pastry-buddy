# Pastry Buddy

A pastry check-in and discovery app. Users log pastries they've tried, rate them, follow other pastry enthusiasts, build curated lists, and get recommendations. Think Untappd but for pastries.

## Tech Stack

- **Framework:** Next.js 15.2 (App Router, Turbopack)
- **Language:** TypeScript 5.7 (strict mode)
- **React:** 19
- **Styling:** Tailwind CSS 4 (PostCSS plugin)
- **Backend:** Supabase (auth, Postgres DB, RLS)
- **Data fetching:** @tanstack/react-query 5 + @supabase/ssr
- **Forms:** react-hook-form 7 + zod 3 + @hookform/resolvers 5
- **Animations:** framer-motion 12
- **Maps:** react-leaflet 5 / leaflet 1.9
- **Charts:** recharts 2
- **Icons:** lucide-react
- **Linter/Formatter:** Biome 1.9 (not ESLint)

## Project Structure

```
src/
  app/              # Next.js App Router pages (check-in, discover, log, lists, profile, onboarding)
  api/              # Supabase query modules — React Query hooks + query functions
                    #   auth, places, check-ins, leaderboards, lists, onboarding,
                    #   pastries, profiles, recommendations, social
  components/
    layout/         # Header, Shell, Sidebar
    ui/             # Design system primitives (Avatar, Badge, BottomSheet, Button, Card,
                    #   Chip, Confetti, EmptyState, InlineRating, Input, Map, PageTransition,
                    #   PullToRefresh, Rating, Skeleton, TasteMatchPill, Toast)
  hooks/            # use-debounce, use-media-query, use-page-view, use-track-event
  lib/
    supabase/       # Supabase browser client (createClient via @supabase/ssr)
    mock-data.ts    # Static seed/mock data
    place-search.ts # Nominatim (OpenStreetMap) place search
  types/            # TypeScript type definitions
supabase/
  migrations/       # Numbered SQL migrations (001–007)
```

## Development Commands

```sh
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Check with Biome
npm run lint:fix   # Auto-fix with Biome
```

## Architecture Decisions

- **No API routes.** All data fetching is client-side: React Query hooks in `src/api/` call Supabase directly via the browser client. There are no `app/api/` route handlers.
- **Supabase client singleton.** `src/lib/supabase/client.ts` creates one browser client; it gracefully returns a dummy client during build/SSG.
- **Middleware auth guard.** `src/middleware.ts` protects `/log`, `/lists`, `/profile`, `/onboarding` using Supabase server client. Public profile pages (`/profile/[username]`) are excluded.
- **Framer Motion** for page transitions (`PageTransition` component) and micro-interactions.
- **Path alias:** `@/*` maps to `./src/*`.

## Database

### Migrations (apply in order)

1. `001_initial_schema.sql` — Core tables, triggers, views, RLS policies
2. `002_recommendations.sql` — Recommendation engine tables
3. `003_analytics.sql` — Analytics/stats tables
4. `004_social_features.sql` — Social feature extensions
5. `005_onboarding.sql` — Onboarding flow tables
6. `006_leaderboards.sql` — Leaderboard tables
7. `007_social_engagement.sql` — Social engagement features

### Core Tables

- `profiles` — Extends `auth.users`. Has username, level, xp, total_checkins.
- `places` — Name, address, lat/lng, Google Place ID.
- `pastries` — Belongs to a place. Has category, avg_rating (denormalized), total_checkins.
- `check_ins` — User rates a pastry at a place. Rating 1–5, notes, photo, flavor_tags, taste_ratings (JSONB).
- `lists` / `list_items` — User-curated pastry lists.
- `badges` / `user_badges` — Achievement system.
- `follows` — Social graph (follower/following).
- `feed_view` — Materialized view joining check_ins + profiles + pastries + places.

### RLS Pattern

- All tables have RLS enabled.
- Read access is generally public (select where `true`).
- Write access checks `auth.uid()` matches the row's user_id / follower_id.
- List items check ownership via a subquery on the parent list.

### Triggers

- Inserting/deleting a check-in auto-updates `pastries.avg_rating`, `pastries.total_checkins`, and `profiles.total_checkins`.
- `auth.users` insert auto-creates a `profiles` row.
- `updated_at` auto-set on profiles and lists.

## Code Conventions

- **Biome** for linting and formatting. Tabs, double quotes, 100-char line width.
- **TypeScript strict mode** is on.
- Reuse existing UI components from `src/components/ui/` — check `index.ts` for exports.
- Always use the `design-principles` skill when creating or modifying UI components.

### Design System Tokens

Colors: `creme` (bg), `brioche` (primary/accent), `espresso` (text), `ganache`, `parchment`, `flour` (white), `sesame` (muted), `raspberry`, `pistachio`, `caramel`, `blueberry`.

Fonts:
- **Headings:** `font-display` (DM Serif Display)
- **Body:** `font-body` (DM Sans)

Border radius:
- Card: `rounded-card` (16px)
- Button: `rounded-button` (14px)
- Input: `rounded-input` (12px)
- Chip: `rounded-chip` (9999px)
- Sheet: `rounded-sheet` (24px)

## Environment Variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```
