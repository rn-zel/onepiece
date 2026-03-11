import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getAppWidth, getAppHeight } from "../../domain/constants/Config";

/**
 * Presentation Layer: Manages the "Buy Feature" popup modal UI.
 */
export class BuyFreeSpinsModal {
  private modalContainer: Container | null = null;
  private parentContainer: Container;

  constructor(parentContainer: Container) {
    this.parentContainer = parentContainer;
  }

  public show(
    cost: number,
    onConfirm: () => void,
    onCancel?: () => void,
  ): void {
    this.hide();

    const modal = new Container();
    modal.zIndex = 1000;
    modal.eventMode = "static";

    const overlay = new Graphics()
      .rect(-2000, -2000, 4000, 4000)
      .fill({ color: 0x000000, alpha: 0.85 });
    overlay.eventMode = "static";
    overlay.cursor = "default";

    overlay.on("pointerdown", () => {});
    modal.addChild(overlay);

    const panelContainer = new Container();
    modal.addChild(panelContainer);

    const panel = new Graphics()
      .roundRect(-420, -320, 840, 640, 24)
      .fill({ color: 0x15110c, alpha: 0.98 })
      .stroke({ color: 0xba8a4c, width: 4, alpha: 0.9 });
    panel.eventMode = "static";
    panelContainer.addChild(panel);

    // Header
    const header = new Graphics()
      .roundRect(-420, -320, 840, 80, 24)
      .fill({ color: 0xba8a4c, alpha: 0.2 })
      .stroke({ color: 0xba8a4c, width: 2, alpha: 0.5 });
    panelContainer.addChild(header);

    const title = new Text({
      text: "BUY FREE SPINS?",
      style: new TextStyle({
        fill: 0xffd700,
        fontSize: 42,
        fontWeight: "900",
        align: "center",
        dropShadow: {
          color: 0x000000,
          blur: 4,
          distance: 2,
          angle: 0,
          alpha: 1,
        },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(0, -280);
    title.resolution = 2;
    panelContainer.addChild(title);

    // Close Button (X)
    const closeBtn = new Container();
    const closeBg = new Graphics()
      .circle(0, 0, 25)
      .fill({ color: 0xba8a4c, alpha: 0.3 })
      .stroke({ color: 0xba8a4c, width: 2 });
    const closeTxt = new Text({
      text: "✕",
      style: { fill: "#FFD700", fontSize: 24, fontWeight: "bold" },
    });
    closeTxt.anchor.set(0.5);
    closeBtn.addChild(closeBg, closeTxt);
    closeBtn.position.set(380, -280);
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.on("pointerdown", () => this.hide());
    panelContainer.addChild(closeBtn);

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
    panelContainer.addChild(body);

    const makeButton = (label: string, x: number, y: number, color: number) => {
      const btn = new Container();
      btn.position.set(x, y);
      btn.eventMode = "static";
      btn.cursor = "pointer";

      const bg = new Graphics()
        .roundRect(-165, -40, 330, 80, 14)
        .fill({ color, alpha: 1 })
        .stroke({ color: 0xba8a4c, width: 3, alpha: 0.7 });
      btn.addChild(bg);

      const t = new Text({
        text: label,
        style: new TextStyle({
          fill: 0xffffff,
          fontSize: 34,
          fontWeight: "800",
        }),
      });
      t.anchor.set(0.5);
      t.resolution = 2;
      btn.addChild(t);

      return btn;
    };

    const confirmBtn = makeButton("CONFIRM", -170, 220, 0xf3cb0d);
    const cancelBtn = makeButton("CANCEL", 170, 220, 0xb00020);

    confirmBtn.on("pointerdown", () => {
      this.hide();
      onConfirm();
    });

    cancelBtn.on("pointerdown", () => {
      this.hide();
      onCancel?.();
    });

    panelContainer.addChild(confirmBtn);
    panelContainer.addChild(cancelBtn);

    this.modalContainer = modal;
    this.parentContainer.addChild(modal);

    // Position immediately for the current application bounds
    this.handleResize(getAppWidth(), getAppHeight());
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

      const overlay = this.modalContainer.children[0] as Graphics;
      if (overlay) {
        overlay
          .clear()
          .rect(-width, -height, width * 2, height * 2)
          .fill({ color: 0x000000, alpha: 0.85 });
      }

      const panelContainer = this.modalContainer.children[1] as Container;
      if (panelContainer) {
        const frameWidth = 840;
        const frameHeight = 640;

        // Fit to 90% of the screen width or height, whichever is more restrictive
        const scaleX = (width * 0.3) / frameWidth;
        const scaleY = (height * 0.3) / frameHeight;
        const fitScale = Math.min(scaleX, scaleY);

        panelContainer.scale.set(fitScale);
      }
    }
  }
}
