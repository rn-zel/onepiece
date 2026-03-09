import { Container, Graphics, Text, TextStyle, Assets, Sprite } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";
import gsap from "gsap";

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

    private readonly SYMBOL_PAYOUTS: Record<string, number[]> = {
        "s4":   [0, 0, 0, 20,  50, 200],
        "s3":   [0, 0, 0, 15,  30, 100],
        "s2":   [0, 0, 0, 10,  20,  50],
        "s1":   [0, 0, 0,  5,  10,  30],
        "a":    [0, 0, 0,  1,   2,   5],
        "k":    [0, 0, 0,  1,   3,  10],
        "q":    [0, 0, 0,  2,   4,  15],
        "j":    [0, 0, 0,  2,   5,  20],
        "sc":   [0, 0, 0,  2,   5,  20],
        "wild": [0, 0, 0,  0,   0,   0],
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
            .rect(-CONFIG.DESIGN_WIDTH, -CONFIG.DESIGN_HEIGHT, CONFIG.DESIGN_WIDTH * 2, CONFIG.DESIGN_HEIGHT * 2)
            .fill({ color: 0x000000, alpha: 0.85 });
        overlay.eventMode = "static";
        overlay.cursor = "default";
        overlay.on("pointerdown", () => {}); // block clicks
        this.modalContainer.addChild(overlay);

        // Main Panel
        const panelWidth = CONFIG.DESIGN_WIDTH;
        const panelHeight = CONFIG.DESIGN_HEIGHT;
        const panel = new Graphics()
            .rect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight)
            .fill({ color: 0x15110C, alpha: 1 })
            .stroke({ color: 0xBA8A4C, width: 4, alpha: 0.9 });
        panel.eventMode = "static";
        this.modalContainer.addChild(panel);

        // Close Button
        const closeBtn = new Container();
        closeBtn.position.set(panelWidth/2 - 60, -panelHeight/2 + 60);
        closeBtn.eventMode = "static";
        closeBtn.cursor = "pointer";
        
        const closeBg = new Graphics().circle(0, 0, 25).fill(0xb00020).stroke({color: 0xffffff, width: 2});
        const closeText = new Text({ text: "X", style: new TextStyle({ fill: 0xffffff, fontSize: 24, fontWeight: "bold" }) });
        closeText.anchor.set(0.5);
        closeBtn.addChild(closeBg, closeText);
        
        closeBtn.on("pointerdown", () => {
            // Add a small bounce animation off scale before hiding
            gsap.to(closeBtn.scale, { x: 0.8, y: 0.8, duration: 0.1, yoyo: true, repeat: 1, onComplete: () => this.hide() });
        });
        
        // Tabs
        this.tabsContainer.position.set(-panelWidth/2 + 40, -panelHeight/2 + 40);
        let currentX = 0;
        
        for (const tab of this.tabs) {
            const btn = new Container();
            btn.position.set(currentX, 0);
            btn.eventMode = "static";
            btn.cursor = "pointer";

            const bg = new Graphics()
                .roundRect(0, 0, 200, 50, 10)
                .fill({ color: 0x33291d, alpha: 1 })
                .stroke({ color: 0xBA8A4C, width: 2, alpha: 0.5 });
            
            const txt = new Text({
                text: tab.label,
                style: new TextStyle({ fill: 0xaaaaaa, fontSize: 24, fontWeight: "bold" })
            });
            txt.anchor.set(0.5);
            txt.position.set(100, 25);
            
            btn.addChild(bg, txt);
            
            btn.on("pointerdown", () => this.switchTab(tab.id));
            
            this.tabsContainer.addChild(btn);
            this.tabButtons.set(tab.id, { bg, text: txt });
            
            currentX += 220;
        }

        this.contentContainer.position.set(-panelWidth/2 + 60, -panelHeight/2 + 120);

        this.modalContainer.addChild(this.tabsContainer);
        this.modalContainer.addChild(this.contentContainer);
        this.modalContainer.addChild(closeBtn);
    }

    private switchTab(tabId: string) {
        this.activeTabId = tabId;
        
        // Update tab visuals
        for (const [id, btn] of this.tabButtons.entries()) {
            btn.bg.clear();
            if (id === tabId) {
                btn.bg.roundRect(0, 0, 200, 50, 10).fill({ color: 0xF3CB0D, alpha: 1 }).stroke({ color: 0xffffff, width: 2, alpha: 1 });
                btn.text.style.fill = 0x000000;
            } else {
                btn.bg.roundRect(0, 0, 200, 50, 10).fill({ color: 0x33291d, alpha: 1 }).stroke({ color: 0xBA8A4C, width: 2, alpha: 0.5 });
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
        const titleStyle = new TextStyle({ fill: 0xF3CB0D, fontSize: 42, fontWeight: "bold" });
        const title = new Text({ text: "Symbol Payout Values", style: titleStyle });
        title.position.set(60, 0); 
        this.contentContainer.addChild(title);

        const list = ["sc", "wild", "s4", "s3", "s2", "s1", "a", "k", "q", "j"];
        
        let xOffset = 60;
        let yOffset = 80;
        
        for (let i = 0; i < list.length; i++) {
            const sym = list[i];
            
            const cell = new Container();
            cell.position.set(xOffset, yOffset);
            
            const cellBg = new Graphics()
                .roundRect(0, 0, 480, 100, 15) // Adjusted for tighter 2-column layout
                .fill({ color: 0x221B13, alpha: 1 })
                .stroke({ color: 0xBA8A4C, width: 1, alpha: 0.5 });
            cell.addChild(cellBg);

            try {
                const tex = Assets.get(`${sym}.png`);
                if (tex) {
                    const sprite = new Sprite(tex);
                    sprite.anchor.set(0.5);
                    sprite.position.set(50, 50);
                    sprite.scale.set(sym === "wild" || sym === "sc" ? 0.30 : 0.35);
                    cell.addChild(sprite);
                }
            } catch (e) {
                // missing texture fallback
            }

            if (sym === "wild") {
                const txt = new Text({ text: "Substitutes for all symbols\nexcept Scatter.", style: new TextStyle({ fill: 0xffffff, fontSize: 18, wordWrap: true, wordWrapWidth: 320 }) });
                txt.position.set(100, 25);
                cell.addChild(txt);
            } else if (sym === "sc") {
                const txt = new Text({ text: "3, 4, or 5 Scatters trigger\nFree Spins.\n3x = 20, 4x = 50, 5x = 200", style: new TextStyle({ fill: 0xffffff, fontSize: 18, wordWrap: true, wordWrapWidth: 320 }) });
                txt.position.set(100, 15);
                cell.addChild(txt);
            } else {
                const payouts = this.SYMBOL_PAYOUTS[sym];
                if (payouts) {
                    const t5 = new Text({ text: `5x:  ${payouts[5]}`, style: new TextStyle({ fill: 0xffffff, fontSize: 22, fontWeight: "bold" }) });
                    const t4 = new Text({ text: `4x:  ${payouts[4]}`, style: new TextStyle({ fill: 0xdddddd, fontSize: 18 }) });
                    const t3 = new Text({ text: `3x:  ${payouts[3]}`, style: new TextStyle({ fill: 0xbbbbbb, fontSize: 18 }) });
                    
                    t5.position.set(130, 20);
                    t4.position.set(130, 50);
                    t3.position.set(280, 50); // Side-by-side inside smaller box
                    
                    cell.addChild(t5, t4, t3);
                }
            }
            
            this.contentContainer.addChild(cell);
            
            xOffset += 500; // Second column
            if (i % 2 !== 0) {
                xOffset = 60;
                yOffset += 115; // Next row
            }
        }

        // --- Right Side: Ways to Win ---
        const waysX = 1100;

        const wTitle = new Text({ text: "243 WAYS TO WIN", style: titleStyle });
        wTitle.position.set(waysX, 0);
        
        const subtitle = new Text({ text: "Left to Right Winning Sequence", style: new TextStyle({ fill: 0xffffff, fontSize: 28, fontWeight: "bold" }) });
        subtitle.position.set(waysX, 80);

        const desc = new Text({ 
            text: "• Wins are awarded for matching symbols on adjacent reels starting from the leftmost reel.\n\n" +
                  "• Symbol Ways to Win are calculated by counting matching symbols on each reel from left to right, then multiplying the counts together.\n\n" +
                  "• Winning symbol payout is calculated as:\nSymbol Payout x Ways to Win x (Bet Size / 100)", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 24, wordWrap: true, wordWrapWidth: 700, lineHeight: 36 }) 
        });
        desc.position.set(waysX, 150);
        
        this.contentContainer.addChild(wTitle, subtitle, desc);
    }

    private renderFeatures() {
        const titleStyle = new TextStyle({ fill: 0xF3CB0D, fontSize: 32, fontWeight: "bold" });
        
        // Multiplier Feature
        const t1 = new Text({ text: "⚡ Increasing Multiplier Feature", style: titleStyle });
        t1.position.set(60, 20);
        
        const d1 = new Text({ 
            text: "• During cascading wins, each consecutive win increases the active multiplier value.\n\n" +
                  "• The longer your cascade chain continues, the higher the multiplier grows, increasing your overall win potential.\n\n" +
                  "• At the start of each new base spin, the multiplier resets to its initial value.", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 28, wordWrap: true, wordWrapWidth: 1560, lineHeight: 40 }) 
        });
        d1.position.set(60, 80);

        // Free Spins Feature
        const t2 = new Text({ text: "⭐ Free Spin Feature", style: titleStyle });
        t2.position.set(60, 280);
        
        const d2 = new Text({ 
            text: "• Triggered when at least 3 Scatter symbols land anywhere on the reels.\n\n" +
                  "• 3 Scatters -> 10 Free Spins\n" +
                  "• 4 Scatters -> 12 Free Spins\n" +
                  "• 5 Scatters -> 14 Free Spins\n\n" +
                  "• Free spins can be re-triggered during the Free Spin feature.\n" +
                  "• All wins during the Free Spin feature contribute to a persistent Total Win counter for the session.", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 28, wordWrap: true, wordWrapWidth: 1560, lineHeight: 40 }) 
        });
        d2.position.set(60, 360);
        
        this.contentContainer.addChild(t1, d1, t2, d2);
    }

    private renderRules() {
        const titleStyle = new TextStyle({ fill: 0xF3CB0D, fontSize: 32, fontWeight: "bold" });
        
        const t1 = new Text({ text: "Game Overview & Rules", style: titleStyle });
        t1.position.set(60, 20);
        
        const d1 = new Text({ 
            text: "• Video Slot Layout: 5x3 Reels\n" +
                  "• Ways to Win: 243\n" +
                  "• Maximum Win Cap: 1000x Total Bet\n\n" +
                  "• Final total win is calculated by summing all individual symbol payouts.\n" +
                  "• All wins are shown in cash equivalent.\n" +
                  "• Malfunction voids all pays and plays.\n\n" +
                  "• Auto Spin automatically plays the game for the selected number of rounds.\n" +
                  "• Bonus Buy allows instant access to the Free Spin feature for 10x the current bet amount.", 
            style: new TextStyle({ fill: 0xdddddd, fontSize: 28, wordWrap: true, wordWrapWidth: 1560, lineHeight: 44 }) 
        });
        d1.position.set(60, 80);
        
        this.contentContainer.addChild(t1, d1);
    }

    public show() {
        if (this.modalContainer.visible) return;
        this.modalContainer.visible = true;
        this.modalContainer.alpha = 0;
        gsap.to(this.modalContainer, { alpha: 1, duration: 0.3 });
        this.switchTab("payouts");
    }

    public hide() {
        gsap.to(this.modalContainer, { alpha: 0, duration: 0.3, onComplete: () => {
            this.modalContainer.visible = false;
        }});
    }
}
