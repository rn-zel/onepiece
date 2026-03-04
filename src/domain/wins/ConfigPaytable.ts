import { PAYOUTS, SYMBOL_BASE } from "../../Config";
import type { Paytable, SymbolIndex } from "./types";

/**
 * Default paytable implementation backed by CONFIG / PAYOUTS.
 *
 * - Uses SYMBOL_BASE[index] as the base multiplier for 3-of-a-kind.
 * - Applies PAYOUTS.MULTI_4 and PAYOUTS.MULTI_5 for 4- and 5-of-a-kind.
 * - Uses PAYOUTS.JACKPOT for jackpot-style wins (5 wilds on a payline).
 */
export class ConfigPaytable implements Paytable {
  getSymbolMultiplier(symbolIndex: SymbolIndex, matchLength: number): number {
    const base = SYMBOL_BASE[symbolIndex];
    if (base == null || base === 0) return 0;
    if (matchLength < 3) return 0;
    if (matchLength === 3) return base;
    if (matchLength === 4) return base; 
    // * PAYOUTS.MULTI_4;
    if (matchLength === 5) return base; 
    // * PAYOUTS.MULTI_5;
    return 0;
  }

  getJackpotMultiplier(): number {
    return PAYOUTS.JACKPOT;
  }
}

