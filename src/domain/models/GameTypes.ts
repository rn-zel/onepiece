import type { Sprite } from "pixi.js";

/**
 * A PixiJS Sprite augmented with slot-machine runtime metadata.
 * Use this interface instead of `(sprite as any).baseScale`.
 */
export interface SymbolSprite extends Sprite {
    baseScale: number;
    lap: number;
}

/** A resolved position on the visible 5×3 grid. */
export interface GridPosition {
    reel: number;
    row: number;
}

/**
 * A normalized cascade step ready to be played by the CascadeOrchestrator.
 * Derived from BackendCascadeStep after pairing wins with their successor grids.
 */
export interface CascadePlayStep {
    /** Raw payout for this step (before multiplier). */
    win: number;
    /** Cascade multiplier (≥1). */
    multiplier: number;
    /** Positions that glow and then explode on the current grid. */
    cascades: ReadonlyArray<{ column: number; row: number; symbol: string }>;
    /** The raw backend reel representing the grid state after the drop. */
    rng: string[][] | null;
}
