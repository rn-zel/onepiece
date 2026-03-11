import { Container, Graphics, TextStyle } from "pixi.js";
import gsap from "gsap";
import { CONFIG } from "../../domain/constants/Config";
import type { UIManager } from "./UIManager";

/**
 * Presentation Layer: Manages win display UI.
 */
export class WinPresenter {
  private winPanel!: Container;
  private bonusPanel!: Container;
  private tierPanel!: Container;
  private tierGlowBg!: Graphics;
  private uiManager: UIManager;

  private _currentTierValue: number = 0;
  private _tierTween: gsap.core.Tween | null = null;
  private _activeTierLabel: string = "";

  constructor(uiManager: UIManager) {
    this.uiManager = uiManager;
  }

  init(): void {
    this._createWinPanel();
    this._createBonusPanel();
    this._createTierPanel();
  }

  showWin(delay: number = 0): void {
    if (!this.winPanel) return;
    if (this.bonusPanel) this.bonusPanel.visible = false;
    if (this.tierPanel) this.tierPanel.visible = false;

    this._applyNormalStyle();
    this._adoptText(this.winPanel);
    this.winPanel.visible = true;
    gsap.killTweensOf(this.winPanel);
    gsap.killTweensOf(this.winPanel.scale);
    this.winPanel.alpha = 0;
    this.winPanel.scale.set(0.01);

    gsap.to(this.winPanel, {
      alpha: 1,
      duration: 0.25,
      delay,
      ease: "power2.out",
    });
    gsap.to(this.winPanel.scale, {
      x: 1,
      y: 1,
      duration: CONFIG.PANEL_POPUP_SPEED,
      delay,
      ease: "back.out(1.7)",
    });
  }

  showBonus(): void {
    if (!this.bonusPanel) return;
    if (this.winPanel) this.winPanel.visible = false;

    this._adoptText(this.bonusPanel);
    this.bonusPanel.visible = true;
    this.bonusPanel.alpha = 0;
    this.bonusPanel.scale.set(0.5);
    gsap.killTweensOf(this.bonusPanel);
    gsap.killTweensOf(this.bonusPanel.scale);

    gsap.to(this.bonusPanel, { alpha: 1, duration: 0.2, ease: "power3.out" });
    gsap.to(this.bonusPanel.scale, {
      x: 1.08,
      y: 1.08,
      duration: 0.2,
      ease: "back.out(3)",
      onComplete: () => {
        gsap.to(this.bonusPanel.scale, {
          x: 1,
          y: 1,
          duration: 0.3,
          ease: "elastic.out(1,0.5)",
        });
        gsap.to(this.bonusPanel, {
          x: this.bonusPanel.x + 4,
          duration: 0.07,
          yoyo: true,
          repeat: 5,
          ease: "sine.inOut",
          onComplete: () => {
            this.bonusPanel.x = 0;
          },
        });
      },
    });
  }

