import { Container, Graphics, Text, AnimatedSprite } from "pixi.js";
import gsap from "gsap";
import { CONFIG } from "../../domain/constants/Config";
import * as slotApi from "../../infrastructure/api/slotApi";
import type { BackendCascadeStep } from "../../infrastructure/api/slotApi";
import type { Reel } from "../../domain/entities/Reel";
import type { UIManager } from "../../presentation/ui/UIManager";
import type { ParticleEmitter } from "../../presentation/vfx/ParticleEmitter";
import type { WinPresenter } from "../../presentation/ui/WinPresenter";
import type {
  CascadePlayStep,
  GridPosition,
  SymbolSprite,
} from "../../domain/models/GameTypes";
import type { SymbolAnimation } from "../../presentation/animation/SymbolAnimation";

import type { SoundManager } from "../../infrastructure/audio/SoundManager";

function tweenToEnd(
  tween: gsap.core.Tween | gsap.core.Timeline,
): Promise<void> {
  return new Promise<void>((resolve) => {
    tween.eventCallback("onComplete", () => resolve());
  });
}

/**
 * Drives the full cascade sequence: highlight winners → break symbols →
 * drop new symbols → repeat for every step.
 *
 * Extracted from SlotMachine to enforce Single Responsibility.
 */
export class CascadeOrchestrator {
  private reels: Reel[];
  private particleEmitter: ParticleEmitter;
  private uiManager: UIManager;
  private winPresenter: WinPresenter;
  private symbolAnimator: SymbolAnimation;
  private soundManager: SoundManager;
  private activeAnimations: AnimatedSprite[];

  constructor(
    reels: Reel[],
    particleEmitter: ParticleEmitter,
    uiManager: UIManager,
    winPresenter: WinPresenter,
    symbolAnimator: SymbolAnimation,
    soundManager: SoundManager,
    activeAnimations: AnimatedSprite[],
  ) {
    this.reels = reels;
    this.particleEmitter = particleEmitter;
    this.uiManager = uiManager;
    this.winPresenter = winPresenter;
    this.symbolAnimator = symbolAnimator;
    this.soundManager = soundManager;
    this.activeAnimations = activeAnimations;
  }

  // ── Public API ───────────────────────────────────────────────────

