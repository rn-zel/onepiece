// sample-backend.js
// Minimal Express backend that matches the contract used in sampleAPI.ts
// Run with:  node sample-backend.js

import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000; // sampleAPI.ts default points at Laravel; override there to http://localhost:4000

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// In‑memory state
// ─────────────────────────────────────────────────────────────

const STARTING_BALANCE = 50_000;

/**
 * Very small in‑memory session store keyed by session_id.
 * In a real Laravel app this would be a database table.
 */
const sessions = new Map();

function createSessionId() {
  return "sess-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

// Simple static machine configuration – now using your JSON
const MACHINE_CONFIG = {
  machine_id: 422,
  min_bet: 400,
  max_bet: 1_000_000,
  bet_sizes: [20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 1000],
  bet_levels: [1],
  default: { bet_size: 20, bet_level: 1 },
  multiplier: 20,
  free_spin_cost: 100,
};

// Info block from your JSON (extra metadata; frontend can ignore or use it)
const MACHINE_INFO = {
  direction: "both",
  row: 3,
  col: 5,
  min_reels_to_win: 3,
  wild_can_start: true,
  reel_heights: [
    { min: 3, max: 3 },
    { min: 3, max: 3 },
    { min: 3, max: 3 },
    { min: 3, max: 3 },
    { min: 3, max: 3 },
  ],
  effect: "cascading",
  type: "ways",
  ways: 243,
  wild_appears: [2, 3, 4],
  paytable: {
    s4: [0, 0, 20, 50, 100],
    s3: [0, 0, 12, 25, 50],
    s2: [0, 0, 8, 15, 30],
    s1: [0, 0, 5, 10, 20],
    a: [0, 0, 4, 8, 16],
    k: [0, 0, 3, 6, 12],
    q: [0, 0, 2, 4, 8],
    j: [0, 0, 0, 3, 6],
    wild: [0, 0, 0, 0, 0],
    sc: [0, 0, 0, 0, 0],
    sm: [0, 0, 0, 0, 0],
  },
  features: {
    cascading: {
      main: { increase_multiplier: true, multiplier: 1 },
      free: { increase_multiplier: true, multiplier: 1 },
    },
  },
};

// Jackpots from your JSON (converted to numbers)
const JACKPOT_PRIZES = {
  mini: 0,
  major: 0,
  super: 0,
  currency: "PHP",
};

// ─────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────

function getOrCreateSession(session_id) {
  if (session_id && sessions.has(session_id)) {
    return sessions.get(session_id);
  }
  const id = createSessionId();
  const session = {
    session_id: id,
    balance: STARTING_BALANCE,
    free_spin_count: 0,
    started_at: new Date().toISOString(),
  };
  sessions.set(id, session);
  return session;
}

function ensureSession(req) {
  const { session_id } = req.body || {};
  const s = getOrCreateSession(session_id);
  // Normalize the body so downstream handlers see the ID
  req.body.session_id = s.session_id;
  return s;
}

function randomReel() {
  const symbols = ["a", "k", "q", "j", "s1", "s2", "s3", "s4", "wild", "sc"];
  const reel = [];
  for (let c = 0; c < 5; c++) {
    const col = [];
    for (let r = 0; r < 3; r++) {
      col.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    reel.push(col);
  }
  return reel;
}

function buildPlayPayload(session, totalBet, isFreeSpin = false, bet_size = null, bet_level = null) {
  const reel = randomReel();

  // Extremely simple fake math: 20% chance to win 2x, 5% chance to win 10x
  let win = 0;
  const roll = Math.random();
  if (roll < 0.05) {
    win = totalBet * 10;
  } else if (roll < 0.25) {
    win = totalBet * 2;
  }

  // Free spin trigger: small chance while spinning normally
  let free_spin = null;
  if (!isFreeSpin && Math.random() < 0.05) {
    session.free_spin_count += 10;
    free_spin = { count: session.free_spin_count };
  } else if (isFreeSpin) {
    free_spin = { count: session.free_spin_count };
  }

  session.balance += win;

  const data = {
    win,
    total_win: win,
    balance: session.balance,
    free_spin,
    slot: {
      reel,
      winnings: [],
      cascaded: [],
    },
    jackpot_prizes: JACKPOT_PRIZES,
    max_win_hit: false,
    jackpot_hit: false,
  };

  return data;
}

// ─────────────────────────────────────────────────────────────
// Endpoints that match sampleAPI.ts expectations
// ─────────────────────────────────────────────────────────────

// POST /session/start
app.post("/api/v1/session/start", (req, res) => {
  // In a real app you would validate Authorization header here.
  const session = getOrCreateSession(null);

  const payload = {
    success: true,
    data: {
      session_id: session.session_id,
      status: "active",
      balance: session.balance,
      started_at: session.started_at,
    },
  };

  res.json(payload);
});

// POST /load
app.post("/api/v1/load", (req, res) => {
  const session = ensureSession(req);

  const payload = {
    success: true,
    data: {
      player: { balance: session.balance, currency: "PHP" },
      machine: MACHINE_CONFIG,
      slot: { reel: [] },
      info: MACHINE_INFO,
      jackpot_prizes: JACKPOT_PRIZES,
      free_spin: session.free_spin_count > 0 ? { count: session.free_spin_count } : null,
    },
  };

  res.json(payload);
});

// POST /play – main spin (bets.bet_size / bets.bet_level)
app.post("/api/v1/play", (req, res) => {
  const session = ensureSession(req);
  const { bets } = req.body || {};

  const bet_size = Number(bets?.bet_size ?? MACHINE_CONFIG.default.bet_size);
  const bet_level = Number(bets?.bet_level ?? MACHINE_CONFIG.default.bet_level);
  const totalBet = bet_size * bet_level;

  if (!Number.isFinite(totalBet) || totalBet <= 0) {
    return res.status(400).json({
      error: true,
      success: false,
      message: "Invalid bet parameters.",
    });
  }

  if (session.balance < totalBet) {
    return res.status(400).json({
      error: true,
      success: false,
      message: "Insufficient balance.",
    });
  }

  session.balance -= totalBet;
  const data = buildPlayPayload(session, totalBet, false, bet_size, bet_level);
  data.bet_size = bet_size;
  data.bet_level = bet_level;
  res.json({ success: true, data });
});

// POST /play-free-game – consume one free spin
app.post("/api/v1/play-free-game", (req, res) => {
  const session = ensureSession(req);

  if (session.free_spin_count <= 0) {
    return res.status(400).json({
      error: true,
      success: false,
      message: "No free spins remaining.",
    });
  }

  session.free_spin_count -= 1;

  // Use the default bet for free spins in this example
  const bet_size = MACHINE_CONFIG.default.bet_size;
  const bet_level = MACHINE_CONFIG.default.bet_level;
  const totalBet = bet_size * bet_level;
  const data = buildPlayPayload(session, totalBet, true, bet_size, bet_level);
  data.bet_size = bet_size;
  data.bet_level = bet_level;
  data.free_spin = { count: session.free_spin_count };

  res.json({ success: true, data });
});

// POST /buy-free-game – deduct cost and award free spins
app.post("/api/v1/buy-free-game", (req, res) => {
  const session = ensureSession(req);
  const { bets } = req.body || {};

  const bet_size = Number(bets?.bet_size ?? MACHINE_CONFIG.default.bet_size);
  const bet_level = Number(bets?.bet_level ?? MACHINE_CONFIG.default.bet_level);
  const totalBet = bet_size * bet_level;

  const cost = totalBet * (MACHINE_CONFIG.multiplier ?? 30);

  if (session.balance < cost) {
    return res.status(400).json({
      error: true,
      success: false,
      message: "Insufficient balance to buy free spins.",
    });
  }

  session.balance -= cost;
  session.free_spin_count += 10;

  const data = buildPlayPayload(session, totalBet, false, bet_size, bet_level);
  data.bet_size = bet_size;
  data.bet_level = bet_level;
  data.free_spin = { count: session.free_spin_count };

  res.json({ success: true, data });
});

// POST /jackpot – simple manual jackpot claim
app.post("/api/v1/jackpot", (req, res) => {
  const session = ensureSession(req);
  const jackpotWin = JACKPOT_PRIZES.mini;
  session.balance += jackpotWin;

  res.json({
    success: true,
    data: {
      win: jackpotWin,
      balance: session.balance,
    },
  });
});

app.listen(PORT, () => {
  console.log("Sample backend for sampleAPI.ts listening on http://localhost:" + PORT);
});

