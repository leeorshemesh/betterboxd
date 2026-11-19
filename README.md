# Betterboxd

Letterboxd-style media diary for **movies, shows, books, and music** — Expo (iOS + Android + web) with a Hono + SQLite API.

## Run (local)

From the project root (`betterboxd`):

```bash
npm install
npm run server      # Terminal A — API on :8787 (catalog + accounts)
npm start           # Terminal B — Expo (QR for Expo Go)
npm run web         # or web at http://localhost:8081
npm run typecheck
```

Catalog search (TMDB / Open Library / Spotify) is proxied by the API so secrets never ship in the app bundle.

Node 22 or newer. The SQLite file is `server/data/betterboxd.sqlite` (gitignored).

```bash
cd server && npm test   # auth, friends, privacy, feed tests
```

### App env

Root [`.env.example`](.env.example) → `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8787
```

- Web and the iOS simulator can use `localhost`.
- Android emulator: `http://10.0.2.2:8787`
- A physical phone on the same Wi‑Fi: `http://<your computer's LAN IP>:8787`

Restart Expo after changing it (`npx expo start -c`).

### Server secrets

Copy [`server/.env.example`](server/.env.example) → `server/.env`:

| Var | Purpose |
|-----|---------|
| `TMDB_API_KEY` | Movies / TV |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Music search |
| `CORS_ORIGIN` | Comma-separated allowed browser origins |
| `ENABLE_SEED` | `true` locally for demo users; `false` in production |
| `PORT` | Default `8787` |
| `BETTERBOXD_DB_PATH` | Optional absolute SQLite path (default `server/data/betterboxd.sqlite`) |

Books use Open Library (no key). Without TMDB/Spotify keys the API falls back to the mock catalog.

Dev seed accounts (only when `ENABLE_SEED` is on / non-production; password `password` for each):

- `maya_reels` / maya@betterboxd.local — public
- `j.watches` / jordan@betterboxd.local — private
- `samreads` / sam@betterboxd.local — public

Maya and Jordan are friends, and Jordan and Sam are friends. Seed diary entries ship on first boot when seeding is enabled.

### Windows (PowerShell)

If `npm` fails with **“running scripts is disabled on this system”**, allow scripts once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Or call `npm.cmd` / `npx.cmd` instead.

## Production deploy (dedicated site on Railway)

Betterboxd is meant to live at its **own HTTPS URL** (not inside your portfolio). One Node process serves the API and the exported website (same origin). Phones use the same URL in Safari/Chrome — no App Store build required.

Config in the repo: [`railway.toml`](railway.toml) (build/start) and [`nixpacks.toml`](nixpacks.toml) (Node 22, `NODE_ENV=production`, `ENABLE_SEED=false`).

### 1. Create the Railway service

1. New project → deploy from this GitHub repo (or CLI).
2. Confirm build uses [`railway.toml`](railway.toml): install root + `server/`, then `npm run build:showcase`; start `npm run server:prod`.
3. Attach a **volume** mounted at `/app/server/data` (Railway’s app root is usually `/app`). That keeps SQLite across restarts. If your mount path differs, set `BETTERBOXD_DB_PATH` to the sqlite file on the volume.
4. Generate a public domain (or add a custom domain).

### 2. Environment variables (dashboard)

| Variable | Value |
|----------|--------|
| `TMDB_API_KEY` | From TMDB |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | From Spotify dashboard |
| `CORS_ORIGIN` | Your public origin, e.g. `https://betterboxd-production.up.railway.app` (update if you add a custom domain) |
| `ENABLE_SEED` | `false` |
| `NODE_ENV` | `production` (Nixpacks sets this) |
| `PORT` | Railway injects this — do not hardcode |

Do **not** set `EXPO_PUBLIC_TMDB_*` or `EXPO_PUBLIC_SPOTIFY_*`. The web export uses same-origin API (`EXPO_PUBLIC_API_URL` empty during `build:showcase`).

### 3. After deploy — smoke checklist

- Open the Railway URL on desktop: register a new account, Explore search, log a title, check Feed.
- Open the **same URL on a phone** browser; repeat sign-up / search / log.
- DevTools → Network: requests go only to your host (no `api.themoviedb.org` / Spotify token from the browser).
- Locally before/after build: `npm run build:showcase && npm run verify:client-secrets`

Community tab remains a placeholder and does not block accessibility. Link this URL from your portfolio when ready.

### Local one-host dry run

```bash
npm install
npm run start:showcase
# then: npm run verify:client-secrets
```

Auth and `/catalog/*` are rate-limited (in-memory; per instance).

## What’s in Phase 1.5

- Auth, diary logging, reviews, comments, friends, privacy-aware feed
- Explore search via `/catalog` + **For you** recommendations
- Lists, Top Five picks, friend profiles, Settings with theme presets
- Community tab remains a placeholder

## Themes

Settings → Appearance offers three presets (saved on device):

1. **Midnight Coral** (default) — ink navy + coral accent
2. **Amber Stage** — near-black + gold accent
3. **Teal Reel** — slate + teal accent

## Project layout

- `app/` — Expo Router screens
- `components/` — shared UI
- `context/` — Auth, AppState, Theme
- `services/` — API client, media proxy, recommendations, preferences
- `data/mock/catalog.ts` — client-side sync fallback snapshots
- `server/` — Hono API, catalog proxy, SQLite
- `constants/theme.ts` — visual tokens and theme presets
