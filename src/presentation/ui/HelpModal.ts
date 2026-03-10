import { Container, Graphics, Text, TextStyle, Assets, Sprite } from "pixi.js";
import { getAppWidth, getAppHeight } from "../../domain/constants/Config";
import gsap from "gsap";

const PANEL_WIDTH = 840;
const PANEL_HEIGHT = 640;

export class HelpModal {
    private modalContainer: Container;
    private parentContainer: Container;
    private contentContainer: Container;
    private tabsContainer: Container;
    
    private tabs: { id: string, label: string }[] = [
        { id: "payouts", label: "Paytable & Ways" },
        { id: "features", label: "Features" },
        { id: "rules", label: "Rules" }
    ];
    private activeTabId: string = "payouts";
    private tabButtons: Map<string, { bg: Graphics, text: Text }> = new Map();

    // Indices 3=3x, 4=4x, 5=5x (matches paytable image)
    private readonly SYMBOL_PAYOUTS: Record<string, number[]> = {
        "s4":   [0, 0, 0, 100, 150, 250],  // Golden Emblem
        "s3":   [0, 0, 0,  40,  60, 100],  // Fiery Bird
        "s2":   [0, 0, 0,  60,  95, 140],  // White Tiger
        "s1":   [0, 0, 0,  25,  40,  75],  // Alligator
        "a":    [0, 0, 0,  15,  20,  30],  // Ace
        "k":    [0, 0, 0,  10,  16,  20],  // King
        "q":    [0, 0, 0,   6,   9,  12],  // Queen
        "j":    [0, 0, 0,   3,   5,   8],  // Jack
        "sc":   [0, 0, 0,   2,   5,  20], // Scatter
        "wild": [0, 0, 0,   0,   0,   0],
    };

    constructor(parentContainer: Container) {
        this.parentContainer = parentContainer;
        this.modalContainer = new Container();
        this.modalContainer.zIndex = 1000;
        this.modalContainer.visible = false;
        this.modalContainer.eventMode = "static";

        this.contentContainer = new Container();
        this.tabsContainer = new Container();

        this.createUI();
        this.parentContainer.addChild(this.modalContainer);
    }

    private createUI() {
        // Dark Overlay
        const overlay = new Graphics()
            .rect(-2000, -2000, 4000, 4000) // Large enough to cover any screen
            .fill({ color: 0x000000, alpha: 0.85 });
        overlay.eventMode = "static";
        overlay.cursor = "default";
        overlay.on("pointerdown", () => {}); // block clicks
        this.modalContainer.addChild(overlay);

        // Main Panel (same size as StatsModal)
        const panel = new Graphics()
            .roundRect(-PANEL_WIDTH/2, -PANEL_HEIGHT/2, PANEL_WIDTH, PANEL_HEIGHT, 24)
            .fill({ color: 0x15110C, alpha: 0.98 })
            .stroke({ color: 0xBA8A4C, width: 4, alpha: 0.9 });
        panel.eventMode = "static";
        this.modalContainer.addChild(panel);

        // Close Button
        const closeBtn = new Container();
        closeBtn.position.set(PANEL_WIDTH/2 - 60, -PANEL_HEIGHT/2 + 60);
        closeBtn.eventMode = "static";
        closeBtn.cursor = "pointer";
        
        const closeBg = new Graphics().circle(0, 0, 25).fill({ color: 0xBA8A4C, alpha: 0.3 }).stroke({ color: 0xBA8A4C, width: 2 });
        const closeText = new Text({ text: "✕", style: new TextStyle({ fill: 0xFFD700, fontSize: 24, fontWeight: "bold" }) });
        closeText.anchor.set(0.5);
        closeBtn.addChild(closeBg, closeText);
        
        closeBtn.on("pointerdown", () => {
            gsap.to(closeBtn.scale, { x: 0.8, y: 0.8, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => this.hide() });
        });
        
        // Tabs
        this.tabsContainer.position.set(-PANEL_WIDTH/2 + 40, -PANEL_HEIGHT/2 + 40);
        let currentX = 0;
        
        for (const tab of this.tabs) {
            const btn = new Container();
            btn.position.set(currentX, 0);
            btn.eventMode = "static";
            btn.cursor = "pointer";

            const bg = new Graphics()
                .roundRect(0, 0, 180, 44, 10)
                .fill({ color: 0x33291d, alpha: 1 })
                .stroke({ color: 0xBA8A4C, width: 2, alpha: 0.5 });
            
            const txt = new Text({
                text: tab.label,
                style: new TextStyle({ fill: 0xaaaaaa, fontSize: 20, fontWeight: "bold" })
            });
            txt.anchor.set(0.5);
            txt.position.set(90, 22);
            
            btn.addChild(bg, txt);
            
            btn.on("pointerdown", () => this.switchTab(tab.id));
            
            this.tabsContainer.addChild(btn);
            this.tabButtons.set(tab.id, { bg, text: txt });
            
            currentX += 200;
        }

        this.contentContainer.position.set(-PANEL_WIDTH/2 + 50, -PANEL_HEIGHT/2 + 110);

        this.modalContainer.addChild(this.tabsContainer);
        this.modalContainer.addChild(this.contentContainer);
        this.modalContainer.addChild(closeBtn);
    }

