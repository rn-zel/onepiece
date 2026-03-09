import { Container, Graphics, Text } from "pixi.js";
import { CONFIG, getAppWidth, getAppHeight } from "../../domain/constants/Config";
import gsap from "gsap";

/**
 * Presentation Layer: Manages the "Bet Options" modal with slider and controls.
 */
export class BetModal {
    private stage: Container;
    private modalContainer: Container | null = null;
    private overlay: Graphics | null = null;
    private currentBetIndex: number = 0;
    private onConfirm: (amount: number) => void;
    private currentBalance: number = 0;

    // UI Elements
    private betAmountText!: Text;
    private betSizeText!: Text;
    private creditsText!: Text;
    private sliderHandle!: Container;
    private sliderTrack!: Graphics;
    private sliderProgress!: Graphics;

    constructor(stage: Container, onConfirm: (amount: number) => void) {
        this.stage = stage;
        this.onConfirm = onConfirm;
        // Find initial index
        this.currentBetIndex = CONFIG.BET_VALUES.indexOf(CONFIG.BET_AMOUNT);
        if (this.currentBetIndex === -1) this.currentBetIndex = 0;
    }

    public show(currentBalance: number, currentBet: number) {
        this.currentBalance = currentBalance;
        this.currentBetIndex = CONFIG.BET_VALUES.indexOf(currentBet);
        if (this.currentBetIndex === -1) {
            // Find closest index
            this.currentBetIndex = CONFIG.BET_VALUES.findIndex(v => v >= currentBet);
            if (this.currentBetIndex === -1) this.currentBetIndex = 0;
        }

        if (this.modalContainer) return;

        this.modalContainer = new Container();
        this.modalContainer.zIndex = 1000;
        this.modalContainer.eventMode = "static";

        // Dark Overlay
        this.overlay = new Graphics()
            .rect(-2000, -2000, 4000, 4000)
            .fill({ color: 0x000000, alpha: 0.85 });
        this.overlay.interactive = true;
        this.overlay.on("pointerdown", () => this.hide());
        this.modalContainer.addChild(this.overlay);

        // Modal Box
        const mainBg = new Graphics()
            .roundRect(-350, -220, 700, 440, 24)
            .fill({ color: 0x1A1A1A, alpha: 0.95 })
            .stroke({ color: 0xBA8A4C, width: 4, alpha: 0.9 });
        this.modalContainer.addChild(mainBg);

        // Header
        const header = new Graphics()
            .roundRect(-350, -220, 700, 70, 24)
            .fill({ color: 0xBA8A4C, alpha: 0.1 });
        this.modalContainer.addChild(header);

        const titleText = new Text({
            text: "Bet Options",
            style: { fill: "#FFFFFF", fontSize: 32, fontWeight: "bold" }
        });
        titleText.anchor.set(0, 0.5);
        titleText.position.set(-320, -185);
        this.modalContainer.addChild(titleText);

        // Close Button
        const closeBtn = new Container();
        const closeBg = new Graphics()
            .circle(0, 0, 25)
            .fill({ color: 0x333333, alpha: 0.8 });
        const closeX = new Text({ text: "✕", style: { fill: "#FFFFFF", fontSize: 24 } });
        closeX.anchor.set(0.5);
        closeBtn.addChild(closeBg, closeX);
        closeBtn.position.set(310, -185);
        closeBtn.interactive = true;
        closeBtn.cursor = "pointer";
        closeBtn.on("pointerdown", () => this.hide());
        this.modalContainer.addChild(closeBtn);

        // Credits Display
        this.creditsText = new Text({
            text: `Credits: ₱${this.currentBalance.toLocaleString()}`,
            style: { fill: "#FFD700", fontSize: 24, fontWeight: "bold" }
        });
        this.creditsText.anchor.set(0.5);
        this.creditsText.position.set(0, -130);
        this.modalContainer.addChild(this.creditsText);

        const multiplierInfo = new Text({
            text: "Bet Amount: Bet Size x Bet Level x 30",
            style: { fill: "#BA8A4C", fontSize: 18, fontWeight: "bold" }
        });
        multiplierInfo.anchor.set(1, 0.5);
        multiplierInfo.position.set(330, -130);
        this.modalContainer.addChild(multiplierInfo);

        // Big Bet Display
        this.betAmountText = new Text({
            text: `Bet Amount: ${CONFIG.BET_VALUES[this.currentBetIndex]}`,
            style: { fill: "#FFFFFF", fontSize: 36, fontWeight: "bold" }
        });
        this.betAmountText.anchor.set(0.5);
        this.betAmountText.position.set(0, -50);
        this.modalContainer.addChild(this.betAmountText);

        this.betSizeText = new Text({
            text: `Bet Size: ${CONFIG.BET_VALUES[this.currentBetIndex] / 30}`,
            style: { fill: "#888888", fontSize: 18 }
        });
        this.betSizeText.anchor.set(0.5);
        this.betSizeText.position.set(0, -20);
        this.modalContainer.addChild(this.betSizeText);

        // Slider
        this.createSlider();

        // Bottom Buttons
        this.createBottomButtons();

        this.stage.addChild(this.modalContainer);
        this.updateUI();

        // Immediate alignment
        this.handleResize(getAppWidth(), getAppHeight());

        // Animation
        this.modalContainer.alpha = 0;
        gsap.to(this.modalContainer, { alpha: 1, duration: 0.3 });
    }

