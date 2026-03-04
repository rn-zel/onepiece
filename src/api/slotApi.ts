/**
 * Slot API client for backend-ready mode.
 * Matches the response shape from slot-free.js (Express sample backend).
 */

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

/** Backend reel: 5 columns, each column = 3 symbol names (rows 0,1,2). */
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

let apiBaseUrl = "http://localhost:3000";

export function setSlotApiBaseUrl(url: string) {
  apiBaseUrl = url.replace(/\/$/, "");
}

export function getSlotApiBaseUrl(): string {
  return apiBaseUrl;
}

async function fetchApi<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Slot API ${path}: ${res.status}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.message || "API error");
  return json as T;
}

/** POST /load – get initial balance, free spin count, jackpot prizes. */
export async function load(): Promise<BackendLoadData> {
  const out = await fetchApi<BackendResponse<BackendLoadData>>("/load", {});
  return out.data;
}

/** POST /play – main game spin. Send bet so backend can use it (slot-free.js uses global totalBet; real backend should use body.bet). */
export async function play(bet: number): Promise<BackendPlayData> {
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/play", { bet });
  return out.data;
}

/** POST /play-free-game – one free spin. */
export async function playFreeGame(): Promise<BackendPlayData> {
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/play-free-game", {});
  return out.data;
}

/** POST /buy-free-game – buy free spins (cost = bet * 10 in sample). */
export async function buyFreeGame(bet: number): Promise<BackendPlayData> {
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/buy-free-game", { bet });
  return out.data;
}

/** POST /jackpot – claim jackpot. */
export async function jackpot(): Promise<{ win: number; balance: number }> {
  const out = await fetchApi<BackendResponse<{ win: number; balance: number }>>("/jackpot", {});
  return out.data;
}

/** Convert backend reel (symbol names) to grid of symbol indices. */
export function backendReelToGrid(reel: BackendReel): number[][] {
  return reel.map((col) => col.map((name) => symbolNameToIndex(name)));
}
