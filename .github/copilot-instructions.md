# Copilot / Agent instructions for Canta-Oke

Purpose: quick, actionable guidance to help an AI agent be productive in this Electron + Express + SQLite codebase.

## Quick start (dev & packaging) 🔧

- Start the app: `npm start` (runs Electron using `src/main.js`).
- Dev with auto-reload: `npm run start:dev` (sets NODE_ENV=development and uses `electron-reload`).
- Populate sample DB: `npm run populate-db` (runs `src/populateDb.js`).
- Auto-download YouTube media: `npm run auto-download` (runs `src/scripts/download.js`).
- Package for Windows: `npm run package-win` or use `npm run dist` (electron-builder config in `package.json`).

## Big picture architecture 🏗️

- Electron main process: `src/main.js` — creates windows, menus, IPC handlers and starts the embedded Express server.
- Express server: `src/expressServer.js` — listens on port 3000 and serves network pages used by remote clients (`/songs`, `/songs2`, `/selected-songs`, `/add-song/:id`, `/remove-selected-song/:index`, `/start`). It returns pre-rendered HTML strings.
- Renderer pages: `src/pages/*.html`, `src/pages/*.js` — pure DOM + calls to `window.electronAPI` (no direct Node use from UI code).
- Preload: `src/preload.js` — exposes safe IPC methods under `window.electronAPI` (the canonical API surface for the renderer).
- Database: `src/database/music.db` (SQLite) and access helpers at `src/database/index.js`.
- Assets: media files live under `src/assets/musicas` and are manipulated by IPC handlers (rename/delete).

## Key IPC channels & events ⚡

- Request/handle style (invoke/send):
  - `get-server-url` → returns server URL (main starts server and returns it)
  - `generate-qr-code` → returns a DataURL for `${serverURL}/songs`
  - `search-song` (identificador) → returns DB row
  - `get-selected-songs`, `add-song`, `remove-first-song`, `remove-last-song`, `clear-selected-songs`
  - `get-config`, `set-config` → persists config to `userData/config.json`
  - `generate-pdf` → triggers `src/generatePDF.js`
  - `get-all-songs`, `update-song`, `delete-song`, `updateSongWithFile`
  - `close-app`, `navigate-to`
- Events sent from main/express to renderer:
  - `update-selected-songs` (payload = song or songs)
  - `start-playing`
- Keep `src/preload.js` and renderer pages in sync whenever adding/changing channels.

## Patterns & conventions to follow ✅

- Renderer code calls `window.electronAPI.<method>` — prefer that over adding new global channels.
- Database columns use Portuguese names: `identificador`, `artista`, `nome`, `caminho`. If you rename columns, update SQL and all places that reference them (`src/expressServer.js`, `src/main.js`, `src/pages/*.js`).
- The Express server returns HTML templates as strings (see `commonStyles` in `src/expressServer.js`) — when changing UI served by the server, update both `/songs` and `/songs2` (they share styles via `commonStyles`).
- There is duplicated state: `selectedSongs` lives in `src/main.js` while `songs` array is also used in `src/expressServer.js` (passed via `startServer`). Be careful to keep them in sync (use `mainWindow.webContents.send` for updates).

## Files of interest (shortlist) 📁

- `src/main.js` — main process, app lifecycle, IPC handlers
- `src/preload.js` — exposes `window.electronAPI`
- `src/expressServer.js` — embedded server, network UI routes
- `src/database/index.js` — SQLite DB location and helper
- `src/pages/*` — front-end pages and logic
- `src/utils/youtubeDownloader.js`, `src/scripts/download.js` — downloader behavior and headers (User-Agent hardcoded)
- `src/generatePDF.js` — PDF export logic

## Developer/testing tips 🧪

- Use `npm run start:dev` to see DevTools enabled and enable fast reload.
- Server URL logs to console on startup (e.g. `Server running at http://<localIP>:3000`). Use that URL for QR generation and testing from other devices.
- Inspect DB directly with `sqlite3 src/database/music.db` if you need to confirm rows.
- When adding native or binary dependencies, run `npx electron-rebuild` or rely on the `electron-rebuild` devDependency.

## Common gotchas & safety notes ⚠️

- Keep IPC channel naming consistent; changing names requires edits in `preload.js` and all renderer files.
- Avoid dual state changes without coordination — prefer updating `selectedSongs` in the main process and then notify renderers via IPC.
- The DB is stored under `src/database/music.db` (not under userData). Packaging or updating paths may require migrating DB location.

---

If anything above is unclear or you want extra examples (e.g., a template for a new IPC handler or an example SQL migration), tell me which part to expand and I’ll add it.

**Notes:** This file was created from code inspection; if there are undocumented runtime setup steps or environment variables you use locally, please tell me and I will add them to this doc.
