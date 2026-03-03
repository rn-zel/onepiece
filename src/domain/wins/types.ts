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

export interface WinEvaluator {
  readonly mode: WinMode;
  evaluate(grid: Grid, betAmount: number): WinEvaluationResult;
}

