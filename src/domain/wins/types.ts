export type SymbolIndex = number; // 0..N-1 (matches ASSETS.TEXTURES order)

export type Grid = SymbolIndex[][]; // grid[reelIndex][rowIndex]

export type GridPosition = { reel: number; row: number };

export type WinMode = "PAYLINES" | "WAYS_243";

export type Win = {
  payout: number;
  matchLength: number;
  positions: GridPosition[];
  meta?: Record<string, unknown>;
};

export type WinEvaluationResult = {
  wins: Win[];
  totalWin: number;
  winningPositions: GridPosition[];
};

/**
 * Paytable abstraction for symbol payouts.
 * Returns multipliers that will be scaled by the current bet amount.
 */
export interface Paytable {
  /**
   * Multiplier for a given symbol and match length (3, 4, 5 of a kind).
   * Returns 0 when the combination does not pay.
   */
  getSymbolMultiplier(symbolIndex: SymbolIndex, matchLength: number): number;

  /**
   * Multiplier used for jackpot-style wins (e.g. 5 wilds on a payline).
   */
  getJackpotMultiplier(): number;
}

export interface WinEvaluator {
  readonly mode: WinMode;
  evaluate(grid: Grid, betAmount: number): WinEvaluationResult;
}

