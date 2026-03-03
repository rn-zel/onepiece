import type { Grid, GridPosition, WinEvaluationResult, WinEvaluator } from "./types";

export type CascadeStep = {
  evaluation: WinEvaluationResult;
  gridAfterDrop: Grid;
  stepIndex: number;
  multiplier: number;
  stepWinBase: number;
  stepWinApplied: number;
};

export type CascadeResult = {
  steps: CascadeStep[];
  /** Sum of all stepWin. */
  totalWin: number;
  finalGrid: Grid;
};

export type NextSymbolIndex = (reelIndex: number) => number;

/**
 * Pure cascade engine:
 * - Evaluate wins
 * - Remove winning positions
 * - Drop + fill
 * - Repeat until no wins
 *
 * Step multipliers:
 * - Step 0 (initial grid): 1x
 * - Step 1 (first cascade): 2x
 * - Step 2: 3x
 */
export class CascadeEngine {
  private readonly evaluator: WinEvaluator;
  private readonly nextSymbolIndex: NextSymbolIndex;
  private readonly maxSteps: number;

  constructor(evaluator: WinEvaluator, nextSymbolIndex: NextSymbolIndex, maxSteps: number = 20) {
    this.evaluator = evaluator;
    this.nextSymbolIndex = nextSymbolIndex;
    this.maxSteps = maxSteps;
  }

  run(initialGrid: Grid, betAmount: number): CascadeResult {
    let grid = cloneGrid(initialGrid);
    const steps: CascadeStep[] = [];
    let totalWin = 0;

    for (let stepIndex = 0; stepIndex < this.maxSteps; stepIndex++) {
      const evaluation = this.evaluator.evaluate(grid, betAmount);
      if (evaluation.totalWin <= 0 || evaluation.winningPositions.length === 0) break;

      const stepWinBase = evaluation.totalWin;
      const multiplier = stepIndex + 1; 
      const stepWinApplied = stepWinBase * multiplier;

      totalWin += stepWinApplied;

      // Remove winners 
      const removed = removePositions(grid, evaluation.winningPositions);
      // Drop and refill
      grid = dropAndFill(removed, this.nextSymbolIndex);

      steps.push({
        evaluation,
        gridAfterDrop: cloneGrid(grid),
        stepIndex,
        multiplier,
        stepWinBase,
        stepWinApplied,
      });
    }

    return { steps, totalWin, finalGrid: grid };
  }
}

function removePositions(grid: Grid, positions: GridPosition[]) {
  const out: (number | null)[][] = grid.map((col) => col.slice());
  for (const p of positions) {
    if (!out[p.reel]) continue;
    out[p.reel][p.row] = null;
  }
  return out;
}

function dropAndFill(grid: (number | null)[][], nextSymbolIndex: NextSymbolIndex): Grid {
  const out: number[][] = [];

  for (let reel = 0; reel < grid.length; reel++) {
    const col = grid[reel];
    const kept = col.filter((v): v is number => v !== null);

    // Drop: fill from bottom up (row 2 is bottom)
    const newCol: number[] = [0, 0, 0];
    let writeRow = 2;
    for (let k = kept.length - 1; k >= 0; k--) {
      newCol[writeRow] = kept[k];
      writeRow--;
    }
    while (writeRow >= 0) {
      newCol[writeRow] = nextSymbolIndex(reel);
      writeRow--;
    }

    out.push(newCol);
  }

  return out;
}

function cloneGrid(grid: Grid): Grid {
  return grid.map((col) => col.slice());
}

