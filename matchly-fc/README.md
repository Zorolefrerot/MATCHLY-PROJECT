# Matchly FC — EA SPORTS FC 27 Edition

Physics-based flick football PWA: slingshot shooting, real-player superstar hub, online rooms, solo cups, locker-room recruitment and a 30-second opening cinematic.

## 📱 Install as an App (Home Screen required)
The game asks you to install it on your Home Screen for the full FC 27 experience.

**Android (Chrome):** open the site → tap **Installer l'App** (or ⋮ menu → *Ajouter à l'écran d'accueil*) → launch **Matchly FC** from your Home Screen.
**iPhone (Safari):** open the site in Safari → **Partager** (⬆️) → *Sur l'écran d'accueil* → **Ajouter** → launch from Home Screen.

Once installed it runs standalone (portrait, fullscreen) with its own icon, splash and offline app-shell via `public/manifest.webmanifest` + `public/sw.js`.

## ✨ FC 27 Features
- **30s opening cinematic** — 9 scenes of real-player photography synced to `/audio/fc27-intro-30s.mp3`, Ken Burns, lower-thirds, live ticker (skippable).
- **EA Trax jukebox** — embedded MP3 playlist with toast + skipper; stadium crowd ambience loop in matches.
- **Settings (4 tabs)** — Audio, Gameplay (slingshot/direct aim, guide, sensitivity, shake, particles), Visual (turf palettes, nameplates), Data.
- **Modes** — Quick Match exhibition, Online Rooms (WebSocket), Competitions, Solo Cups, Objectives/Season Pass, Locker Room recruitment with Crédits FC & PlayStyles+.
- **PWA** — manifest, maskable icons, service worker, safe-area portrait polish.

## 🛠 Develop
```bash
npm ci
npm run dev      # or: npm start (serves dist/ on 0.0.0.0:5173)
npm run typecheck && npm run build
```

## 🚀 Deploy on Render
Blueprint included (`render.yaml`):
- **Root Directory:** `matchly-fc`
- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm start`
- **Health Check:** `/api/health`
- Optional env vars: `PORT` (Render sets it), Supabase keys already defaulted in the client.

Or connect the repo in Render → *New → Blueprint* and it picks up `matchly-fc/render.yaml` automatically.
