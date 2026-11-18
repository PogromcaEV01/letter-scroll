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

// Słownik do dekodowania (Morse -> Tekst) i enkodowania (Tekst -> Morse)
const MORSE_TO_CHAR = {
  ".-": "A", "-...": "B", "-.-.": "C", "-..": "D", ".": "E", "..-.": "F", "--.": "G",
  "....": "H", "..": "I", ".---": "J", "-.-": "K", ".-..": "L", "--": "M", "-.": "N",
  "---": "O", ".--.": "P", "--.-": "Q", ".-.": "R", "...": "S", "-": "T", "..-": "U",
  "...-": "V", ".--": "W", "-..-": "X", "-.--": "Y", "--..": "Z",
  "-----": "0", ".----": "1", "..---": "2", "...--": "3", "....-": "4",
  ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9"
};

const CHAR_TO_MORSE = Object.fromEntries(
  Object.entries(MORSE_TO_CHAR).map(([morse, ch]) => [ch, morse])
);

// DEKODER: zamienia ciąg Morse'a (np. "... --- ... / - . ... -") na zwykły tekst
function decodeMorseToText(morseString) {
  return String(morseString || "")
    .trim()
    .split(/\s*\/\s*/) // słowa oddzielone ukośnikiem "/"
    .map((word) =>
      word
        .trim()
        .split(/\s+/) // litery oddzielone spacją
        .map((code) => MORSE_TO_CHAR[code] || "")
        .join("")
    )
    .filter(Boolean)
    .join(" ");
}

// Normalizacja odpowiedzi z GPT (usuwa polskie ogonki i znaki specjalne przed enkodowaniem)
function normalizeText(text) {
  return String(text || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ł/g, "L")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ENKODER: zamienia cały tekst odpowiedzi GPT na jedną paczkę sygnałów dla telefonu
function encodeTextToMorsePacket(text) {
  const cleanText = normalizeText(text);
  const words = cleanText.split(" ").filter(Boolean);
  const signals = [];
  const morseWords = [];

  words.forEach((word, wIdx) => {
    const letterCodes = [];
    for (let lIdx = 0; lIdx < word.length; lIdx++) {
      const code = CHAR_TO_MORSE[word[lIdx]];
      if (!code) continue;
      letterCodes.push(code);

      for (const symbol of code) {
        signals.push({ type: "symbol", symbol });
      }
      signals.push({ type: "letter_end" });
    }
    if (letterCodes.length) morseWords.push(letterCodes.join(" "));
    if (wIdx < words.length - 1) {
      signals.push({ type: "word_end" });
    }
  });

  return {
    text: cleanText,
    morse: morseWords.join(" / "),
    signals
  };
}

async function askChatGPT(userText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Brak OPENAI_API_KEY w zmiennych srodowiskowych Render");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-6-luna",
      messages: [
        {
          role: "system",
          content:
            "Odpowiadaj po polsku, ale maksymalnie w jednym dużym zdaniu, bez polskich znaków diakrytycznych i bez interpunkcji (tylko A-Z i 0-9). Twoja odpowiedź jest odtwarzana na telefonie wibracjami w alfabecie Morse'a."
        },
        { role: "user", content: userText }
      ],
      max_completion_tokens: 100,
      temperature: 1
    })
  });

  const data = await response.json();
  if (!response.ok) {
  console.error("OPENAI ERROR:", response.status, data);
  throw new Error(
    `OpenAI HTTP ${response.status}: ${data?.error?.message || JSON.stringify(data)}`
  );
}

  return data?.choices?.[0]?.message?.content?.trim() || "OK";
}

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
app.use(express.static(__dirname, {
  extensions: ["html"],
  maxAge: "1h"
}));

app.get("/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, service: "morse-link-gpt" });
});

io.on("connection", (socket) => {
  socket.on("morse_message", async (payload, ack) => {
    const rawMorse = typeof payload?.morse === "string" ? payload.morse : "";
    const decodedText = decodeMorseToText(rawMorse);

    if (!decodedText) {
      if (typeof ack === "function") ack({ ok: false, error: "Nie rozpoznano liter Morse'a." });
      return;
    }

    if (typeof ack === "function") {
      ack({ ok: true, decodedText });
    }

    try {
      const gptReplyText = await askChatGPT(decodedText);
      const encodedPacket = encodeTextToMorsePacket(gptReplyText);

      // Odsyłamy całą odpowiedź na raz do telefonu
      socket.emit("morse_reply", {
        ok: true,
        userText: decodedText,
        replyText: encodedPacket.text,
        replyMorse: encodedPacket.morse,
        signals: encodedPacket.signals
      });
    } catch (err) {
      const fallback = encodeTextToMorsePacket("ERR");
      socket.emit("morse_reply", {
        ok: false,
        error: err.message,
        userText: decodedText,
        replyText: "ERR",
        replyMorse: fallback.morse,
        signals: fallback.signals
      });
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`MORSE LINK GPT listening on 0.0.0.0:${PORT}`);
});