    private switchTab(tabId: string) {
        this.activeTabId = tabId;
        
        for (const [id, btn] of this.tabButtons.entries()) {
            btn.bg.clear();
            if (id === tabId) {
                btn.bg.roundRect(0, 0, 180, 44, 10).fill({ color: 0xF3CB0D, alpha: 1 }).stroke({ color: 0xffffff, width: 2, alpha: 1 });
                btn.text.style.fill = 0x000000;
            } else {
                btn.bg.roundRect(0, 0, 180, 44, 10).fill({ color: 0x33291d, alpha: 1 }).stroke({ color: 0xBA8A4C, width: 2, alpha: 0.5 });
                btn.text.style.fill = 0xaaaaaa;
            }
        }

        this.renderContent();
    }

    private renderContent() {
        this.contentContainer.removeChildren();

        if (this.activeTabId === "payouts") {
            this.renderPayoutsAndWays();
        } else if (this.activeTabId === "features") {
            this.renderFeatures();
        } else if (this.activeTabId === "rules") {
            this.renderRules();
        }
    }

    private renderPayoutsAndWays() {
        const titleStyle = new TextStyle({ fill: 0xF3CB0D, fontSize: 28, fontWeight: "bold" });
        const title = new Text({ text: "Symbol Payout Values", style: titleStyle });
        title.position.set(30, 0); 
        this.contentContainer.addChild(title);

        const list = ["sc", "wild", "s4", "s3", "s2", "s1", "a", "k", "q", "j"];
        let xOffset = 30;
        let yOffset = 45;
        
        for (let i = 0; i < list.length; i++) {
            const sym = list[i];
            const cell = new Container();
            cell.position.set(xOffset, yOffset);
            const cellBg = new Graphics()
                .roundRect(0, 0, 320, 56, 10)
                .fill({ color: 0x221B13, alpha: 1 })
                .stroke({ color: 0xBA8A4C, width: 1, alpha: 0.5 });
            cell.addChild(cellBg);

            try {
                const tex = Assets.get(`${sym}.png`);
                if (tex) {
                    const sprite = new Sprite(tex);
                    sprite.anchor.set(0.5);
                    sprite.position.set(32, 28);
                    sprite.scale.set(sym === "wild" || sym === "sc" ? 0.18 : 0.22);
                    cell.addChild(sprite);
                }
            } catch (e) {}

            if (sym === "wild") {
                const txt = new Text({ text: "Substitutes for all except Scatter.", style: new TextStyle({ fill: 0xffffff, fontSize: 14, wordWrap: true, wordWrapWidth: 220 }) });
                txt.position.set(70, 14);
                cell.addChild(txt);
            } else if (sym === "sc") {
                const txt = new Text({ text: "3/4/5 Scatters = Free Spins. 3x=20, 4x=50, 5x=200", style: new TextStyle({ fill: 0xffffff, fontSize: 14, wordWrap: true, wordWrapWidth: 220 }) });
                txt.position.set(70, 14);
                cell.addChild(txt);
            } else {
                const payouts = this.SYMBOL_PAYOUTS[sym];
                if (payouts) {
                    const t5 = new Text({ text: `5x: ${payouts[5]}`, style: new TextStyle({ fill: 0xffffff, fontSize: 16, fontWeight: "bold" }) });
                    const t4 = new Text({ text: `4x: ${payouts[4]}`, style: new TextStyle({ fill: 0xdddddd, fontSize: 14 }) });
                    const t3 = new Text({ text: `3x: ${payouts[3]}`, style: new TextStyle({ fill: 0xbbbbbb, fontSize: 14 }) });
                    t5.position.set(90, 8);
                    t4.position.set(90, 28);
                    t3.position.set(200, 28);
                    cell.addChild(t5, t4, t3);
                }
            }
            this.contentContainer.addChild(cell);
            xOffset += 340;
            if (i % 2 !== 0) {
                xOffset = 30;
                yOffset += 62;
            }
        }

        const waysX = 420;
        const wTitle = new Text({ text: "243 WAYS TO WIN", style: titleStyle });
        wTitle.position.set(waysX, 0);
        const subtitle = new Text({ text: "Left to Right Winning Sequence", style: new TextStyle({ fill: 0xffffff, fontSize: 18, fontWeight: "bold" }) });
        subtitle.position.set(waysX, 38);
        const desc = new Text({ 
            text: "• Wins for matching symbols on adjacent reels from the left.\n\n• Ways = multiply matching counts per reel.\n\n• Payout = Symbol Payout x Ways x (Bet Size / 100)", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 16, wordWrap: true, wordWrapWidth: 380, lineHeight: 24 }) 
        });
        desc.position.set(waysX, 75);
        this.contentContainer.addChild(wTitle, subtitle, desc);
    }

    private renderFeatures() {
        const titleStyle = new TextStyle({ fill: 0xF3CB0D, fontSize: 22, fontWeight: "bold" });
        const t1 = new Text({ text: "⚡ Increasing Multiplier", style: titleStyle });
        t1.position.set(30, 10);
        const d1 = new Text({ 
            text: "• Each cascade win increases the multiplier.\n• Multiplier resets at the start of each new base spin.", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 18, wordWrap: true, wordWrapWidth: 740, lineHeight: 26 }) 
        });
        d1.position.set(30, 45);
        const t2 = new Text({ text: "⭐ Free Spins", style: titleStyle });
        t2.position.set(30, 120);
        const d2 = new Text({ 
            text: "• 3 Scatters = 10, 4 = 12, 5 = 14 Free Spins. Can re-trigger.", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 18, wordWrap: true, wordWrapWidth: 740, lineHeight: 26 }) 
        });
        d2.position.set(30, 155);
        this.contentContainer.addChild(t1, d1, t2, d2);
    }

    private renderRules() {
        const titleStyle = new TextStyle({ fill: 0xF3CB0D, fontSize: 22, fontWeight: "bold" });
        const t1 = new Text({ text: "Game Overview & Rules", style: titleStyle });
        t1.position.set(30, 10);
        const d1 = new Text({ 
            text: "• 5x3 Reels, 243 Ways. Max win cap: 1000x Total Bet.\n• Total win = sum of symbol payouts. Auto Spin and Bonus Buy (10x bet) available.", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 18, wordWrap: true, wordWrapWidth: 740, lineHeight: 28 }) 
        });
        d1.position.set(30, 50);
        this.contentContainer.addChild(t1, d1);
    }

    public show() {
        if (this.modalContainer.visible) return;
        this.modalContainer.visible = true;
        this.modalContainer.alpha = 0;
        gsap.to(this.modalContainer, { alpha: 1, duration: 0.3 });
        this.switchTab("payouts");
        
        // Immediate alignment
        this.handleResize(getAppWidth(), getAppHeight());
    }

    public hide() {
        gsap.to(this.modalContainer, { alpha: 0, duration: 0.3, onComplete: () => {
            this.modalContainer.visible = false;
        }});
    }

    public handleResize(width: number, height: number) {
        const isPortrait = height > width;
        const parent = this.modalContainer.parent as Container | null;
        if (parent) {
            const localCenter = parent.toLocal({ x: width / 2, y: height / 2 } as any);
            this.modalContainer.position.set(localCenter.x, localCenter.y);
        }

        const overlay = this.modalContainer.children[0] as Graphics;
        if (overlay) {
            overlay.clear()
                .rect(-2000, -2000, 4000, 4000)
                .fill({ color: 0x000000, alpha: 0.85 });
        }

        if (this.modalContainer) {
            const baseScale = isPortrait ? 0.7 : 1.0;
            this.modalContainer.scale.set(baseScale);
            const fitScale = Math.min(1, (width * 0.95) / (PANEL_WIDTH * baseScale));
            this.modalContainer.scale.set(baseScale * fitScale);
        }
    }
}
