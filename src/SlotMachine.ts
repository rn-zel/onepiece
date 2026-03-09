import { Application, Container, Sprite, Texture, Graphics, AnimatedSprite } from "pixi.js";
import { CONFIG, DEVICE_TYPES, getDeviceType } from "./domain/constants/Config";
import * as SampleApi from "../sampleAPI";
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
import { WinPresenter } from "./presentation/ui/WinPresenter";
import { SpinOrchestrator } from "./application/orchestrators/SpinOrchestrator";
import { CascadeOrchestrator } from "./application/orchestrators/CascadeOrchestrator";
import type { SymbolAnimation } from "./presentation/animation/SymbolAnimation";
import type { SymbolSprite } from "./domain/models/GameTypes";
import { JackpotPresenter } from "./presentation/ui/JackpotPresenter";
import { BuyFreeSpinsModal } from "./presentation/ui/BuyFreeSpinsModal";
import { TelemetryService } from "./domain/services/TelemetryService";

export class SlotMachine {
    app: Application;
    mainContainer = new Container();
    backgroundContainer = new Container();
    reelContainer = new Container();

    uiManager!: UIManager;
    leftTopUI: LeftTopUI;
    titleUI: TitleUI;
    topUI: TopUI;
    modelUI: ModelUI;
    vfxManager!: VFXManager;
    soundManager: SoundManager = new SoundManager();
    particleEmitter!: ParticleEmitter;
    jackpotPresenter!: JackpotPresenter;
    private buyFreeSpinsModal!: BuyFreeSpinsModal;

    reels: Reel[] = [];
    activeAnimations: AnimatedSprite[] = [];

    // Domain State
    slotTextures: Texture[];
    backgroundTexture: Texture;
    balance: number = CONFIG.CURRENT_BALANCE;
    betAmount: number = CONFIG.BET_AMOUNT;
    bonusSpins: number = 0;
    private sessionWins: number = 0;
    private telemetry = TelemetryService.getInstance();

    autoSpinConfig = {
        stopOnWin: true,
        stopOnLossLimit: 5000,
        sessionLoss: 0
    };
    lastSpinWin: number = 0;

    running: boolean = false;
    isQuickSpin: boolean = false;
    autoSpinActive: boolean = false;
    autoSpinCount: number = 0;
    freeSpinAutoActive: boolean = false;
    freeSpinDelayTween: gsap.core.Tween | null = null;

    lightning: LightningBorder = new LightningBorder();
    starfield: Starfield;
    waterBg: WaterBg;

    // Services
    private spinOrchestrator!: SpinOrchestrator;
    private cascadeOrchestrator!: CascadeOrchestrator;
    private winPresenter!: WinPresenter;
    private symbolAnimator: SymbolAnimation;

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
        this.symbolAnimator = symbolAnimator;

        this.soundManager.init();
        this.soundManager.playBGM(false);

        this.mainContainer.sortableChildren = true;
        this.app.stage.addChild(this.mainContainer);
        this.mainContainer.addChild(this.backgroundContainer);
        this.mainContainer.addChild(this.reelContainer);

        this.backgroundContainer.zIndex = 0;
        this.reelContainer.zIndex = 10;

        this.setupLightning();
        this.vfxManager = new VFXManager(
            this.app,
            this.mainContainer,
            this.backgroundContainer,
            this.soundManager,
            this.lightning,
            this.starfield,
            this.waterBg,
        );
        this.uiManager = new UIManager(
            () => this.startSpin(),
            () => this.openBuyFreeSpinsModal(),
            (amount: number) => this.adjustBet(amount),
            (config: any) => this.startManualAutoSpin(config)
        );

        const particleContainer = new Container();
        particleContainer.zIndex = 15;
        this.mainContainer.addChild(particleContainer);
        this.particleEmitter = new ParticleEmitter(this.app, particleContainer);
        this.jackpotPresenter = new JackpotPresenter(this.app.stage, this.particleEmitter);
        this.buyFreeSpinsModal = new BuyFreeSpinsModal(this.app.stage); // Initialized the new modal

        this.uiManager.container.zIndex = 100;
        this.mainContainer.addChild(this.uiManager.container);
        
        // Removed betPreset listener as it's now handled by the modal confirming a delta
        // If UIManager still emits it, we should remove the emission too.
        // Actually, UIManager now calls onBetAdjust directly from its betModal onConfirm.

        this.uiManager.container.on('turboToggle', (isActive: boolean) => {
            this.spinOrchestrator.isTurbo = isActive;
            this.soundManager.playSFX('sfx_button');
        });

        // Win presenter must be created before spin/cascade orchestrators
        this.winPresenter = new WinPresenter(this.uiManager);

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

        this.leftTopUI.setTheme(false);
        this.titleUI.setTheme(false);
        this.topUI.setTheme(false);
        this.modelUI.setTheme(false);

        this.setupBackground();
        this.createReels();

        // Wire services now that reels exist
        this.spinOrchestrator = new SpinOrchestrator(
            this.reels,
            this.slotTextures,
            this.uiManager,
            this.soundManager,
            this.particleEmitter,
            this.symbolAnimator,
            this.starfield,
        );
        this.cascadeOrchestrator = new CascadeOrchestrator(
            this.reels,
            this.particleEmitter,
            this.uiManager,
            this.winPresenter,
            this.symbolAnimator,
            this.soundManager,
            this.activeAnimations
        );

