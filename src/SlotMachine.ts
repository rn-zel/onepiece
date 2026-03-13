import { Application, Container, Sprite, Texture, Graphics } from "pixi.js";
import { CONFIG, DEVICE_TYPES, getDeviceType } from "./domain/constants/Config";
import * as slotApi from "./infrastructure/api/slotApi";
import { Reel } from "./domain/entities/Reel";
import gsap from "gsap";
import { UIManager } from "./presentation/ui/UIManager";
import { VFXManager } from "./presentation/vfx/VFXManager";
import { SoundManager } from "./infrastructure/audio/SoundManager";
import { LightningBorder } from "./presentation/animation/LightningBorder";
import { Starfield } from "./presentation/animation/Starfield";
import { WaterBg } from "./presentation/animation/WaterBg";
import { LeftTopUI } from "./presentation/ui/lefttop";
import { TopUI } from "./presentation/ui/top";
import { TitleUI } from "./presentation/ui/title";
import { ModelUI } from "./presentation/ui/model";
import { ParticleEmitter } from "./presentation/vfx/ParticleEmitter";
import { SpinOrchestrator } from "./application/orchestrators/SpinOrchestrator";
import { CascadeOrchestrator } from "./application/orchestrators/CascadeOrchestrator";
import type { SymbolAnimation } from "./presentation/animation/SymbolAnimation";
import { JackpotPresenter } from "./presentation/ui/JackpotPresenter";
import { BuyFreeSpinsModal } from "./presentation/ui/BuyFreeSpinsModal";
import { GameState } from "./domain/models/GameState";
import { GameController } from "./application/services/GameController";

/**
 * SlotMachine acts as the main View component in the presentation layer.
 * It manages PIXI containers, background, reels, and UI layout.
 * Business logic and state are delegated to GameController and GameState.
 */
export class SlotMachine {
  app: Application;
  mainContainer = new Container();
  backgroundContainer = new Container();
  reelContainer = new Container();

  uiManager!: UIManager;
  modalLayer = new Container();
  leftTopUI: LeftTopUI;
  titleUI: TitleUI;
  topUI: TopUI;
  modelUI: ModelUI;
  vfxManager!: VFXManager;
  backParticleEmitter!: ParticleEmitter;
  soundManager: SoundManager = new SoundManager();
  particleEmitter!: ParticleEmitter;
  jackpotPresenter!: JackpotPresenter;
  private buyFreeSpinsModal!: BuyFreeSpinsModal;

  reels: Reel[] = [];

  // Core Dependencies
  gameState: GameState;
  gameController: GameController;
  spinOrchestrator: SpinOrchestrator;
  cascadeOrchestrator: CascadeOrchestrator;

  slotTextures: Texture[];
  backgroundTexture: Texture;

  autoSpinConfig = {
    stopOnWin: true,
    stopOnLossLimit: 5000,
    sessionLoss: 0,
  };
  private jackpotPrizes: { mini: number; major: number; grand: number } | null =
    null;

  lightning: LightningBorder = new LightningBorder();
  starfield: Starfield;
  waterBg: WaterBg;

