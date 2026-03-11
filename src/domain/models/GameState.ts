import { CONFIG } from "../constants/Config";

/**
 * Manages the core business state of the game.
 * Centralizes balance, bet levels, and grid data.
 */
export class GameState {
  private _balance: number = CONFIG.CURRENT_BALANCE;
  private _currentBet: number = CONFIG.BET_AMOUNT;
  private _totalWin: number = 0;
  private _freeSpinsCount: number = 0;
  private _bonusSessionWin: number = 0;
  private _currentGrid: number[][] | null = null;

  constructor() {}

  get balance(): number {
    return this._balance;
  }
  set balance(value: number) {
    this._balance = value;
  }

  get currentBet(): number {
    return this._currentBet;
  }
  set currentBet(value: number) {
    this._currentBet = value;
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
   * Snaps a raw value to the nearest valid bet level defined in CONFIG.
   */
  public snapBetToList(value: number): number {
    const vals = CONFIG.BET_VALUES as readonly number[];
    if (!vals || vals.length === 0) return value;

    const nearest = vals.reduce((a, b) =>
      Math.abs(b - value) < Math.abs(a - value) ? b : a,
    );

    const min = vals[0] ?? value;
    const max = vals[vals.length - 1] ?? value;
    return Math.max(min, Math.min(max, nearest));
  }

  /**
   * Calculates the next or previous valid bet amount.
   * @param deltaIndex -1 for previous, 1 for next.
   */
  public getNextBetAmount(deltaIndex: -1 | 1): number {
    const vals = CONFIG.BET_VALUES as readonly number[];
    if (!vals || vals.length === 0) return this._currentBet;

    const currentSnapped = this.snapBetToList(this._currentBet);
    const currentIndex = vals.indexOf(currentSnapped);

    const safeIdx = currentIndex >= 0 ? currentIndex : 0;
    const nextIdx = Math.max(
      0,
      Math.min(vals.length - 1, safeIdx + deltaIndex),
    );

    return vals[nextIdx] ?? currentSnapped;
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
