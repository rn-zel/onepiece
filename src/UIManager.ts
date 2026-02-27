import { Container, Sprite, Text, TextStyle, Assets } from "pixi.js";
import { CONFIG } from "./Config";

export class UIManager {
    betbg: any;
    balancebg: any;
    totalWinbg: any;
    enableAllButtons() {
        throw new Error("Method not implemented.");
    }
    container = new Container();
    
    spinButton!: Sprite;
    autoSpinButton!: Sprite;
    menuButton!: Sprite;
    minusButton!: Sprite;
    plusButton!: Sprite;
    
    winText!: Text;
    balanceText!: Text;
    betAmountText!: Text;
    totalWinText!: Text;
    bonusSpinsText!: Text;

    private onSpin: () => void;
    private onAutoSpin: () => void;
    private onBetAdjust: (amount: number) => void;
    private onBetEditClick: () => void;
    balance: any;
    betAmount: any;
    maxBetButton: any;

    constructor(
        onSpin: () => void,
        onAutoSpin: () => void,
        onBetAdjust: (amount: number) => void,
        onBetEditClick: () => void
    ) {
        this.onSpin = onSpin;
        this.onAutoSpin = onAutoSpin;
        this.onBetAdjust = onBetAdjust;
        this.onBetEditClick = onBetEditClick;
        this.createUI();

        this.container.sortableChildren = true;

        if (this.minusButton) this.minusButton.zIndex = 5;
        if (this.plusButton) this.plusButton.zIndex = 5;
        if (this.menuButton) this.menuButton.zIndex = 5;

        if (this.spinButton) this.spinButton.zIndex = 20;
        if (this.autoSpinButton) this.autoSpinButton.zIndex = 20;
            }

    private createUI() {
        const glowStyle = new TextStyle({
            fill: 0xffffff, fontSize: 36, fontWeight: "bold",
            dropShadow: { color: 0x00d9ff, blur: 6, distance: 0, angle: 0 }, align: "center"
        });

        // Spin 
        this.spinButton = new Sprite(Assets.get("spinBTN.png"));
        this.spinButton.anchor.set(0.5);
        this.spinButton.scale.set(CONFIG.SPIN_BTN_SIZE); 
        this.spinButton.x = CONFIG.BTN_SPIN_X;
        this.spinButton.y = CONFIG.BTN_SPIN_Y;
        this.spinButton.interactive = true;
        this.spinButton.cursor = "pointer";
        this.spinButton.on("pointerdown", this.onSpin);
        this.container.addChild(this.spinButton);

        // Auto Spin
        this.autoSpinButton = new Sprite(Assets.get("autoSpin.png"));
        this.autoSpinButton.anchor.set(0.5);
        this.autoSpinButton.scale.set(CONFIG.BTN_AUTO_SCALE);
        this.autoSpinButton.x = CONFIG.BTN_AUTO_X;
        this.autoSpinButton.y = CONFIG.BTN_AUTO_Y;
        this.autoSpinButton.interactive = true;
        this.autoSpinButton.cursor = "pointer";
        this.autoSpinButton.on("pointerdown", this.onAutoSpin);
        this.container.addChild(this.autoSpinButton);

        // Menu Button
        this.menuButton = new Sprite(Assets.get("menu.png"));
        this.menuButton.anchor.set(0.5);
        this.menuButton.scale.set(CONFIG.BTN_MENU_SCALE);
        this.menuButton.x = CONFIG.BTN_MENU_X;
        this.menuButton.y = CONFIG.BTN_MENU_Y;
        this.container.addChild(this.menuButton);

        // BALANCE 
        const balanceBg = new Sprite(Assets.get("balance.png")); 
        balanceBg.anchor.set(0, 0.5); 
        balanceBg.scale.set(CONFIG.BALANCE_BG_SCALE);
        balanceBg.x = CONFIG.BALANCE_BG_X; 
        balanceBg.y = CONFIG.BALANCE_BG_Y;
        this.container.addChild(balanceBg);

        this.balanceText = new Text({ text: `₱${this.balance}`, style: glowStyle });
        this.balanceText.anchor.set(0, 0.5);
        this.balanceText.x = CONFIG.TEXT_BAL_X; 
        this.balanceText.y = CONFIG.TEXT_BAL_Y;
        this.balanceText.resolution = 3;
        this.container.addChild(this.balanceText);

        // BET
        const betBg = new Sprite(Assets.get("bet.png")); 
        betBg.anchor.set(0, 0.5);
        betBg.scale.set(CONFIG.BET_BG_SCALE);
        betBg.x = CONFIG.BET_BG_X; 
        betBg.y = CONFIG.BET_BG_Y;
        this.container.addChild(betBg);

        this.betAmountText = new Text({ text: `₱${this.betAmount}`, style: glowStyle });
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
        const winBg = new Sprite(Assets.get("totalwin.png"));
        winBg.anchor.set(0, 0.5);
        winBg.scale.set(CONFIG.TOTALWIN_BG_SCALE);
        winBg.x = CONFIG.TOTALWIN_BG_X;
        winBg.y = CONFIG.TOTALWIN_BG_Y;
        this.container.addChild(winBg);

        this.totalWinText = new Text({ text: "₱0", style: glowStyle });
        this.totalWinText.anchor.set(0, 0.5);
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
    }

    // bet sizing
    updateBetTextDisplay(textToShow: string, isEditing: boolean = false) {
        this.betAmountText.text = textToShow;
        this.betAmountText.style.fill = isEditing ? 0x00ff00 : 0xffffff;
        const cleanNumber = textToShow.replace(/[^0-9]/g, '');
        const len = cleanNumber.length;
        let newSize = 36;
        if (len >= 9) newSize = 27;
        else if (len >= 7) newSize = 30; 
        this.betAmountText.style.fontSize = newSize;
    }

    //  updateBalance, Total Win, Free Spins 
    updateTextValues(balance: number, totalWin: number, bonusSpins: number) {
        this.balanceText.text = `₱${balance}`;
        this.totalWinText.text = `₱${totalWin}`;
        if (bonusSpins > 0) this.bonusSpinsText.text = `FREE SPINS: ${bonusSpins}`;
        else this.bonusSpinsText.text = "";
    }

    //tint
    public toggleButtonTheme(isFreeSpins: boolean) {
      
        const tintColor = isFreeSpins ? 0xFFBDD5 : 0xFFFFFF;

        
        if (this.spinButton) this.spinButton.tint = tintColor;
        if (this.autoSpinButton) this.autoSpinButton.tint = tintColor;
        if (this.maxBetButton) this.maxBetButton.tint = tintColor;
        if (this.minusButton) this.minusButton.tint = tintColor;
        if (this.plusButton) this.plusButton.tint = tintColor;
        if (this.menuButton) this.menuButton.tint = tintColor;
        if (this.betbg) this.betbg.tint = tintColor;
        if (this.balancebg) this.balancebg.tint = tintColor;
        if (this.totalWinbg) this.totalWinbg.tint = tintColor;

    }
}