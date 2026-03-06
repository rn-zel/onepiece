
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
  positions?: { column: number; row: number }[];
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

/** POST /play-free-game – one free spin. Sends bet so backend can compute payouts. */
export async function playFreeGame(bet: number = 100): Promise<BackendPlayData> {
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/play-free-game", { bet });
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
/** * Convert backend reel (symbol names) to grid of symbol indices.
 * Enforces a Column-Major matrix [reelIndex][rowIndex] required by the Domain.
 */
export function backendReelToGrid(reel: BackendReel): number[][] {
  // 1. Map string identifiers to numeric domain indices
  const indexGrid = reel.map((row) => row.map((name) => symbolNameToIndex(name)));

  let finalGrid: number[][];

  // 2. Validate and Transpose:
  // If the backend returns Row-Major data (e.g., 3 arrays of 5 elements),
  // transpose it into Col-Major data (5 arrays of 3 elements).
  if (indexGrid.length > 0 && indexGrid[0].length > indexGrid.length) {
    const transposedGrid: number[][] = [];
    const numCols = indexGrid[0].length;
    const numRows = indexGrid.length;

    for (let c = 0; c < numCols; c++) {
      transposedGrid[c] = [];
      for (let r = 0; r < numRows; r++) {
        transposedGrid[c][r] = indexGrid[r][c];
      }
    }
    finalGrid = transposedGrid;
  } else {
    finalGrid = indexGrid;
  }

  // ─── DEBUG ────────────────────────────────────────────────────────
  const NAMES = ["a","k","q","j","s1","s2","s3","s4","wild","sc"];
  console.group("🎰 backendReelToGrid");
  console.log("Raw reel from backend (each entry = one column [r0,r1,r2]):");
  reel.forEach((col, i) => console.log(`  Reel ${i}: ${col.join(", ")}`));
  console.log("Mapped to indices + final grid [reel][row]:");
  finalGrid.forEach((col, i) =>
    console.log(`  Reel ${i}: [${col.join(", ")}]  →  ${col.map(n => NAMES[n] ?? "?").join(" | ")}`)
  );
  console.groupEnd();
  // ─────────────────────────────────────────────────────────────────

  return finalGrid;
}