  /**
   * Runs the full cascade sequence. Resolves when every step has been animated.
   *
   * @param cascaded   Raw steps from the backend.
   * @param initialWin Win amount that triggered the first drop.
   * @param betAmount  Current bet (used for coin-burst threshold).
   * @param onDone     Called with the total accumulated win when sequence finishes.
   */
  async play(
    cascaded: BackendCascadeStep[],
    initialWin: number,
    _betAmount: number,
    onStep: (accumulatedWin: number) => void,
  ): Promise<void> {
    this.reels.forEach((r) =>
      r.symbols.forEach((s) => {
        s.tint = 0x555555;
        s.alpha = 1;
      }),
    );

    const steps = this._buildSteps(cascaded, initialWin);
    let accumulatedWin = 0;
    let stepIndex = 0;

    for (const step of steps) {
      const winningPositions: GridPosition[] = step.cascades.map((c) => ({
        reel: c.column,
        row: c.row,
      }));
      if (winningPositions.length === 0) {
        stepIndex++;
        continue;
      }

      const stepPayout = step.win * (step.multiplier ?? 1);
      if (stepPayout > 0) this.soundManager.playSFX("sfx_coin");

      // Strictly follow the progression logic. With the new backend,
      // accumulatedWin should perfectly reach finalSpinWin on the last step.
      accumulatedWin += stepPayout;
      onStep(accumulatedWin);

      if (stepIndex > 0) {
        // Ensure all symbols are visually neutral (white tint, base scale) while waiting.
        this.reels.forEach((r) =>
          r.symbols.forEach((s) => {
            s.tint = 0xffffff;
            s.zIndex = 0;
            s.scale.set((s as unknown as SymbolSprite).baseScale || 1);
          }),
        );

        // Wait so the player can see the symbols that just fell.
        await tweenToEnd(gsap.to({}, { duration: CONFIG.WIN_HIGHLIGHT_DELAY }));
      }

      // ── Highlight winners ──
      this.winPresenter.hide();
      // Now darken the non-winning symbols to make the winners pop
      this.reels.forEach((r) => r.symbols.forEach((s) => (s.tint = 0x555555)));

      for (const p of winningPositions) {
        const reel = this.reels[p.reel];
        if (!reel) continue;
        reel.setBrightness(p.row, 2);
        const sprite = reel.getSymbolAtRow(p.row);
        sprite.zIndex = 100;
        reel.container.zIndex = 100;

        const symbolIndex = reel.slotTextures.indexOf(sprite.texture);
        const previousCount = this.activeAnimations.length;
        this.symbolAnimator.play(
          symbolIndex,
          sprite,
          reel,
          this.activeAnimations,
          false,
        );

        // Because SymbolAnimator.play adds the winContainer to activeAnimations,
        // we can tag the newly added animation with its row/reel so we can find it to destroy it later.
        if (this.activeAnimations.length > previousCount) {
          const addedAnim = this.activeAnimations[
            this.activeAnimations.length - 1
          ] as any;
          addedAnim._cascadeReel = p.reel;
          addedAnim._cascadeRow = p.row;
        }

        const globalPos = sprite.getGlobalPosition();
        const localPos = this.particleEmitter.container.toLocal(globalPos);
        this.particleEmitter.emitGlow(localPos.x, localPos.y, 10);
      }

      this._spawnWinChip(winningPositions, stepPayout, step.multiplier);

      // const isBigWin = stepPayout >= betAmount;
      // gsap.delayedCall(0, () => {
      //   this.particleEmitter.burst(
      //     CONFIG.PARTICLE_ORIGIN_X,
      //     CONFIG.PARTICLE_ORIGIN_Y,
      //     isBigWin ? 100 : 30,
      //   );
      // });

      const currentDelay =
        stepIndex === 0 ? CONFIG.FIRST_WIN_DELAY : CONFIG.CASCADE_WIN_DELAY;
      await tweenToEnd(gsap.to({}, { duration: currentDelay }));

      // ── Break winning symbols ──
      const breakTweens: gsap.core.Tween[] = [];
      for (const p of winningPositions) {
        const reel = this.reels[p.reel];
        if (!reel) continue;
        const sprite = reel.getSymbolAtRow(p.row);
        const baseScale =
          (sprite as unknown as SymbolSprite).baseScale || sprite.scale.x || 1;
        breakTweens.push(
          gsap.to(sprite, { alpha: 0, duration: 0.25, ease: "power2.out" }),
        );
        breakTweens.push(
          gsap.to(sprite.scale, {
            x: baseScale * 0.8,
            y: baseScale * 0.8,
            duration: 0.25,
            ease: "power2.out",
          }),
        );

        // Fade out and destroy the overlay animation container
        const animIndex = this.activeAnimations.findIndex(
          (a: any) => a._cascadeReel === p.reel && a._cascadeRow === p.row,
        );
        if (animIndex !== -1) {
          const anim = this.activeAnimations[animIndex];
          this.activeAnimations.splice(animIndex, 1); // remove from array
          breakTweens.push(
            gsap.to(anim, {
              alpha: 0,
              duration: 0.25,
              ease: "power2.out",
              onComplete: () => {
                if (anim.parent) anim.parent.removeChild(anim);
                anim.destroy({ children: true });
              },
            }),
          );
        }

        const globalPos = sprite.getGlobalPosition();
        const localPos = this.particleEmitter.container.toLocal(globalPos);
        this.particleEmitter.emitDust(localPos.x, localPos.y, 25);
      }
      await Promise.all(breakTweens.map(tweenToEnd));

      // ── Drop new symbols ──
      if (step.rng) {
        const afterGrid = slotApi.backendReelToGrid(step.rng);
        const beforeGrid = this._getVisibleGrid();
        await this._animateDrop(beforeGrid, afterGrid, winningPositions);
      }

      this.reels.forEach((r) =>
        r.symbols.forEach((s) => {
          s.tint = 0x555555;
          s.zIndex = 0;
          s.scale.set((s as unknown as SymbolSprite).baseScale || 1);
        }),
      );

      stepIndex++;
    }

    // Restore full brightness when done
    this.reels.forEach((r) =>
      r.symbols.forEach((s) => {
        s.tint = 0xffffff;
        s.zIndex = 0;
        s.scale.set((s as unknown as SymbolSprite).baseScale || 1);
      }),
    );
  }

