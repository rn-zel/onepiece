import { Container, Sprite, Text, TextStyle, Assets, Graphics } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";
import { BuyFreeSpinsModal } from "./BuyFreeSpinsModal";
import { HelpModal } from "./HelpModal";
import { StatsModal } from "./StatsModal";
import { AutoSpinModal, type AutoSpinConfig } from "./AutoSpinModal";

export class UIManager {
    container = new Container();
    
    spinButton!: Sprite;
    autoSpinButton!: Sprite;
    buyFreeSpinButton!: Sprite;
    menuButton!: Sprite;
    minusButton!: Sprite;
    plusButton!: Sprite;
    statsButton!: Container;
    
    winText!: Text;
    balanceText!: Text;
    betAmountText!: Text;
    totalWinText!: Text;
    bonusSpinsText!: Text;

    // Responsive Elements
    private balanceTitle!: Text;
    private balanceBg!: Sprite;
    private betTitle!: Text;
    private betBg!: Sprite;
    private totalWinTitle!: Text;
    private winBg!: Sprite;
    private turboButton!: Container;
    private isTurboActive: boolean = false;
    private betPresetButtons: Container[] = [];
    private statsModal!: StatsModal;
    private autoSpinModal!: AutoSpinModal;

    private buyFreeSpinsModal!: BuyFreeSpinsModal;
    private helpModal!: HelpModal;

    private onSpin: () => void;
    private onBuyFreeSpins: () => void;
    private onBetAdjust: (amount: number) => void;
    private onBetEditClick: () => void;
    private onAutoSpinStart: (config: AutoSpinConfig) => void;

    constructor(
        onSpin: () => void,
        onBuyFreeSpins: () => void,
        onBetAdjust: (amount: number) => void,
        onBetEditClick: () => void,
        onAutoSpinStart: (config: AutoSpinConfig) => void
    ) {
        this.onSpin = onSpin;
        this.onBuyFreeSpins = onBuyFreeSpins;
        this.onBetAdjust = onBetAdjust;
        this.onBetEditClick = onBetEditClick;
        this.onAutoSpinStart = onAutoSpinStart;
        this.createUI();

        this.container.sortableChildren = true;

        if (this.minusButton) this.minusButton.zIndex = 5;
        if (this.plusButton) this.plusButton.zIndex = 5;
        if (this.menuButton) this.menuButton.zIndex = 5;

        if (this.spinButton) this.spinButton.zIndex = 20;
        if (this.autoSpinButton) this.autoSpinButton.zIndex = 20;
        if (this.buyFreeSpinButton) this.buyFreeSpinButton.zIndex = 20;

        this.buyFreeSpinsModal = new BuyFreeSpinsModal(this.container);
        this.helpModal = new HelpModal(this.container);
        this.statsModal = new StatsModal(this.container);
        this.autoSpinModal = new AutoSpinModal(this.container, (cfg) => this.onAutoSpinStart(cfg));
    }

