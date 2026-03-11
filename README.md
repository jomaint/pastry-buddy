# Pastry Buddy

**Discover, log, and rank your favorite pastries.**

A social pastry discovery app -- think Untappd, but for pastries. Check in at your favorite places, rate what you try, build your taste profile, and see what your friends are loving.

---

## About

Pastry Buddy is a mobile-first web app that turns every pastry shop visit into a social experience. Users check in with ratings, flavor tags, and tasting notes, building a personal pastry journal that powers recommendations and leaderboards. Whether you're hunting for the best croissant in your city or tracking your sourdough streak, Pastry Buddy has you covered.

## Features

- **Check-in system** -- Rate pastries 1-5, add flavor tags, write tasting notes, and attach photos
- **Personalized recommendations** -- Content-based and collaborative filtering powered by your taste profile
- **Social feed** -- See what friends are eating, like and comment on check-ins, share discoveries
- **Leaderboards** -- Weekly rankings by friends, global, top places, and top pastries
- **Gamification** -- Earn badges, maintain check-in streaks, level up, and progressively unlock features
- **Taste profile** -- Visualize your flavor preferences and category tendencies
- **Map integration** -- Browse places on an interactive Leaflet map with geo-distance search
- **Curated lists** -- Create and share ranked pastry lists (Top 10 Croissants, Must-Try in LA, etc.)
- **Onboarding flow** -- Guided setup to capture initial taste preferences
- **PWA support** -- Installable on mobile with standalone display and offline-ready manifest
- **Analytics tracking** -- Usage and engagement analytics baked into the schema

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Backend / Auth | [Supabase](https://supabase.com) (Postgres, Auth, Row-Level Security) |
| Data Fetching | TanStack React Query |
| Forms | React Hook Form + Zod validation |
| Maps | React Leaflet |
| Charts | Recharts |
| Icons | Lucide React |
| Linting | Biome |

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm**, **yarn**, or **pnpm**
- A [Supabase](https://supabase.com) project (free tier works fine)

### Installation

```bash
git clone https://github.com/<your-username>/pastry-buddy.git
cd pastry-buddy
npm install
```

### Environment Setup

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find both values in your Supabase project dashboard under **Settings > API**.

### Database Migrations

Run the SQL migration files in order against your Supabase database (via the SQL Editor in the dashboard or the Supabase CLI):

| # | File | Purpose |
|---|---|---|
| 1 | `001_initial_schema.sql` | Core tables (profiles, places, pastries, check-ins, lists, badges, follows), RLS policies, triggers, feed view |
| 2 | `002_recommendations.sql` | Materialized views and functions for the recommendation engine |
| 3 | `003_analytics.sql` | Analytics and usage tracking |
| 4 | `004_social_features.sql` | Streaks, progressive unlocking, social engagement functions |
| 5 | `005_onboarding.sql` | Onboarding flow support |
| 6 | `006_leaderboards.sql` | Weekly leaderboard functions (friends, global, top places, top pastries) |
| 7 | `007_social_engagement.sql` | Likes, comments, and sharing |

Migration files are located in `supabase/migrations/`.

### Running the Dev Server

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000) using Turbopack for fast refresh.

## Project Structure

```
src/
├── api/              # API route handlers and server-side logic
├── app/              # Next.js App Router pages and layouts
│   ├── (auth)/       # Sign-in and sign-up pages
│   ├── place/[id]/   # Place detail page
│   ├── check-in/[id]/# Check-in flow
│   ├── discover/     # Pastry discovery and recommendations
│   ├── leaderboard/  # Weekly leaderboards
│   ├── lists/        # User-curated pastry lists
│   ├── log/          # Check-in log / activity feed
│   ├── onboarding/   # New user onboarding
│   ├── pastry/[id]/  # Pastry detail page
│   └── profile/      # User profile and taste profile
├── components/       # Reusable UI and feature components
│   ├── analytics/    # Analytics visualizations
│   ├── layout/       # Shell, Header, Sidebar
│   ├── leaderboard/  # Leaderboard components
│   ├── onboarding/   # Onboarding flow components
│   ├── pastry/       # Pastry cards and detail components
│   ├── profile/      # Profile and taste profile components
│   ├── social/       # Feed, likes, comments
│   └── ui/           # Primitives (Button, Chip, Avatar, etc.)
├── config/           # App configuration
├── hooks/            # Custom React hooks
├── lib/              # Utilities, Supabase client, mock data
├── middleware.ts     # Next.js middleware (auth guards)
└── types/            # TypeScript type definitions

supabase/
└── migrations/       # SQL migration files (run in order)
```

## Database Schema

The Postgres schema is organized around these core tables:

- **profiles** -- User accounts with XP, level, and taste preferences (extends Supabase Auth)
- **places** -- Place locations with geo-coordinates and Google Place IDs
- **pastries** -- Individual pastry items linked to places, with denormalized ratings
- **check_ins** -- The heart of the app: user ratings, flavor tags, taste ratings, notes, and photos
- **lists / list_items** -- User-curated ranked pastry lists
- **badges / user_badges** -- Achievement system with JSON-defined unlock criteria
- **follows** -- Social graph for friend feeds and friend leaderboards

Key supporting structures include materialized views for taste profiles and recommendations, functions for streak calculation and leaderboard ranking, and Row-Level Security policies on every table.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and ensure linting passes (`npm run lint`)
4. Commit with a clear message
5. Open a pull request

## License

MIT
