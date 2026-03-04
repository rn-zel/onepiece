import type { WinEvaluator } from "../wins/types";
import { CascadeEngine, type NextSymbolIndex } from "../wins/CascadeEngine";
import type { SpinEngine, SpinRequest, SpinResult } from "./SpinEngine";

/**
 * Pure local spin engine:
 * - Takes a starting grid and bet amount
 * - Evaluates wins using the injected WinEvaluator (paylines or ways)
 * - Runs the pure CascadeEngine to produce cascade steps and final grid
 * - Returns a SpinResult with no knowledge of Pixi, UI, or I/O
 */
export class LocalSpinEngine implements SpinEngine {
  private readonly paylineEvaluator: WinEvaluator;
  private readonly waysEvaluator: WinEvaluator;
  private readonly nextSymbolIndex: NextSymbolIndex;
  private readonly maxCascadeSteps: number;

  constructor(
    paylineEvaluator: WinEvaluator,
    waysEvaluator: WinEvaluator,
    nextSymbolIndex: NextSymbolIndex,
    maxCascadeSteps: number = 20
  ) {
    this.paylineEvaluator = paylineEvaluator;
    this.waysEvaluator = waysEvaluator;
    this.nextSymbolIndex = nextSymbolIndex;
    this.maxCascadeSteps = maxCascadeSteps;
  }

  async spin(request: SpinRequest): Promise<SpinResult> {
    const { grid, betAmount, mode } = request;
    const evaluator = mode === "WAYS_243" ? this.waysEvaluator : this.paylineEvaluator;
    const cascadeEngine = new CascadeEngine(evaluator, this.nextSymbolIndex, this.maxCascadeSteps);
    const cascadeResult = cascadeEngine.run(grid, betAmount);

    return {
      initialGrid: grid,
      finalGrid: cascadeResult.finalGrid,
      cascades: cascadeResult.steps,
      totalWin: cascadeResult.totalWin,
    };
  }
}

