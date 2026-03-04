import type { Grid, WinMode } from "../wins/types";
import type { CascadeStep } from "../wins/CascadeEngine";

export type SpinRequest = {
  grid: Grid;
  betAmount: number;
  mode: WinMode;
};

export type SpinResult = {
  initialGrid: Grid;
  finalGrid: Grid;
  cascades: CascadeStep[];
  totalWin: number;
};

export interface SpinEngine {
  spin(request: SpinRequest): Promise<SpinResult>;
}

