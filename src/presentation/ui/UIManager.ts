import { Container, Sprite, Text, TextStyle, Assets } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";
import { BuyFreeSpinsModal } from "./BuyFreeSpinsModal";

export class UIManager {
    container = new Container();
    
    spinButton!: Sprite;
    autoSpinButton!: Sprite;
    buyFreeSpinButton!: Sprite;
    menuButton!: Sprite;
    minusButton!: Sprite;
    plusButton!: Sprite;
    
    winText!: Text;
    balanceText!: Text;
    betAmountText!: Text;
    totalWinText!: Text;
    bonusSpinsText!: Text;

    private buyFreeSpinsModal!: BuyFreeSpinsModal;

    private onSpin: () => void;
    private onAutoSpin: () => void;
    private onBuyFreeSpins: () => void;
    private onBetAdjust: (amount: number) => void;
    private onBetEditClick: () => void;

    constructor(
        onSpin: () => void,
        onAutoSpin: () => void,
        onBuyFreeSpins: () => void,
        onBetAdjust: (amount: number) => void,
        onBetEditClick: () => void
    ) {
        this.onSpin = onSpin;
        this.onAutoSpin = onAutoSpin;
        this.onBuyFreeSpins = onBuyFreeSpins;
        this.onBetAdjust = onBetAdjust;
        this.onBetEditClick = onBetEditClick;
        this.createUI();

        this.container.sortableChildren = true;

        if (this.minusButton) this.minusButton.zIndex = 5;
        if (this.plusButton) this.plusButton.zIndex = 5;
        if (this.menuButton) this.menuButton.zIndex = 5;

        if (this.spinButton) this.spinButton.zIndex = 20;
        if (this.autoSpinButton) this.autoSpinButton.zIndex = 20;
        if (this.buyFreeSpinButton) this.buyFreeSpinButton.zIndex = 20;

        this.buyFreeSpinsModal = new BuyFreeSpinsModal(this.container);
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
        const balanceTitle = new Text({ text: "Balance", style: titleStyle });
        balanceTitle.anchor.set(0, 0.5);
        balanceTitle.x = CONFIG.TITLE_BALANCE_X;
        balanceTitle.y = CONFIG.TITLE_BALANCE_Y;
        balanceTitle.resolution = 3;
        balanceTitle.zIndex = 6;
        this.container.addChild(balanceTitle);

        const balanceBg = new Sprite(Assets.get("balance.png")); 
        balanceBg.anchor.set(0, 0.5); 
        balanceBg.scale.set(CONFIG.BALANCE_BG_SCALE);
        balanceBg.x = CONFIG.BALANCE_BG_X; 
        balanceBg.y = CONFIG.BALANCE_BG_Y;
        this.container.addChild(balanceBg);

        this.balanceText = new Text({ text: "₱0", style: glowStyle });
        this.balanceText.anchor.set(0, 0.5);
        this.balanceText.x = CONFIG.TEXT_BAL_X; 
        this.balanceText.y = CONFIG.TEXT_BAL_Y;
        this.balanceText.resolution = 3;
        this.container.addChild(this.balanceText);

        // BET
        const betTitle = new Text({ text: "Bet", style: titleStyle });
        betTitle.anchor.set(0, 0.5);
        betTitle.x = CONFIG.TITLE_BET_X;
        betTitle.y = CONFIG.TITLE_BET_Y;
        betTitle.resolution = 3;
        betTitle.zIndex = 6;
        this.container.addChild(betTitle);

        const betBg = new Sprite(Assets.get("bet.png")); 
        betBg.anchor.set(0, 0.5);
        betBg.scale.set(CONFIG.BET_BG_SCALE);
        betBg.x = CONFIG.BET_BG_X; 
        betBg.y = CONFIG.BET_BG_Y;
        this.container.addChild(betBg);

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
        const totalWinTitle = new Text({ text: "Total Win", style: titleStyle });
        totalWinTitle.anchor.set(0, 0);
        totalWinTitle.x = CONFIG.TITLE_TOTALWIN_X;
        totalWinTitle.y = CONFIG.TITLE_TOTALWIN_Y;
        totalWinTitle.resolution = 3;
        totalWinTitle.zIndex = 6;
        this.container.addChild(totalWinTitle);

        const winBg = new Sprite(Assets.get("totalwin.png"));
        winBg.anchor.set(0, 0.5);
        winBg.scale.set(CONFIG.TOTALWIN_BG_SCALE);
        winBg.x = CONFIG.TOTALWIN_BG_X;
        winBg.y = CONFIG.TOTALWIN_BG_Y;
        this.container.addChild(winBg);

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
}