const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["polling", "websocket"],
  pingInterval: 25000,
  pingTimeout: 20000
});

const PORT = process.env.PORT || 10000;
const rooms = new Map();
const roomTimers = new Map();
const ROOM_TTL_MS = 120000;

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.static(path.join(__dirname, "strona"), {
  extensions: ["html"],
  maxAge: "1h"
}));

app.get("/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, service: "morse-link", rooms: rooms.size });
});

function clearRoomTimer(code) {
  const timer = roomTimers.get(code);
  if (timer) {
    clearTimeout(timer);
    roomTimers.delete(code);
  }
}

function scheduleRoomCleanup(code) {
  clearRoomTimer(code);
  const timer = setTimeout(() => {
    roomTimers.delete(code);
    const room = rooms.get(code);
    if (room && room.size === 0) {
      rooms.delete(code);
    }
  }, ROOM_TTL_MS);
  roomTimers.set(code, timer);
}

function makeRoomCode() {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(code));
  return code;
}

function leaveCurrentRoom(socket, notify = true, immediateDelete = false) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  socket.leave(code);
  socket.data.roomCode = null;

  if (room) {
    room.delete(socket.id);
    if (notify) socket.to(code).emit("peer_left");
    if (room.size === 0) {
      if (immediateDelete) {
        clearRoomTimer(code);
        rooms.delete(code);
      } else {
        scheduleRoomCleanup(code);
      }
    }
  }
}

io.on("connection", (socket) => {
  socket.on("create_room", (_unused, ack) => {
    if (typeof ack !== "function") return;
    leaveCurrentRoom(socket, true, true);
    const code = makeRoomCode();
    clearRoomTimer(code);
    rooms.set(code, new Set([socket.id]));
    socket.join(code);
    socket.data.roomCode = code;
    ack({ ok: true, code });
  });

  socket.on("join_room", (rawCode, ack) => {
    if (typeof ack !== "function") return;
    const code = String(rawCode || "").replace(/\D/g, "").slice(0, 6);
    const room = rooms.get(code);

    if (!/^\d{6}$/.test(code) || !room) {
      ack({ ok: false, error: "Nie znaleziono takiego pokoju." });
      return;
    }
    if (!room.has(socket.id) && room.size >= 2) {
      ack({ ok: false, error: "Ten pokój jest już pełny." });
      return;
    }

    if (socket.data.roomCode && socket.data.roomCode !== code) {
      leaveCurrentRoom(socket, true, true);
    }
    clearRoomTimer(code);
    room.add(socket.id);
    socket.join(code);
    socket.data.roomCode = code;
    ack({ ok: true, code, peers: room.size });
    socket.to(code).emit("peer_joined");
  });

  socket.on("rejoin_room", (rawCode, ack) => {
    const code = String(rawCode || "").replace(/\D/g, "").slice(0, 6);
    if (!/^\d{6}$/.test(code)) {
      if (typeof ack === "function") ack({ ok: false, error: "Nieprawidłowy kod pokoju." });
      return;
    }
    let room = rooms.get(code);
    if (!room) {
      room = new Set();
      rooms.set(code, room);
    }
    if (!room.has(socket.id) && room.size >= 2) {
      if (typeof ack === "function") ack({ ok: false, error: "Ten pokój jest już pełny." });
      return;
    }
    clearRoomTimer(code);
    room.add(socket.id);
    socket.join(code);
    socket.data.roomCode = code;
    if (typeof ack === "function") ack({ ok: true, code, peers: room.size });
    if (room.size >= 2) {
      socket.to(code).emit("peer_joined");
    }
  });

  socket.on("morse_signal", (payload) => {
    const code = socket.data.roomCode;
    if (!code || !rooms.has(code) || !payload || typeof payload !== "object") return;

    let clean = null;
    if (payload.type === "symbol" && (payload.symbol === "." || payload.symbol === "-")) {
      clean = { type: "symbol", symbol: payload.symbol };
    } else if (payload.type === "letter_end") {
      clean = { type: "letter_end" };
    } else if (payload.type === "word_end") {
      clean = { type: "word_end" };
    }
    if (clean) socket.to(code).emit("morse_signal", clean);
  });

  socket.on("leave_room", () => leaveCurrentRoom(socket, true, true));

  socket.on("disconnect", () => {
    leaveCurrentRoom(socket, true, false);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MORSE LINK listening on 0.0.0.0:${PORT}`);
});
