import * as slotApi from "../../infrastructure/api/slotApi";
import { GameState } from "../../domain/models/GameState";
import { type SpinOrchestrator } from "../orchestrators/SpinOrchestrator";
import { type CascadeOrchestrator } from "../orchestrators/CascadeOrchestrator";
import { type UIManager } from "../../presentation/ui/UIManager";
import { type JackpotPresenter } from "../../presentation/ui/JackpotPresenter";
import { CONFIG } from "../../domain/constants/Config";

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

    private isSpinning: boolean = false;
    private isAutoSpinning: boolean = false;

    constructor(
        state: GameState,
        ui: UIManager,
        spinOrchestrator: SpinOrchestrator,
        cascadeOrchestrator: CascadeOrchestrator,
        jackpotPresenter: JackpotPresenter
    ) {
        this.state = state;
        this.ui = ui;
        this.spinOrchestrator = spinOrchestrator;
        this.cascadeOrchestrator = cascadeOrchestrator;
        this.jackpotPresenter = jackpotPresenter;
    }

    /**
     * Entry point for a standard spin.
     */
    public async handleSpinRequest(): Promise<void> {
        if (this.isSpinning) return;
        
        const bet = this.state.currentBet;
        if (this.state.balance < bet && this.state.freeSpinsCount <= 0) {
            this.ui.container.emit("insufficientBalance");
            return;
        }

        this.isSpinning = true;
        this.state.totalWin = 0; // Reset win at start of spin
        this.updateUI();

        this.ui.toggleButtonTheme(this.state.freeSpinsCount > 0);
        this.spinOrchestrator.showSpinFeedback(this.state.freeSpinsCount > 0);

        try {
            const response = await this.executeSpin(bet);
            await this.processSpinResult(response);
        } catch (error) {
            console.error("Spin error:", error);
        } finally {
            this.isSpinning = false;
            this.updateUI();
        }
    }

    private async executeSpin(bet: number): Promise<slotApi.BackendPlayData> {
        if (this.state.freeSpinsCount > 0) {
            return await slotApi.playFreeGame(bet);
        }
        return await slotApi.play(bet);
    }

    private async processSpinResult(data: slotApi.BackendPlayData): Promise<void> {
        const grid = slotApi.backendReelToGrid(data.slot.reel);
        
        // 1. Initial State Update (Trust balance from backend)
        this.state.balance = data.balance;
        this.state.freeSpinsCount = data.free_spin?.count ?? 0;
        
        const finalSpinWin = data.total_win;
        const baseEvaluationWin = data.win;

        return new Promise<void>((resolve) => {
            this.spinOrchestrator.animateReels(grid, !!data.free_spin?.count, async () => {
                
                // 2. Handle Jackpots
                if (data.jackpot_hit && data.jackpot_type) {
                    const winAmount = data.jackpot_prizes?.[data.jackpot_type] || 0;
                    await this.jackpotPresenter.show(data.jackpot_type, winAmount);
                }

                // 3. Play Cascades
                if (data.slot.cascaded && data.slot.cascaded.length > 0) {
                    await this.cascadeOrchestrator.play(
                        data.slot.cascaded,
                        baseEvaluationWin,
                        this.state.currentBet,
                        (accWin) => {
                            // Visually update win, but don't exceed backend final total_win
                            this.state.totalWin = Math.min(accWin, finalSpinWin);
                            this.updateUI();
                        }
                    );
                }

                // 4. Force Final State Sync & Celebration
                this.state.totalWin = finalSpinWin;
                this.updateUI();

                // If Big/Mega/Max win, trigger the celebration
                if (finalSpinWin >= this.state.currentBet * (CONFIG.BIG_WIN_MULTIPLIER ?? 10)) {
                    await this.ui.winPresenter.showTierWin(finalSpinWin, this.state.currentBet);
                }
                
                resolve();
            });
        });
    }

    public handleBetAdjust(delta: -1 | 1): void {
        const nextBet = this.state.getNextBetAmount(delta);
        this.state.currentBet = nextBet;
        this.updateUI();
    }

    public updateUI(): void {
        this.ui.updateTextValues(
            this.state.balance,
            this.state.totalWin,
            this.state.freeSpinsCount
        );
        this.ui.updateBetTextDisplay(this.state.currentBet.toString());
    }
}