    private createUI() {
        const glowStyle = new TextStyle({
            fill: 0xffffff, fontSize: 36, fontWeight: "bold",
            dropShadow: { color: 0x00d9ff, blur: 6, distance: 0, angle: 0 }, align: "center"
        });
        const titleStyle = new TextStyle({
            fill: CONFIG.TITLE_LABEL_FILL, fontSize: 22, fontWeight: "bold",
            dropShadow: { color: CONFIG.TITLE_LABEL_GLOW, blur: 4, distance: 0, angle: 0 }, align: "center"
        });

        this.buyFreeSpinButton = new Sprite(Assets.get("freespin.png"));
        this.buyFreeSpinButton.anchor.set(0.5);
        this.buyFreeSpinButton.scale.set(CONFIG.BTN_BUY_FREE_SCALE);
        this.buyFreeSpinButton.x = CONFIG.BTN_RIGHT_COLUMN_X;
        this.buyFreeSpinButton.y = CONFIG.BTN_BUY_FREE_Y;
        this.buyFreeSpinButton.interactive = true;
        this.buyFreeSpinButton.eventMode = "static";
        this.buyFreeSpinButton.cursor = "pointer";
        this.buyFreeSpinButton.on("pointerdown", this.onBuyFreeSpins);
        this.container.addChild(this.buyFreeSpinButton);

        this.spinButton = new Sprite(Assets.get("spinBTN.png"));
        this.spinButton.anchor.set(0.5);
        this.spinButton.scale.set(CONFIG.SPIN_BTN_SIZE);
        this.spinButton.x = CONFIG.BTN_SPIN_X;
        this.spinButton.y = CONFIG.BTN_SPIN_Y;
        this.spinButton.interactive = true;
        this.spinButton.eventMode = "static";
        this.spinButton.cursor = "pointer";
        this.spinButton.on("pointerdown", this.onSpin);
        this.container.addChild(this.spinButton);

        this.autoSpinButton = new Sprite(Assets.get("autoSpin.png"));
        this.autoSpinButton.anchor.set(0.5);
        this.autoSpinButton.scale.set(CONFIG.BTN_AUTO_SCALE);
        this.autoSpinButton.x = CONFIG.BTN_AUTO_X;
        this.autoSpinButton.y = CONFIG.BTN_AUTO_Y;
        this.autoSpinButton.interactive = true;
        this.autoSpinButton.cursor = "pointer";
        this.autoSpinButton.on("pointerdown", () => this.autoSpinModal.show());
        this.container.addChild(this.autoSpinButton);

        // Menu Button
        this.menuButton = new Sprite(Assets.get("menu.png"));
        this.menuButton.anchor.set(0.5);
        this.menuButton.scale.set(CONFIG.BTN_MENU_SCALE);
        this.menuButton.x = CONFIG.BTN_MENU_X;
        this.menuButton.y = CONFIG.BTN_MENU_Y;
        this.menuButton.eventMode = "static";
        this.menuButton.cursor = "pointer";
        this.menuButton.on("pointerdown", () => {
            // If there's an active sound manager passed in, we can play a sound. But UIManager doesn't have it natively.
            this.helpModal.show();
        });
        this.container.addChild(this.menuButton);

        this.statsButton = new Container();
        const statBg = new Graphics().roundRect(0,0,80,40,8).fill({color: 0x333333, alpha: 0.8});
        const statTxt = new Text({text: "STATS", style: {fill: "#ffffff", fontSize: 18}});
        statTxt.anchor.set(0.5);
        statTxt.position.set(40,20);
        this.statsButton.addChild(statBg, statTxt);
        this.statsButton.eventMode = 'static';
        this.statsButton.cursor = 'pointer';
        this.statsButton.on('pointerdown', () => this.statsModal.show());
        this.container.addChild(this.statsButton);

        // BALANCE 
        this.balanceTitle = new Text({ text: "Balance", style: titleStyle });
        this.balanceTitle.anchor.set(0, 0.5);
        this.balanceTitle.x = CONFIG.TITLE_BALANCE_X;
        this.balanceTitle.y = CONFIG.TITLE_BALANCE_Y;
        this.balanceTitle.resolution = 3;
        this.balanceTitle.zIndex = 6;
        this.container.addChild(this.balanceTitle);

        this.balanceBg = new Sprite(Assets.get("balance.png")); 
        this.balanceBg.anchor.set(0, 0.5); 
        this.balanceBg.scale.set(CONFIG.BALANCE_BG_SCALE);
        this.balanceBg.x = CONFIG.BALANCE_BG_X; 
        this.balanceBg.y = CONFIG.BALANCE_BG_Y;
        this.container.addChild(this.balanceBg);

        this.balanceText = new Text({ text: "₱0", style: glowStyle });
        this.balanceText.anchor.set(0, 0.5);
        this.balanceText.x = CONFIG.TEXT_BAL_X; 
        this.balanceText.y = CONFIG.TEXT_BAL_Y;
        this.balanceText.resolution = 3;
        this.container.addChild(this.balanceText);

        // BET
        this.betTitle = new Text({ text: "Bet", style: titleStyle });
        this.betTitle.anchor.set(0, 0.5);
        this.betTitle.x = CONFIG.TITLE_BET_X;
        this.betTitle.y = CONFIG.TITLE_BET_Y;
        this.betTitle.resolution = 3;
        this.betTitle.zIndex = 6;
        this.container.addChild(this.betTitle);

        this.betBg = new Sprite(Assets.get("bet.png")); 
        this.betBg.anchor.set(0, 0.5);
        this.betBg.scale.set(CONFIG.BET_BG_SCALE);
        this.betBg.x = CONFIG.BET_BG_X; 
        this.betBg.y = CONFIG.BET_BG_Y;
        this.container.addChild(this.betBg);

        this.betAmountText = new Text({ text: "₱0", style: glowStyle });
        this.betAmountText.anchor.set(0, 0.5);
        this.betAmountText.x = CONFIG.TEXT_BET_X;
        this.betAmountText.y = CONFIG.TEXT_BET_Y;
        this.betAmountText.resolution = 3;
        this.betAmountText.interactive = true; 
        this.betAmountText.cursor = "text";
        this.betAmountText.eventMode = "static";
        this.betAmountText.on("pointerdown", this.onBetEditClick);
        this.container.addChild(this.betAmountText);

        // TOTAL WIN 
        this.totalWinTitle = new Text({ text: "Total Win", style: titleStyle });
        this.totalWinTitle.anchor.set(0, 0);
        this.totalWinTitle.x = CONFIG.TITLE_TOTALWIN_X;
        this.totalWinTitle.y = CONFIG.TITLE_TOTALWIN_Y;
        this.totalWinTitle.resolution = 3;
        this.totalWinTitle.zIndex = 6;
        this.container.addChild(this.totalWinTitle);

        this.winBg = new Sprite(Assets.get("totalwin.png"));
        this.winBg.anchor.set(0, 0.5);
        this.winBg.scale.set(CONFIG.TOTALWIN_BG_SCALE);
        this.winBg.x = CONFIG.TOTALWIN_BG_X;
        this.winBg.y = CONFIG.TOTALWIN_BG_Y;
        this.container.addChild(this.winBg);

        this.totalWinText = new Text({ text: "₱0", style: glowStyle });
        this.totalWinText.anchor.set(0.5, 0.5);
        this.totalWinText.x = CONFIG.TEXT_TOTALWIN_X;
        this.totalWinText.resolution = 3;
        this.totalWinText.y = CONFIG.TEXT_TOTALWIN_Y;
        this.container.addChild(this.totalWinText);

        // MINUS BUTTON 
        this.minusButton = new Sprite(Assets.get("minus.png"));
        this.minusButton.anchor.set(0.5);
        this.minusButton.scale.set(CONFIG.BTN_MINUS_SCALE);
        this.minusButton.x = CONFIG.BTN_MINUS_X;
        this.minusButton.y = CONFIG.BTN_MINUS_Y;
        this.minusButton.interactive = true;
        this.minusButton.eventMode = "static";
        this.minusButton.cursor = "pointer";
        this.minusButton.on("pointerdown", () => this.onBetAdjust(-10));
        this.container.addChild(this.minusButton);

        // PLUS BUTTON 
        this.plusButton = new Sprite(Assets.get("plus.png"));
        this.plusButton.anchor.set(0.5);
        this.plusButton.scale.set(CONFIG.BTN_PLUS_SCALE);
        this.plusButton.x = CONFIG.BTN_PLUS_X;
        this.plusButton.y = CONFIG.BTN_PLUS_Y;
        this.plusButton.interactive = true;
        this.plusButton.eventMode = "static";
        this.plusButton.cursor = "pointer";
        this.plusButton.on("pointerdown", () => this.onBetAdjust(10));
        this.container.addChild(this.plusButton);

        // WIN TEX
        this.winText = new Text({
            text: "", 
            style: { fill: 0xffd700, fontSize: 100, fontWeight: "bold", dropShadow: { color: 0x000000, blur: 15, distance: 0 }, align: "center" }
        });
        this.winText.anchor.set(0.5);
        this.winText.resolution = 2;
        this.container.addChild(this.winText);
        
        // BONUS SPINS 
        this.bonusSpinsText = new Text({ text: "", style: new TextStyle({ fill: 0xff6b00, fontSize: 40, fontWeight: "bold", stroke: { color: 0x000000, width: 4 } }) });
        this.bonusSpinsText.anchor.set(0.5);
        this.bonusSpinsText.y = -450; 
        this.bonusSpinsText.resolution = 2;
        this.container.addChild(this.bonusSpinsText);

        this.createBetPresets();
        this.createTurboToggle();
    }

