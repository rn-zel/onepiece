const SYMBOL_NAME_TO_INDEX: Record<string, number> = {
  a: 0,
  k: 1,
  q: 2,
  j: 3,
  s1: 4,
  s2: 5,
  s3: 6,
  s4: 7,
  wild: 8,
  sc: 9,
};
const INDEX_TO_SYMBOL = [
  "a",
  "k",
  "q",
  "j",
  "s1",
  "s2",
  "s3",
  "s4",
  "wild",
  "sc",
] as const;

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

export type BackendMachineConfig = {
  machine_id: number;
  min_bet?: number;
  max_bet?: number;
  bet_sizes?: number[];
  bet_levels?: number[];
  default?: { bet_size: number; bet_level: number };
  multiplier?: number;
  free_spin_cost?: number;
};

export type BackendLoadData = {
  player: { balance: number; currency?: string };
  machine?: BackendMachineConfig;
  info?: { base_multiplier?: number };
  slot?: { reel?: BackendReel } | null;
  jackpot_prizes?: Record<string, unknown> | null;
  free_spin?: { count: number; total_win?: number } | null;
};

export type BackendPlayData = {
  win: number;
  total_win: number;
  balance: number;
  bet_size?: number;
  bet_level?: number;
  free_spin?: BackendFreeSpin | null;
  is_free_spin?: boolean;
  slot: BackendSlot;
  jackpot_prizes?: Record<string, unknown> | null;
  max_win_hit?: boolean;
  jackpot_hit?: boolean;
  jackpot_type?: "mini" | "major" | "grand";
};

export type BackendResponse<T> = { success: boolean; data: T };

type BackendErrorResponse = {
  error?: boolean;
  code?: string;
  message?: string;
  success?: boolean;
};

type SessionInfo = {
  session_id: string;
  status: string;
  balance: number;
  started_at: string;
};

let apiBaseUrl = "http://blitzgamingbackoffice.test/api/v1";
let authToken: string | null = null;
let currentSessionId: string | null = null;
let roundCounter = 0;
let machineId: number | null = 421;

export function setSlotApiBaseUrl(url: string) {
  apiBaseUrl = url.replace(/\/$/, "");
}

export function getSlotApiBaseUrl(): string {
  return apiBaseUrl;
}

export function setAuthToken(token: string | null) {
  authToken = token?.trim() ? token.trim() : null;
  currentSessionId = null;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setMachineId(id: number | null) {
  machineId =
    typeof id === "number" && Number.isFinite(id) && id > 0 ? Math.floor(id) : null;
}

export function getMachineId(): number | null {
  return machineId;
}

function nextRoundId(): string {
  roundCounter += 1;
  return `r-${Date.now()}-${roundCounter}`;
}

async function fetchApi<T>(path: string, body?: object): Promise<T> {
  if (!authToken) {
    throw new Error("Missing token. Please launch the game from the lobby.");
  }

  const url = `${apiBaseUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: body ? JSON.stringify(body) : JSON.stringify({}),
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // ignore JSON parse errors; we'll throw a generic message below
  }

  if (!res.ok) {
    console.error("Slot API error", { url, status: res.status, body, json });
    const err = json as BackendErrorResponse | null;
    throw new Error(err?.message || `Slot API ${path}: ${res.status}`);
  }

  const err = json as BackendErrorResponse | null;
  if (err?.error === true || err?.success === false) {
    console.error("Slot API application error", { url, body, json });
    throw new Error(err?.message || "API error");
  }

  return json as T;
}

/** POST /session/start – start and cache session_id. */
export async function ensureSession(): Promise<SessionInfo> {
  if (currentSessionId) {
    return {
      session_id: currentSessionId,
      status: "active",
      balance: 0,
      started_at: "",
    };
  }

  const out = await fetchApi<BackendResponse<SessionInfo>>("/session/start", {});
  currentSessionId = out.data.session_id;
  return out.data;
}

/** POST /session/end – best-effort session close. Safe to call multiple times. */
export async function endSession(): Promise<void> {
  if (!currentSessionId) return;

  const sessionId = currentSessionId;
  try {
    await fetchApi<BackendResponse<unknown>>("/session/end", {
      session_id: sessionId,
    });
  } catch (err) {
    console.warn("Slot API: failed to end session", err);
  } finally {
    if (currentSessionId === sessionId) {
      currentSessionId = null;
    }
  }
}

/** POST /load – get initial balance, free spin count, jackpot prizes. */
export async function load(): Promise<BackendLoadData> {
  await ensureSession();
  const out = await fetchApi<BackendResponse<BackendLoadData>>("/load", {
    session_id: currentSessionId,
    machine_id: machineId ?? undefined,
  });

  const newMachineId = out.data.machine?.machine_id;
  if (typeof newMachineId === "number") setMachineId(newMachineId);

  if (out.data.free_spin && (out.data as any).free_spin.freeSpinWin !== undefined) {
    const fs: any = out.data.free_spin;
    fs.total_win = fs.total_win ?? fs.freeSpinWin;
  }

  return out.data;
}

/** POST /play – main game spin. Sends only bet_size and bet_level; backend computes bet amount. */
export async function play(
  betSize: number,
  betLevel: number = 1,
): Promise<BackendPlayData> {
  await ensureSession();
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/play", {
    session_id: currentSessionId,
    round_id: nextRoundId(),
    machine_id: machineId ?? undefined,
    bets: { bet_size: betSize, bet_level: betLevel },
  });
  return out.data;
}

/** POST /play-free-game – one free spin. */
export async function playFreeGame(_bet?: number): Promise<BackendPlayData> {
  await ensureSession();
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/play-free-game", {
    session_id: currentSessionId,
    round_id: nextRoundId(),
    machine_id: machineId ?? undefined,
  });
  return {
    ...out.data,
    free_spin: out.data.free_spin ?? null,
  };
}

/** POST /buy-free-game – buy free spins. Sends only bet_size and bet_level. */
export async function buyFreeGame(
  betSize: number,
  betLevel: number = 1,
): Promise<BackendPlayData> {
  await ensureSession();
  const out = await fetchApi<BackendResponse<BackendPlayData>>("/buy-free-game", {
    session_id: currentSessionId,
    round_id: nextRoundId(),
    machine_id: machineId ?? undefined,
    bets: { bet_size: betSize, bet_level: betLevel },
  });
  return out.data;
}

/** POST /jackpot – claim jackpot (currently always mini for demo). */
export async function jackpot(): Promise<{ win: number; balance: number }> {
  await ensureSession();
  const out = await fetchApi<BackendResponse<{ win: number; balance: number }>>(
    "/jackpot",
    {
      session_id: currentSessionId,
      round_id: nextRoundId(),
      jackpot_type: "mini",
    },
  );
  return out.data;
}

/** Convert backend reel (symbol names) to grid of symbol indices. */
/** * Convert backend reel (symbol names) to grid of symbol indices.
 * Enforces a Column-Major matrix [reelIndex][rowIndex] required by the Domain.
 */
export function backendReelToGrid(reel: BackendReel): number[][] {
  const indexGrid = reel.map((row) => row.map((name) => symbolNameToIndex(name)));

  let finalGrid: number[][];

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

  return finalGrid;
}