  // ── Private ──────────────────────────────────────────────────────

  /**
   * Pairs each backend cascade step with the win and grid that precede it,
   * producing a flat, ordered list ready for sequential playback.
   */
  private _buildSteps(
    cascaded: BackendCascadeStep[],
    initialWin: number,
  ): CascadePlayStep[] {
    const steps: CascadePlayStep[] = [];

    if (initialWin > 0 && cascaded.length > 0) {
      steps.push({
        win: initialWin,
        multiplier: 1,
        cascades: cascaded[0].cascades,
        rng: cascaded[0].rng as string[][] | null,
      });
    }

    for (let i = 0; i < cascaded.length - 1; i++) {
      if (cascaded[i].win > 0) {
        steps.push({
          win: cascaded[i].win,
          multiplier: cascaded[i].multiplier,
          cascades: cascaded[i + 1].cascades,
          rng: cascaded[i + 1].rng as string[][] | null,
        });
      }
    }

    return steps;
  }

  private _getVisibleGrid(): number[][] {
    return this.reels.map((reel) =>
      [0, 1, 2].map((row) =>
        reel.slotTextures.indexOf(reel.getSymbolAtRow(row).texture),
      ),
    );
  }

  private async _animateDrop(
    beforeGrid: number[][],
    afterGrid: number[][],
    winningPositions: GridPosition[],
  ): Promise<void> {
    const removedByReel = new Map<number, number[]>();
    for (const p of winningPositions) {
      const arr = removedByReel.get(p.reel) ?? [];
      arr.push(p.row);
      removedByReel.set(p.reel, arr);
    }
    for (const [reelIndex, rows] of removedByReel) {
      removedByReel.set(
        reelIndex,
        Array.from(new Set(rows)).sort((a, b) => a - b),
      );
    }

    const tweens: gsap.core.Tween[] = [];

    for (let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
      const reel = this.reels[reelIndex];
      const removedRows = removedByReel.get(reelIndex) ?? [];
      if (removedRows.length === 0) continue;

      const symbolHeight = reel.symbolSize + reel.symbolSpacing;
      const rowSprites = [
        reel.getSymbolAtRow(0),
        reel.getSymbolAtRow(1),
        reel.getSymbolAtRow(2),
      ];

      const keptOldRows = ([0, 1, 2] as const).filter(
        (r) => !removedRows.includes(r),
      );
      const keptCount = keptOldRows.length;

      // Slide kept symbols down to their new positions
      if (keptCount < 3) this.soundManager.playSFX("sfx_break");
      for (let k = 0; k < keptCount; k++) {
        const oldRow = keptOldRows[k];
        const newRow = 3 - keptCount + k;
        const sprite = rowSprites[oldRow];
        const baseScale =
          (sprite as unknown as SymbolSprite).baseScale || sprite.scale.x || 1;
        sprite.alpha = 1;
        sprite.scale.set(baseScale);
        sprite.tint = 0xffffff;
        if (newRow >= 0 && newRow < 3) {
          tweens.push(
            gsap.to(sprite, {
              y: newRow * symbolHeight + reel.symbolSize / 2,
              duration: CONFIG.SYMBOL_DROP_SPEED,
              ease: "power2.out",
            }),
          );
        }
      }

      // Drop new symbols in from above
      const newRowsCount = 3 - keptCount;
      for (let newRow = 0; newRow < newRowsCount; newRow++) {
        const sprite = rowSprites[removedRows[newRow] ?? removedRows[0]];
        const symbolIndex = afterGrid[reelIndex][newRow];
        reel.setSpriteToSymbolIndex(sprite, symbolIndex);
        sprite.tint = 0xffffff;
        sprite.y = -symbolHeight * (newRowsCount - newRow) + reel.symbolSize / 2;
        tweens.push(
          gsap.to(sprite, {
            y: newRow * symbolHeight + reel.symbolSize / 2,
            duration: CONFIG.SYMBOL_DROP_SPEED + 0.06,
            ease: "power2.out",
          }),
        );
      }
    }

    await Promise.all(tweens.map(tweenToEnd));

    // Sync Reel state with the settled positions
    for (let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
      const reel = this.reels[reelIndex];
      for (let row = 0; row < 3; row++) {
        const idx = afterGrid[reelIndex]?.[row];
        if (typeof idx === "number" && idx >= 0) {
          reel.setSymbolIndexAtRow(row, idx);
        }
      }
      reel.resetBrightness();
    }

    void beforeGrid; // consumed above; silences noUnusedLocals
  }

