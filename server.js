// Tic Tac Extreme - Server
// Handles: Online multiplayer + Local Hotspot multiplayer + PWA serving
// Run: node server.js

const { WebSocketServer } = require("ws");
const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

// ── Serve static files ────────────────────────────────────────
const MIME = {
  ".html": "text/html",
  ".json": "application/json",
  ".js":   "application/javascript",
  ".png":  "image/png",
  ".svg":  "image/svg+xml",
  ".mp3":  "audio/mpeg",
  ".wav":  "audio/wav",
  ".ogg":  "audio/ogg",
};

const httpServer = http.createServer((req, res) => {
  let filePath = req.url === "/" ? "/index.html" : req.url;
  // strip query strings
  filePath = filePath.split("?")[0];
  const full = path.join(__dirname, filePath);
  const ext  = path.extname(full);

  fs.readFile(full, (err, data) => {
    if (err) {
      // fallback to index for SPA
      fs.readFile(path.join(__dirname, "index.html"), (e2, d2) => {
        if (e2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(d2);
      });
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(data);
  });
});

// ── WebSocket server ──────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });
const rooms = {};   // online rooms  { code: {host, guest} }
const hotspots = {}; // hotspot rooms { code: {host, guest} }

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function send(ws, data) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(data));
}

wss.on("connection", (ws) => {
  ws.roomCode = null;
  ws.role     = null;
  ws.roomType = null; // "online" | "hotspot"

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const pool = msg.roomType === "hotspot" ? hotspots : rooms;

    // ── CREATE ──
    if (msg.type === "create") {
      let code;
      do { code = generateCode(); } while (pool[code]);
      pool[code] = { host: ws, guest: null };
      ws.roomCode = code;
      ws.role     = "host";
      ws.roomType = msg.roomType || "online";
      send(ws, { type: "created", code });
    }

    // ── JOIN ──
    else if (msg.type === "join") {
      const room = pool[msg.code];
      if (!room)       { send(ws, { type: "error", message: "Room not found." }); return; }
      if (room.guest)  { send(ws, { type: "error", message: "Room is full."   }); return; }
      room.guest  = ws;
      ws.roomCode = msg.code;
      ws.role     = "guest";
      ws.roomType = msg.roomType || "online";
      send(ws,       { type: "joined"          });
      send(room.host,{ type: "opponent_joined" });
    }

    // ── MOVE / RESTART / CHAT ── (relay to opponent)
    else if (["move","restart","chat"].includes(msg.type)) {
      // Use ws.roomType (set at create/join) — msg.roomType may be absent
      const relayPool = ws.roomType === "hotspot" ? hotspots : rooms;
      const room = relayPool[ws.roomCode];
      if (!room) return;
      const opponent = ws.role === "host" ? room.guest : room.host;
      send(opponent, msg);
    }
  });

  ws.on("close", () => {
    const pool = ws.roomType === "hotspot" ? hotspots : rooms;
    const code = ws.roomCode;
    if (!code || !pool[code]) return;
    const room     = pool[code];
    const opponent = ws.role === "host" ? room.guest : room.host;
    if (opponent) send(opponent, { type: "opponent_left" });
    delete pool[code];
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log("==========================================");
  console.log("  Tic Tac Extreme Server");
  console.log(`  Local  : http://localhost:${PORT}`);
  console.log("  Hotspot: share your local IP on port " + PORT);
  console.log("==========================================");
});