    private createSlider() {
        const sliderGroup = new Container();
        sliderGroup.position.set(0, 50);

        // Minus Button
        const minusBtn = this.createHexButton("-", 0xDC1A1A, -320, 0, () => this.adjustBetIndex(-1));
        sliderGroup.addChild(minusBtn);

        // Plus Button
        const plusBtn = this.createHexButton("+", 0x1ADC6A, 320, 0, () => this.adjustBetIndex(1));
        sliderGroup.addChild(plusBtn);

        // Track
        this.sliderTrack = new Graphics()
            .roundRect(-280, -5, 560, 10, 5)
            .fill({ color: 0x333333 })
            .stroke({ color: 0x444444, width: 2 });
        sliderGroup.addChild(this.sliderTrack);

        // Progress
        this.sliderProgress = new Graphics();
        sliderGroup.addChild(this.sliderProgress);

        // Handle
        this.sliderHandle = new Container();
        const handleGfx = new Graphics()
            .circle(0, 0, 20)
            .fill({ color: 0xFFFFFF })
            .stroke({ color: 0xBA8A4C, width: 3 });
        this.sliderHandle.addChild(handleGfx);
        this.sliderHandle.interactive = true;
        this.sliderHandle.cursor = "pointer";
        
        let isDragging = false;
        this.sliderHandle.on("pointerdown", () => isDragging = true);
        this.stage.on("pointermove", (e) => {
            if (!isDragging || !this.modalContainer) return;
            const localPos = sliderGroup.toLocal(e.global);
            let x = Math.max(-280, Math.min(280, localPos.x));
            const progress = (x + 280) / 560;
            const newIndex = Math.round(progress * (CONFIG.BET_VALUES.length - 1));
            if (newIndex !== this.currentBetIndex) {
                this.currentBetIndex = newIndex;
                this.updateUI();
            }
        });
        this.stage.on("pointerup", () => isDragging = false);
        this.stage.on("pointerupoutside", () => isDragging = false);

        sliderGroup.addChild(this.sliderHandle);
        this.modalContainer!.addChild(sliderGroup);
    }

    private createHexButton(label: string, color: number, x: number, y: number, onClick: () => void): Container {
        const btn = new Container();
        const bg = new Graphics()
            .roundRect(-30, -25, 60, 50, 10)
            .fill({ color });
        const txt = new Text({ text: label, style: { fill: "#FFFFFF", fontSize: 40, fontWeight: "bold" } });
        txt.anchor.set(0.5);
        btn.addChild(bg, txt);
        btn.position.set(x, y);
        btn.interactive = true;
        btn.cursor = "pointer";
        btn.on("pointerdown", () => {
            gsap.fromTo(btn.scale, { x: 0.9, y: 0.9 }, { x: 1, y: 1, duration: 0.1 });
            onClick();
        });
        return btn;
    }

