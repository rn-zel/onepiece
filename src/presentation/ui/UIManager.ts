import { Container, Sprite, Text, TextStyle, Assets, Graphics } from "pixi.js";
import {
  CONFIG,
  DEVICE_TYPES,
  type DeviceType,
} from "../../domain/constants/Config";
import { HelpModal } from "./HelpModal";
import { StatsModal } from "./StatsModal";
import { AutoSpinModal, type AutoSpinConfig } from "./AutoSpinModal";
import { WinPresenter } from "./WinPresenter";

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
  private statsModal!: StatsModal;
  private autoSpinModal!: AutoSpinModal;

  private helpModal!: HelpModal;
  public winPresenter!: WinPresenter;

  private onSpin: () => void;
  private onBuyFreeSpins: () => void;
  private onBetAdjust: (delta: -1 | 1) => void;
  private onAutoSpinStart: (config: AutoSpinConfig) => void;

  constructor(
    onSpin: () => void,
    onBuyFreeSpins: () => void,
    onBetAdjust: (delta: -1 | 1) => void,
    onAutoSpinStart: (config: AutoSpinConfig) => void,
    modalLayer: Container,
  ) {
    this.onSpin = onSpin;
    this.onBuyFreeSpins = onBuyFreeSpins;
    this.onBetAdjust = onBetAdjust;
    this.onAutoSpinStart = onAutoSpinStart;
    this.createUI();

    this.container.sortableChildren = true;

    if (this.minusButton) this.minusButton.zIndex = 5;
    if (this.plusButton) this.plusButton.zIndex = 5;
    if (this.menuButton) this.menuButton.zIndex = 5;

    if (this.spinButton) this.spinButton.zIndex = 20;
    if (this.autoSpinButton) this.autoSpinButton.zIndex = 20;
    if (this.buyFreeSpinButton) this.buyFreeSpinButton.zIndex = 20;

    this.helpModal = new HelpModal(modalLayer);
    this.statsModal = new StatsModal(modalLayer);
    this.autoSpinModal = new AutoSpinModal(modalLayer, (cfg) =>
      this.onAutoSpinStart(cfg),
    );

    this.winPresenter = new WinPresenter(this);
    this.winPresenter.init();
  }

  // Removed internal bet calculation logic as it's now handled by the Domain layer (GameState).

  private createUI() {
    const glowStyle = new TextStyle({
      fill: CONFIG.HUD_VALUE_FILL,
      fontSize: CONFIG.UI_HUD_CREDIT_SIZE, // Start with credit size
      fontWeight: "bold",
      dropShadow: {
        color: CONFIG.HUD_VALUE_GLOW_COLOR,
        blur: CONFIG.HUD_VALUE_GLOW_BLUR,
        distance: 0,
        angle: 0,
        alpha: 1,
      },
      align: "center",
    });
    const titleStyle = new TextStyle({
      fill: CONFIG.TITLE_LABEL_FILL,
      fontSize: CONFIG.UI_HUD_TITLE_SIZE,
      fontWeight: "bold",
      dropShadow: {
        color: CONFIG.TITLE_LABEL_GLOW,
        blur: 4,
        distance: 0,
        angle: 0,
        alpha: 1,
      },
      align: "center",
    });

    this.buyFreeSpinButton = new Sprite(Assets.get("freespin.png"));
    this.buyFreeSpinButton.anchor.set(0.5);
    this.buyFreeSpinButton.scale.set(CONFIG.BUY_FREE_LANDSCAPE_SCALE);
    this.buyFreeSpinButton.x = CONFIG.BUY_FREE_LANDSCAPE_X;
    this.buyFreeSpinButton.y = CONFIG.BUY_FREE_LANDSCAPE_Y;
    this.buyFreeSpinButton.interactive = true;
    this.buyFreeSpinButton.eventMode = "static";
    this.buyFreeSpinButton.cursor = "pointer";
    this.buyFreeSpinButton.on("pointerdown", this.onBuyFreeSpins);
    this.container.addChild(this.buyFreeSpinButton);

    this.spinButton = new Sprite(Assets.get("spinBTN.png"));
    this.spinButton.anchor.set(0.5);
    this.spinButton.scale.set(CONFIG.SPIN_BTN_LANDSCAPE_SCALE);
    this.spinButton.x = CONFIG.SPIN_BTN_LANDSCAPE_X;
    this.spinButton.y = CONFIG.SPIN_BTN_LANDSCAPE_Y;
    this.spinButton.interactive = true;
    this.spinButton.eventMode = "static";
    this.spinButton.cursor = "pointer";
    this.spinButton.on("pointerdown", this.onSpin);
    this.container.addChild(this.spinButton);

    this.autoSpinButton = new Sprite(Assets.get("autoSpin.png"));
    this.autoSpinButton.anchor.set(0.5);
    this.autoSpinButton.scale.set(CONFIG.AUTO_BTN_LANDSCAPE_SCALE);
    this.autoSpinButton.x = CONFIG.AUTO_BTN_LANDSCAPE_X;
    this.autoSpinButton.y = CONFIG.AUTO_BTN_LANDSCAPE_Y;
    this.autoSpinButton.interactive = true;
    this.autoSpinButton.cursor = "pointer";
    this.autoSpinButton.on("pointerdown", () => this.autoSpinModal.show());
    this.container.addChild(this.autoSpinButton);

    // Menu Button
    this.menuButton = new Sprite(Assets.get("menu.png"));
    this.menuButton.anchor.set(0.5);
    this.menuButton.scale.set(CONFIG.MENU_BTN_LANDSCAPE_SCALE);
    this.menuButton.x = CONFIG.MENU_BTN_LANDSCAPE_X;
    this.menuButton.y = CONFIG.MENU_BTN_LANDSCAPE_Y;
    this.menuButton.eventMode = "static";
    this.menuButton.cursor = "pointer";
    this.menuButton.on("pointerdown", () => {
      window.dispatchEvent(new CustomEvent("slot-open-menu"));
    });
    this.container.addChild(this.menuButton);

    this.statsButton = new Container();
    const statBg = new Graphics()
      .roundRect(
        0,
        0,
        CONFIG.STATS_BTN_WIDTH,
        CONFIG.STATS_BTN_HEIGHT,
        CONFIG.STATS_BTN_RADIUS,
      )
      .fill({ color: 0x1a1a1a, alpha: 0.85 })
      .stroke({ color: 0xba8a4c, width: 2, alpha: 0.8 });

    const statTxt = new Text({
      text: "STATS",
      style: {
        fill: "#BA8A4C",
        fontSize: CONFIG.STATS_BTN_FONT_SIZE,
        fontWeight: "900",
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      },
    });
    statTxt.anchor.set(0.5);
    statTxt.position.set(
      CONFIG.STATS_BTN_WIDTH / 2,
      CONFIG.STATS_BTN_HEIGHT / 2,
    );
    this.statsButton.addChild(statBg, statTxt);
    this.statsButton.eventMode = "static";
    this.statsButton.cursor = "pointer";
    this.statsButton.on("pointerdown", () => {
      gsap.fromTo(
        this.statsButton.scale,
        { x: 0.9, y: 0.9 },
        { x: 1, y: 1, duration: 0.1 },
      );
      this.statsModal.show();
    });
    this.container.addChild(this.statsButton);

    // BALANCE
    this.balanceTitle = new Text({ text: "CREDIT", style: titleStyle });
    this.balanceTitle.anchor.set(0, 0.5);
    this.balanceTitle.x = CONFIG.HUD_BAL_TITLE_LANDSCAPE_X;
    this.balanceTitle.y = CONFIG.HUD_BAL_TITLE_LANDSCAPE_Y;
    this.balanceTitle.resolution = CONFIG.UI_HUD_RESOLUTION;
    this.balanceTitle.zIndex = 6;
    this.container.addChild(this.balanceTitle);

    this.balanceBg = new Sprite(Assets.get("balance.png"));
    this.balanceBg.anchor.set(0, 0.5);
    this.balanceBg.scale.set(CONFIG.HUD_BAL_LANDSCAPE_BG_SCALE);
    this.balanceBg.x = CONFIG.HUD_BAL_BG_LANDSCAPE_X;
    this.balanceBg.y = CONFIG.HUD_BAL_BG_LANDSCAPE_Y;
    this.container.addChild(this.balanceBg);

    this.balanceText = new Text({ text: "₱0", style: glowStyle });
    this.balanceText.anchor.set(0, 0.5);
    this.balanceText.x = CONFIG.HUD_BAL_TEXT_LANDSCAPE_X;
    this.balanceText.y = CONFIG.HUD_BAL_TEXT_LANDSCAPE_Y;
    this.balanceText.resolution = CONFIG.UI_HUD_RESOLUTION;
    this.container.addChild(this.balanceText);

    // BET
    this.betTitle = new Text({ text: "BET", style: titleStyle });
    this.betTitle.anchor.set(0, 0.5);
    this.betTitle.x = CONFIG.HUD_BET_TITLE_LANDSCAPE_X;
    this.betTitle.y = CONFIG.HUD_BET_TITLE_LANDSCAPE_Y;
    this.betTitle.resolution = CONFIG.UI_HUD_RESOLUTION;
    this.betTitle.zIndex = 6;
    this.container.addChild(this.betTitle);

    this.betBg = new Sprite(Assets.get("bet.png"));
    this.betBg.anchor.set(0, 0.5);
    this.betBg.scale.set(CONFIG.HUD_BET_LANDSCAPE_BG_SCALE);
    this.betBg.x = CONFIG.HUD_BET_BG_LANDSCAPE_X;
    this.betBg.y = CONFIG.HUD_BET_BG_LANDSCAPE_Y;
    this.container.addChild(this.betBg);

    this.betAmountText = new Text({ text: "₱0", style: glowStyle.clone() }); // Clone to ensure separate control
    this.betAmountText.style.fontSize = CONFIG.UI_HUD_BET_SIZE;
    this.betAmountText.anchor.set(0, 0.5);
    this.betAmountText.x = CONFIG.HUD_BET_TEXT_LANDSCAPE_X;
    this.betAmountText.y = CONFIG.HUD_BET_TEXT_LANDSCAPE_Y;
    this.betAmountText.resolution = CONFIG.UI_HUD_RESOLUTION;
    this.betAmountText.interactive = true;
    this.betAmountText.cursor = "text";
    this.betAmountText.eventMode = "static";
    this.betAmountText.on("pointerdown", () => {
      const balance = parseFloat(this.balanceText.text.replace(/[^0-9.]/g, ""));
      const currentBet = parseFloat(
        this.betAmountText.text.replace(/[^0-9.]/g, ""),
      );
      window.dispatchEvent(
        new CustomEvent("slot-open-bet", { detail: { balance, currentBet } }),
      );
    });
    this.container.addChild(this.betAmountText);

    // TOTAL WIN
    this.totalWinTitle = new Text({ text: "TOTAL WIN", style: titleStyle });
    this.totalWinTitle.anchor.set(0, 0);
    this.totalWinTitle.x = CONFIG.HUD_WIN_TITLE_LANDSCAPE_X;
    this.totalWinTitle.y = CONFIG.HUD_WIN_TITLE_LANDSCAPE_Y;
    this.totalWinTitle.resolution = CONFIG.UI_HUD_RESOLUTION;
    this.totalWinTitle.zIndex = 6;
    this.container.addChild(this.totalWinTitle);

    this.winBg = new Sprite(Assets.get("totalwin.png"));
    this.winBg.anchor.set(0, 0.5);
    this.winBg.scale.set(CONFIG.HUD_WIN_BG_LANDSCAPE_SCALE);
    this.winBg.x = CONFIG.HUD_WIN_BG_LANDSCAPE_X;
    this.winBg.y = CONFIG.HUD_WIN_BG_LANDSCAPE_Y;
    this.container.addChild(this.winBg);

    this.totalWinText = new Text({ text: "₱0", style: glowStyle.clone() });
    this.totalWinText.style.fontSize = CONFIG.UI_HUD_TOTAL_WIN_SIZE;
    this.totalWinText.anchor.set(0.5, 0.5);
    this.totalWinText.x = CONFIG.HUD_WIN_TEXT_LANDSCAPE_X;
    this.totalWinText.resolution = CONFIG.UI_HUD_RESOLUTION;
    this.totalWinText.y = CONFIG.HUD_WIN_TEXT_LANDSCAPE_Y;
    this.container.addChild(this.totalWinText);

    // MINUS BUTTON
    this.minusButton = new Sprite(Assets.get("minus.png"));
    this.minusButton.anchor.set(0.5);
    this.minusButton.scale.set(CONFIG.BTN_ADJUST_LANDSCAPE_SCALE);
    this.minusButton.x = CONFIG.BTN_MINUS_LANDSCAPE_X;
    this.minusButton.y = CONFIG.BTN_MINUS_LANDSCAPE_Y;
    this.minusButton.interactive = true;
    this.minusButton.eventMode = "static";
    this.minusButton.cursor = "pointer";
    this.minusButton.on("pointerdown", () => this.onBetAdjust(-1));
    this.container.addChild(this.minusButton);

    // PLUS BUTTON
    this.plusButton = new Sprite(Assets.get("plus.png"));
    this.plusButton.anchor.set(0.5);
    this.plusButton.scale.set(CONFIG.BTN_ADJUST_LANDSCAPE_SCALE);
    this.plusButton.x = CONFIG.BTN_PLUS_LANDSCAPE_X;
    this.plusButton.y = CONFIG.BTN_PLUS_LANDSCAPE_Y;
    this.plusButton.interactive = true;
    this.plusButton.eventMode = "static";
    this.plusButton.cursor = "pointer";
    this.plusButton.on("pointerdown", () => this.onBetAdjust(1));
    this.container.addChild(this.plusButton);

    // WIN TEX
    this.winText = new Text({
      text: "",
      style: {
        fill: 0xffd700,
        fontSize: CONFIG.UI_WIN_SIZE,
        fontWeight: "bold",
        dropShadow: { color: 0x000000, blur: 15, distance: 0 },
        align: "center",
      },
    });
    this.winText.anchor.set(0.5);
    this.winText.resolution = CONFIG.UI_WIN_RESOLUTION;
    this.container.addChild(this.winText);

    // BONUS SPINS
    this.bonusSpinsText = new Text({
      text: "",
      style: new TextStyle({
        fill: 0xff6b00,
        fontSize: CONFIG.UI_BONUS_SIZE,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 4 },
      }),
    });
    this.bonusSpinsText.anchor.set(0.5);
    this.bonusSpinsText.y = -450;
    this.bonusSpinsText.resolution = CONFIG.UI_WIN_RESOLUTION;
    this.container.addChild(this.bonusSpinsText);

    this.createTurboToggle();
  }

  private createTurboToggle() {
    this.turboButton = new Container();
    const bg = new Graphics()
      .roundRect(
        0,
        0,
        CONFIG.TURBO_BTN_WIDTH,
        CONFIG.TURBO_BTN_HEIGHT,
        CONFIG.TURBO_BTN_RADIUS,
      )
      .fill({ color: 0x1a1a1a, alpha: 0.85 })
      .stroke({ color: 0xba8a4c, width: 2, alpha: 0.8 });

    const style = new TextStyle({
      fill: CONFIG.TURBO_BTN_INACTIVE_COLOR,
      fontSize: CONFIG.TURBO_BTN_FONT_SIZE,
      fontWeight: "900",
      dropShadow: { color: 0x000000, blur: 2, distance: 1 },
    });
    const txt = new Text({ text: "TURBO", style });
    txt.anchor.set(0.5);
    txt.position.set(CONFIG.TURBO_BTN_WIDTH / 2, CONFIG.TURBO_BTN_HEIGHT / 2);
    this.turboButton.addChild(bg, txt);
    this.turboButton.eventMode = "static";
    this.turboButton.cursor = "pointer";
    this.turboButton.on("pointerdown", () => {
      this.isTurboActive = !this.isTurboActive;
      (txt.style as TextStyle).fill = this.isTurboActive
        ? CONFIG.TURBO_BTN_ACTIVE_COLOR
        : CONFIG.TURBO_BTN_INACTIVE_COLOR;
      if (this.isTurboActive) {
        (txt.style as TextStyle).dropShadow = {
          color: CONFIG.TURBO_BTN_GLOW_COLOR,
          blur: CONFIG.TURBO_BTN_GLOW_BLUR,
          distance: 0,
          alpha: 0.8,
          angle: 0,
        };
      } else {
        (txt.style as TextStyle).dropShadow = {
          color: 0x000000,
          blur: 2,
          distance: 1,
          alpha: 1,
          angle: 0,
        };
      }
      this.container.emit("turboToggle", this.isTurboActive);
      gsap.fromTo(
        this.turboButton.scale,
        { x: 0.9, y: 0.9 },
        { x: 1, y: 1, duration: 0.1 },
      );
    });
    this.container.addChild(this.turboButton);
  }

  // bet sizing
  updateBetTextDisplay(textToShow: string, isEditing: boolean = false) {
    // Ensure Peso sign is always present
    const display = textToShow.startsWith("₱") ? textToShow : `₱${textToShow}`;
    this.betAmountText.text = display;
    this.betAmountText.style.fill = isEditing ? 0x00ff00 : 0xffffff;

    // Use only digits for size calculation
    const cleanNumber = display.replace(/[^0-9]/g, "");
    const len = cleanNumber.length;
    let newSize = CONFIG.UI_HUD_BET_SIZE;
    if (len >= 9) newSize = Math.floor(CONFIG.UI_HUD_BET_SIZE * 0.75);
    else if (len >= 7) newSize = Math.floor(CONFIG.UI_HUD_BET_SIZE * 0.83);
    this.betAmountText.style.fontSize = newSize;
  }

  public showStats() {
    this.statsModal.show();
  }

  //  updateBalance, Total Win, Free Spins
  updateTextValues(balance: number, totalWin: number, bonusSpins: number, isBonusWin: boolean = false) {
    this.balanceText.text = `₱${balance.toLocaleString()}`;
    this.totalWinText.text = `₱${totalWin.toLocaleString()}`;
    if (bonusSpins > 0) {
      this.bonusSpinsText.text = `FREE SPINS: ${bonusSpins.toLocaleString()}`;
    } else {
      this.bonusSpinsText.text = "";
    }
    
    if (isBonusWin) {
      this.totalWinTitle.text = "BONUS WIN";
    } else {
      this.totalWinTitle.text = "TOTAL WIN";
    }
  }

  public setSpinButtonEnabled(enabled: boolean) {
    if (this.spinButton) {
      this.spinButton.interactive = enabled;
      this.spinButton.alpha = enabled ? 1 : 0.5;
    }
  }

  //tint
  public toggleButtonTheme(isFreeSpins: boolean, isAuto: boolean = false) {
    const tintColor = isFreeSpins
      ? CONFIG.UI_COLORS.FREE_SPINS_TINT
      : CONFIG.UI_COLORS.DEFAULT_TINT;

    if (this.spinButton) {
      this.spinButton.tint = isAuto ? 0xff0000 : tintColor;
    }
    if (this.autoSpinButton) this.autoSpinButton.tint = tintColor;
    if (this.buyFreeSpinButton) this.buyFreeSpinButton.tint = tintColor;
    if (this.minusButton) this.minusButton.tint = tintColor;
    if (this.plusButton) this.plusButton.tint = tintColor;
    if (this.menuButton) this.menuButton.tint = tintColor;

    if (isFreeSpins || isAuto) {
      this.autoSpinButton.visible = false;
      this.buyFreeSpinButton.visible = false;
      this.betAmountText.eventMode = "none";
    } else {
      this.autoSpinButton.visible = true;
      this.buyFreeSpinButton.visible = true;
      this.betAmountText.eventMode = "static";
    }
  }

  public animateThemeTransition(toFreeSpins: boolean, isAuto: boolean = false) {
    const tintColor = toFreeSpins
      ? CONFIG.UI_COLORS.FREE_SPINS_TINT
      : CONFIG.UI_COLORS.DEFAULT_TINT;

    const duration = 1.0;

    // 1. Animate visibility of mode buttons
    if (toFreeSpins || isAuto) {
      gsap.to([this.autoSpinButton, this.buyFreeSpinButton], {
        alpha: 0,
        duration: 0.5,
        onComplete: () => {
          this.autoSpinButton.visible = false;
          this.buyFreeSpinButton.visible = false;
        },
      });
      this.betAmountText.eventMode = "none";
    } else {
      this.autoSpinButton.visible = true;
      this.buyFreeSpinButton.visible = true;
      gsap.to([this.autoSpinButton, this.buyFreeSpinButton], {
        alpha: 1,
        duration: 0.5,
      });
      this.betAmountText.eventMode = "static";
    }

    // 2. Animate tints
    const elements = [
      this.spinButton,
      this.autoSpinButton,
      this.buyFreeSpinButton,
      this.minusButton,
      this.plusButton,
      this.menuButton,
      this.balanceBg,
      this.betBg,
      this.winBg,
    ];

    elements.forEach((el) => {
      if (el) {
        gsap.to(el, {
          pixi: { tint: tintColor },
          duration: duration,
          ease: "power2.out",
        });
      }
    });
  }

  public handleResize(width: number, height: number) {
    this.autoSpinModal?.handleResize(width, height);
    this.statsModal?.handleResize(width, height);
    this.helpModal?.handleResize(width, height);
  }

  public updateResponsiveLayout(
    isPortrait: boolean,
    deviceType: DeviceType = DEVICE_TYPES.DESKTOP,
  ) {
    const isMobile = deviceType === DEVICE_TYPES.MOBILE;
    const mobileScaleBonus = isMobile ? 1.2 : 1.0;

    if (isPortrait) {
      // PORTRAIT (Phone) Layout
      this.spinButton.x = CONFIG.SPIN_BTN_PORTRAIT_X;
      this.spinButton.y = CONFIG.SPIN_BTN_PORTRAIT_Y;
      this.spinButton.scale.set(
        CONFIG.SPIN_BTN_PORTRAIT_SCALE * mobileScaleBonus,
      );

      this.autoSpinButton.x = CONFIG.AUTO_BTN_PORTRAIT_X;
      this.autoSpinButton.y = CONFIG.AUTO_BTN_PORTRAIT_Y;
      this.autoSpinButton.scale.set(
        CONFIG.AUTO_BTN_PORTRAIT_SCALE * mobileScaleBonus,
      );

      this.buyFreeSpinButton.x = CONFIG.BUY_FREE_PORTRAIT_X;
      this.buyFreeSpinButton.y = CONFIG.BUY_FREE_PORTRAIT_Y;
      this.buyFreeSpinButton.scale.set(
        CONFIG.BUY_FREE_PORTRAIT_SCALE * mobileScaleBonus,
      );

      this.menuButton.x = CONFIG.MENU_BTN_PORTRAIT_X;
      this.menuButton.y = CONFIG.MENU_BTN_PORTRAIT_Y;
      this.menuButton.scale.set(
        CONFIG.MENU_BTN_PORTRAIT_SCALE * mobileScaleBonus,
      );

      // Balance & Bet (Move to Top)
      this.balanceTitle.x = CONFIG.HUD_BAL_TITLE_PORTRAIT_X;
      this.balanceTitle.y = CONFIG.HUD_BAL_TITLE_PORTRAIT_Y;
      this.balanceBg.x = CONFIG.HUD_BAL_BG_PORTRAIT_X;
      this.balanceBg.y = CONFIG.HUD_BAL_BG_PORTRAIT_Y;
      this.balanceBg.scale.set(CONFIG.HUD_BAL_PORTRAIT_BG_SCALE);
      this.balanceText.x = CONFIG.HUD_BAL_TEXT_PORTRAIT_X;
      this.balanceText.y = CONFIG.HUD_BAL_TEXT_PORTRAIT_Y;

      this.betTitle.x = CONFIG.HUD_BET_TITLE_PORTRAIT_X;
      this.betTitle.y = CONFIG.HUD_BET_TITLE_PORTRAIT_Y;
      this.betBg.x = CONFIG.HUD_BET_BG_PORTRAIT_X;
      this.betBg.y = CONFIG.HUD_BET_BG_PORTRAIT_Y;
      this.betBg.scale.set(CONFIG.HUD_BET_PORTRAIT_BG_SCALE);
      this.betAmountText.x = CONFIG.HUD_BET_TEXT_PORTRAIT_X;
      this.betAmountText.y = CONFIG.HUD_BET_TEXT_PORTRAIT_Y;

      this.minusButton.x = CONFIG.BTN_MINUS_PORTRAIT_X;
      this.minusButton.y = CONFIG.BTN_MINUS_PORTRAIT_Y;
      this.minusButton.scale.set(
        CONFIG.BTN_ADJUST_PORTRAIT_SCALE * mobileScaleBonus,
      );
      this.plusButton.x = CONFIG.BTN_PLUS_PORTRAIT_X;
      this.plusButton.y = CONFIG.BTN_PLUS_PORTRAIT_Y;
      this.plusButton.scale.set(
        CONFIG.BTN_ADJUST_PORTRAIT_SCALE * mobileScaleBonus,
      );

      // Total Win center
      this.totalWinTitle.x = CONFIG.HUD_WIN_TITLE_PORTRAIT_X;
      this.totalWinTitle.y = CONFIG.HUD_WIN_TITLE_PORTRAIT_Y;
      this.winBg.x = CONFIG.HUD_WIN_BG_PORTRAIT_X;
      this.winBg.y = CONFIG.HUD_WIN_BG_PORTRAIT_Y;
      this.winBg.scale.set(CONFIG.HUD_WIN_BG_PORTRAIT_SCALE);
      this.totalWinText.x = CONFIG.HUD_WIN_TEXT_PORTRAIT_X;
      this.totalWinText.y = CONFIG.HUD_WIN_TEXT_PORTRAIT_Y;

      this.winText.y = CONFIG.WIN_TEXT_PORTRAIT_Y;

      this.statsButton.x = CONFIG.STATS_BTN_PORTRAIT_X;
      this.statsButton.y = CONFIG.STATS_BTN_PORTRAIT_Y;

      this.turboButton.x = CONFIG.TURBO_BTN_PORTRAIT_X;
      this.turboButton.y = CONFIG.TURBO_BTN_PORTRAIT_Y;
    } else {
      // LANDSCAPE Layout (Default)
      this.spinButton.x = CONFIG.SPIN_BTN_LANDSCAPE_X;
      this.spinButton.y = CONFIG.SPIN_BTN_LANDSCAPE_Y;
      this.spinButton.scale.set(
        CONFIG.SPIN_BTN_LANDSCAPE_SCALE * mobileScaleBonus,
      );

      this.autoSpinButton.x = CONFIG.AUTO_BTN_LANDSCAPE_X;
      this.autoSpinButton.y = CONFIG.AUTO_BTN_LANDSCAPE_Y;
      this.autoSpinButton.scale.set(
        CONFIG.AUTO_BTN_LANDSCAPE_SCALE * mobileScaleBonus,
      );

      this.buyFreeSpinButton.x = CONFIG.BUY_FREE_LANDSCAPE_X;
      this.buyFreeSpinButton.y = CONFIG.BUY_FREE_LANDSCAPE_Y;
      this.buyFreeSpinButton.scale.set(
        CONFIG.BUY_FREE_LANDSCAPE_SCALE * mobileScaleBonus,
      );

      this.menuButton.x = CONFIG.MENU_BTN_LANDSCAPE_X;
      this.menuButton.y = CONFIG.MENU_BTN_LANDSCAPE_Y;
      this.menuButton.scale.set(
        CONFIG.MENU_BTN_LANDSCAPE_SCALE * mobileScaleBonus,
      );

      this.balanceTitle.x = CONFIG.HUD_BAL_TITLE_LANDSCAPE_X;
      this.balanceTitle.y = CONFIG.HUD_BAL_TITLE_LANDSCAPE_Y;
      this.balanceBg.scale.set(CONFIG.HUD_BAL_LANDSCAPE_BG_SCALE);
      this.balanceText.x = CONFIG.HUD_BAL_TEXT_LANDSCAPE_X;
      this.balanceText.y = CONFIG.HUD_BAL_TEXT_LANDSCAPE_Y;

      this.betTitle.x = CONFIG.HUD_BET_TITLE_LANDSCAPE_X;
      this.betTitle.y = CONFIG.HUD_BET_TITLE_LANDSCAPE_Y;
      this.betBg.x = CONFIG.HUD_BET_BG_LANDSCAPE_X;
      this.betBg.y = CONFIG.HUD_BET_BG_LANDSCAPE_Y;
      this.betBg.scale.set(CONFIG.HUD_BET_LANDSCAPE_BG_SCALE);
      this.betAmountText.x = CONFIG.HUD_BET_TEXT_LANDSCAPE_X;
      this.betAmountText.y = CONFIG.HUD_BET_TEXT_LANDSCAPE_Y;

      this.minusButton.x = CONFIG.BTN_MINUS_LANDSCAPE_X;
      this.minusButton.y = CONFIG.BTN_MINUS_LANDSCAPE_Y;
      this.minusButton.scale.set(
        CONFIG.BTN_ADJUST_LANDSCAPE_SCALE * mobileScaleBonus,
      );
      this.plusButton.x = CONFIG.BTN_PLUS_LANDSCAPE_X;
      this.plusButton.y = CONFIG.BTN_PLUS_LANDSCAPE_Y;
      this.plusButton.scale.set(
        CONFIG.BTN_ADJUST_LANDSCAPE_SCALE * mobileScaleBonus,
      );

      this.totalWinTitle.x = CONFIG.HUD_WIN_TITLE_LANDSCAPE_X;
      this.totalWinTitle.y = CONFIG.HUD_WIN_TITLE_LANDSCAPE_Y;
      this.winBg.x = CONFIG.HUD_WIN_BG_LANDSCAPE_X;
      this.winBg.y = CONFIG.HUD_WIN_BG_LANDSCAPE_Y;
      this.winBg.scale.set(CONFIG.HUD_WIN_BG_LANDSCAPE_SCALE);
      this.totalWinText.x = CONFIG.HUD_WIN_TEXT_LANDSCAPE_X;
      this.totalWinText.y = CONFIG.HUD_WIN_TEXT_LANDSCAPE_Y;

      this.winText.y = CONFIG.WIN_TEXT_LANDSCAPE_Y;

      this.statsButton.x = CONFIG.STATS_BTN_LANDSCAPE_X;
      this.statsButton.y = CONFIG.STATS_BTN_LANDSCAPE_Y;

      this.turboButton.x = CONFIG.TURBO_BTN_LANDSCAPE_X;
      this.turboButton.y = CONFIG.TURBO_BTN_LANDSCAPE_Y;
    }
  }
}
