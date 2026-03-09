import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";

/**
 * Presentation Layer: Manages the "Buy Feature" popup modal UI.
 * Extracted from UIManager to enforce Single Responsibility Principle.
 */
export class BuyFreeSpinsModal {
    private modalContainer: Container | null = null;
    private parentContainer: Container;

    constructor(parentContainer: Container) {
        this.parentContainer = parentContainer;
    }

    public show(cost: number, onConfirm: () => void, onCancel?: () => void): void {
        this.hide();

        const modal = new Container();
        modal.zIndex = 1000;
        modal.eventMode = "static";

        const overlay = new Graphics()
            .rect(-CONFIG.DESIGN_WIDTH, -CONFIG.DESIGN_HEIGHT, CONFIG.DESIGN_WIDTH * 2, CONFIG.DESIGN_HEIGHT * 2)
            .fill({ color: 0x000000, alpha: 0.65 });
        overlay.eventMode = "static";
        overlay.cursor = "default";
      
        overlay.on("pointerdown", () => {});
        modal.addChild(overlay);

        const panel = new Graphics()
            .roundRect(-320, -180, 640, 360, 24)
            .fill({ color: 0x15110C, alpha: 0.95 })
            .stroke({ color: 0xBA8A4C, width: 4, alpha: 0.9 });
        panel.eventMode = "static";
        modal.addChild(panel);

        const title = new Text({
            text: "BUY FREE SPINS?",
            style: new TextStyle({
                fill: 0xffffff,
                fontSize: 52,
                fontWeight: "800",
                align: "center",
                dropShadow: { color: 0x000000, blur: 8, distance: 0, angle: 0 },
            }),
        });
        title.anchor.set(0.5);
        title.position.set(0, -95);
        title.resolution = 2;
        modal.addChild(title);

        const body = new Text({
            text: `Cost: ₱${Math.floor(cost).toLocaleString()}\nThis will trigger a scatter bonus.`,
            style: new TextStyle({
                fill: 0xffffff,
                fontSize: 34,
                fontWeight: "600",
                align: "center",
                lineHeight: 44,
            }),
        });
        body.anchor.set(0.5);
        body.position.set(0, 0);
        body.resolution = 2;
        modal.addChild(body);

        const makeButton = (label: string, x: number, y: number, color: number) => {
            const btn = new Container();
            btn.position.set(x, y);
            btn.eventMode = "static";
            btn.cursor = "pointer";

            const bg = new Graphics()
                .roundRect(-165, -48, 330, 96, 18)
                .fill({ color, alpha: 1 })
                .stroke({ color: 0xBA8A4C, width: 3, alpha: 0.7 });
            btn.addChild(bg);

            const t = new Text({
                text: label,
                style: new TextStyle({ fill: 0xffffff, fontSize: 38, fontWeight: "800" }),
            });
            t.anchor.set(0.5);
            t.resolution = 2;
            btn.addChild(t);

            return btn;
        };

        const confirmBtn = makeButton("CONFIRM", -170, 110, 0xF3CB0D);
        const cancelBtn = makeButton("CANCEL", 170, 110, 0xb00020);

        confirmBtn.on("pointerdown", () => {
            this.hide();
            onConfirm();
        });

        cancelBtn.on("pointerdown", () => {
            this.hide();
            onCancel?.();
        });

        modal.addChild(confirmBtn);
        modal.addChild(cancelBtn);

        this.modalContainer = modal;
        this.parentContainer.addChild(modal);
    }

    public hide(): void {
        if (!this.modalContainer) return;
        if (this.modalContainer.parent) {
            this.modalContainer.parent.removeChild(this.modalContainer);
        }
        this.modalContainer.destroy({ children: true });
        this.modalContainer = null;
    }

    public handleResize(width: number, height: number): void {
        if (this.modalContainer) {
            this.modalContainer.x = width / 2;
            this.modalContainer.y = height / 2;
        }
    }
}