    private createBottomButtons() {
        // Min Bet
        const minBtn = this.createWideButton("Min Bet", 0x888888, -230, 165, () => {
            this.currentBetIndex = 0;
            this.updateUI();
        }, 160);
        this.modalContainer!.addChild(minBtn);

        // Max Bet
        const maxBtn = this.createWideButton("Max Bet", 0x1ADC6A, -50, 165, () => {
            this.currentBetIndex = CONFIG.BET_VALUES.length - 1;
            this.updateUI();
        }, 160);
        this.modalContainer!.addChild(maxBtn);

        // Confirm Bet
        const confirmBtn = this.createWideButton("Confirm Bet", 0xFFA500, 200, 165, () => {
            this.onConfirm(CONFIG.BET_VALUES[this.currentBetIndex]);
            this.hide();
        }, 260);
        this.modalContainer!.addChild(confirmBtn);
    }

    private createWideButton(label: string, color: number, x: number, y: number, onClick: () => void, width: number = 220): Container {
        const btn = new Container();
        const bg = new Graphics()
            .roundRect(-width/2, -30, width, 60, 10)
            .fill({ color, alpha: 0.9 })
            .stroke({ color: 0xFFFFFF, width: 2, alpha: 0.5 });
        const txt = new Text({ text: label, style: { fill: "#FFFFFF", fontSize: 20, fontWeight: "bold" } });
        txt.anchor.set(0.5);
        btn.addChild(bg, txt);
        btn.position.set(x, y);
        btn.interactive = true;
        btn.cursor = "pointer";
        btn.on("pointerdown", () => {
            gsap.fromTo(btn.scale, { x: 0.95, y: 0.95 }, { x: 1, y: 1, duration: 0.1 });
            onClick();
        });
        return btn;
    }

    private adjustBetIndex(delta: number) {
        this.currentBetIndex = Math.max(0, Math.min(CONFIG.BET_VALUES.length - 1, this.currentBetIndex + delta));
        this.updateUI();
    }

    private updateUI() {
        const amount = CONFIG.BET_VALUES[this.currentBetIndex];
        this.betAmountText.text = `Bet Amount: ${amount}`;
        this.betSizeText.text = `Bet Size: ${(amount / 30).toFixed(2)}`;
        
        // Update handle position
        const progress = this.currentBetIndex / (CONFIG.BET_VALUES.length - 1);
        const handleX = -280 + (progress * 560);
        this.sliderHandle.x = handleX;

        // Update progress line
        this.sliderProgress.clear()
            .roundRect(-280, -5, handleX + 280, 10, 5)
            .fill({ color: 0xBA8A4C });
    }

    public hide() {
        if (!this.modalContainer) return;
        gsap.to(this.modalContainer, {
            alpha: 0, duration: 0.2, onComplete: () => {
                this.stage.removeChild(this.modalContainer!);
                this.modalContainer = null;
            }
        });
    }

    public handleResize(width: number, height: number) {
        const isPortrait = height > width;
        if (this.modalContainer) {
            // Convert the true screen center into this.stage's local space
            const localCenter = this.stage.toLocal({ x: width / 2, y: height / 2 } as any);
            this.modalContainer.position.set(localCenter.x, localCenter.y);

            if (this.overlay) {
                // Keep the overlay generously large so it always covers the screen,
                // regardless of how the parent container is scaled or offset.
                this.overlay.clear()
                    .rect(-2000, -2000, 4000, 4000)
                    .fill({ color: 0x000000, alpha: 0.85 });
            }

            // Adjust scale for portrait
            const baseScale = isPortrait ? 0.65 : 1.0;
            this.modalContainer.scale.set(baseScale);
            
            // Further scale down if screen is too small
            const fitScale = Math.min(1, (width * 0.95) / (720 * baseScale));
            this.modalContainer.scale.set(baseScale * fitScale);
        }
    }
}
