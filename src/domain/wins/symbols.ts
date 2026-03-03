import type { SymbolIndex } from "./types";

export const SYMBOL = {
  WILD: 8 as SymbolIndex,
  SCATTER: 9 as SymbolIndex,
} as const;

export function isScatter(idx: SymbolIndex) {
  return idx === SYMBOL.SCATTER;
}

export function isWild(idx: SymbolIndex) {
  return idx === SYMBOL.WILD;
}

