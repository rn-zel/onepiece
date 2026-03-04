import { isScatter, isWild } from "./symbols";
import type {
  Grid,
  GridPosition,
  Win,
  WinEvaluationResult,
  WinEvaluator,
  WinMode,
  Paytable,
} from "./types";

/** True if symbol index is a paying symbol (A,K,Q,J,S1,S2,S3,S4). */
function isPayingSymbol(idx: number): boolean {
  return idx >= 0 && idx <= 7;
}

/**
 * 243 Ways evaluator (5 reels × 3 rows).
 * - Counts matches per reel for a chosen target symbol, including wild substitutes.
 * - Ways count = product of matches per reel for the matched reels.
 * - Requires at least 3 consecutive reels from the left.
 * - Scatter is excluded from ways evaluation (still handled separately by game flow).
 */
export class Ways243WinEvaluator implements WinEvaluator {
  readonly mode: WinMode = "WAYS_243";
  private readonly paytable: Paytable;

  constructor(paytable: Paytable) {
    this.paytable = paytable;
  }

  evaluate(grid: Grid, betAmount: number): WinEvaluationResult {
    const wins: Win[] = [];

    // Evaluate each paying symbol 
    for (let target = 0; target <= 7; target++) {
      if (!isPayingSymbol(target)) continue;

      const matchesPerReel: number[] = [];
      let matchLength = 0;

      for (let reel = 0; reel < 5; reel++) {
        const count = countMatchesInReel(grid, reel, target);
        if (count === 0) break;
        matchesPerReel.push(count);
        matchLength++;
      }

      if (matchLength < 3) continue;

      const waysCount = matchesPerReel.reduce((prod, c) => prod * c, 1);
      const multiplier = this.paytable.getSymbolMultiplier(target, matchLength);
      const payout = betAmount * multiplier * waysCount;
      if (payout <= 0) continue;

      const positions = collectWinningPositions(grid, matchLength, target);

      wins.push({
        payout,
        matchLength,
        positions,
        meta: { targetIndex: target, waysCount },
      });
    }

    // Optional: Jackpot-like rule for ways (5 reels contain wilds somewhere).
    // Keeping payline jackpot as the primary jackpot rule, but if you want a ways jackpot:
    // - uncomment below.
    //
    // if (reelsAllHaveWild(grid)) {
    //   wins.push({
    //     payout: betAmount * PAYOUTS.JACKPOT,
    //     matchLength: 5,
    //     positions: collectAllWildPositions(grid),
    //     meta: { isJackpot: true },
    //   });
    // }

    const winningPositions = dedupePositions(wins.flatMap((w) => w.positions));
    const totalWin = wins.reduce((sum, w) => sum + w.payout, 0);
    return { wins, totalWin, winningPositions };
  }
}

function countMatchesInReel(grid: Grid, reel: number, target: number) {
  let count = 0;
  for (let row = 0; row < 3; row++) {
    const idx = grid[reel][row];
    if (isScatter(idx)) continue;
    if (idx === target || isWild(idx)) count++;
  }
  return count;
}

function collectWinningPositions(grid: Grid, matchLength: number, target: number): GridPosition[] {
  const positions: GridPosition[] = [];
  for (let reel = 0; reel < matchLength; reel++) {
    for (let row = 0; row < 3; row++) {
      const idx = grid[reel][row];
      if (isScatter(idx)) continue;
      if (idx === target || isWild(idx)) positions.push({ reel, row });
    }
  }
  return positions;
}

function dedupePositions(positions: GridPosition[]) {
  const seen = new Set<string>();
  const out: GridPosition[] = [];
  for (const p of positions) {
    const key = `${p.reel},${p.row}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

