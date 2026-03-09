import { Container, Graphics } from "pixi.js";
import gsap from "gsap";
import { CONFIG } from "../../domain/constants/Config";
import type { UIManager } from "./UIManager";

/**
 * Owns all win-display UI: the win panel, the bonus panel, and their animations.
 * Extracted from SlotMachine to enforce the Single Responsibility Principle.
 */
export class WinPresenter {
    private winPanel!: Container;
    private bonusPanel!: Container;
    private uiManager: UIManager;

    constructor(uiManager: UIManager) {
        this.uiManager = uiManager;
    }

    /** Must be called once after UIManager.winText has been added to a parent container. */
    init(): void {
        this._createWinPanel();
        this._createBonusPanel();
    }

    // ── Public API ───────────────────────────────────────────────────

    showWin(delay: number = 0): void {
        if (!this.winPanel) return;
        if (this.bonusPanel) this.bonusPanel.visible = false;

        this._adoptText(this.winPanel);
        this.winPanel.visible = true;
        gsap.killTweensOf(this.winPanel);
        gsap.killTweensOf(this.winPanel.scale);
        this.winPanel.alpha = 0;
        this.winPanel.scale.set(0.01);

        gsap.to(this.winPanel, { alpha: 1, duration: 0.25, delay, ease: "power2.out" });
        gsap.to(this.winPanel.scale, {
            x: 1, y: 1,
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
            x: 1.08, y: 1.08, duration: 0.2, ease: "back.out(3)",
            onComplete: () => {
                gsap.to(this.bonusPanel.scale, { x: 1, y: 1, duration: 0.3, ease: "elastic.out(1,0.5)" });
                gsap.to(this.bonusPanel, {
                    x: this.bonusPanel.x + 4, duration: 0.07,
                    yoyo: true, repeat: 5, ease: "sine.inOut",
                    onComplete: () => { this.bonusPanel.x = 0; },
                });
            },
        });
    }

    hide(): void {
        const panels: Container[] = [];
        if (this.winPanel) panels.push(this.winPanel);
        if (this.bonusPanel) panels.push(this.bonusPanel);

        for (const panel of panels) {
            gsap.killTweensOf(panel);
            gsap.killTweensOf(panel.scale);
            gsap.to(panel, {
                alpha: 0, duration: 0.2, ease: "power2.in",
                onComplete: () => { panel.visible = false; panel.scale.set(1); },
            });
        }
    }

    // ── Private Helpers ──────────────────────────────────────────────

    private _adoptText(panel: Container): void {
        if (this.uiManager.winText.parent !== panel) {
            this.uiManager.winText.parent?.removeChild(this.uiManager.winText);
            this.uiManager.winText.position.set(0, 0);
            panel.addChild(this.uiManager.winText);
        }
    }

    private _createWinPanel(): void {
        const parent = this.uiManager.winText.parent;
        if (!parent) return;

        const pos = this.uiManager.winText.position.clone();
        this.winPanel = new Container();
        this.winPanel.zIndex = 150;
        this.winPanel.position.copyFrom(pos);
        this.winPanel.visible = false;
        this.winPanel.alpha = 0;

        const W = 900, H = 260;
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
        this.bonusPanel.position.copyFrom(this.winPanel.position);
        this.bonusPanel.visible = false;
        this.bonusPanel.alpha = 0;

        const W = 1800, H = 980;
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
}
