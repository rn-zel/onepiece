import { Container, Graphics, Text, TextStyle } from "pixi.js";
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
        this.overlay.rect(0, 0, 1920, 1080);
        this.overlay.fill({ color: 0x000000, alpha: 0.85 });
        this.overlay.interactive = true;
        this.overlay.on('pointerdown', () => this.hide());
        this.container.addChild(this.overlay);

        this.content = new Container();
        this.container.addChild(this.content);

        const bg = new Graphics();
        bg.roundRect(-400, -300, 800, 600, 20);
        bg.fill({ color: 0x1a1a1a });
        bg.stroke({ color: 0xffd700, width: 4 });
        this.content.addChild(bg);

        const titleStyle = new TextStyle({ fill: "#ffd700", fontSize: 48, fontWeight: "bold" });
        const title = new Text({ text: "SESSION STATISTICS", style: titleStyle });
        title.anchor.set(0.5);
        title.y = -240;
        this.content.addChild(title);

        this.content.x = 1920 / 2;
        this.content.y = 1080 / 2;
    }

    public show() {
        this.container.visible = true;
        this.renderStats();
    }

    public hide() {
        this.container.visible = false;
    }

    private renderStats() {
        // Clear previous stats
        this.content.children.forEach((child, i) => {
            if (i > 2) this.content.removeChild(child); // Keep bg and title
        });

        const stats = this.telemetry.getSessionStats();
        const style = new TextStyle({ fill: "#ffffff", fontSize: 32 });

        const labels = [
            `Total Wagered: ₱${stats.totalWagered.toLocaleString()}`,
            `Total Won: ₱${stats.totalWon.toLocaleString()}`,
            `Net Profit/Loss: ₱${(stats.totalWon - stats.totalWagered).toLocaleString()}`,
            `Session RTP: ${stats.rtp.toFixed(2)}%`,
            `Total Spins: ${stats.spinsCount}`,
            `Free Spins Hit: ${stats.bonusSpinsCount}`,
            `Session Duration: ${stats.duration}s`
        ];

        labels.forEach((text, i) => {
            const t = new Text({ text, style });
            t.anchor.set(0.5);
            t.y = -140 + (i * 50);
            this.content.addChild(t);
        });
    }

    public handleResize(width: number, height: number) {
        this.overlay.clear();
        this.overlay.rect(0, 0, width, height);
        this.overlay.fill({ color: 0x000000, alpha: 0.85 });
        this.content.x = width / 2;
        this.content.y = height / 2;
    }
}
