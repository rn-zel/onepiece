import { AnimatedSprite, Sprite } from "pixi.js";
import gsap from "gsap";
import { CONFIG } from "../../domain/constants/Config";
import type { Reel } from "../../domain/entities/Reel";
import type { Texture } from "pixi.js";
import type { UIManager } from "../../presentation/ui/UIManager";
import type { SoundManager } from "../../infrastructure/audio/SoundManager";
import type { ParticleEmitter } from "../../presentation/vfx/ParticleEmitter";
import type { SymbolAnimation } from "../../presentation/animation/SymbolAnimation";
import type { Starfield } from "../../presentation/animation/Starfield";
import type { SymbolSprite } from "../../domain/models/GameTypes";

function tweenToEnd(tween: gsap.core.Tween | gsap.core.Timeline): Promise<void> {
    return new Promise<void>((resolve) => {
        tween.eventCallback("onComplete", () => resolve());
    });
}

/**
 * Drives the physical reel-spin animation and related helpers.
 * Extracted from SlotMachine to enforce Single Responsibility.
 */
export class SpinOrchestrator {
    private reels: Reel[];
    private slotTextures: Texture[];
    private uiManager: UIManager;
    private soundManager: SoundManager;
    private particleEmitter: ParticleEmitter;
    private symbolAnimator: SymbolAnimation;
    private starfield: Starfield;
    private spinAuraSprite: Sprite | undefined;

    /** Shared array — mutated by animateSymbolToContainer; cleared by clearAnimations(). */
    activeAnimations: AnimatedSprite[] = [];

    /** Set by SlotMachine when the player taps spin during an ongoing spin. */
    isQuickSpin: boolean = false;

    constructor(
        reels: Reel[],
        slotTextures: Texture[],
        uiManager: UIManager,
        soundManager: SoundManager,
        particleEmitter: ParticleEmitter,
        symbolAnimator: SymbolAnimation,
        starfield: Starfield,
    ) {
        this.reels = reels;
        this.slotTextures = slotTextures;
        this.uiManager = uiManager;
        this.soundManager = soundManager;
        this.particleEmitter = particleEmitter;
        this.symbolAnimator = symbolAnimator;
        this.starfield = starfield;
    }

    // ── Public API ───────────────────────────────────────────────────

    /**
     * Plays the full reel-spin animation.
     *
     * @param targetGrid  The backend grid to land on. Pass `null` for a visual-only spin.
     * @param isBonusMode When true uses continuous slow rotation; when false uses fast-then-slow.
     * @param onDone      Called once the last reel has settled and the grid has been applied.
     */
    animateReels(
        targetGrid: number[][] | null,
        isBonusMode: boolean,
        onDone: () => void,
    ): void {
        this.soundManager.playSFX("sfx_spin");
        this.starfield?.triggerWarp(true);

        // Recycle the aura sprite
        if (this.spinAuraSprite) {
            gsap.killTweensOf(this.spinAuraSprite);
            this.spinAuraSprite.parent?.removeChild(this.spinAuraSprite);
            this.spinAuraSprite.destroy();
        }
        this.spinAuraSprite = this.particleEmitter.emitAura(this.uiManager.spinButton);

        // Spin-button animation
        gsap.killTweensOf(this.uiManager.spinButton);
        gsap.fromTo(
            this.uiManager.spinButton.scale,
            { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 },
            { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.4, ease: "back.out(2)" },
        );

        if (isBonusMode) {
            gsap.to(this.uiManager.spinButton, {
                rotation: "+=" + (Math.PI * 2), duration: 1.5, repeat: -1, ease: "none", overwrite: "auto",
            });
        } else {
            gsap.to(this.uiManager.spinButton, {
                rotation: "+=" + (Math.PI * 100), duration: 2.5, ease: "power4.out",
                onComplete: () => {
                    gsap.to(this.uiManager.spinButton, {
                        rotation: "+=" + (Math.PI * 2), duration: 15, repeat: -1, ease: "none", overwrite: "auto",
                    });
                },
            });
        }

        // Reset symbol state
        this.clearAnimations();
        this.reels.forEach((r) => {
            r.container.zIndex = 0;
            r.resetBrightness();
            r.symbols.forEach((s) => {
                gsap.killTweensOf(s);
                gsap.killTweensOf(s.scale);
                s.zIndex = 0;
                s.alpha = 1;
                s.rotation = 0;
            });
        });

        // Spin each reel
        this.reels.forEach((r, i) => {
            const target = Math.round(r.position) + 30 + i * 4;
            r.targetPosition = target;
            r.finalGrid = targetGrid ? targetGrid[i] : null;
            r.blur.strengthX = 0;
            r.blur.strengthY = CONFIG.REEL_MAX_BLUR;

            const duration = CONFIG.REEL_SPIN_DURATION + (i * 0.15);

            gsap.to(r, {
                position: target,
                duration,
                ease: "power2.inOut",
                onUpdate: () => {
                    r.updateSymbols();
                    const remaining = target - r.position;
                    r.blur.strengthY = remaining <= CONFIG.REEL_BLUR_FADE_DIST
                        ? Math.max(0, (remaining / CONFIG.REEL_BLUR_FADE_DIST) * CONFIG.REEL_MAX_BLUR)
                        : CONFIG.REEL_MAX_BLUR;
                },
                onComplete: () => {
                    r.blur.strengthY = 0;

                    if (targetGrid) {
                        const gridCol = targetGrid[i];
                        r.forceSetGrid(gridCol);
                    }

                    r.targetPosition = -1;
                    r.finalGrid = null;

                    // Bounce
                    const originalY = r.container.y;
                    gsap.fromTo(
                        r.container,
                        { y: originalY - CONFIG.REEL_BOUNCE_OFFSET },
                        { y: originalY, duration: CONFIG.REEL_BOUNCE_SPEED, ease: "back.out(1.5)" },
                    );

                    this._bounceSpecialSymbols(r);

                    if (i === this.reels.length - 1) {
                        // Fade out aura
                        if (this.spinAuraSprite) {
                            gsap.to(this.spinAuraSprite, {
                                alpha: 0, duration: 0.3,
                                onComplete: () => {
                                    if (this.spinAuraSprite) {
                                        gsap.killTweensOf(this.spinAuraSprite);
                                        this.spinAuraSprite.parent?.removeChild(this.spinAuraSprite);
                                        this.spinAuraSprite.destroy();
                                        this.spinAuraSprite = undefined;
                                    }
                                },
                            });
                        }

                        this.starfield?.triggerWarp(false);
                        if (targetGrid) this.applyGrid(targetGrid);
                        onDone();
                    }
                },
            });
        });
    }