        this.vfxManager.setupBlackHole();

        this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
        this.topUI.updateJackpots(this.betAmount);
        this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

        // Init win panels AFTER updateTextValues so winText has a parent
        this.winPresenter.init();

        this.handleResize();
        window.addEventListener("resize", () => this.handleResize());
        this.waterBg.play();

        // Wire SlotMachine to use the sample Laravel-style API backend (sampleAPI.ts + sample-backend.js)
        SampleApi.setSlotApiBaseUrl("http://localhost:4000/api/v1");
        SampleApi.setAuthToken("dev-token");
        void this.loadFromBackend();
    }

    // ── Backend ───────────────────────────────────────────────────────

    private async loadFromBackend() {
        try {
            const data = await SampleApi.load();
            this.balance = data.player?.balance ?? this.balance;
            this.bonusSpins = data.free_spin?.count ?? 0;
            this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
        } catch (e) {
            console.error("Backend load exception:", e);
        }
    }

    private async spinFromBackend(isBonusSpin: boolean) {
        this.running = true;
        this.uiManager.spinButton.interactive = false;
        // Keep alpha at 1 or only slightly lower to ensure visibility
        this.uiManager.spinButton.alpha = 0.9;

        this.spinOrchestrator.showSpinFeedback(isBonusSpin || this.autoSpinActive);

        gsap.killTweensOf(this.uiManager.winText.scale);
        this.winPresenter.hide();
        this.reels.forEach((r) =>
            r.symbols.forEach((s) => {
                s.tint = 0xFFFFFF;
                s.zIndex = 0;
                s.scale.set((s as unknown as SymbolSprite).baseScale || 1);
            })
        );
        this.spinOrchestrator.clearAnimations();

        this.uiManager.winText.text = "";
        
        // Retain sessionWins ONLY if we are in free spins mode
        if (!isBonusSpin && !this.vfxManager.isFreeSpinsTheme) {
            this.sessionWins = 0; 
        }
        this.lastSpinWin = 0;
        
        const displayTotal = this.vfxManager.isFreeSpinsTheme ? this.sessionWins : this.lastSpinWin;
        this.uiManager.updateTextValues(this.balance, displayTotal, this.bonusSpins);

        try {
            const data = isBonusSpin
                ? await SampleApi.playFreeGame(this.betAmount)
                : await SampleApi.play(this.betAmount);

            // If backend returns bet_size / bet_level, sync local bet with it
            if (typeof data.bet_size === "number" && typeof data.bet_level === "number") {
                this.betAmount = data.bet_size * data.bet_level;
                this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
                this.topUI.updateJackpots(this.betAmount);
            }

            this.balance = data.balance;
            this.bonusSpins = data.free_spin?.count ?? 0;

            const grid = SampleApi.backendReelToGrid(data.slot.reel);
            const isBonusMode = isBonusSpin || this.autoSpinActive;

            this.spinOrchestrator.animateReels(grid, isBonusMode, async () => {
                this.reels.forEach((r) => { r.isFreeSpins = this.bonusSpins > 0; });

                if (data.jackpot_hit && data.jackpot_type) {
                    this.running = true;
                    this.uiManager.spinButton.interactive = false;
                    this.uiManager.spinButton.alpha = 0.5;
                    
                    const winAmount = (data.jackpot_prizes?.[data.jackpot_type] as number) || 0;
                    this.soundManager.playSFX("sfx_maxwin");
                    await this.jackpotPresenter.show(data.jackpot_type, winAmount);
                }

                // Always refresh balance display as soon as reels settle (deduction visible even on no-win)
                const currentDisplay = this.vfxManager.isFreeSpinsTheme ? this.sessionWins : this.lastSpinWin;
                this.uiManager.updateTextValues(this.balance, currentDisplay, this.bonusSpins);

                const hasCascade = data.slot.cascaded && data.slot.cascaded.length > 0;
                const isEnteringFreeSpins =
                    !!data.free_spin && (data.free_spin.count ?? 0) > 0 && !this.vfxManager.isFreeSpinsTheme;
                const isExitingFreeSpins =
                    this.vfxManager.isFreeSpinsTheme && this.bonusSpins === 0;

                // Add a brief pause before any win explosions/highlights so the player can see the stopped grid
                if (hasCascade || data.total_win > 0 || isEnteringFreeSpins) {
                    await this.spinOrchestrator.tweenToEnd(gsap.to({}, { duration: CONFIG.WIN_HIGHLIGHT_DELAY }));
                }

                if (hasCascade) {
                    this.running = true;
                    this.uiManager.spinButton.interactive = false;
                    this.uiManager.spinButton.alpha = 0.6;

                    await this.cascadeOrchestrator.play(
                        data.slot.cascaded!,
                        data.win,
                        this.betAmount,
                        (accumulated) => {
                            this.lastSpinWin = accumulated;
                            const displayTotal = this.vfxManager.isFreeSpinsTheme ? this.sessionWins + accumulated : this.lastSpinWin;
                            this.uiManager.updateTextValues(this.balance, displayTotal, this.bonusSpins);
                        },
                    );

                    if (data.total_win > 0) {
                        this.soundManager.playSFX("sfx_coin");
                        this.balance += data.total_win;
                        this.sessionWins += data.total_win;
                        
                        const displayTotal = this.vfxManager.isFreeSpinsTheme ? this.sessionWins : this.lastSpinWin;
                        this.uiManager.updateTextValues(this.balance, displayTotal, this.bonusSpins);

                        if (!this.vfxManager.isFreeSpinsTheme) {
                            this.uiManager.winText.style.fontSize = 100;
                            const isChain = data.slot.cascaded && data.slot.cascaded.length > 1;
                            if (isChain) {
                                this.uiManager.winText.text = `TOTAL WIN\n₱${Math.floor(data.total_win).toLocaleString()}`;
                            } else {
                                this.uiManager.winText.text = `WIN ₱${Math.floor(data.total_win).toLocaleString()}`;
                            }
                            this.uiManager.winText.style.fill = 0xffd700;
                            this.uiManager.winText.scale.set(0.01);
                            this.winPresenter.showWin(1);
                            gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: CONFIG.PANEL_POPUP_SPEED, ease: "back.out(1.7)" });
                            await this.spinOrchestrator.tweenToEnd(gsap.to({}, { duration: CONFIG.TOTAL_WIN_PANEL_DELAY }));
                            this.winPresenter.hide();
                        }
                    }

                    this.reels.forEach((r) =>
                        r.symbols.forEach((s) => {
                            s.tint = 0xFFFFFF;
                            s.zIndex = 0;
                            s.scale.set((s as unknown as SymbolSprite).baseScale || 1);
                        })
                    );
                    this.telemetry.trackSpin(this.betAmount, data.total_win, isBonusMode);
                    this.autoSpinConfig.sessionLoss += (this.betAmount - data.total_win);
                    this.resolveSpinCompletion(data.total_win, isBonusMode);
                    return;
                }

                if (data.total_win > 0) {
                    const winningPositions =
                        data.slot.winnings?.flatMap(
                            (w) => w.positions?.map((p) => ({ reel: p.column, row: p.row })) ?? [],
                        ) ?? [];

                    this.soundManager.playSFX("sfx_win");
                    const isBigWin = data.total_win >= this.betAmount;
                    this.particleEmitter.burst(CONFIG.PARTICLE_ORIGIN_X, CONFIG.PARTICLE_ORIGIN_Y, isBigWin ? 100 : 30);

                    this.reels.forEach((r) => r.symbols.forEach((s) => (s.tint = 0x555555)));
                    this.reels.forEach((r) => r.resetBrightness());

                    for (const p of winningPositions) {
                        const reel = this.reels[p.reel];
                        if (!reel) continue;
                        reel.setBrightness(p.row, 2);
                        const symbolSprite = reel.getSymbolAtRow(p.row);
                        if (symbolSprite) {
                            symbolSprite.zIndex = 100;
                            reel.container.zIndex = 100;
                            this.spinOrchestrator.animateSymbol(symbolSprite, reel);
                            const globalPos = symbolSprite.getGlobalPosition();
                            const localPos = this.particleEmitter.container.toLocal(globalPos);
                            this.particleEmitter.emitGlow(localPos.x, localPos.y, 10);
                        }
                    }

                    this.sessionWins += data.total_win;
                    this.lastSpinWin = data.total_win;
                    
                    const displayTotal = this.vfxManager.isFreeSpinsTheme ? this.sessionWins : this.lastSpinWin;
                    this.uiManager.updateTextValues(this.balance, displayTotal, this.bonusSpins);

                    if (isBonusSpin) {
                        gsap.delayedCall(CONFIG.NORMAL_WIN_DELAY, () => {
                            this.telemetry.trackSpin(this.betAmount, data.total_win, isBonusMode);
                            this.autoSpinConfig.sessionLoss += (this.betAmount - data.total_win);
                            this.resolveSpinCompletion(data.total_win, isBonusMode);
                        });
                        return;
                    }

                    this.uiManager.winText.style.fontSize = 100;
                    this.uiManager.winText.text = `WIN ₱${Math.floor(data.total_win).toLocaleString()}`;
                    this.uiManager.winText.style.fill = 0xffd700;
                    this.uiManager.winText.scale.set(0.01);
                    this.winPresenter.showWin(0.8);

                    gsap.delayedCall(0.5 + 0.8, () => {
                        gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: CONFIG.PANEL_POPUP_SPEED, ease: "back.out(1.7)" });
                    });
                    gsap.delayedCall(CONFIG.NORMAL_WIN_DELAY, () => {
                        this.telemetry.trackSpin(this.betAmount, data.total_win, isBonusMode);
                        this.autoSpinConfig.sessionLoss += (this.betAmount - data.total_win);
                        this.resolveSpinCompletion(data.total_win, isBonusMode);
                    });
                    return;
                }

                if (isEnteringFreeSpins) {
                    this.running = true;
                    this.uiManager.spinButton.interactive = false;
                    this.uiManager.spinButton.alpha = 0.5;
                    this.telemetry.trackSpin(this.betAmount, data.total_win, isBonusMode);
                    this.autoSpinConfig.sessionLoss += (this.betAmount - data.total_win);
                    this.playPurchasedScatterIntro();
                    return;
                }

                if (isExitingFreeSpins) {
                    this.running = true;
                    this.uiManager.spinButton.interactive = false;
                    this.uiManager.spinButton.alpha = 0.5;
                    gsap.delayedCall(1, () => {
                        this.uiManager.winText.text = `TOTAL WIN\n₱${Math.floor(this.sessionWins).toLocaleString()}`;
                        this.uiManager.winText.style.fill = 0x00ff00;
                        this.uiManager.winText.scale.set(0.01);
                        this.winPresenter.showWin();
                        gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 1, ease: "back.out(1)" });
                        gsap.delayedCall(2, () => {
                            this.vfxManager.playBlackHoleTransition(
                                false,
                                () => {
                                    this.vfxManager.swapTheme(false, this.reels);
                                    this.uiManager.toggleButtonTheme(false);
                                    this.leftTopUI.setTheme(false);
                                    this.titleUI.setTheme(false);
                                    this.modelUI.setTheme(false);
                                    this.topUI.setTheme(false);
                                    this.uiManager.winText.text = "";
                                    this.winPresenter.hide();
                                },
                                () => {
                                    this.sessionWins = 0;
                                    this.telemetry.trackSpin(this.betAmount, data.total_win, isBonusMode);
                                    this.autoSpinConfig.sessionLoss += (this.betAmount - data.total_win);
                                    this.resolveSpinCompletion(data.total_win, isBonusMode);
                                },
                            );
                        });
                    });
                    return;
                }
                this.telemetry.trackSpin(this.betAmount, data.total_win, isBonusMode);
                this.autoSpinConfig.sessionLoss += (this.betAmount - data.total_win);
                this.resolveSpinCompletion(data.total_win, isBonusMode);
            });
        } catch (e) {
            console.error("Backend process failure:", e);
            if (!isBonusSpin) this.balance += this.betAmount;
            this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

            // Show a user-facing error toast
            const errMsg = (e instanceof Error) ? e.message : "Server Error";
            this.uiManager.winText.style.fontSize = 50;
            this.uiManager.winText.text = `⚠ ${errMsg}\nBet Refunded`;
            this.uiManager.winText.style.fill = 0xff4444;
            this.uiManager.winText.scale.set(1);
            this.winPresenter.showWin(0);
            gsap.delayedCall(2.5, () => {
                this.winPresenter.hide();
                this.uiManager.winText.text = "";
                this.resolveSpinCompletion(0, isBonusSpin); // Pass 0 win for error case
            });
        }
    }

    // ── Buy Free Spins ────────────────────────────────────────────────

    private openBuyFreeSpinsModal() {
        if (this.running || this.vfxManager.isFreeSpinsTheme) return;
        this.soundManager.playSFX("sfx_button");
        const cost = this.betAmount * CONFIG.BUY_COST_MULTIPLIER;
        if (this.balance < cost) {
            this.showInsufficientBalanceMessage();
            return;
        }
        this.buyFreeSpinsModal.show(cost, () => { void this.confirmBuyFreeSpins(); }); // Changed to use this.buyFreeSpinsModal
    }

    private async confirmBuyFreeSpins() {
        if (this.running || this.vfxManager.isFreeSpinsTheme) return;
        this.soundManager.playSFX("sfx_buy");
        this.buyFreeSpinsModal.hide(); // Hide the modal after confirmation

        let purchasedGrid: number[][] | null = null;
        let purchasedBalance: number | null = null;
        let purchasedFreeSpins: number | null = null;

        try {
            const data = await SampleApi.buyFreeGame(this.betAmount);
            purchasedBalance = data.balance;
            purchasedFreeSpins = data.free_spin?.count ?? 0;
            purchasedGrid = SampleApi.backendReelToGrid(data.slot.reel);
        } catch (e) {
            console.error("Transaction exception during feature purchase:", e);
            return;
        }

        if (purchasedGrid) this.forceThreeScattersInView(purchasedGrid);
        if (typeof purchasedBalance === "number") this.balance = purchasedBalance;
        if (typeof purchasedFreeSpins === "number") this.bonusSpins = purchasedFreeSpins;

        this.spinOrchestrator.animateReels(purchasedGrid, false, () => {
            this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
            this.playPurchasedScatterIntro();
        });
    }

    private forceThreeScattersInView(grid: number[][]) {
        const SCATTER_INDEX = 9;
        const WILD_INDEX = 8;
        let scatterCount = 0;

        for (let x = 0; x < grid.length; x++) {
            const col = grid[x];
            if (!col) continue;
            for (let y = 0; y < 3; y++) {
                if (col[y] === SCATTER_INDEX) scatterCount++;
            }
        }
        for (let x = 0; x < grid.length && scatterCount < 3; x++) {
            const col = grid[x];
            if (!col) continue;
            for (let y = 0; y < 3 && scatterCount < 3; y++) {
                if (col[y] === WILD_INDEX) continue;
                if (col[y] !== SCATTER_INDEX) {
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
                gsap.timeline()
                    .to(sprite.scale, { x: sprite.scale.x * 2.2, y: sprite.scale.y * 2.2, duration: 0.18, ease: "back.out(2)" })
                    .to(sprite.scale, { x: sprite.scale.x * 1.5, y: sprite.scale.y * 1.5, duration: 0.25, ease: "power2.inOut" })
                    .to(sprite, { alpha: 0.6, duration: 0.15, yoyo: true, repeat: 3, ease: "sine.inOut" }, ">")
                    .to(sprite.scale, { x: sprite.scale.x * 1.8, y: sprite.scale.y * 1.8, duration: 0.3, ease: "elastic.out(1,0.4)" }, "<");
                this.spinOrchestrator.animateSymbol(sprite, reel);
            });
        });

        const staggerDuration = 0.1 + scatterSprites.length * 0.22;
        const ANIM_FINISH_DELAY = 1.8;

        gsap.delayedCall(staggerDuration + ANIM_FINISH_DELAY, () => {
            this.reelContainer.alpha = 0;
            gsap.to(this.reelContainer, { alpha: 1, duration: 0.5, ease: "power2.out" });
            this.soundManager.playSFX("sfx_maxwin");

            const spinsText = this.bonusSpins > 0 ? `${this.bonusSpins} SPINS!` : "FREE SPINS!";
            this.uiManager.winText.text = `MEGA BONUS!\n\n${spinsText}`;
            this.uiManager.winText.style.fontSize = 100;
            this.uiManager.winText.style.fill = 0xFFD700;
            this.uiManager.winText.scale.set(0.01);
            this.winPresenter.showBonus();

            gsap.to(this.uiManager.winText.scale, {
                x: 1.15, y: 1.15, duration: 0.25, ease: "back.out(3)",
                onComplete: () => {
                    gsap.to(this.uiManager.winText.scale, {
                        x: 1, y: 1, duration: 0.4, ease: "elastic.out(1, 0.5)",
                        onComplete: () => {
                            gsap.to(this.uiManager.winText.scale, {
                                x: 1.04, y: 1.04, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut",
                            });
                            gsap.delayedCall(2.5, () => {
                                gsap.killTweensOf(this.uiManager.winText.scale);
                                this.vfxManager.playBlackHoleTransition(
                                    true,
                                    () => {
                                        this.vfxManager.swapTheme(true, this.reels);
                                        this.uiManager.toggleButtonTheme(true);
                                        this.leftTopUI.setTheme(true);
                                        this.titleUI.setTheme(true);
                                        this.topUI.setTheme(true);
                                        this.modelUI.setTheme(true);
                                        this.reels.forEach((r) => (r.isFreeSpins = true));
                                    },
                                    () => {
                                        this.haltUserAutoSpin();
                                        this.running = false;
                                        this.resolveSpinCompletion(0, true); // 0 win, isBonusMode true
                                    },
                                );
                            });
                        },
                    });
                },
            });
        });
    }

    // ── Scene Setup ───────────────────────────────────────────────────

    private setupBackground() {
        const padding = -10;
        const bg = new Sprite(this.backgroundTexture);
        bg.anchor.set(0.5);
        bg.width = 1920 + padding * 2;
        bg.height = 1080 + padding * 2;
        const isPortrait = this.app.screen.height > this.app.screen.width;
        const bgOffX = isPortrait ? CONFIG.BACKGROUND_OFFSET_X_PORTRAIT : CONFIG.BACKGROUND_OFFSET_X_LANDSCAPE;
        bg.x = padding + bgOffX;
        bg.y = padding + 10;
        this.backgroundContainer.addChild(bg);
    }

    private createReels() {
        const screenWidth = this.app.screen.width;
        const screenHeight = this.app.screen.height;
        const isPortrait = screenHeight > screenWidth;

        const cardWidth = isPortrait ? CONFIG.CARD_WIDTH_PORTRAIT : CONFIG.CARD_WIDTH_LANDSCAPE;
        const cardHeight = isPortrait ? CONFIG.CARD_HEIGHT_PORTRAIT : CONFIG.CARD_HEIGHT_LANDSCAPE;
        const cardSpacing = isPortrait ? CONFIG.CARD_SPACING_PORTRAIT : CONFIG.CARD_SPACING_LANDSCAPE;
        const reelOffX = isPortrait ? CONFIG.REEL_OFFSET_X_PORTRAIT : CONFIG.REEL_OFFSET_X_LANDSCAPE;
        const reelOffY = isPortrait ? CONFIG.REEL_OFFSET_Y_PORTRAIT : CONFIG.REEL_OFFSET_Y_LANDSCAPE;
        const maskPX = isPortrait ? CONFIG.MASK_PX_PORTRAIT : CONFIG.MASK_PX_LANDSCAPE;
        const maskPY = isPortrait ? CONFIG.MASK_PY_PORTRAIT : CONFIG.MASK_PY_LANDSCAPE;
        const maskOffY = isPortrait ? CONFIG.MASK_OFFSET_Y_PORTRAIT : CONFIG.MASK_OFFSET_Y_LANDSCAPE;
        const symbolSize = isPortrait ? CONFIG.SYMBOL_SIZE_PORTRAIT : CONFIG.SYMBOL_SIZE_LANDSCAPE;
        const symbolSpacing = isPortrait ? CONFIG.SYMBOL_SPACING_PORTRAIT : CONFIG.SYMBOL_SPACING_LANDSCAPE;

        const reelCount = CONFIG.REELS_COUNT;
        const totalWidth = cardWidth * reelCount + cardSpacing * (reelCount - 1);
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
        mask.fill(0xFF0000);
        this.reelContainer.addChild(mask);
        this.reelContainer.mask = mask;

        for (let i = 0; i < reelCount; i++) {
            const rc = new Container();
            rc.sortableChildren = true;
            rc.x = i * (cardWidth + cardSpacing);
            this.reelContainer.addChild(rc);
            this.reels.push(
                new Reel(rc, this.slotTextures, 3, symbolSize, symbolSpacing, cardWidth, cardHeight),
            );
        }
    }

    handleResize() {
        // Use app.screen instead of window, so it respects the max-width/height constraints of the app container
        const screenWidth = this.app.screen.width;
        const screenHeight = this.app.screen.height;

        const isPortrait = screenHeight > screenWidth;
        const deviceType = getDeviceType();

        // In portrait mode, we narrow the target width so the reels scale up to fill screen
        const targetWidth = isPortrait ? CONFIG.DESIGN_WIDTH_PORTRAIT : CONFIG.DESIGN_WIDTH_LANDSCAPE;
        const targetHeight = isPortrait ? CONFIG.DESIGN_HEIGHT_PORTRAIT : CONFIG.DESIGN_HEIGHT_LANDSCAPE;

        let scale = Math.min(screenWidth / targetWidth, screenHeight / targetHeight);
        
        // Select Device + Orientation specific scale
        let machineScale = isPortrait ? CONFIG.MACHINE_SCALE_PORTRAIT : CONFIG.MACHINE_SCALE_LANDSCAPE;
        
        if (deviceType === DEVICE_TYPES.MOBILE) {
            machineScale = isPortrait ? CONFIG.MACHINE_SCALE_MOBILE_PORTRAIT : CONFIG.MACHINE_SCALE_MOBILE_LANDSCAPE;
        } else if (deviceType === DEVICE_TYPES.TABLET) {
            machineScale = isPortrait ? CONFIG.MACHINE_SCALE_TABLET_PORTRAIT : CONFIG.MACHINE_SCALE_TABLET_LANDSCAPE;
        } else {
            machineScale = isPortrait ? CONFIG.MACHINE_SCALE_DESKTOP_PORTRAIT : CONFIG.MACHINE_SCALE_DESKTOP_LANDSCAPE;
        }

        scale *= machineScale;

        this.mainContainer.scale.set(scale);

        // Center Horizontally
        const slotOffX = isPortrait ? CONFIG.SLOT_OFFSET_X_PORTRAIT : CONFIG.SLOT_OFFSET_X_LANDSCAPE;
        this.mainContainer.x = screenWidth / 2 + slotOffX * scale;

        // Center Vertically with Device-Specific overrides for Portrait
        let slotOffY = isPortrait ? CONFIG.SLOT_OFFSET_Y_PORTRAIT : CONFIG.SLOT_OFFSET_Y_LANDSCAPE;
        if (isPortrait) {
            if (deviceType === DEVICE_TYPES.MOBILE) slotOffY = CONFIG.SLOT_OFFSET_Y_MOBILE_PORTRAIT;
            else if (deviceType === DEVICE_TYPES.TABLET) slotOffY = CONFIG.SLOT_OFFSET_Y_TABLET_PORTRAIT;
            else slotOffY = CONFIG.SLOT_OFFSET_Y_DESKTOP_PORTRAIT;
        }

        this.mainContainer.y = screenHeight / 2 + slotOffY * scale;

        // Inform UI about device type if it has its own logic
        if (this.uiManager) {
            this.uiManager.updateResponsiveLayout(isPortrait, deviceType);
        }

        // Broadcast resize to all modals
        if (this.uiManager) {
             this.buyFreeSpinsModal?.handleResize(screenWidth, screenHeight);
             this.uiManager.handleResize(screenWidth, screenHeight);
        }

        // Update Reel Geometry
        const cardWidth = isPortrait ? CONFIG.CARD_WIDTH_PORTRAIT : CONFIG.CARD_WIDTH_LANDSCAPE;
        const cardHeight = isPortrait ? CONFIG.CARD_HEIGHT_PORTRAIT : CONFIG.CARD_HEIGHT_LANDSCAPE;
        const cardSpacing = isPortrait ? CONFIG.CARD_SPACING_PORTRAIT : CONFIG.CARD_SPACING_LANDSCAPE;
        const symbolSize = isPortrait ? CONFIG.SYMBOL_SIZE_PORTRAIT : CONFIG.SYMBOL_SIZE_LANDSCAPE;
        const symbolSpacing = isPortrait ? CONFIG.SYMBOL_SPACING_PORTRAIT : CONFIG.SYMBOL_SPACING_LANDSCAPE;
        const reelOffX = isPortrait ? CONFIG.REEL_OFFSET_X_PORTRAIT : CONFIG.REEL_OFFSET_X_LANDSCAPE;
        const reelOffY = isPortrait ? CONFIG.REEL_OFFSET_Y_PORTRAIT : CONFIG.REEL_OFFSET_Y_LANDSCAPE;
        const maskPX = isPortrait ? CONFIG.MASK_PX_PORTRAIT : CONFIG.MASK_PX_LANDSCAPE;
        const maskPY = isPortrait ? CONFIG.MASK_PY_PORTRAIT : CONFIG.MASK_PY_LANDSCAPE;
        const maskOffY = isPortrait ? CONFIG.MASK_OFFSET_Y_PORTRAIT : CONFIG.MASK_OFFSET_Y_LANDSCAPE;

        const symbolMargin = isPortrait ? CONFIG.SYMBOL_MARGIN_PORTRAIT : CONFIG.SYMBOL_MARGIN_LANDSCAPE;

        const totalWidth = cardWidth * CONFIG.REELS_COUNT + cardSpacing * (CONFIG.REELS_COUNT - 1);
        this.reelContainer.pivot.x = totalWidth / 2;
        this.reelContainer.pivot.y = cardHeight / 2.2;
        this.reelContainer.x = reelOffX;
        this.reelContainer.y = reelOffY;

        if (this.reelContainer.mask instanceof Graphics) {
            this.reelContainer.mask.clear();
            this.reelContainer.mask.rect(
                -maskPX,
                -maskPY + maskOffY,
                totalWidth + maskPX * 2,
                cardHeight + maskPY * 2,
            );
            this.reelContainer.mask.fill(0xFF0000);
        }

        this.reels.forEach((reel, i) => {
            reel.container.x = i * (cardWidth + cardSpacing);
            reel.updateConfig(symbolSize, symbolSpacing, cardWidth, cardHeight, symbolMargin);
        });

        if (this.backgroundContainer.children[0] instanceof Sprite) {
            const bg = this.backgroundContainer.children[0];
            const bgOffX = isPortrait ? CONFIG.BACKGROUND_OFFSET_X_PORTRAIT : CONFIG.BACKGROUND_OFFSET_X_LANDSCAPE;
            bg.x = 100 + bgOffX;
        }

        if (this.waterBg?.sprite) {
            this.waterBg.sprite.x = screenWidth / 2;
            this.waterBg.sprite.y = screenHeight / 2;
            this.waterBg.sprite.width = screenWidth;
            this.waterBg.sprite.height = screenHeight;
        }

        // Broadcast to UI elements to reposition themselves
        this.leftTopUI.updateResponsiveLayout(isPortrait);
        this.titleUI.updateResponsiveLayout(isPortrait);
        this.topUI.updateResponsiveLayout(isPortrait);
        this.modelUI.updateResponsiveLayout(isPortrait);

        if (this.jackpotPresenter) this.jackpotPresenter.handleResize();
        this.vfxManager.handleResize();
    }

    private async setupLightning() {
        await this.lightning.init();
        if (this.lightning.sprite) {
            this.uiManager.container.addChild(this.lightning.sprite);
            this.lightning.sprite.zIndex = 10;
            this.lightning.sprite.eventMode = "none";
        }
    }

    private adjustBet(amount: number) {
        this.betAmount = Math.max(10, Math.min(1000000000, this.betAmount + amount));
        this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
        this.topUI.updateJackpots(this.betAmount);
    }

    // ── Spin Control ──────────────────────────────────────────────────

    startSpin(_fromAutoSpin = false) {
        if (!this.running && !_fromAutoSpin && !this.freeSpinAutoActive) {
            this.soundManager.playSFX("sfx_button");
        }
        
        if (this.running) {
            if (this.bonusSpins > 0) {
                // Clicking during a free spin pauses the auto-chain
                this.freeSpinAutoActive = false;
            }
            this.isQuickSpin = true;
            this.spinOrchestrator.isQuickSpin = true;
            const width = this.app.screen.width;
            const height = this.app.screen.height;
            const isPortrait = height > width;
            const btnScale = isPortrait ? CONFIG.SPIN_BTN_PORTRAIT_SCALE : CONFIG.SPIN_BTN_LANDSCAPE_SCALE;

            gsap.killTweensOf(this.uiManager.spinButton.scale);
            gsap.to(
                this.uiManager.spinButton.scale,
                { x: btnScale, y: btnScale, duration: 0.2, ease: "back.out(2)", overwrite: "auto" },
            );
            this.reels.forEach((r) => {
                gsap.getTweensOf(r).forEach((tween) => tween.progress(1));
            });
            return;
        }

        this.isQuickSpin = false;
        this.spinOrchestrator.isQuickSpin = false;
        const isBonusSpin = this.bonusSpins > 0;

        if (isBonusSpin) {
            if (_fromAutoSpin) {
                void this.spinFromBackend(true);
            } else {
                if (this.freeSpinDelayTween) {
                    // Clicked while waiting for delay: PAUSE auto spins.
                    this.freeSpinDelayTween.kill();
                    this.freeSpinDelayTween = null;
                    this.freeSpinAutoActive = false;
                    this.haltSpinButtonVisuals();
                    return;
                } else {
                    // Start next free spin and RESUME auto playing
                    this.freeSpinAutoActive = true;
                    void this.spinFromBackend(true);
                }
            }
            return;
        }

        if (!isBonusSpin && this.balance < this.betAmount) {
            this.showInsufficientBalanceMessage();
            return;
        }
        void this.spinFromBackend(isBonusSpin);
    }

    private startManualAutoSpin(config: any): void {
        this.autoSpinConfig.stopOnWin = config.stopOnWin;
        this.autoSpinConfig.stopOnLossLimit = config.stopOnLossLimit;
        this.autoSpinActive = true;
        this.autoSpinCount = config.count;
        this.autoSpinConfig.sessionLoss = 0;

        if (this.bonusSpins > 0) {
            this.startSpin(true);
        } else {
            this.startSpin();
        }
    }

    private autoSpinNext() {
        if (!this.autoSpinActive || this.autoSpinCount <= 0) {
            this.haltUserAutoSpin();
            return;
        }
        // Re-check balance immediately before firing to guard against race conditions
        if (!this.running && this.balance < this.betAmount && this.bonusSpins === 0) {
            this.haltUserAutoSpin();
            alert("Insufficient Balance");
            return;
        }
        if (!this.running) {
            this.autoSpinCount--;
            this.startSpin(true);
        }
    }

    private resolveSpinCompletion(totalWin: number, isBonusMode: boolean): void {
        this.running = false;

        // AutoSpin Stop Conditions
        if (this.autoSpinActive && !isBonusMode) {
            if (this.autoSpinConfig.stopOnWin && totalWin > 0) {
                this.haltUserAutoSpin();
                console.log("[AutoSpin] Stopped: Win detected.");
                return;
            } else if (this.autoSpinConfig.sessionLoss >= this.autoSpinConfig.stopOnLossLimit) {
                this.haltUserAutoSpin();
                console.log("[AutoSpin] Stopped: Loss Limit reached.");
                return;
            }
        }

        if (this.bonusSpins > 0) {
            this.uiManager.spinButton.interactive = true;
            this.uiManager.spinButton.alpha = 1;

            if (this.freeSpinAutoActive || this.autoSpinActive) {
                // Animate spin button to show it's auto-firing
                gsap.to(this.uiManager.spinButton, {
                    rotation: "+=" + Math.PI * 2, duration: 1.2, repeat: -1, ease: "none", overwrite: "auto",
                });

                const delay = this.autoSpinActive
                    ? CONFIG.AUTO_SPIN_DELAY / 1000
                    : CONFIG.FREE_SPIN_AUTO_DELAY / 1000;

                this.freeSpinDelayTween = gsap.delayedCall(delay, () => {
                    this.freeSpinDelayTween = null;
                    if (this.bonusSpins > 0) {
                        this.startSpin(true);
                    }
                });
            } else {
                // Paused. Waiting for manual click to resume.
                this.haltSpinButtonVisuals();
            }
            return;
        } else {
            this.freeSpinAutoActive = false;
            if (this.freeSpinDelayTween) {
                this.freeSpinDelayTween.kill();
                this.freeSpinDelayTween = null;
            }
        }

        if (this.autoSpinActive) {
            if (this.autoSpinCount > 0) {
                this.uiManager.spinButton.interactive = false;
                gsap.to(this.uiManager.spinButton, {
                    rotation: "+=" + Math.PI * 2, duration: 1.5, repeat: -1, ease: "none", overwrite: "auto",
                });
                gsap.delayedCall(CONFIG.AUTO_SPIN_DELAY / 1000, () => { this.autoSpinNext(); });
                return;
            } else {
                this.haltUserAutoSpin();
            }
        }

        this.uiManager.spinButton.interactive = true;
        this.uiManager.spinButton.alpha = 1;
        this.haltSpinButtonVisuals();
    }

    private haltUserAutoSpin(): void {
        this.autoSpinActive = false;
        this.autoSpinCount = 0;
        this.uiManager.autoSpinButton.alpha = 1;
        gsap.killTweensOf(this.uiManager.autoSpinButton);
        gsap.to(this.uiManager.autoSpinButton, { rotation: 0, duration: 0.3, ease: "power2.out" });
        this.haltSpinButtonVisuals();
    }

    private haltSpinButtonVisuals(): void {
        gsap.killTweensOf(this.uiManager.spinButton);
        const cur = this.uiManager.spinButton.rotation;
        gsap.to(this.uiManager.spinButton, { rotation: cur + 0.2, duration: 0.3, ease: "power2.out" });
    }

    /** Shows a brief red on-screen toast when the player cannot afford their bet. */
    private showInsufficientBalanceMessage(): void {
        if (this.uiManager.winText.text !== "") return; // Don't stack toasts

        this.uiManager.winText.style.fontSize = 70;
        this.uiManager.winText.text = "⚠ INSUFFICIENT BALANCE\nPlease lower your bet";
        this.uiManager.winText.style.fill = 0xff4444;
        this.uiManager.winText.scale.set(0.01);
        this.winPresenter.showWin(0);

        gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 0.4, ease: "back.out(1.7)" });
        gsap.delayedCall(2.5, () => {
            gsap.to(this.uiManager.winText.scale, {
                x: 0, y: 0, duration: 0.2, ease: "power2.in",
                onComplete: () => {
                    this.winPresenter.hide();
                    this.uiManager.winText.text = "";
                    this.uiManager.winText.style.fill = 0xffd700;
                },
            });
        });
    }
}