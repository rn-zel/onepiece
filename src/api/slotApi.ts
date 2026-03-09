
const SYMBOL_NAME_TO_INDEX: Record<string, number> = {
  a: 0, k: 1, q: 2, j: 3,
  s1: 4, s2: 5, s3: 6, s4: 7,
  wild: 8, sc: 9,
};
const INDEX_TO_SYMBOL = ["a", "k", "q", "j", "s1", "s2", "s3", "s4", "wild", "sc"] as const;

export function symbolNameToIndex(name: string): number {
  const n = String(name).toLowerCase();
  return SYMBOL_NAME_TO_INDEX[n] ?? 0;
}

export function symbolIndexToName(index: number): string {
  return INDEX_TO_SYMBOL[index] ?? "a";
}

export type BackendReel = string[][];

export type BackendWinning = {
  symbol: string;
  payout: number;
  ways: number;
  hasWild?: boolean;
  direction?: string;
  length: number;
};

export type BackendCascadeStep = {
  winnings: BackendWinning[];
  rng: BackendReel;
  type?: string;
  win: number;
  multiplier: number;
  cascades: { column: number; row: number; symbol: string }[];
};

export type BackendSlot = {
  reel: BackendReel;
  winnings?: BackendWinning[];
  cascaded?: BackendCascadeStep[];
};

export type BackendFreeSpin = {
  count: number;
  scatterCount?: number | null;
  retrigger?: boolean;
  add?: number | null;
};

export type BackendLoadData = {
  player: { balance: number; currency?: string };
  jackpot_prizes?: Record<string, unknown> | null;
  free_spin?: { count: number } | null;
};

export type BackendPlayData = {
  win: number;
  total_win: number;
  balance: number;
  free_spin?: BackendFreeSpin | null;
  slot: BackendSlot;
  jackpot_prizes?: Record<string, unknown> | null;
  max_win_hit?: boolean;
};

export type BackendResponse<T> = { success: boolean; data: T };

// Temporary hardcoded integration values for BlitzGamingBackoffice.
// Update these IDs and token to match real data in the backoffice.
const GAME_API_CONFIG = {
  baseUrl: "http://blitzgamingbackoffice.test/api/v1",
  gameToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwbGF5ZXJfaWQiOiIwMTljNzlkZS03NGVjLTcyOWQtODY1Ny02NTMzZDg3NzI1YmYiLCJnYW1lX2lkIjoiMDE5Y2IzMTEtMzBiMi03MTg4LThlOTctNWY1ZGE0ZTllMzI5IiwicHJvdmlkZXJfaWQiOiIwMTljYWQwYi0zYjA1LTcwY2YtOTY0MS0yZTQ1Yzg0ZjFmOTciLCJpYXQiOjE3NzI3ODIzOTAsImV4cCI6MTc3Mjc4NTk5MH0.L3837JT9aECfKsdC-OQTvIFmdqYY8ucu8ZjkSKwVD6c",
  playerId: "019c79de-74ec-729d-8657-6533d87725bf",
  gameId: "019cb311-30b2-7188-8e97-5f5da4e9e329",
  providerId: "019cad0b-3b05-70cf-9641-2e45c84f1f97",
};

let apiBaseUrl = GAME_API_CONFIG.baseUrl;

export function setSlotApiBaseUrl(url: string) {
  apiBaseUrl = url.replace(/\/$/, "");
}

export function getSlotApiBaseUrl(): string {
  return apiBaseUrl;
}

async function fetchApi<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GAME_API_CONFIG.gameToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Slot API ${path}: ${res.status}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.message || "API error");
  return json as T;
}

type SessionInfo = {
  session_id: string;
  status: string;
  balance: number;
  started_at: string;
};

let currentSessionId: string | null = null;
let roundCounter = 0;

function nextRoundId(): string {
  roundCounter += 1;
  return `r-${Date.now()}-${roundCounter}`;
}

/** POST /session/start – ensure a game session exists and cache session_id locally. */
export async function ensureSession(): Promise<SessionInfo> {
  if (currentSessionId) {
    return {
      session_id: currentSessionId,
      status: "active",
      balance: 0,
      started_at: "",
    };
  }

  const out = await fetchApi<BackendResponse<SessionInfo>>("/session/start", {
    player_id: GAME_API_CONFIG.playerId,
    game_id: GAME_API_CONFIG.gameId,
    provider_id: GAME_API_CONFIG.providerId,
  });

  currentSessionId = out.data.session_id;
  return out.data;
}

/** POST /load – get initial balance, free spin count, jackpot prizes. */
export async function load(): Promise<BackendLoadData> {
  await ensureSession();
  const out = await fetchApi<BackendResponse<BackendLoadData>>("/load", {
    player_id: GAME_API_CONFIG.playerId,
    game_id: GAME_API_CONFIG.gameId,
    provider_id: GAME_API_CONFIG.providerId,
    session_id: currentSessionId,
  });
  return out.data;
}

/** POST /play – main game spin using bets.bet_size / bets.bet_level. */
export async function play(bet: number): Promise<BackendPlayData> {
  await ensureSession();
  const round_id = nextRoundId();
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/play", {
    session_id: currentSessionId,
    round_id,
    player_id: GAME_API_CONFIG.playerId,
    game_id: GAME_API_CONFIG.gameId,
    bets: {
      bet_size: bet,
      bet_level: 1,
    },
  });
  return out.data;
}

/** POST /play-free-game – one free spin. */
export async function playFreeGame(): Promise<BackendPlayData> {
  await ensureSession();
  const round_id = nextRoundId();
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/play-free-game", {
    session_id: currentSessionId,
    round_id,
    player_id: GAME_API_CONFIG.playerId,
    game_id: GAME_API_CONFIG.gameId,
  });
  return out.data;
}

/** POST /buy-free-game – buy free spins using bets.bet_size / bets.bet_level. */
export async function buyFreeGame(bet: number): Promise<BackendPlayData> {
  await ensureSession();
  const round_id = nextRoundId();
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/buy-free-game", {
    session_id: currentSessionId,
    round_id,
    player_id: GAME_API_CONFIG.playerId,
    game_id: GAME_API_CONFIG.gameId,
    bets: {
      bet_size: bet,
      bet_level: 1,
    },
  });
  return out.data;
}

/** POST /jackpot – claim jackpot (wired for later use). */
export async function jackpot(): Promise<{ win: number; balance: number }> {
  await ensureSession();
  const round_id = nextRoundId();
  const out = await fetchApi<BackendResponse<{ win: number; balance: number }>>("/jackpot", {
    session_id: currentSessionId,
    round_id,
    player_id: GAME_API_CONFIG.playerId,
    game_id: GAME_API_CONFIG.gameId,
    jackpot_type: "mini",
  });
  return out.data;
}

/** Convert backend reel (symbol names) to grid of symbol indices. */
export function backendReelToGrid(reel: BackendReel): number[][] {
  return reel.map((col) => col.map((name) => symbolNameToIndex(name)));
}
