import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getAppWidth, getAppHeight } from "../../domain/constants/Config";
import { TelemetryService } from "../../domain/services/TelemetryService";

export class StatsModal {
  private container: Container;
  private overlay: Graphics;
  private content: Container;
  private telemetry = TelemetryService.getInstance();

  constructor(parent: Container) {
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = 500;
    parent.addChild(this.container);

    this.overlay = new Graphics();
    this.overlay.rect(-2000, -2000, 4000, 4000);
    this.overlay.fill({ color: 0x000000, alpha: 0.85 });
    this.overlay.interactive = true;
    this.overlay.on("pointerdown", () => this.hide());
    this.container.addChild(this.overlay);

    this.content = new Container();
    this.container.addChild(this.content);

    const bg = new Graphics()
      .roundRect(-420, -320, 840, 640, 24)
      .fill({ color: 0x15110c, alpha: 0.98 })
      .stroke({ color: 0xba8a4c, width: 4, alpha: 0.9 });
    this.content.addChild(bg);

    // Header Bar
    const header = new Graphics()
      .roundRect(-420, -320, 840, 80, 24)
      .fill({ color: 0xba8a4c, alpha: 0.2 })
      .stroke({ color: 0xba8a4c, width: 2, alpha: 0.5 });
    this.content.addChild(header);

    const titleStyle = new TextStyle({
      fill: "#FFD700",
      fontSize: 42,
      fontWeight: "900",
      dropShadow: { color: 0x000000, blur: 4, distance: 2, angle: 0 },
    });
    const title = new Text({ text: "SESSION STATISTICS", style: titleStyle });
    title.anchor.set(0.5);
    title.y = -280;
    this.content.addChild(title);

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
    this.content.addChild(closeBtn);

    this.content.x = 0;
    this.content.y = 0;
  }

  public show() {
    this.container.visible = true;
    this.renderStats();

    // Immediate alignment
    this.handleResize(getAppWidth(), getAppHeight());
  }

  public hide() {
    this.container.visible = false;
  }

  private renderStats() {
    // Clear previous stats (children after header/title/bg/closeBtn)
    while (this.content.children.length > 4) {
      this.content.removeChildAt(4);
    }

    const stats = this.telemetry.getSessionStats();

    const labels = [
      ["Total Wagered", `₱${stats.totalWagered.toLocaleString()}`],
      ["Total Won", `₱${stats.totalWon.toLocaleString()}`],
      [
        "Net Profit/Loss",
        `₱${(stats.totalWon - stats.totalWagered).toLocaleString()}`,
      ],
      ["Session RTP", `${stats.rtp.toFixed(2)}%`],
      ["Total Spins", `${stats.spinsCount}`],
      ["Free Spins Hit", `${stats.bonusSpinsCount}`],
      [
        "Session Duration",
        `${Math.floor(stats.duration / 60)}m ${stats.duration % 60}s`,
      ],
    ];

    const labelStyle = new TextStyle({
      fill: "#BA8A4C",
      fontSize: 28,
      fontWeight: "700",
    });
    const valStyle = new TextStyle({
      fill: "#FFFFFF",
      fontSize: 28,
      fontWeight: "500",
    });

    labels.forEach((pair, i) => {
      const rowY = -160 + i * 60;

      // Draw a subtle row separator
      const line = new Graphics()
        .moveTo(-350, rowY + 35)
        .lineTo(350, rowY + 35)
        .stroke({ color: 0xba8a4c, width: 1, alpha: 0.2 });
      this.content.addChild(line);

      const lab = new Text({ text: pair[0], style: labelStyle });
      lab.anchor.set(0, 0.5);
      lab.x = -350;
      lab.y = rowY;

      const val = new Text({ text: pair[1], style: valStyle });
      val.anchor.set(1, 0.5);
      val.x = 350;
      val.y = rowY;

      if (pair[0] === "Net Profit/Loss") {
        const diff = stats.totalWon - stats.totalWagered;
        val.style.fill = diff >= 0 ? 0x00ff00 : 0xff4444;
      }

      this.content.addChild(lab, val);
    });
  }

  public handleResize(width: number, height: number) {
    if (this.container) {
      this.container.x = width / 2;
      this.container.y = height / 2;

      if (this.overlay) {
        this.overlay
          .clear()
          .rect(-width, -height, width * 2, height * 2)
          .fill({ color: 0x000000, alpha: 0.85 });
      }

      if (this.content) {
        const frameWidth = 840;
        const frameHeight = 640;

        const scaleX = (width * 0.9) / frameWidth;
        const scaleY = (height * 0.9) / frameHeight;
        const fitScale = Math.min(scaleX, scaleY);

        this.content.scale.set(fitScale);
      }
    }

    this.content.x = 0;
    this.content.y = 0;
  }
}
