export interface HistoryRecord {
  timestamp: number;
  bet: number;
  win: number;
  isBonus: boolean;
}

export class TelemetryService {
  private static instance: TelemetryService;

  private _totalWagered: number = 0;
  private _totalWon: number = 0;
  private _spinsCount: number = 0;
  private _bonusSpinsCount: number = 0;
  private _sessionStartTime: number;
  private _history: HistoryRecord[] = [];

  private constructor() {
    this._sessionStartTime = Date.now();
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public trackSpin(bet: number, win: number, isBonus: boolean = false) {
    this._totalWagered += bet;
    this._totalWon += win;
    this._spinsCount++;
    if (isBonus) this._bonusSpinsCount++;

    this._history.unshift({
      timestamp: Date.now(),
      bet,
      win,
      isBonus,
    });

    if (this._history.length > 50) this._history.pop();
  }

  public getHistory(): HistoryRecord[] {
    return this._history;
  }

  public getRTP(): number {
    if (this._totalWagered === 0) return 0;
    return (this._totalWon / this._totalWagered) * 100;
  }

  public getSessionStats() {
    return {
      totalWagered: this._totalWagered,
      totalWon: this._totalWon,
      spinsCount: this._spinsCount,
      bonusSpinsCount: this._bonusSpinsCount,
      rtp: this.getRTP(),
      duration: Math.floor((Date.now() - this._sessionStartTime) / 1000),
    };
  }

  public reset() {
    this._totalWagered = 0;
    this._totalWon = 0;
    this._spinsCount = 0;
    this._bonusSpinsCount = 0;
    this._history = [];
    this._sessionStartTime = Date.now();
  }
}
