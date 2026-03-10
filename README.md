# Baby Tracker

A mobile-first baby tracking app built with SvelteKit and Turso. Track diaper changes, nursing sessions, pumping, and sleep with one-tap logging.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Turso database

Create a free account at [turso.tech](https://turso.tech), then:

```bash
turso db create baby-tracker
turso db show baby-tracker --url       # copy the URL
turso db tokens create baby-tracker    # copy the token
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Turso credentials. For local development without Turso, the app falls back to a local SQLite file (`local.db`).

### 4. Run locally

```bash
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add environment variables in the Vercel project settings:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy

## Features

- **Diaper tracking** - One tap to log, then pick pee/poop/mixed
- **Nursing tracking** - One tap to log, then pick left/right/equal
- **Pumping tracking** - One tap to log, then adjust ml amount
- **Sleep tracking** - Log sleep periods with start/end times
- **PWA** - Add to home screen on iOS/Android for native app feel
- **At-a-glance** - Each card shows when the last event happened
