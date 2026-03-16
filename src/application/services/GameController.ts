import * as slotApi from "../../infrastructure/api/slotApi";
import { GameState } from "../../domain/models/GameState";
import { type SpinOrchestrator } from "../orchestrators/SpinOrchestrator";
import { type CascadeOrchestrator } from "../orchestrators/CascadeOrchestrator";
import { type UIManager } from "../../presentation/ui/UIManager";
import { type JackpotPresenter } from "../../presentation/ui/JackpotPresenter";
import { CONFIG } from "../../domain/constants/Config";
import { type AutoSpinConfig } from "../../presentation/ui/AutoSpinModal";
import { TelemetryService } from "../../domain/services/TelemetryService";

/**
 * Orchestrates the high-level game flow.
 * Connects UI events to domain state and infrastructure APIs.
 */
export class GameController {
  private state: GameState;
  private ui: UIManager;
  private spinOrchestrator: SpinOrchestrator;
  private cascadeOrchestrator: CascadeOrchestrator;
  private jackpotPresenter: JackpotPresenter;
  private onBonusTriggered?: (count: number) => Promise<void>;
  private onBonusEnded?: () => Promise<void>;

  private isSpinning: boolean = false;
  private isAutoSpinning: boolean = false;
  private autoSpinConfig: AutoSpinConfig | null = null;
  private sessionStartBalance: number = 0;
  private telemetry = TelemetryService.getInstance();

  constructor(
    state: GameState,
    ui: UIManager,
    spinOrchestrator: SpinOrchestrator,
    cascadeOrchestrator: CascadeOrchestrator,
    jackpotPresenter: JackpotPresenter,
  ) {
    this.state = state;
    this.ui = ui;
    this.spinOrchestrator = spinOrchestrator;
    this.cascadeOrchestrator = cascadeOrchestrator;
    this.jackpotPresenter = jackpotPresenter;
  }

  public setBonusTriggerCallback(callback: (count: number) => Promise<void>) {
    this.onBonusTriggered = callback;
  }

  public setBonusEndCallback(callback: () => Promise<void>) {
    this.onBonusEnded = callback;
  }

  /**
   * Entry point for a standard spin.
   */
  public async handleSpinRequest(): Promise<void> {
    if (this.isSpinning) return;

    const betAmount = this.state.currentBetAmount;
    if (this.state.balance < betAmount && this.state.freeSpinsCount <= 0) {
      this.ui.container.emit("insufficientBalance");
      this.stopAutoSpin();
      return;
    }

    this.isSpinning = true;

    try {
      while (true) {
        this.ui.winPresenter.hide(); // Hide any active result panels
        this.state.totalWin = 0; // Reset win at start of spin
        this.updateUI();

        this.ui.toggleButtonTheme(this.state.freeSpinsCount > 0, this.isAutoSpinning);
        this.spinOrchestrator.showSpinFeedback(this.state.freeSpinsCount > 0);

        const response = await this.executeSpin();
        await this.processSpinResult(response);

        // If we still have free spins, continue the loop automatically
        if (this.state.freeSpinsCount > 0) {
          // Delay between sequential free spins
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          break;
        }
      }
    } catch (error) {
      console.error("Spin error:", error);
      this.stopAutoSpin();
    } finally {
      this.isSpinning = false;
      this.updateUI();
    }
  }

  public get autoSpinActive(): boolean {
    return this.isAutoSpinning;
  }

  public get spinning(): boolean {
    return this.isSpinning;
  }

