import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getAppWidth, getAppHeight } from "../../domain/constants/Config";
import { TelemetryService } from "../../domain/services/TelemetryService";

export class HistoryModal {
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
    const title = new Text({ text: "SPIN HISTORY", style: titleStyle });
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
    this.renderHistory();

    // Immediate alignment
    this.handleResize(getAppWidth(), getAppHeight());
  }

  public hide() {
    this.container.visible = false;
  }

  private renderHistory() {
    // Clear previous content (children after header/title/bg/closeBtn)
    while (this.content.children.length > 4) {
      this.content.removeChildAt(4);
    }

    const history = this.telemetry.getHistory();
    const headerStyle = new TextStyle({
      fill: "#BA8A4C",
      fontSize: 24,
      fontWeight: "900",
      align: "center"
    });

    const rowStyle = new TextStyle({
      fill: "#FFFFFF",
      fontSize: 22,
      fontWeight: "500",
    });

    // Sub-headers
    const hTime = new Text({ text: "TIME", style: headerStyle });
    hTime.position.set(-350, -210);
    const hBet = new Text({ text: "BET", style: headerStyle });
    hBet.position.set(-50, -210);
    const hWin = new Text({ text: "WIN", style: headerStyle });
    hWin.position.set(250, -210);
    this.content.addChild(hTime, hBet, hWin);

    // List top 8 recent spins
    const displayCount = Math.min(history.length, 8);
    for (let i = 0; i < displayCount; i++) {
      const record = history[i];
      const rowY = -150 + i * 55;

      const date = new Date(record.timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      
      const tTime = new Text({ text: timeStr, style: rowStyle });
      tTime.position.set(-350, rowY);
      
      const tBet = new Text({ text: `₱${record.bet.toLocaleString()}`, style: rowStyle });
      tBet.position.set(-50, rowY);
      
      const tWin = new Text({ text: `₱${record.win.toLocaleString()}`, style: rowStyle });
      tWin.position.set(250, rowY);
      if (record.win > 0) tWin.style.fill = 0x00FF00;

      // Subtle separator
      const line = new Graphics()
        .moveTo(-380, rowY + 30)
        .lineTo(380, rowY + 30)
        .stroke({ color: 0xba8a4c, width: 1, alpha: 0.1 });

      this.content.addChild(tTime, tBet, tWin, line);
    }

    if (history.length === 0) {
      const noHistory = new Text({ 
        text: "NO SPINS RECORDED YET", 
        style: { ...rowStyle, fill: 0x555555, fontSize: 32 } 
      });
      noHistory.anchor.set(0.5);
      noHistory.y = 0;
      this.content.addChild(noHistory);
    }
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