    /** Starts the early "button is being pressed" visual before API data arrives. */
    showSpinFeedback(isBonusMode: boolean): void {
        if (this.spinAuraSprite) {
            gsap.killTweensOf(this.spinAuraSprite);
            this.spinAuraSprite.parent?.removeChild(this.spinAuraSprite);
            this.spinAuraSprite.destroy();
        }
        this.spinAuraSprite = this.particleEmitter.emitAura(this.uiManager.spinButton);

        gsap.killTweensOf(this.uiManager.spinButton);
        gsap.fromTo(
            this.uiManager.spinButton.scale,
            { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 },
            { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.2, ease: "back.out(2)" },
        );
        gsap.to(this.uiManager.spinButton, {
            rotation: "+=" + (Math.PI * 2),
            duration: 2.0, repeat: -1, ease: "none", overwrite: "auto",
        });

        void isBonusMode; // kept for API symmetry
    }

    /** Plays the animated win overlay on top of a given symbol sprite. */
    animateSymbol(symbolSprite: Sprite, reel: Reel): void {
        const symbolIndex = this.slotTextures.indexOf(symbolSprite.texture);
        this.symbolAnimator.play(symbolIndex, symbolSprite, reel, this.activeAnimations, this.isQuickSpin);
    }

    /** Returns the current visible grid as symbol indices [reel][row]. */
    getVisibleGrid(): number[][] {
        return this.reels.map((reel) =>
            [0, 1, 2].map((row) => this.slotTextures.indexOf(reel.getSymbolAtRow(row).texture))
        );
    }

    /** Forces each reel to display the symbols from `grid`. */
    applyGrid(grid: number[][]): void {
        for (let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
            const reel = this.reels[reelIndex];
            for (let row = 0; row < 3; row++) {
                const idx = grid[reelIndex]?.[row];
                if (typeof idx === "number" && idx >= 0) {
                    reel.setSymbolIndexAtRow(row, idx);
                }
            }
            reel.resetBrightness();
        }
    }

    /** Kills and destroys all active animated-sprite overlays. */
    clearAnimations(): void {
        this.activeAnimations.forEach((anim) => {
            gsap.killTweensOf(anim);
            anim.parent?.removeChild(anim);
            anim.destroy();
        });
        this.activeAnimations = [];
    }

    tweenToEnd(tween: gsap.core.Tween | gsap.core.Timeline): Promise<void> {
        return tweenToEnd(tween);
    }

    // ── Private ──────────────────────────────────────────────────────

    private _bounceSpecialSymbols(reel: Reel): void {
        for (let row = 0; row < 3; row++) {
            const sprite = reel.getSymbolAtRow(row);
            const index = this.slotTextures.indexOf(sprite.texture);
            if (index === 8 || index === 9) { // wild or scatter
                const baseScale = (sprite as unknown as SymbolSprite).baseScale || 1;
                sprite.zIndex = 50;
                reel.container.zIndex = 50;
                gsap.to(sprite.scale, {
                    x: baseScale * 1.1, y: baseScale * 1.1,
                    duration: 0.2, yoyo: true, repeat: 1, delay: 0.1, ease: "back.out(2)",
                    onComplete: () => {
                        sprite.scale.set(baseScale);
                        sprite.zIndex = 0;
                    },
                });
            }
        }
    }
}