  public async startAutoSpin(config: AutoSpinConfig) {
    if (this.isAutoSpinning) return;

    this.isAutoSpinning = true;
    this.autoSpinConfig = config;
    this.sessionStartBalance = this.state.balance;

    while (this.isAutoSpinning && this.autoSpinConfig && this.autoSpinConfig.count > 0) {
      // 1. Wait for any current spin to finish
      if (this.isSpinning) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      // 2. Perform spin
      await this.handleSpinRequest();

      // 3. Decrement count
      this.autoSpinConfig.count--;

      // 4. Check stop conditions
      // if (this.autoSpinConfig.stopOnWin && this.state.totalWin > 0) {
      //   this.stopAutoSpin();
      //   break;
      // }

      const sessionLoss = this.sessionStartBalance - this.state.balance;
      if (this.autoSpinConfig.stopOnLossLimit > 0 && sessionLoss >= this.autoSpinConfig.stopOnLossLimit) {
        this.stopAutoSpin();
        break;
      }

      if (!this.isAutoSpinning) break;

      // Small delay between auto spins
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.stopAutoSpin();
  }

  public stopAutoSpin() {
    this.isAutoSpinning = false;
    this.autoSpinConfig = null;
    this.updateUI();
  }

  private async executeSpin(): Promise<slotApi.BackendPlayData> {
    if (this.state.freeSpinsCount > 0) {
      return await slotApi.playFreeGame();
    }
    return await slotApi.play(this.state.currentBetSize, this.state.betLevel);
  }

  private async processSpinResult(
    data: slotApi.BackendPlayData,
  ): Promise<void> {
    const grid = slotApi.backendReelToGrid(data.slot.reel);
    this.telemetry.trackSpin(this.state.currentBet, data.total_win, data.is_free_spin);

    // Initial State Update (Trust balance from backend)
    const wasFreeSpin = this.state.freeSpinsCount > 0 || data.is_free_spin === true;
    this.state.balance = data.balance;
    this.state.freeSpinsCount = data.free_spin?.count ?? 0;
    const isFreeSpinNow = this.state.freeSpinsCount > 0;

    const finalSpinWin = data.total_win;
    const spinWin = data.win;

    return new Promise<void>((resolve) => {
      this.spinOrchestrator.animateReels(
        grid,
        !!data.free_spin?.count,
        async () => {
          //. Handle Jackpots
          if (data.jackpot_hit && data.jackpot_type) {
            const raw = data.jackpot_prizes?.[data.jackpot_type];
            const winAmount = typeof raw === "number" ? raw : Number(raw) || 0;
            await this.jackpotPresenter.show(data.jackpot_type, winAmount);
          }

          // Play Cascades
          const baseBonusWin = this.state.bonusSessionWin;
          if (data.slot.cascaded && data.slot.cascaded.length > 0) {
            await this.cascadeOrchestrator.play(
              data.slot.cascaded,
              0,
              this.state.currentBetAmount,
              (accWin) => {
                if (data.is_free_spin) {
                  // Progressive update for bonus session
                  this.state.bonusSessionWin = baseBonusWin + accWin;
                } else {
                  // Progressive update for base game spin
                  this.state.totalWin = Math.min(accWin, finalSpinWin);
                }
                this.updateUI();
              },
            );
          }

          //  Final Celebration & Summary
          if (data.free_spin && (data.free_spin.add ?? 0) > 0) {
            // New trigger or re-trigger
            if (this.onBonusTriggered) {
              await this.onBonusTriggered(data.free_spin.add!);
            }
          }

          if (data.is_free_spin) {
            // Guarantee the final sum matches the backend exact 'win' for this spin.
            this.state.bonusSessionWin = baseBonusWin + spinWin;
            this.updateUI();
            // Completely suppress individual winText popups during active bonus spins
            this.ui.winText.text = "";
            
             // If this was the absolute last free spin, show the final celebration
            if (this.state.freeSpinsCount === 0 && this.state.bonusSessionWin > 0) {
              const totalBonusWin = this.state.bonusSessionWin;
              const isBigWin = totalBonusWin >= this.state.currentBetAmount * (CONFIG.BIG_WIN_MULTIPLIER ?? 10);
              
              // Always show the basic total win panel first
              this.ui.winText.text = `TOTAL BONUS WIN\n₱${totalBonusWin.toLocaleString()}`;
              this.ui.winPresenter.showWin();
              
              if (isBigWin) {
                // Wait while standard panel is visible, then start flashier tier celebration
                await new Promise((resolve) => setTimeout(resolve, 2000));
                await this.ui.winPresenter.showTierWin(totalBonusWin, this.state.currentBetAmount);
              } else {
                await new Promise((resolve) => setTimeout(resolve, 3000));
                this.ui.winPresenter.hide();
              }
            }
          } else if (finalSpinWin > 0) {
            const isBigWin =
              finalSpinWin >=
              this.state.currentBetAmount * (CONFIG.BIG_WIN_MULTIPLIER ?? 10);

            this.state.totalWin = finalSpinWin;
            this.updateUI();

            // Show standard win panel first
            this.ui.winText.text = `WIN\n₱${finalSpinWin.toLocaleString()}`;
            this.ui.winPresenter.showWin();

            if (isBigWin) {
              // Wait while standard panel is visible, then start flashier tier celebration
              await new Promise((resolve) => setTimeout(resolve, 1500));
              await this.ui.winPresenter.showTierWin(
                finalSpinWin,
                this.state.currentBetAmount,
              );
            } else {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              this.ui.winPresenter.hide();
            }
          }

          if (wasFreeSpin && !isFreeSpinNow) {
            // Free spins just ended
            if (this.onBonusEnded) {
              await this.onBonusEnded();
            }
          }

          resolve();
        },
      );
    });
  }

  public handleBetAdjust(delta: -1 | 1): void {
    const nextSize = this.state.getNextBetSize(delta);
    this.state.currentBetSize = nextSize;
    this.updateUI();
  }

  /** Accept display amount (e.g. from menu); snaps to nearest valid bet size. */
  public handleBetConfirm(amount: number): void {
    const mult = this.state.betLevel * this.state.baseMultiplier || 1;
    const size = amount / mult;
    this.state.currentBetSize = this.state.snapBetSizeToList(size);
    this.updateUI();
  }

  public updateUI(): void {
    const inBonus = this.state.freeSpinsCount > 0;
    const displayWin = inBonus ? this.state.bonusSessionWin : this.state.totalWin;

    this.ui.updateTextValues(
      this.state.balance,
      displayWin,
      this.state.freeSpinsCount,
      inBonus,
    );
    this.ui.updateBetTextDisplay(this.state.currentBetAmount.toString());
    this.ui.toggleButtonTheme(this.state.freeSpinsCount > 0, this.isAutoSpinning);
  }
}