  /** Spawns a floating win-amount chip (and optional multiplier chip) over the centre winning symbol. */
  private _spawnWinChip(
    winningPositions: GridPosition[],
    stepPayout: number,
    multiplier: number,
  ): void {
    if (winningPositions.length === 0) return;

    const sorted = [...winningPositions].sort((a, b) => a.reel - b.reel);
    const center = sorted[Math.floor(sorted.length / 2)];
    const reel = this.reels[center.reel];
    if (!reel) return;

    const sprite = reel.getSymbolAtRow(center.row);
    const globalPos = sprite.getGlobalPosition();
    const localPos = this.uiManager.container.toLocal(globalPos);

    // Amount chip
    const winContainer = new Container();
    winContainer.position.set(localPos.x, localPos.y - 15);
    winContainer.zIndex = 200;
    winContainer.scale.set(0.01);

    const winBg = new Graphics();
    winBg.roundRect(-100, -35, 200, 70, 20);
    winBg.fill({ color: 0x000000, alpha: 0.85 });
    winBg.stroke({ color: 0xffd700, width: 3, alpha: 0.8 });
    winContainer.addChild(winBg);

    const winText = new Text({
      text: `₱${Math.floor(stepPayout).toLocaleString()}`,
      style: {
        fill: 0xffd700,
        fontSize: 45,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 4 },
      },
    });
    winText.anchor.set(0.5);
    winContainer.addChild(winText);

    this.uiManager.container.addChild(winContainer);
    gsap.to(winContainer.scale, {
      x: 1,
      y: 1,
      duration: CONFIG.WIN_TEXT_POPUP_SPEED,
      ease: "back.out(2)",
    });
    gsap.to(winContainer, {
      alpha: 0,
      duration: 0.5,
      delay: CONFIG.CASCADE_WIN_DELAY,
      onComplete: () => winContainer.destroy(),
    });

    // Multiplier chip (only rendered when > 1)
    if (multiplier > 1) {
      const multContainer = new Container();
      multContainer.position.set(localPos.x, localPos.y + 50);
      multContainer.zIndex = 200;
      multContainer.scale.set(0.01);

      const multBg = new Graphics();
      multBg.roundRect(-70, -30, 140, 60, 20);
      multBg.fill({ color: 0x000000, alpha: 0.85 });
      multBg.stroke({ color: 0x00ffcc, width: 3, alpha: 0.8 });
      multContainer.addChild(multBg);

      const multText = new Text({
        text: `x${multiplier}`,
        style: {
          fill: 0x00ffcc,
          fontSize: 40,
          fontWeight: "bold",
          stroke: { color: 0x000000, width: 4 },
        },
      });
      multText.anchor.set(0.5);
      multContainer.addChild(multText);

      this.uiManager.container.addChild(multContainer);
      gsap.to(multContainer.scale, {
        x: 1,
        y: 1,
        duration: CONFIG.WIN_TEXT_POPUP_SPEED,
        delay: CONFIG.CASCADE_MULT_SPAWN_DELAY,
        ease: "back.out(2)",
      });
      gsap.to(multContainer, {
        alpha: 0,
        duration: 0.5,
        delay: CONFIG.CASCADE_WIN_DELAY + CONFIG.CASCADE_MULT_SPAWN_DELAY,
        onComplete: () => multContainer.destroy(),
      });
    }
  }
}
