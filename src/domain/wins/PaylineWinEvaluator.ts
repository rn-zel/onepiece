import { PAYLINES, PAYOUTS } from "../../Config";
import { SYMBOL, isScatter, isWild } from "./symbols";
import type { Grid, GridPosition, Win, WinEvaluationResult, WinEvaluator, WinMode } from "./types";

function symbolTier(idx: number): "LOW" | "HIGH" | "WILD" | "SCATTER" | "UNKNOWN" {
  if (idx >= 0 && idx <= 4) return "LOW";
  if (idx >= 5 && idx <= 7) return "HIGH";
  if (idx === SYMBOL.WILD) return "WILD";
  if (idx === SYMBOL.SCATTER) return "SCATTER";
  return "UNKNOWN";
}

function payoutForMatchLength(tier: "LOW" | "HIGH", matchLength: number) {
  const basePay = tier === "HIGH" ? PAYOUTS.HIGH : PAYOUTS.LOW;
  if (matchLength === 3) return basePay;
  if (matchLength === 4) return basePay * PAYOUTS.MULTI_4;
  if (matchLength === 5) return basePay * PAYOUTS.MULTI_5;
  return 0;
}

export class PaylineWinEvaluator implements WinEvaluator {
  readonly mode: WinMode = "PAYLINES";

  evaluate(grid: Grid, betAmount: number): WinEvaluationResult {
    const wins: Win[] = [];

    for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex++) {
      const line = PAYLINES[lineIndex];
      const symbols = [
        grid[0][line[0]],
        grid[1][line[1]],
        grid[2][line[2]],
        grid[3][line[3]],
        grid[4][line[4]],
      ];

      // Jackpot: 5 consecutive wilds starting from reel 0
      if (
        symbols[0] === SYMBOL.WILD &&
        symbols[1] === SYMBOL.WILD &&
        symbols[2] === SYMBOL.WILD &&
        symbols[3] === SYMBOL.WILD &&
        symbols[4] === SYMBOL.WILD
      ) {
        const positions: GridPosition[] = line.map((row, reel) => ({ reel, row }));
        wins.push({
          payout: betAmount * PAYOUTS.JACKPOT,
          matchLength: 5,
          positions,
          meta: { lineIndex, isJackpot: true },
        });
        continue;
      }

      let bestWinForLine: Win | null = null;

      // Evaluate matches starting from reel 0, 1, or 2
      for (let start = 0; start <= 2; start++) {
        let targetIndex = symbols[start];

        // If starting on wild, pick the first non-wild to define the target (if any)
        if (isWild(targetIndex)) {
          for (let k = start + 1; k < 5; k++) {
            if (!isWild(symbols[k])) {
              targetIndex = symbols[k];
              break;
            }
          }
        }

        if (isScatter(targetIndex)) continue;

        let matchLength = 1;
        for (let next = start + 1; next < 5; next++) {
          if (symbols[next] === targetIndex || isWild(symbols[next])) matchLength++;
          else break;
        }

        if (matchLength < 3) continue;

        const tier = symbolTier(targetIndex);
        if (tier !== "LOW" && tier !== "HIGH") continue;

        const multiplier = payoutForMatchLength(tier, matchLength);
        const payout = betAmount * multiplier;

        if (!bestWinForLine || payout > bestWinForLine.payout) {
          const positions: GridPosition[] = [];
          for (let i = 0; i < matchLength; i++) {
            const reelIndex = start + i;
            positions.push({ reel: reelIndex, row: line[reelIndex] });
          }

          bestWinForLine = {
            payout,
            matchLength,
            positions,
            meta: { lineIndex, startIndex: start, targetIndex },
          };
        }
      }

      if (bestWinForLine) wins.push(bestWinForLine);
    }

    const winningPositions = dedupePositions(wins.flatMap((w) => w.positions));
    const totalWin = wins.reduce((sum, w) => sum + w.payout, 0);

    return { wins, totalWin, winningPositions };
  }
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