  constructor(
    app: Application,
    textures: Texture[],
    bgTexture: Texture,
    starfield: Starfield,
    symbolAnimator: SymbolAnimation,
    waterBg: WaterBg,
  ) {
    this.app = app;
    this.slotTextures = textures;
    this.backgroundTexture = bgTexture;
    this.starfield = starfield;
    this.waterBg = waterBg;

    this.gameState = new GameState();

    this.lightning.init().then(() => {
      this.setupLightning();
      this.handleResize(); // Reposition after load
    });
    this.soundManager.init();
    this.soundManager.playBGM(false);

    this.mainContainer.sortableChildren = true;
    this.app.stage.addChild(this.mainContainer);
    this.app.stage.addChild(this.modalLayer);
    this.app.stage.sortableChildren = true;
    this.modalLayer.zIndex = 1000;

    this.mainContainer.addChild(this.backgroundContainer);
    this.mainContainer.addChild(this.reelContainer);

    this.backgroundContainer.zIndex = 0;
    this.reelContainer.zIndex = 10;

    this.setupLightning();

    const particleContainer = new Container();
    particleContainer.zIndex = 15;
    this.mainContainer.addChild(particleContainer);
    this.particleEmitter = new ParticleEmitter(this.app, particleContainer);
    this.jackpotPresenter = new JackpotPresenter(
      this.app.stage,
      this.particleEmitter,
    );
    this.buyFreeSpinsModal = new BuyFreeSpinsModal(this.app.stage);

    const backVFXContainer = new Container();
    backVFXContainer.zIndex = CONFIG.UI_COIN_VFX_ZINDEX;
    this.mainContainer.addChild(backVFXContainer);
    this.backParticleEmitter = new ParticleEmitter(this.app, backVFXContainer);

    // 1. Create Orchestrators
    this.spinOrchestrator = new SpinOrchestrator(
      this.reels,
      this.slotTextures,
      null as any, // Injected shortly
      this.soundManager,
      this.particleEmitter,
      symbolAnimator,
      this.starfield,
    );

    this.cascadeOrchestrator = new CascadeOrchestrator(
      this.reels,
      this.particleEmitter,
      null as any, // Injected shortly
      null as any, // Injected shortly
      symbolAnimator,
      this.soundManager,
      this.spinOrchestrator.activeAnimations,
    );

    // 2. Create Controller FIRST
    this.gameController = new GameController(
      this.gameState,
      null as any, // Injected shortly
      this.spinOrchestrator,
      this.cascadeOrchestrator,
      this.jackpotPresenter,
    );

    // 3. Create UIManager SECOND with Controller callbacks
    this.uiManager = new UIManager(
      () => this.handleSpinClick(),
      () => this.openBuyFreeSpinsModal(),
      (cfg) => this.startManualAutoSpin(cfg),
      this.modalLayer,
      this.backParticleEmitter
    );

    // 4. Circular Dependency Fix (Inject UI into orchestrators/controller)
    (this.gameController as any).ui = this.uiManager;
    (this.spinOrchestrator as any).uiManager = this.uiManager;
    (this.cascadeOrchestrator as any).uiManager = this.uiManager;
    (this.cascadeOrchestrator as any).winPresenter =
      this.uiManager.winPresenter;

    this.gameController.setBonusTriggerCallback((count) => this.playBonusTransition(count));
    this.gameController.setBonusEndCallback(() => this.playBaseGameReturnTransition());

    this.vfxManager = new VFXManager(
      this.app,
      this.mainContainer,
      this.backgroundContainer,
      this.soundManager,
      this.lightning,
      this.starfield,
      this.waterBg,
    );

    this.uiManager.container.zIndex = 100;
    this.mainContainer.addChild(this.uiManager.container);

    this.uiManager.container.on("turboToggle", (isActive: boolean) => {
      this.spinOrchestrator.isTurbo = isActive;
      this.soundManager.playSFX("sfx_button");
    });

    this.buyFreeSpinsModal = new BuyFreeSpinsModal(this.modalLayer);

    this.modelUI = new ModelUI();
    this.modelUI.getContainer().zIndex = -10;
    this.mainContainer.addChild(this.modelUI.getContainer());

    this.leftTopUI = new LeftTopUI();
    this.leftTopUI.getContainer().zIndex = 20;

    this.titleUI = new TitleUI();
    this.titleUI.getContainer().zIndex = 15;

    this.topUI = new TopUI();
    this.topUI.getContainer().zIndex = 15;

    this.uiManager.container.addChild(this.leftTopUI.getContainer());
    this.uiManager.container.addChild(this.titleUI.getContainer());
    this.uiManager.container.addChild(this.topUI.getContainer());

    this.setupBackground();
    this.createReels();
    this.vfxManager.setupBlackHole();

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());

    window.addEventListener("slot-bet-confirm", (e: any) => {
      if (e.detail && typeof e.detail.bet === "number") {
        this.gameController.handleBetConfirm(e.detail.bet);
      }
    });

    window.addEventListener("slot-stop-auto", () => {
      this.gameController.stopAutoSpin();
    });

    this.waterBg.play();

