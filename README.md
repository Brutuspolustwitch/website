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

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_SITE_URL` | Production URL for SEO |
| `NEXT_PUBLIC_TWITCH_CHANNEL` | Twitch channel username |
| `TWITCH_CLIENT_ID` | Twitch API client ID (server-side) |
| `TWITCH_CLIENT_SECRET` | Twitch API client secret (server-side) |

## Required Assets

| Path | Description |
|---|---|
| `/public/images/hero-gladiator.jpg` | Hero background (1920x1080+) |
| `/public/og-image.jpg` | Open Graph image (1200x630) |
| `/public/sounds/arena-ambience.mp3` | Ambient sound loop |

## Database Setup

Run `supabase/schema.sql` in your Supabase SQL Editor.

## Deployment

```bash
npm i -g vercel && vercel --prod
```

Set environment variables in Vercel project settings.
