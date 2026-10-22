# Betterboxd

Letterboxd-style media diary for **movies, shows, books, and music** — Expo (iOS + web), Phase 1 MVP with mock data.

## Run

From the project root (`betterboxd`):

```bash
npm install
npm start          # Expo dev server (QR for Expo Go)
npm run web        # Web at http://localhost:8081
npm run typecheck  # TypeScript check
```

### Windows (PowerShell)

If `npm` fails with **“running scripts is disabled on this system”**, PowerShell is blocking `npm.ps1`. Node is installed; fix it one of these ways:

**Option A — allow npm scripts for your user (recommended, once):**

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Close and reopen the terminal, then use normal commands:

```powershell
cd C:\Users\leeor\Desktop\Projects\betterboxd
npm install
npm run web        # http://localhost:8081
npm start          # Expo Go on phone
```

**Option B — call the `.cmd` shims (no policy change):**

```powershell
cd C:\Users\leeor\Desktop\Projects\betterboxd
npm.cmd install
npm.cmd run web
npm.cmd start
# or:
npx.cmd expo start --web
```

**Option C — use Command Prompt** (`cmd.exe`) instead of PowerShell; plain `npm` works there.

### iOS

- **With a Mac:** `npm run ios` (simulator) or open the project in Xcode after `npx expo prebuild` when you need a native build.
- **Without a Mac (Windows):** install [Expo Go](https://expo.dev/go) on an iPhone, run `npm start` (or `npm.cmd start`), then scan the QR code (same Wi‑Fi).

### Android

`npm run android` or Expo Go on a device.

## Phase 1 scope

Five tabs (Feed, Explore, Add, Community placeholder, Profile), review/media detail, mock catalog + social graph, `mediaService` ready for TMDB / Open Library / Spotify later.

## Real catalog data (API keys)

The app still uses **mock** data. Screens talk to [`services/mediaService.ts`](services/mediaService.ts); when adapters are wired, the UI stays the same. Here is what you need to do before asking to connect live APIs.

### 1. Movies & TV — TMDB

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/).
2. **Settings → API** → request an API key (v3 auth key is enough).
3. Copy [`.env.example`](.env.example) to `.env` and set:

```env
EXPO_PUBLIC_TMDB_API_KEY=your_v3_key_here
```

4. Restart Expo so env vars load: `npx expo start -c` (or `npx.cmd expo start -c` on Windows).

### 2. Books — Open Library

No API key. The future adapter will call `https://openlibrary.org/search.json` and cover image URLs.

### 3. Music — Spotify

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Copy **Client ID** and **Client Secret**.
3. Put both in `.env` for local/MVP search (Client Credentials):

```env
EXPO_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret
```

Without the secret, music search falls back to mock data. For a production build, move the secret to a small backend/proxy so it is not embedded in the app binary.

### Security

- Only `EXPO_PUBLIC_*` variables are available in the client (visible in the app bundle).
- `.env` is gitignored — never commit real keys. Use `.env.example` as the template.

### Wired providers

| Type | Source | Needs |
|------|--------|--------|
| Movies / TV | TMDB | `EXPO_PUBLIC_TMDB_API_KEY` |
| Books | Open Library | nothing |
| Music | Spotify | Client ID + Secret (else mock) |

Restart with `npx expo start -c` after editing `.env`.

## Project layout

- `app/` — Expo Router screens
- `components/` — shared UI (stars, art, feed/timeline rows, media-type icons)
- `data/mock/` — catalog, users, reviews, comments, lists
- `services/mediaService.ts` — catalog abstraction (mock now)
- `context/AppState.tsx` — in-memory reviews/lists/top-five
- `constants/theme.ts` — visual tokens
- `.env.example` — template for future API keys