    private createBetPresets() {
        const style = new TextStyle({ fill: "#ffffff", fontSize: 24, fontWeight: "bold" });
        CONFIG.BET_PRESETS.forEach((amount) => {
            const btn = new Container();
            const bg = new Graphics().roundRect(0, 0, 80, 40, 8).fill({ color: 0x333333, alpha: 0.8 });
            const txt = new Text({ text: `₱${amount}`, style });
            txt.anchor.set(0.5);
            txt.position.set(40, 20);
            btn.addChild(bg, txt);
            btn.eventMode = 'static';
            btn.cursor = 'pointer';
            btn.on('pointerdown', () => {
                this.container.emit('betPreset', amount);
                gsap.fromTo(btn.scale, { x: 0.9, y: 0.9 }, { x: 1, y: 1, duration: 0.2 });
            });
            this.container.addChild(btn);
            this.betPresetButtons.push(btn);
        });
    }

    private createTurboToggle() {
        this.turboButton = new Container();
        const bg = new Graphics().roundRect(0, 0, 100, 40, 8).fill({ color: 0x333333, alpha: 0.8 });
        const txt = new Text({ text: "TURBO", style: { fill: "#555555", fontSize: 20, fontWeight: "bold" } });
        txt.anchor.set(0.5);
        txt.position.set(50, 20);
        this.turboButton.addChild(bg, txt);
        this.turboButton.eventMode = 'static';
        this.turboButton.cursor = 'pointer';
        this.turboButton.on('pointerdown', () => {
            this.isTurboActive = !this.isTurboActive;
            (txt.style as TextStyle).fill = this.isTurboActive ? "#ffcc00" : "#555555";
            this.container.emit('turboToggle', this.isTurboActive);
        });
        this.container.addChild(this.turboButton);
    }

