import { Container, Graphics, Text } from "pixi.js";

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
        this.overlay.rect(0, 0, 1920, 1080);
        this.overlay.fill({ color: 0x000000, alpha: 0.8 });
        this.container.addChild(this.overlay);

        this.content = new Container();
        this.container.addChild(this.content);

        const bg = new Graphics();
        bg.roundRect(-250, -200, 500, 400, 15);
        bg.fill({ color: 0x222222 });
        bg.stroke({ color: 0xffd700, width: 3 });
        this.content.addChild(bg);

        const title = new Text({ text: "AUTO SPIN", style: { fill: "#ffd700", fontSize: 36, fontWeight: "bold" } });
        title.anchor.set(0.5);
        title.y = -150;
        this.content.addChild(title);

        const counts = [10, 25, 50, 100];
        counts.forEach((count, i) => {
            const btn = this.createButton(`${count} SPINS`, -60 + (i * 60), () => {
                this.onStart({ count, stopOnWin: true, stopOnLossLimit: 5000 });
                this.hide();
            });
            this.content.addChild(btn);
        });

        this.content.x = 1920 / 2;
        this.content.y = 1080 / 2;
    }

    private createButton(label: string, y: number, callback: () => void): Container {
        const btn = new Container();
        const bg = new Graphics().roundRect(-100, -20, 200, 40, 5).fill({ color: 0x444444 });
        const txt = new Text({ text: label, style: { fill: "#ffffff", fontSize: 20 } });
        txt.anchor.set(0.5);
        btn.addChild(bg, txt);
        btn.y = y;
        btn.eventMode = 'static';
        btn.cursor = 'pointer';
        btn.on('pointerdown', callback);
        return btn;
    }

    public show() {
        this.container.visible = true;
    }

    public hide() {
        this.container.visible = false;
    }

    public handleResize(width: number, height: number) {
        this.overlay.clear();
        this.overlay.rect(0, 0, width, height);
        this.overlay.fill({ color: 0x000000, alpha: 0.8 });
        this.content.x = width / 2;
        this.content.y = height / 2;
    }
}
