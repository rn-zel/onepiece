export type SymbolIndex = number; 

export type Grid = SymbolIndex[][]; 

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


export interface Paytable {
  /**
   * Multiplier for a given symbol and match length (3, 4, 5 of a kind).
   * Returns 0 when the combination does not pay.
   */
  getSymbolMultiplier(symbolIndex: SymbolIndex, matchLength: number): number;

  /**
   * Multiplier used for jackpot-style wins
   */
  getJackpotMultiplier(): number;
}

export interface WinEvaluator {
  readonly mode: WinMode;
  evaluate(grid: Grid, betAmount: number): WinEvaluationResult;
}

