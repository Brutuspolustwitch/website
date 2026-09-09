# Arena Gladiator ⚔️

A production-ready SEO website for an iGaming casino streamer brand with a dark gladiator/arena theme. Built with Next.js 16, React 19, TailwindCSS 4, Framer Motion, GSAP, and Supabase.

## Features

- **Cinematic Hero Section** — Full-screen with rain/ember particles (canvas), GSAP camera push-in, ambient sound toggle
- **Streamer Hub** — Live Twitch embed with dynamic "gladiator status" (online/offline)
- **Bonus Hunt Tracker** — Real-time card carousel with 3D depth, smooth layout animations
- **Slot Request System** — `!sr` command input with Fuse.js fuzzy matching and animated queue
- **Leaderboard** — Gladiator rank progression (Recruit → Legend) with animated gold fill bars
- **Casino Reviews** — SEO-optimized landing pages with Review, FAQ, and Product schema markup
- **Full SEO** — Metadata, Open Graph, Twitter cards, sitemap.xml, robots.txt, JSON-LD schemas

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase and Twitch credentials
npm run dev
```

## Environment Variables

| Variable                        | Description                                                                                                                                                                                                                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                                                                                                                                                                                                                                                                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key                                                                                                                                                                                                                                                                                                                    |
| `NEXT_PUBLIC_SITE_URL`          | Production URL for SEO                                                                                                                                                                                                                                                                                                                    |
| `NEXT_PUBLIC_TWITCH_CHANNEL`    | Twitch channel username                                                                                                                                                                                                                                                                                                                   |
| `TWITCH_CLIENT_ID`              | Twitch API client ID (server-side)                                                                                                                                                                                                                                                                                                        |
| `TWITCH_CLIENT_SECRET`          | Twitch API client secret (server-side)                                                                                                                                                                                                                                                                                                    |
| `STREAMERS_CENTER_API_URL`      | Server-only Streamers Center API origin for external imports. Use `https://streamerscenter.com` with no trailing slash.                                                                                                                                                                                                                   |
| `STREAMERS_CENTER_API_KEY`      | Server-only API key used by `/api/bonus-hunt/sync` when importing data from Streamers Center. Optional if the key is instead saved via the admin UI (Bonus Hunt admin page → Streamers Center API), which stores it in the `integration_settings` table (service-role only, no public RLS policy) and takes precedence over this env var. |
| `BONUS_HUNT_SYNC_SECRET`        | Secret for authorized cron or automation calls to `/api/bonus-hunt/sync`.                                                                                                                                                                                                                                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only key required for bonus hunt imports (`bonus_hunt_sessions`/`bonus_hunt_slots` only allow public reads via RLS, writes must bypass it) and other admin-only writes.                                                                                                                                                            |

## Required Assets

| Path                                | Description                  |
| ----------------------------------- | ---------------------------- |
| `/public/images/hero-gladiator.jpg` | Hero background (1920x1080+) |
| `/public/og-image.jpg`              | Open Graph image (1200x630)  |
| `/public/sounds/arena-ambience.mp3` | Ambient sound loop           |

## Database Setup

### Shared Arena offer cards

The cards on `/` and `/ofertas` use `/api/arena-offers`, which reads the public
`/api/external-offers` feed from the Brutuspolus application. That feed queries
the same `external_offer_sites` and `external_site_offers` Supabase tables used
by `brutuspolusWS`. Manage Arena's cards in Brutuspolus at `/admin/external-sites`.
Only visible offers for the active configured site are returned, in admin order.
Images and tracked offer links continue to point to Brutuspolus.

Set `NEXT_PUBLIC_BRUTUSPOLUS_OFFERS_ORIGIN` to the Brutuspolus deployment origin
(default `https://www.brutuspolus.com`) and `NEXT_PUBLIC_EXTERNAL_OFFERS_SITE` to
the site slug (default `arena-dos-bonus`). Both are listed in the environment
examples. The feed is fetched without caching on each card-page mount. This
integration needs no Supabase keys on Arena and adds no database migrations.
Existing Arena database configuration still serves its other features.

Run `supabase/schema.sql` in your Supabase SQL Editor, then apply the migrations in `supabase/migrations/` in order (includes `add_bonus_hunt_sync_lock.sql`, needed by the `/api/bonus-hunt/live` poll endpoint).

## Deployment

```bash
npm i -g vercel && vercel --prod
```

Set environment variables in Vercel project settings.
