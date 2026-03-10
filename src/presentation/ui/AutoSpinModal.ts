import { Container, Graphics, Text } from "pixi.js";
import { getAppWidth, getAppHeight } from "../../domain/constants/Config";

export interface AutoSpinConfig {
    count: number;
    stopOnWin: boolean;
    stopOnLossLimit: number;
}

export class AutoSpinModal {
    private container: Container;
    private overlay: Graphics;
    private content: Container;
    private onStart: (config: AutoSpinConfig) => void;

    constructor(parent: Container, onStart: (config: AutoSpinConfig) => void) {
        this.onStart = onStart;
        this.container = new Container();
        this.container.visible = false;
        this.container.zIndex = 400;
        parent.addChild(this.container);

        this.overlay = new Graphics();
        this.overlay.rect(-2000, -2000, 4000, 4000);
        this.overlay.fill({ color: 0x000000, alpha: 0.85 });
        this.container.addChild(this.overlay);

        this.content = new Container();
        this.container.addChild(this.content);

        const bg = new Graphics()
            .roundRect(-420, -320, 840, 640, 24)
            .fill({ color: 0x15110C, alpha: 0.98 })
            .stroke({ color: 0xBA8A4C, width: 4, alpha: 0.9 });
        this.content.addChild(bg);

        // Header Bar
        const header = new Graphics()
            .roundRect(-420, -320, 840, 80, 24)
            .fill({ color: 0xBA8A4C, alpha: 0.2 })
            .stroke({ color: 0xBA8A4C, width: 2, alpha: 0.5 });
        this.content.addChild(header);

        const title = new Text({ 
            text: "AUTO SPIN", 
            style: { 
                fill: "#FFD700", 
                fontSize: 42, 
                fontWeight: "900",
                dropShadow: { color: 0x000000, blur: 4, distance: 2, angle: 0, alpha: 1 }
            } 
        });
        title.anchor.set(0.5);
        title.y = -280;
        this.content.addChild(title);

        // Close Button (X)
        const closeBtn = new Container();
        const closeBg = new Graphics().circle(0, 0, 25).fill({ color: 0xBA8A4C, alpha: 0.3 }).stroke({ color: 0xBA8A4C, width: 2 });
        const closeTxt = new Text({ text: "✕", style: { fill: "#FFD700", fontSize: 24, fontWeight: "bold" } });
        closeTxt.anchor.set(0.5);
        closeBtn.addChild(closeBg, closeTxt);
        closeBtn.position.set(380, -280);
        closeBtn.eventMode = 'static';
        closeBtn.cursor = 'pointer';
        closeBtn.on('pointerdown', () => this.hide());
        this.content.addChild(closeBtn);

        const counts = [10, 25, 50, 100];
        counts.forEach((count, i) => {
            const btn = this.createButton(`${count} SPINS`, -140 + (i * 75), () => {
                this.onStart({ count, stopOnWin: true, stopOnLossLimit: 5000 });
                this.hide();
            });
            this.content.addChild(btn);
        });

        const cancelBtn = this.createButton("CANCEL", 220, () => this.hide(), 0xb00020);
        this.content.addChild(cancelBtn);

        this.content.x = 0;
        this.content.y = 0;
    }

    private createButton(label: string, y: number, callback: () => void, color: number = 0x1A1A1A): Container {
        const btn = new Container();
        const bg = new Graphics()
            .roundRect(-150, -25, 300, 50, 12)
            .fill({ color, alpha: 1 })
            .stroke({ color: 0xBA8A4C, width: 2, alpha: 0.6 });
            
        const txt = new Text({ text: label, style: { fill: "#FFFFFF", fontSize: 24, fontWeight: "800" } });
        txt.anchor.set(0.5);
        btn.addChild(bg, txt);
        btn.y = y;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => {
             gsap.fromTo(btn.scale, { x: 0.9, y: 0.9 }, { x: 1, y: 1, duration: 0.1 });
             callback();
        });
        return btn;
    }

    public show() {
        this.container.visible = true;
        
        // Immediate alignment
        this.handleResize(getAppWidth(), getAppHeight());
    }

    public hide() {
        this.container.visible = false;
    }

    public handleResize(width: number, height: number) {
        const isPortrait = height > width;
        const parent = this.container.parent as Container | null;
        if (parent) {
            const localCenter = parent.toLocal({ x: width / 2, y: height / 2 } as any);
            this.container.position.set(localCenter.x, localCenter.y);
        }

        this.overlay.clear();
        this.overlay.rect(-2000, -2000, 4000, 4000);
        this.overlay.fill({ color: 0x000000, alpha: 0.85 });
        
        if (this.content) {
            const baseScale = isPortrait ? 0.7 : 1.0;
            this.content.scale.set(baseScale);
            const fitScale = Math.min(1, (width * 0.95) / (840 * baseScale));
            this.content.scale.set(baseScale * fitScale);
        }

        this.content.x = 0;
        this.content.y = 0;
    }
}
