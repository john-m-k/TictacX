# Tic Tac Extreme v4.0 🎮

## Files
- `index.html` — full game
- `server.js` — WebSocket server (handles Online + Hotspot multiplayer)
- `package.json` — Node.js config
- `sw.js` — Service Worker (PWA offline support)
- `manifest.json` — PWA manifest (install to home screen)

## Features
- 🤖 AI (Easy / Medium / Hard / Impossible)
- 👥 Two Player local
- 🌐 Online Multiplayer
- 📡 Hotspot Multiplayer (same Wi-Fi)
- 📴 Offline PWA (AI + Two Player work without internet)
- 📲 Install to home screen on Android/iOS
- 💬 In-game chat
- ⏱ Match + Turn timers
- 💳 Custom names 

## Deploy on Railway
1. Push all files to a GitHub repository
2. Go to railway.app → New Project → Deploy from GitHub
3. Select your repo — Railway auto-detects Node.js
4. It runs `npm start` → `node server.js` automatically
5. Go to Settings → Networking → Generate Domain
6. Share your Railway URL and play!

## Local play
node server.js
Open http://localhost:3000

## Hotspot play
node server.js
Share your local IP (e.g. http://192.168.x.x:3000) with devices on same Wi-Fi