    public showBuyFreeSpinsModal(cost: number, onConfirm: () => void, onCancel?: () => void) {
        this.buyFreeSpinsModal.show(cost, onConfirm, onCancel);
    }

    // bet sizing
    updateBetTextDisplay(textToShow: string, isEditing: boolean = false) {
        this.betAmountText.text = `${textToShow.toLocaleString()}`;
        this.betAmountText.style.fill = isEditing ? 0x00ff00 : 0xffffff;
        const cleanNumber = textToShow.toLocaleString().replace(/[^0-9]/g, '');
        const len = cleanNumber.length;
        let newSize = 36;
        if (len >= 9) newSize = 27;
        else if (len >= 7) newSize = 30; 
        this.betAmountText.style.fontSize = newSize;
    }

    public showStats() {
        this.statsModal.show();
    }

    public handleResize(width: number, height: number, isPortrait: boolean) {
        this.statsModal.handleResize(width, height);
        this.autoSpinModal.handleResize(width, height);
        this.buyFreeSpinsModal.handleResize(width, height);
        this.updateResponsiveLayout(isPortrait);
    }

    //  updateBalance, Total Win, Free Spins 
    updateTextValues(balance: number, totalWin: number, bonusSpins: number) {
        this.balanceText.text = `₱${balance.toLocaleString()}`;
        this.totalWinText.text = `₱${totalWin.toLocaleString()}`;
        if (bonusSpins > 0) this.bonusSpinsText.text = `FREE SPINS: ${bonusSpins.toLocaleString()}`;
        else this.bonusSpinsText.text = "";
    }

    //tint
    public toggleButtonTheme(isFreeSpins: boolean) {
      
        const tintColor = isFreeSpins ? CONFIG.UI_COLORS.FREE_SPINS_TINT : CONFIG.UI_COLORS.DEFAULT_TINT;

        if (this.spinButton) this.spinButton.tint = tintColor;
        if (this.autoSpinButton) this.autoSpinButton.tint = tintColor;
        if (this.buyFreeSpinButton) this.buyFreeSpinButton.tint = tintColor;
        if (this.minusButton) this.minusButton.tint = tintColor;
        if (this.plusButton) this.plusButton.tint = tintColor;
        if (this.menuButton) this.menuButton.tint = tintColor;

        if (isFreeSpins) {
            this.autoSpinButton.visible = false;
            this.buyFreeSpinButton.visible = false;
            this.betAmountText.eventMode = 'none';  
        } else {
            this.autoSpinButton.visible = true;
            this.buyFreeSpinButton.visible = true;
            this.betAmountText.eventMode = 'static'; 
        }

    }