    if (this.waterBg && this.waterBg.sprite) {
      // Centering
      this.waterBg.sprite.x = this.app.screen.width / 2;
      this.waterBg.sprite.y = this.app.screen.height / 2;
      // Scaling to cover the screen (Cover fill)
      const scale = Math.max(
        this.app.screen.width / this.waterBg.sprite.texture.width,
        this.app.screen.height / this.waterBg.sprite.texture.height,
      );
      this.waterBg.sprite.scale.set(scale);
    }

    slotApi.setSlotApiBaseUrl(CONFIG.API_BASE_URL);
    void this.loadFromBackend();
    this.spinOrchestrator.returnToIdle();
  }

  private async loadFromBackend() {
    try {
      const data = await slotApi.load();
      this.gameState.balance = data.player?.balance ?? this.gameState.balance;
      this.gameState.freeSpinsCount = data.free_spin?.count ?? 0;
      this.gameState.bonusSessionWin = data.free_spin?.total_win ?? 0;
            this.gameState.updateFromLoadData({
        machine: data.machine,
        info: data.info,
      });
      if (
        data.jackpot_prizes &&
        typeof data.jackpot_prizes.mini === "number" &&
        typeof data.jackpot_prizes.major === "number" &&
        typeof data.jackpot_prizes.grand === "number"
      ) {
        this.jackpotPrizes = {
          mini: data.jackpot_prizes.mini,
          major: data.jackpot_prizes.major,
          grand: data.jackpot_prizes.grand,
        };
      }
      this.gameController.updateUI();
      this.topUI.updateJackpots(this.jackpotPrizes ?? undefined);
    } catch (e) {
      console.error("Backend load exception:", e);
    }
  }

  private handleSpinClick(): void {
    if (this.gameController.autoSpinActive) {
      this.gameController.stopAutoSpin();
    } else {
      void this.gameController.handleSpinRequest();
    }
  }

  /**
   * Returns bet options for the HTML bet modal. Used so the modal does not need to call /config.
   * Single source of truth: game state (from /load or GAME_RULES fallback).
   */
  public getBetOptions(): {
    betAmounts: number[];
    balance: number;
    currentBetAmount: number;
    baseMultiplier: number;
  } {
    const level = Math.max(1, this.gameState.betLevel);
    const mult = Math.max(0, this.gameState.baseMultiplier) || 1;
    const betAmounts = this.gameState.betSizes
      .map((s) => s * level * mult)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    return {
      betAmounts: betAmounts.length > 0 ? betAmounts : [this.gameState.currentBetAmount],
      balance: this.gameState.balance,
      currentBetAmount: this.gameState.currentBetAmount,
      baseMultiplier: mult,
    };
  }

  public openBuyFreeSpinsModal(): void {
    if (this.gameController.spinning) return;
    if (this.vfxManager.isFreeSpinsTheme) return;
    this.soundManager.playSFX("sfx_button");
    const cost = this.gameState.buyCost;
    if (this.gameState.balance < cost) {
      this.showInsufficientBalanceMessage();
      return;
    }
    this.buyFreeSpinsModal.show(cost, () => {
      void this.confirmBuyFreeSpins();
    });
  }

  private async confirmBuyFreeSpins() {
    if (this.vfxManager.isFreeSpinsTheme) return;
    this.soundManager.playSFX("sfx_buy");
    this.buyFreeSpinsModal.hide();

    try {
      const data = await slotApi.buyFreeGame(
        this.gameState.currentBetSize,
        this.gameState.betLevel,
      );
      this.gameState.balance = data.balance;
      this.gameState.freeSpinsCount = data.free_spin?.count ?? 0;
      const grid = slotApi.backendReelToGrid(data.slot.reel);

      this.forceThreeScattersInView(grid);
      this.spinOrchestrator.animateReels(grid, false, () => {
        this.gameController.updateUI();
        this.playPurchasedScatterIntro();
      });
    } catch (e) {
      console.error("Feature purchase error:", e);
    }
  }

  private forceThreeScattersInView(grid: number[][]) {
    const SCATTER_INDEX = 9;
    const WILD_INDEX = 8;
    let scatterCount = 0;

    for (const col of grid) {
      for (let y = 0; y < 3; y++) {
        if (col[y] === SCATTER_INDEX) scatterCount++;
      }
    }
    for (const col of grid) {
      if (scatterCount >= 3) break;
      for (let y = 0; y < 3 && scatterCount < 3; y++) {
        if (col[y] !== SCATTER_INDEX && col[y] !== WILD_INDEX) {
          col[y] = SCATTER_INDEX;
          scatterCount++;
        }
      }
    }
  }

  private playPurchasedScatterIntro() {
    this.uiManager.spinButton.interactive = false;
    this.uiManager.spinButton.alpha = 0.5;

    const scatterSprites: { sprite: Sprite; reel: Reel }[] = [];
    this.reels.forEach((r) => {
      for (let row = 0; row < 3; row++) {
        const sprite = r.getSymbolAtRow(row);
        if (this.slotTextures.indexOf(sprite.texture) === 9) {
          sprite.zIndex = 100;
          r.container.zIndex = 100;
          scatterSprites.push({ sprite, reel: r });
        }
      }
    });

    scatterSprites.forEach(({ sprite, reel }, i) => {
      gsap.delayedCall(0.1 + i * 0.22, () => {
        this.soundManager.playSFX("sfx_win");
        gsap
          .timeline()
          .to(sprite.scale, {
            x: sprite.scale.x * 2.2,
            y: sprite.scale.y * 2.2,
            duration: 0.18,
            ease: "back.out(2)",
          })
          .to(sprite.scale, {
            x: sprite.scale.x * 1.5,
            y: sprite.scale.y * 1.5,
            duration: 0.25,
            ease: "power2.inOut",
          })
          .to(
            sprite,
            {
              alpha: 0.6,
              duration: 0.15,
              yoyo: true,
              repeat: 3,
              ease: "sine.inOut",
            },
            ">",
          )
          .to(
            sprite.scale,
            {
              x: sprite.scale.x * 1.8,
              y: sprite.scale.y * 1.8,
              duration: 0.3,
              ease: "elastic.out(1,0.4)",
            },
            "<",
          );
        this.spinOrchestrator.animateSymbol(sprite, reel);
      });
    });

    const staggerDuration = 0.1 + scatterSprites.length * 0.22;
    const ANIM_FINISH_DELAY = 1.8;

    gsap.delayedCall(staggerDuration + ANIM_FINISH_DELAY, () => {
      this.uiManager.spinButton.interactive = true;
      this.uiManager.spinButton.alpha = 1;
      void this.playBonusTransition(this.gameState.freeSpinsCount);
    });
  }

  private async playBonusTransition(count: number): Promise<void> {
    this.gameState.bonusSessionWin = 0;
    return new Promise<void>((resolve) => {
      this.reelContainer.alpha = 0;
      gsap.to(this.reelContainer, {
        alpha: 1,
        duration: 0.5,
        ease: "power2.out",
      });
      this.soundManager.playSFX("sfx_maxwin");

      this.uiManager.winText.text = `MEGA BONUS!\n\n${count > 0 ? count + " SPINS!" : "FREE SPINS!"}`;
      this.uiManager.winText.style.fontSize = 100;
      this.uiManager.winText.style.fill = 0xffd700;
      this.uiManager.winText.scale.set(0.01);
      this.uiManager.winPresenter.showBonus();

      gsap.to(this.uiManager.winText.scale, {
        x: 1,
        y: 1,
        duration: 0.25,
        ease: "back.out(3)",
        onComplete: () => {
          gsap.delayedCall(2.5, () => {
            this.vfxManager.playBlackHoleTransition(
              true,
              () => {
                this.vfxManager.swapTheme(true, this.reels, true); // skip lightning for now
                this.uiManager.toggleButtonTheme(true);
                this.leftTopUI.setTheme(true);
                this.titleUI.setTheme(true);
                this.topUI.setTheme(true);
                this.modelUI.setTheme(true);
                this.reels.forEach((r) => (r.isFreeSpins = true));
              },
              () => {
                // vortex complete
                resolve();
              },
            );

            // Show "MEGA BONUS" panel, enable spin button, and animate theme ONLY after vortex (4s)
            gsap.delayedCall(4.0, () => {
              this.uiManager.winPresenter.showBonus();
              this.uiManager.setSpinButtonEnabled(true);
              this.uiManager.animateThemeTransition(true);
              this.vfxManager.toggleFreeSpinEffects(true); // turn on lightning now
            });
          });
        },
      });
    });
  }

  private async playBaseGameReturnTransition(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.soundManager.playSFX("sfx_maxwin");
      const totalBonusWin = this.gameState.bonusSessionWin;
      this.uiManager.winText.text = `BONUS COMPLETE!\n\nTOTAL WIN:\n₱${totalBonusWin.toLocaleString()}`;
      this.uiManager.winText.style.fontSize = 80;
      this.uiManager.winText.style.fill = 0xffffff;
      this.uiManager.winText.scale.set(0.01);
      this.uiManager.winPresenter.showBonus();

      gsap.to(this.uiManager.winText.scale, {
        x: 1,
        y: 1,
        duration: 0.25,
        ease: "back.out(3)",
        onComplete: () => {
          gsap.delayedCall(2.0, () => {
            this.vfxManager.playBlackHoleTransition(
              false,
              () => {
                this.vfxManager.swapTheme(false, this.reels);
                this.uiManager.toggleButtonTheme(false);
                this.leftTopUI.setTheme(false);
                this.titleUI.setTheme(false);
                this.topUI.setTheme(false);
                this.modelUI.setTheme(false);
                this.reels.forEach((r) => (r.isFreeSpins = false));
                this.uiManager.animateThemeTransition(false);
                this.uiManager.winPresenter.showBonus(); // Show final total panel
              },
              () => {
                this.uiManager.winPresenter.hide();
                resolve();
              },
            );
          });
        },
      });
    });
  }

  private setupBackground() {
    const padding = -10;
    const bg = new Sprite(this.backgroundTexture);
    bg.anchor.set(0.5);
    bg.width = 1920 + padding * 2;
    bg.height = 1080 + padding * 2;
    const isPortrait = this.app.screen.height > this.app.screen.width;
    const bgOffX = isPortrait
      ? CONFIG.BACKGROUND_OFFSET_X_PORTRAIT
      : CONFIG.BACKGROUND_OFFSET_X_LANDSCAPE;
    bg.x = padding + bgOffX;
    bg.y = padding + 10;
    this.backgroundContainer.addChild(bg);
  }

  private createReels() {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const isPortrait = screenHeight > screenWidth;

    const cardWidth = isPortrait
      ? CONFIG.CARD_WIDTH_PORTRAIT
      : CONFIG.CARD_WIDTH_LANDSCAPE;
    const cardHeight = isPortrait
      ? CONFIG.CARD_HEIGHT_PORTRAIT
      : CONFIG.CARD_HEIGHT_LANDSCAPE;
    const cardSpacing = isPortrait
      ? CONFIG.CARD_SPACING_PORTRAIT
      : CONFIG.CARD_SPACING_LANDSCAPE;
    const reelOffX = isPortrait
      ? CONFIG.REEL_OFFSET_X_PORTRAIT
      : CONFIG.REEL_OFFSET_X_LANDSCAPE;
    const reelOffY = isPortrait
      ? CONFIG.REEL_OFFSET_Y_PORTRAIT
      : CONFIG.REEL_OFFSET_Y_LANDSCAPE;
    const maskPX = isPortrait
      ? CONFIG.MASK_PX_PORTRAIT
      : CONFIG.MASK_PX_LANDSCAPE;
    const maskPY = isPortrait
      ? CONFIG.MASK_PY_PORTRAIT
      : CONFIG.MASK_PY_LANDSCAPE;
    const maskOffY = isPortrait
      ? CONFIG.MASK_OFFSET_Y_PORTRAIT
      : CONFIG.MASK_OFFSET_Y_LANDSCAPE;
    const symbolSize = isPortrait
      ? CONFIG.SYMBOL_SIZE_PORTRAIT
      : CONFIG.SYMBOL_SIZE_LANDSCAPE;
    const symbolSpacing = isPortrait
      ? CONFIG.SYMBOL_SPACING_PORTRAIT
      : CONFIG.SYMBOL_SPACING_LANDSCAPE;

    const totalWidth =
      cardWidth * CONFIG.REELS_COUNT + cardSpacing * (CONFIG.REELS_COUNT - 1);
    this.reelContainer.pivot.x = totalWidth / 2;
    this.reelContainer.pivot.y = cardHeight / 2.2;
    this.reelContainer.x = reelOffX;
    this.reelContainer.y = reelOffY;
    this.reelContainer.sortableChildren = true;

    const mask = new Graphics();
    mask.rect(
      -maskPX,
      -maskPY + maskOffY,
      totalWidth + maskPX * 2,
      cardHeight + maskPY * 2,
    );
    mask.fill(0xff0000);
    this.reelContainer.addChild(mask);
    this.reelContainer.mask = mask;

    for (let i = 0; i < CONFIG.REELS_COUNT; i++) {
      const rc = new Container();
      rc.x = i * (cardWidth + cardSpacing);
      this.reelContainer.addChild(rc);
      this.reels.push(
        new Reel(
          rc,
          this.slotTextures,
          3,
          symbolSize,
          symbolSpacing,
          cardWidth,
          cardHeight,
        ),
      );
    }
  }

  handleResize() {
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const isPortrait = screenHeight > screenWidth;
    const deviceType = getDeviceType();

    const targetWidth = isPortrait
      ? CONFIG.DESIGN_WIDTH_PORTRAIT
      : CONFIG.DESIGN_WIDTH_LANDSCAPE;
    const targetHeight = isPortrait
      ? CONFIG.DESIGN_HEIGHT_PORTRAIT
      : CONFIG.DESIGN_HEIGHT_LANDSCAPE;

    let scale = Math.min(
      screenWidth / targetWidth,
      screenHeight / targetHeight,
    );
    let machineScale = isPortrait
      ? CONFIG.MACHINE_SCALE_PORTRAIT
      : CONFIG.MACHINE_SCALE_LANDSCAPE;

    if (deviceType === DEVICE_TYPES.MOBILE) {
      machineScale = isPortrait
        ? CONFIG.MACHINE_SCALE_MOBILE_PORTRAIT
        : CONFIG.MACHINE_SCALE_MOBILE_LANDSCAPE;
    } else if (deviceType === DEVICE_TYPES.TABLET) {
      machineScale = isPortrait
        ? CONFIG.MACHINE_SCALE_TABLET_PORTRAIT
        : CONFIG.MACHINE_SCALE_TABLET_LANDSCAPE;
    } else {
      machineScale = isPortrait
        ? CONFIG.MACHINE_SCALE_DESKTOP_PORTRAIT
        : CONFIG.MACHINE_SCALE_DESKTOP_LANDSCAPE;
    }

    scale *= machineScale;
    this.mainContainer.scale.set(scale);
    this.mainContainer.x =
      screenWidth / 2 +
      (isPortrait
        ? CONFIG.SLOT_OFFSET_X_PORTRAIT
        : CONFIG.SLOT_OFFSET_X_LANDSCAPE) *
        scale;

    let slotOffY = isPortrait
      ? CONFIG.SLOT_OFFSET_Y_PORTRAIT
      : CONFIG.SLOT_OFFSET_Y_LANDSCAPE;
    if (isPortrait) {
      if (deviceType === DEVICE_TYPES.MOBILE)
        slotOffY = CONFIG.SLOT_OFFSET_Y_MOBILE_PORTRAIT;
      else if (deviceType === DEVICE_TYPES.TABLET)
        slotOffY = CONFIG.SLOT_OFFSET_Y_TABLET_PORTRAIT;
      else slotOffY = CONFIG.SLOT_OFFSET_Y_DESKTOP_PORTRAIT;
    }
    this.mainContainer.y = screenHeight / 2 + slotOffY * scale;

    if (this.uiManager) {
      this.uiManager.updateResponsiveLayout(isPortrait, deviceType);
      this.uiManager.handleResize(screenWidth, screenHeight);
      this.buyFreeSpinsModal?.handleResize(screenWidth, screenHeight);
    }

    this.modelUI?.updateResponsiveLayout(isPortrait);
    this.titleUI?.updateResponsiveLayout(isPortrait);
    this.leftTopUI?.updateResponsiveLayout(isPortrait);
    this.topUI?.updateResponsiveLayout(isPortrait);
    

    const cardWidth = isPortrait
      ? CONFIG.CARD_WIDTH_PORTRAIT
      : CONFIG.CARD_WIDTH_LANDSCAPE;
    const cardHeight = isPortrait
      ? CONFIG.CARD_HEIGHT_PORTRAIT
      : CONFIG.CARD_HEIGHT_LANDSCAPE;
    const cardSpacing = isPortrait
      ? CONFIG.CARD_SPACING_PORTRAIT
      : CONFIG.CARD_SPACING_LANDSCAPE;
    const symbolSize = isPortrait
      ? CONFIG.SYMBOL_SIZE_PORTRAIT
      : CONFIG.SYMBOL_SIZE_LANDSCAPE;
    const symbolSpacing = isPortrait
      ? CONFIG.SYMBOL_SPACING_PORTRAIT
      : CONFIG.SYMBOL_SPACING_LANDSCAPE;
    const maskPX = isPortrait
      ? CONFIG.MASK_PX_PORTRAIT
      : CONFIG.MASK_PX_LANDSCAPE;
    const maskPY = isPortrait
      ? CONFIG.MASK_PY_PORTRAIT
      : CONFIG.MASK_PY_LANDSCAPE;
    const maskOffY = isPortrait
      ? CONFIG.MASK_OFFSET_Y_PORTRAIT
      : CONFIG.MASK_OFFSET_Y_LANDSCAPE;

    const totalWidth =
      cardWidth * CONFIG.REELS_COUNT + cardSpacing * (CONFIG.REELS_COUNT - 1);
    this.reelContainer.pivot.x = totalWidth / 2;
    // Centering based on 3 symbols + 2 gaps
    this.reelContainer.pivot.y = (symbolSize * 3 + symbolSpacing * 2) / 2;

    if (this.reelContainer.mask instanceof Graphics) {
      this.reelContainer.mask
        .clear()
        .rect(
          -maskPX,
          -maskPY + maskOffY,
          totalWidth + maskPX * 2,
          cardHeight + maskPY * 2,
        )
        .fill(0xff0000);
    }

    this.reels.forEach((reel, i) => {
      reel.container.x = i * (cardWidth + cardSpacing);
      reel.updateConfig(
        symbolSize,
        symbolSpacing,
        cardWidth,
        cardHeight,
        isPortrait
          ? CONFIG.SYMBOL_MARGIN_PORTRAIT
          : CONFIG.SYMBOL_MARGIN_LANDSCAPE,
      );
    });

    if (this.backgroundContainer.children[0] instanceof Sprite) {
      const bg = this.backgroundContainer.children[0];
      bg.x =
        -10 +
        (isPortrait
          ? CONFIG.BACKGROUND_OFFSET_X_PORTRAIT
          : CONFIG.BACKGROUND_OFFSET_X_LANDSCAPE);
    }

    if (this.lightning && this.lightning.sprite) {
      this.lightning.sprite.x = 0;
      this.lightning.sprite.y = 30; 

      // Match the reelContainer's dimensions
      this.lightning.sprite.width = totalWidth * 1.1;
      this.lightning.sprite.height = cardHeight * 1.4;
    }
  }

  private setupLightning() {
    if (this.lightning.sprite) {
      this.mainContainer.addChild(this.lightning.sprite);
      this.lightning.sprite.zIndex = 10; 
    }
  }

  private startManualAutoSpin(config: any) {
    this.gameController.startAutoSpin(config);
  }

  showInsufficientBalanceMessage() {
    this.uiManager.winText.text = "INSUFFICIENT BALANCE";
    this.uiManager.winText.style.fill = 0xff0000;
    this.uiManager.winText.style.fontSize = 60;
    this.uiManager.winPresenter.showWin(0);
    gsap.delayedCall(2, () => this.uiManager.winPresenter.hide());
  }
}
