# Scarcine (formerly VoidStream) — PRD

> Rebranded 2026-11-04: user-facing name is now "Scarcine" (logo, title, manifest, error states). Internal localStorage keys (`voidstream:*`, `preferred_stream_mode`) intentionally unchanged to preserve existing user data.

## Original Problem Statement
Build a production-grade, zero-authentication streaming web application named "VoidStream" (Next.js 14 / React, Tailwind CSS, Lucide React) with: anti-AI-slop obsidian design system (Deep Obsidian Void palette #08080a/#0d0d11, crimson #e50914 accent, Inter/Geist type, shimmer skeletons, glass bars); TMDB integration (trending/popular/top-rated, search/multi with 300ms debounce, details+credits+seasons); FrameXTV embed playback (movies + TV with season/episode, 4 extraction servers: PEKKA default, Archer, Barbarian, Goblin); real-time telemetry listener for `frameXTV:timeupdate` persisting to localStorage to power Continue Watching; zero-auth localStorage state (bookmarks + history); views: Navbar (logo, links, ⌘K search, adblock tip), Hero Billboard, Media Rows (Continue Watching, Trending Today, Top Rated Movies, Popular TV Series), Search Overlay (filters All/Movies/TV, clear), Cinematic Theater Modal (16:9 iframe, server pills, season dropdown + episode grid, synopsis/genres/cast); error boundaries + fallback posters; responsive 360px → 4K.

## User Choices
- Stack: React app on the managed scaffold (CRA + Tailwind on port 3000) instead of a full Next.js rebuild — user confirmed.
- TMDB: user supplied their own API key via secure secrets card (`REACT_APP_TMDB_KEY` in frontend env).

## Architecture
- Frontend: React (CRA, craco) + Tailwind + react-router-dom + lucide-react. No auth, no backend dependency for features.
  - `src/lib/tmdb.js` — TMDB client (normalize movie/tv shapes, image helper, endpoint wrappers)
  - `src/hooks/useLocalStorage.js`, `src/hooks/useLibrary.js` — persisted bookmarks + history
  - `src/components/` — Navbar, Hero, MediaCard, MediaRow, HistoryRow, SearchOverlay, PlayerModal, Skeleton, ErrorBoundary
  - `src/pages/` — Discover, Movies, Series, Library
- Backend: stock FastAPI template (hello world at `/api/`); untouched — all features client-side.
- Data: TMDB API v3 via backend proxy (`/api/tmdb/*`, browser-direct images also proxied); playback via a multi-provider registry (`src/lib/streamProviders.js`: FrameXTV "Server Alpha" primary with pekka/archer/barbarian/goblin extraction servers + VidSrc "Beta", AutoEmbed "Gamma", MultiEmbed "Delta" backups); persistence via localStorage keys `voidstream:bookmarks`, `voidstream:history`, `preferred_stream_mode`.

## User Personas
- Binge-watcher who wants instant access without creating accounts.
- Privacy-minded viewer who wants watch state kept on-device only.
- Cord-cutter switching servers/episodes quickly when a source is slow.

## Core Requirements (static)
1. Zero-auth instant access; all state in localStorage.
2. TMDB-powered discovery, search (debounced 300ms, filterable), details, cast, seasons/episodes.
3. FrameXTV playback with 4 server options, TV season/episode navigation without page reload.
4. `frameXTV:timeupdate` telemetry → Continue Watching with progress bars.
5. Bookmark/Watchlist toggle everywhere (cards, hero, player).
6. Anti-slop obsidian aesthetic, shimmer skeletons, fallback posters, error boundaries, 360px→4K responsive.

## Implemented (2026-11-04)
- Full design system + all views (Navbar, Hero, Rows, Search Overlay, Theater Modal, Library).
- TMDB live integration with user key; graceful empty/error states if key missing.
- FrameXTV player: PEKKA/Archer/Barbarian/Goblin pills, season dropdown, episode pills, telemetry persistence (5s throttle + save on close).
- Continue Watching (Discover row + Library grid, removable), Watchlist (Library grid).
- ⌘K/Ctrl+K search with debounced results, category filters, clear, Esc, trending suggestions.
- Error boundary, poster fallbacks, mobile nav row, data-testids throughout.
- Browse by Mood: genre chips on Discover/Movies/Series → /discover grid (movie + TV genre lists), cached per session.
- Cast exploration: cast avatars under the player open a PersonModal (photo, bio with read-more, birth info, Known For grid sorted by popularity → opens that title's player); Escape closes only the topmost modal.
- PWA: manifest + generated obsidian/red-dot icons (192/512) + network-first service worker + apple tags + navbar Install App button (appears on beforeinstallprompt).
- Sub/Dub + Subtitle toolbar: Audio Track pill switch (SUB → barbarian server + setSubtitle(0); DUB → archer server + setProvider postMessage, re-dispatched after embed reload), Subtitles ON/OFF dropdown (setSubtitle index 0 / -1), preference persisted in localStorage `preferred_stream_mode` and applied as default server on subsequent titles (fresh users default PEKKA), iframe src includes `controls=1` for native audio/CC buttons, manual server picks clear the session mode while keeping the stored preference.
- Anti-Redirect & Anti-Popup Defense Layer: strict iframe sandbox (`allow-scripts allow-same-origin allow-forms allow-presentation`, popups + top-navigation never granted by default), `window.open` trap while the player is mounted (blocks + counts attempts, cleanly restored on unmount), first-click phantom shield over the iframe (absorbs rogue first-click traps), and a "Popups blocked (N)" badge with a Relax Sandbox toggle that re-enables popups + passthrough only on explicit user action (iframe reloads with relaxed sandbox; Re-secure reverses it).
- Rebrand to Scarcine across all user-facing surfaces (navbar, footer, document title, manifest, error boundary).
- App-level fullscreen control: toolbar Fullscreen button uses the Fullscreen API on the player container (works regardless of embed internals), tracks fullscreenchange, container fills the screen when fullscreen; Esc inside fullscreen is deferred to the browser (second Esc closes the modal).
- Rotating hero billboard: cycles the top 8 trending titles every 8s with 1s crossfade + rise-in content animation, pauses on hover, numbered "Trending №N" eyebrow, clickable dot indicators.
- Mobile responsiveness audit at 390px across home/player/search/library (no overflow, toolbar wraps cleanly).
- Multi-Provider Adapter Architecture: `lib/streamProviders.js` registry (FrameXTV Alpha primary + VidSrc Beta / AutoEmbed Gamma / MultiEmbed Delta backups) with per-provider movie/TV URL builders on TMDB IDs; Source pill selector (Server Alpha/Beta/Gamma/Delta) re-mounts the iframe without page reload; "Stream broken or buffering? Switch to Next Server" one-click fallback cycles providers and re-arms the click shield; sandbox, popup trap, and shield apply uniformly to every provider; FrameXTV-only controls (extraction servers, SUB/DUB, subtitle menu) render only on Alpha.

## Verified
- Testing agent (iterations 1–4): hero/rows/cards, navbar routing, search (button + Ctrl+K + debounce + filters + clear + Esc), movie player URL, server switching, TV season/episode switching, telemetry → localStorage → Continue Watching across reload, bookmark/library persistence, empty states, mobile overflow, genre chips + grids on all pages, person modal + known-for handoff, nested-modal Escape stacking (3/3), PWA manifest/SW/icons served 200, backend `/api/` sanity.

## Bug Fixes
- 2026-11-04 — "Home empty + search failed": user's browser could not reach TMDB domains directly (container-side TMDB was 200 OK, key valid). Fixed by adding a backend TMDB proxy (`/api/tmdb/{path}` with TTL caching + 429 retry, `/api/tmdb/img/{size}/{file}` for posters/backdrops); frontend routes ALL metadata + image traffic through the app's own domain with a 12s timeout. Verified by testing agent: home fully populated via proxy, "anime"/"batman" searches return results, gibberish queries show graceful no-results state.
- 2026-11-04 — "No English dub for anime (Classroom of the Elite)": investigated against FrameXTV's official docs (framextv.xyz/api) + provider backend — there is NO dub/audio-language parameter or postMessage action (only setProvider + setSubtitle) and no dub-specific provider, so a dub that isn't in the upstream stream cannot be selected client-side. Our DUB flow already does everything documented (server=archer + setProvider postMessage + controls=1 native audio menu). Shipped an honest DUB-mode hint (dub-hint) explaining where dub tracks live (player ⚙ → Audio) and to try another server; offered a secondary anime-dub embed provider (Anilist-based) as opt-in next step.

## Backlog
- P0: none pending.
- P1: offline viewing history sync across devices (needs backend, optional).
- P2: genre row deep-links (shareable /genre/action URLs); iOS install guidance banner; history "clear all" action.

## Next Tasks
1. Secondary anime-dub provider (Anilist-based embed with documented /dub endpoints) as opt-in backup source.
2. Shareable genre deep-links.
3. iOS "Add to Home Screen" hint banner.
