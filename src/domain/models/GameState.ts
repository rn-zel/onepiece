import { CONFIG, GAME_RULES } from "../constants/Config";

/**
 * Manages the core business state of the game.
 * Backend is source of truth for bet config: bet_sizes, default, multiplier, free_spin_cost.
 * We store currentBetSize and derive currentBetAmount = betSize * betLevel * baseMultiplier.
 */
export class GameState {
  private _balance: number = CONFIG.CURRENT_BALANCE;
  private _totalWin: number = 0;
  private _freeSpinsCount: number = 0;
  private _bonusSessionWin: number = 0;
  private _currentGrid: number[][] | null = null;

  /** Bet config from /load (machine). Fallback from GAME_RULES until load completes. */
  private _betSizes: number[] =
    GAME_RULES.BET_SIZES?.length > 0 ? [...GAME_RULES.BET_SIZES] : [20];
  private _currentBetSize: number = this._betSizes[0] ?? 20;
  private _betLevel: number = 1;
  private _baseMultiplier: number = GAME_RULES.BASE_BET_MULTIPLIER ?? 20;
  private _freeSpinCostMultiplier: number = CONFIG.BUY_COST_MULTIPLIER ?? 10;

  constructor() {}

  get balance(): number {
    return this._balance;
  }
  set balance(value: number) {
    this._balance = value;
  }

  /** Derived: bet_size * bet_level * base_multiplier (display "Total bet"). */
  get currentBetAmount(): number {
    return this._currentBetSize * Math.max(1, this._betLevel) * Math.max(0, this._baseMultiplier) || this._currentBetSize * this._betLevel;
  }

  /** Alias for UI/controller compatibility. */
  get currentBet(): number {
    return this.currentBetAmount;
  }
  set currentBet(_: number) {
    // No-op; bet is derived from currentBetSize. Use currentBetSize for changes.
  }

  get betSizes(): number[] {
    return [...this._betSizes];
  }
  get currentBetSize(): number {
    return this._currentBetSize;
  }
  set currentBetSize(value: number) {
    this._currentBetSize = value;
  }
  get betLevel(): number {
    return this._betLevel;
  }
  get baseMultiplier(): number {
    return this._baseMultiplier;
  }
  get freeSpinCostMultiplier(): number {
    return this._freeSpinCostMultiplier;
  }

  /** Derived: currentBetAmount * freeSpinCostMultiplier (cost to buy free spins). */
  get buyCost(): number {
    return this.currentBetAmount * this._freeSpinCostMultiplier;
  }

  get totalWin(): number {
    return this._totalWin;
  }
  set totalWin(value: number) {
    this._totalWin = value;
  }

  get freeSpinsCount(): number {
    return this._freeSpinsCount;
  }
  set freeSpinsCount(value: number) {
    this._freeSpinsCount = value;
  }

  get bonusSessionWin(): number {
    return this._bonusSessionWin;
  }
  set bonusSessionWin(value: number) {
    this._bonusSessionWin = value;
  }

  get currentGrid(): number[][] | null {
    return this._currentGrid;
  }
  set currentGrid(value: number[][] | null) {
    this._currentGrid = value;
  }

  /**
   * Snaps a raw bet size to the nearest valid bet size in the list.
   */
  public snapBetSizeToList(value: number): number {
    const vals = this._betSizes;
    if (!vals.length) return value;
    const nearest = vals.reduce((a, b) =>
      Math.abs(b - value) < Math.abs(a - value) ? b : a,
    );
    const min = vals[0] ?? value;
    const max = vals[vals.length - 1] ?? value;
    return Math.max(min, Math.min(max, nearest));
  }

  /**
   * Next or previous bet size in the list. Use this to adjust bet selector.
   * @param deltaIndex -1 for previous, 1 for next.
   */
  public getNextBetSize(deltaIndex: -1 | 1): number {
    const vals = this._betSizes;
    if (!vals.length) return this._currentBetSize;
    const currentSnapped = this.snapBetSizeToList(this._currentBetSize);
    const currentIndex = vals.indexOf(currentSnapped);
    const safeIdx = currentIndex >= 0 ? currentIndex : 0;
    const nextIdx = Math.max(0, Math.min(vals.length - 1, safeIdx + deltaIndex));
    return vals[nextIdx] ?? currentSnapped;
  }

  /**
   * Apply machine config from /load. Call after load().
   */
  public updateFromLoadData(data: {
    machine?: {
      bet_sizes?: number[];
      default?: { bet_size?: number; bet_level?: number };
      multiplier?: number;
      free_spin_cost?: number;
    };
    info?: { base_multiplier?: number };
  }): void {
    const machine = data.machine ?? {};
    if (Array.isArray(machine.bet_sizes) && machine.bet_sizes.length > 0) {
      this._betSizes = [...machine.bet_sizes];
    }
    const baseMult =
      data.info?.base_multiplier ?? machine.multiplier ?? this._baseMultiplier;
    if (typeof baseMult === "number" && baseMult > 0) {
      this._baseMultiplier = baseMult;
    }
    if (typeof machine.free_spin_cost === "number" && machine.free_spin_cost >= 0) {
      this._freeSpinCostMultiplier = machine.free_spin_cost;
    }
    const defaultSize = machine.default?.bet_size;
    if (typeof defaultSize === "number") {
      this._currentBetSize = this.snapBetSizeToList(defaultSize);
    } else if (this._betSizes.length > 0) {
      this._currentBetSize = this._betSizes[0];
    }
    const defaultLevel = machine.default?.bet_level;
    if (typeof defaultLevel === "number" && defaultLevel >= 1) {
      this._betLevel = defaultLevel;
    }
  }

  /**
   * Updates the state from a backend play response.
   */
  public updateFromPlayData(data: {
    balance: number;
    total_win: number;
    free_spin?: { count: number } | null;
  }) {
    this._balance = data.balance;
    this._totalWin = data.total_win;
    if (data.free_spin) {
      this._freeSpinsCount = data.free_spin.count;
    } else {
      this._freeSpinsCount = 0;
    }
  }
}