    public updateResponsiveLayout(isPortrait: boolean) {
        if (isPortrait) {
            // PORTRAIT (Phone) Layout
            // Cluster controls at bottom
            this.spinButton.x = 0;
            this.spinButton.y = 800;
            this.spinButton.scale.set(CONFIG.SPIN_BTN_SIZE * 1.2);

            this.autoSpinButton.x = 280;
            this.autoSpinButton.y = 800;
            this.autoSpinButton.scale.set(CONFIG.BTN_AUTO_SCALE * 1.1);

            this.buyFreeSpinButton.x = -280;
            this.buyFreeSpinButton.y = 800;
            this.buyFreeSpinButton.scale.set(CONFIG.BTN_BUY_FREE_SCALE * 1.1);

            this.menuButton.x = -450;
            this.menuButton.y = 950;

            // Balance & Bet (Move to Top)
            this.balanceTitle.x = -500;
            this.balanceTitle.y = -950;
            this.balanceBg.x = -500;
            this.balanceBg.y = -890;
            this.balanceText.x = -450;
            this.balanceText.y = -890;

            this.betTitle.x = 100;
            this.betTitle.y = -950;
            this.betBg.x = 100;
            this.betBg.y = -890;
            this.betAmountText.x = 200;
            this.betAmountText.y = -890;

            this.minusButton.x = 140;
            this.minusButton.y = -890;
            this.plusButton.x = 440;
            this.plusButton.y = -890;

            // Total Win center
            this.totalWinTitle.x = -200;
            this.totalWinTitle.y = 480;
            this.winBg.x = -400;
            this.winBg.y = 580;
            this.winBg.scale.set(CONFIG.TOTALWIN_BG_SCALE * 1.2);
            this.totalWinText.x = 0;
            this.totalWinText.y = 580;

            this.winText.y = 100;

            this.turboButton.x = 420;
            this.turboButton.y = 700;

            this.betPresetButtons.forEach((btn, i) => {
                btn.x = -450 + (i * 90);
                btn.y = 700;
            });

        } else {
            // LANDSCAPE Layout (Default)
            this.spinButton.x = CONFIG.BTN_SPIN_X;
            this.spinButton.y = CONFIG.BTN_SPIN_Y;
            this.spinButton.scale.set(CONFIG.SPIN_BTN_SIZE);

            this.autoSpinButton.x = CONFIG.BTN_AUTO_X;
            this.autoSpinButton.y = CONFIG.BTN_AUTO_Y;
            this.autoSpinButton.scale.set(CONFIG.BTN_AUTO_SCALE);

            this.buyFreeSpinButton.x = CONFIG.BTN_RIGHT_COLUMN_X;
            this.buyFreeSpinButton.y = CONFIG.BTN_BUY_FREE_Y;
            this.buyFreeSpinButton.scale.set(CONFIG.BTN_BUY_FREE_SCALE);

            this.menuButton.x = CONFIG.BTN_MENU_X;
            this.menuButton.y = CONFIG.BTN_MENU_Y;

            this.balanceTitle.x = CONFIG.TITLE_BALANCE_X;
            this.balanceTitle.y = CONFIG.TITLE_BALANCE_Y;
            this.balanceBg.x = CONFIG.BALANCE_BG_X;
            this.balanceBg.y = CONFIG.BALANCE_BG_Y;
            this.balanceText.x = CONFIG.TEXT_BAL_X;
            this.balanceText.y = CONFIG.TEXT_BAL_Y;

            this.betTitle.x = CONFIG.TITLE_BET_X;
            this.betTitle.y = CONFIG.TITLE_BET_Y;
            this.betBg.x = CONFIG.BET_BG_X;
            this.betBg.y = CONFIG.BET_BG_Y;
            this.betAmountText.x = CONFIG.TEXT_BET_X;
            this.betAmountText.y = CONFIG.TEXT_BET_Y;

            this.minusButton.x = CONFIG.BTN_MINUS_X;
            this.minusButton.y = CONFIG.BTN_MINUS_Y;
            this.plusButton.x = CONFIG.BTN_PLUS_X;
            this.plusButton.y = CONFIG.BTN_PLUS_Y;

            this.totalWinTitle.x = CONFIG.TITLE_TOTALWIN_X;
            this.totalWinTitle.y = CONFIG.TITLE_TOTALWIN_Y;
            this.winBg.x = CONFIG.TOTALWIN_BG_X;
            this.winBg.y = CONFIG.TOTALWIN_BG_Y;
            this.winBg.scale.set(CONFIG.TOTALWIN_BG_SCALE);
            this.totalWinText.x = CONFIG.TEXT_TOTALWIN_X;
            this.totalWinText.y = CONFIG.TEXT_TOTALWIN_Y;

            this.winText.y = 0;

            this.turboButton.x = 980;
            this.turboButton.y = 480;

            this.betPresetButtons.forEach((btn, i) => {
                btn.x = 980;
                btn.y = 550 + (i * 50);
            });
        }
    }
}