  hide(): void {
    const panels: Container[] = [];
    if (this.winPanel) panels.push(this.winPanel);
    if (this.bonusPanel) panels.push(this.bonusPanel);
    if (this.tierPanel) panels.push(this.tierPanel);

    if (this._tierTween) {
      this._tierTween.kill();
      this._tierTween = null;
    }

    for (const panel of panels) {
      gsap.killTweensOf(panel);
      gsap.killTweensOf(panel.scale);
      gsap.to(panel, {
        alpha: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          panel.visible = false;
          panel.scale.set(1);
        },
      });
    }
  }

  /**
   * trigger a heavy text celebration before resuming the count.
   */
  async showTierWin(totalWin: number, betAmount: number): Promise<void> {
    if (!this.tierPanel) return;

    const isVisible = this.tierPanel.visible && this.tierPanel.alpha > 0.5;

    if (this.winPanel) this.winPanel.visible = false;
    if (this.bonusPanel) this.bonusPanel.visible = false;

    this._adoptText(this.tierPanel);
    this.tierPanel.visible = true;

    if (!isVisible) {
      this._currentTierValue = 0;
      this.tierPanel.alpha = 0;
      this.tierPanel.scale.set(0.9);

      this._setTierVisuals("big", 0);

      gsap.killTweensOf(this.tierPanel);
      gsap.killTweensOf(this.tierPanel.scale);
      gsap.to(this.tierPanel, { alpha: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(this.tierPanel.scale, {
        x: 1,
        y: 1,
        duration: 0.4,
        ease: "back.out(1.6)",
      });
    }

    if (this._tierTween) this._tierTween.kill();

    const megaMult = (CONFIG as any).MEGA_WIN_MULTIPLIER ?? 50;
    const maxMult = (CONFIG as any).MAX_WIN_MULTIPLIER ?? 100;

    const megaThreshold = betAmount * megaMult;
    const maxThreshold = betAmount * maxMult;

    //  Plot the milestones the counter needs to hit
    const sequence: { tier: "mega" | "max" | "done"; value: number }[] = [];

    if (totalWin >= megaThreshold && this._currentTierValue < megaThreshold) {
      sequence.push({ tier: "mega", value: megaThreshold });
    }
    if (totalWin >= maxThreshold && this._currentTierValue < maxThreshold) {
      sequence.push({ tier: "max", value: maxThreshold });
    }

    sequence.push({ tier: "done", value: totalWin });

    //  Iterate through each milestone chunk
    for (const step of sequence) {
      const targetVal = step.value;

      if (targetVal > this._currentTierValue) {
        const distance = (targetVal - this._currentTierValue) / betAmount;
        let duration = (distance / 50) * 4.0;
        duration = Math.max(1.5, Math.min(duration, 5.0));

        await new Promise<void>((resolve) => {
          const counterObj = { val: this._currentTierValue };
          this._tierTween = gsap.to(counterObj, {
            val: targetVal,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
              this._currentTierValue = Math.floor(counterObj.val);
              this.uiManager.winText.text = `${this._activeTierLabel}\n₱${this._currentTierValue.toLocaleString()}`;
            },
            onComplete: resolve,
          });
        });
      }

      // If we hit a threshold, pause the counter and celebrate!
      if (step.tier === "mega" || step.tier === "max") {
        this._setTierVisuals(step.tier, targetVal);

        // Halt the system for  seconds s
        await new Promise<void>((resolve) => gsap.delayedCall(1.5, resolve));
      }
    }

    // Lock in the final exact text value
    this.uiManager.winText.text = `${this._activeTierLabel}\n₱${Math.floor(totalWin).toLocaleString()}`;

    // Wait  end before hiding
    await new Promise<void>((resolve) => gsap.delayedCall(2.5, resolve));
    this.hide();
  }

  // ── Private Helpers

  private _setTierVisuals(
    tier: "big" | "mega" | "max",
    currentValue: number,
  ): void {
    const newLabel =
      tier === "max" ? "MAX WIN" : tier === "mega" ? "MEGA WIN" : "BIG WIN";

    this._activeTierLabel = newLabel;
    this._applyTierWinTextStyle(tier);

    const glowColor = (CONFIG as any).TIER_BG_GLOW?.[tier] ?? 0xffc107;
    this._drawTierGlow(glowColor);

    // Heavy, lingering elastic bounce
    gsap.killTweensOf(this.uiManager.winText.scale);
    gsap.fromTo(
      this.uiManager.winText.scale,
      { x: 1.6, y: 1.6 },
      { x: 1, y: 1, duration: 1.5, ease: "elastic.out(1, 0.3)" },
    );

    this.uiManager.winText.text = `${this._activeTierLabel}\n₱${currentValue.toLocaleString()}`;
  }

  private _adoptText(panel: Container): void {
    if (this.uiManager.winText.parent !== panel) {
      this.uiManager.winText.parent?.removeChild(this.uiManager.winText);
      this.uiManager.winText.position.set(0, 0);
      panel.addChild(this.uiManager.winText);
    }
  }

  private _applyNormalStyle(): void {
    const style = new TextStyle({
      fill: 0xffd700,
      //  0xffd700,
      fontSize: CONFIG.UI_WIN_SIZE,
      fontWeight: "bold",
      dropShadow: { color: 0x000000, blur: 15, distance: 0 },
      align: "center",
      stroke: { color: 0x000000, width: 6 },
    });
    this.uiManager.winText.style = style;
    this.uiManager.winText.scale.set(1);
  }

  private _applyTierWinTextStyle(tier: "big" | "mega" | "max" = "big"): void {
    const fillColors = (CONFIG as any).TIER_TEXT_FILL?.[tier]
      ? [
          (CONFIG as any).TIER_TEXT_FILL[tier],
          0xffffff,
          (CONFIG as any).TIER_TEXT_FILL[tier],
        ]
      : [0xffffff, 0xfbff00, 0xffc800];

    const style = new TextStyle({
      fontFamily: "Georgia, serif",
      fontSize: CONFIG.UI_TIER_WIN_SIZE,
      fontWeight: "900",
      align: "center",
      letterSpacing: CONFIG.UI_TIER_WIN_LETTER_SPACING,
      padding: 20,
      fill: fillColors,
      stroke: { color: 0x000000, width: CONFIG.UI_TIER_WIN_STROKE, join: "round" },
      dropShadow: {
        color: 0x000000,
        blur: 4,
        distance: 8,
        angle: Math.PI / 4,
        alpha: 0.8,
      },
    });
    this.uiManager.winText.style = style;
  }

  private _drawTierGlow(color: number): void {
    if (!this.tierGlowBg) return;
    this.tierGlowBg.clear();

    const cx = 0,
      cy = 80;
    const radii = [1600, 1200, 900, 600, 400];
    const alphas = [0.05, 0.12, 0.22, 0.35, 0.5];

    for (let i = 0; i < radii.length; i++) {
      this.tierGlowBg.circle(cx, cy, radii[i]);
      this.tierGlowBg.fill({ color, alpha: alphas[i] });
    }
  }

  private _createWinPanel(): void {
    const parent = this.uiManager.winText.parent;
    if (!parent) return;

    const pos = this.uiManager.winText.position.clone();
    this.winPanel = new Container();
    this.winPanel.zIndex = 150;
    this.winPanel.eventMode = "none";
    this.winPanel.position.copyFrom(pos);
    this.winPanel.visible = false;
    this.winPanel.alpha = 0;

    const W = 900,
      H = 260;
    this.winPanel.addChild(
      new Graphics()
        .roundRect(-W / 2, -H / 2, W, H, 40)
        .fill({ color: 0x000000, alpha: 0.92 })
        .stroke({ color: 0xffd700, width: 6, alpha: 0.9 }),
    );
    this.winPanel.addChild(
      new Graphics()
        .roundRect(-W / 2 + 10, -H / 2 + 10, W - 20, H - 20, 30)
        .fill({ color: 0x000000, alpha: 0.9 }),
    );

    parent.removeChild(this.uiManager.winText);
    this.uiManager.winText.position.set(0, 0);
    this.winPanel.addChild(this.uiManager.winText);
    parent.addChild(this.winPanel);
  }

  private _createBonusPanel(): void {
    if (!this.winPanel) return;
    const parent = this.uiManager.container;

    this.bonusPanel = new Container();
    this.bonusPanel.zIndex = 160;
    this.bonusPanel.eventMode = "none";
    this.bonusPanel.position.copyFrom(this.winPanel.position);
    this.bonusPanel.visible = false;
    this.bonusPanel.alpha = 0;

    const W = 1800,
      H = 980;
    this.bonusPanel.addChild(
      new Graphics()
        .roundRect(-W / 2, -H / 2, W, H, 48)
        .fill({ color: 0x000000, alpha: 0.95 })
        .stroke({ color: 0x000000, width: 7, alpha: 1 }),
    );
    this.bonusPanel.addChild(
      new Graphics()
        .roundRect(-W / 2 + 12, -H / 2 + 12, W - 24, H - 24, 32)
        .fill({ color: 0x000000, alpha: 0.95 }),
    );

    parent.addChild(this.bonusPanel);
  }

  private _createTierPanel(): void {
    if (!this.winPanel) return;
    const parent = this.uiManager.container;

    this.tierPanel = new Container();
    this.tierPanel.zIndex = 170;
    this.tierPanel.eventMode = "none";
    this.tierPanel.position.copyFrom(this.winPanel.position);
    this.tierPanel.visible = false;
    this.tierPanel.alpha = 0;

    this.tierGlowBg = new Graphics();
    this.tierPanel.addChild(this.tierGlowBg);

    parent.addChild(this.tierPanel);
  }
}
