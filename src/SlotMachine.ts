import { Application, Container, Sprite, Texture, Graphics, AnimatedSprite } from "pixi.js";
import { CONFIG } from "./domain/constants/Config";
import * as SlotApi from "./infrastructure/api/slotApi";
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

    reels: Reel[] = [];
    activeAnimations: AnimatedSprite[] = [];

    // Domain State
    slotTextures: Texture[];
    backgroundTexture: Texture;
    balance: number = CONFIG.CURRENT_BALANCE;
    betAmount: number = CONFIG.BET_AMOUNT;
    bonusSpins: number = 0;
    sessionWins: number = 0;
    lastSpinWin: number = 0;

    running: boolean = false;
    isQuickSpin: boolean = false;
    autoSpinActive: boolean = false;
    autoSpinCount: number = 0;
    isEditingBet: boolean = false;

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
            () => this.startAutoSpin(),
            () => this.openBuyFreeSpinsModal(),
            (amount) => this.adjustBet(amount),
            () => this.enableBetEditing(),
        );

        const particleContainer = new Container();
        particleContainer.zIndex = 15;
        this.mainContainer.addChild(particleContainer);
        this.particleEmitter = new ParticleEmitter(this.app, particleContainer);

        this.uiManager.container.zIndex = 100;
        this.mainContainer.addChild(this.uiManager.container);

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
            this.activeAnimations
        );

        this.vfxManager.setupBlackHole();
        this.setupBetInput();

        this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
        this.topUI.updateJackpots(this.betAmount);
        this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

        // Init win panels AFTER updateTextValues so winText has a parent
        this.winPresenter.init();

        this.handleResize();
        window.addEventListener("resize", () => this.handleResize());
        this.waterBg.play();

        SlotApi.setSlotApiBaseUrl(CONFIG.API_BASE_URL);
        void this.loadFromBackend();
    }

    // ── Backend ───────────────────────────────────────────────────────

    private async loadFromBackend() {
        try {
            const data = await SlotApi.load();
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
        this.uiManager.spinButton.alpha = 0.6;

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
                ? await SlotApi.playFreeGame(this.betAmount)
                : await SlotApi.play(this.betAmount);

            this.balance = data.balance;
            this.bonusSpins = data.free_spin?.count ?? 0;

            const grid = SlotApi.backendReelToGrid(data.slot.reel);
            const isBonusMode = isBonusSpin || this.autoSpinActive;

            this.spinOrchestrator.animateReels(grid, isBonusMode, async () => {
                this.reels.forEach((r) => { r.isFreeSpins = this.bonusSpins > 0; });

                const hasCascade = data.slot.cascaded && data.slot.cascaded.length > 0;
                const isEnteringFreeSpins =
                    !!data.free_spin && (data.free_spin.count ?? 0) > 0 && !this.vfxManager.isFreeSpinsTheme;
                const isExitingFreeSpins =
                    this.vfxManager.isFreeSpinsTheme && this.bonusSpins === 0;

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
                        this.balance += data.total_win;
                        this.sessionWins += data.total_win;
                        
                        const displayTotal = this.vfxManager.isFreeSpinsTheme ? this.sessionWins : this.lastSpinWin;
                        this.uiManager.updateTextValues(this.balance, displayTotal, this.bonusSpins);

                        if (!this.vfxManager.isFreeSpinsTheme) {
                            this.uiManager.winText.style.fontSize = 100;
                            this.uiManager.winText.text = `TOTAL WIN\n₱${Math.floor(data.total_win).toLocaleString()}`;
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
                    this.resolveSpinCompletion();
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
                        this.resolveSpinCompletion();
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
                    gsap.delayedCall(CONFIG.NORMAL_WIN_DELAY, () => { this.resolveSpinCompletion(); });
                    return;
                }

                if (isEnteringFreeSpins) {
                    this.running = true;
                    this.uiManager.spinButton.interactive = false;
                    this.uiManager.spinButton.alpha = 0.5;
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
                                    this.resolveSpinCompletion();
                                },
                            );
                        });
                    });
                    return;
                }

                this.resolveSpinCompletion();
            });
        } catch (e) {
            console.error("Backend process failure:", e);
            if (!isBonusSpin) this.balance += this.betAmount;
            this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
            this.resolveSpinCompletion();
        }
    }

    // ── Buy Free Spins ────────────────────────────────────────────────

    private openBuyFreeSpinsModal() {
        if (this.running || this.vfxManager.isFreeSpinsTheme) return;
        const cost = this.betAmount * CONFIG.BUY_COST_MULTIPLIER;
        if (this.balance < cost) return;
        this.uiManager.showBuyFreeSpinsModal(cost, () => { void this.confirmBuyFreeSpins(); });
    }

    private async confirmBuyFreeSpins() {
        if (this.running || this.vfxManager.isFreeSpinsTheme) return;

        let purchasedGrid: number[][] | null = null;
        let purchasedBalance: number | null = null;
        let purchasedFreeSpins: number | null = null;

        try {
            const data = await SlotApi.buyFreeGame(this.betAmount);
            purchasedBalance = data.balance;
            purchasedFreeSpins = data.free_spin?.count ?? 0;
            purchasedGrid = SlotApi.backendReelToGrid(data.slot.reel);
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
                                        this.resolveSpinCompletion();
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
        bg.x = padding + CONFIG.BACKGROUND_OFFSET_X;
        bg.y = padding + 10;
        this.backgroundContainer.addChild(bg);
    }

    private createReels() {
        const reelCount = CONFIG.REELS_COUNT;
        const totalWidth = CONFIG.CARD_WIDTH * reelCount + CONFIG.CARD_SPACING * (reelCount - 1);
        this.reelContainer.pivot.x = totalWidth / 2;
        this.reelContainer.pivot.y = CONFIG.CARD_HEIGHT / 2.2;
        this.reelContainer.x = CONFIG.REEL_OFFSET_X;
        this.reelContainer.y = CONFIG.REEL_OFFSET_Y;
        this.reelContainer.sortableChildren = true;

        const mask = new Graphics();
        mask.rect(
            -CONFIG.MASK_PX,
            -CONFIG.MASK_PY + CONFIG.MASK_OFFSET_Y,
            totalWidth + CONFIG.MASK_PX * 2,
            CONFIG.CARD_HEIGHT + CONFIG.MASK_PY * 2,
        );
        mask.fill(0xFF0000);
        this.reelContainer.addChild(mask);
        this.reelContainer.mask = mask;

        for (let i = 0; i < reelCount; i++) {
            const rc = new Container();
            rc.sortableChildren = true;
            rc.x = i * (CONFIG.CARD_WIDTH + CONFIG.CARD_SPACING);
            this.reelContainer.addChild(rc);
            this.reels.push(
                new Reel(rc, this.slotTextures, 3, CONFIG.SYMBOL_SIZE, CONFIG.SYMBOL_SPACING, CONFIG.CARD_WIDTH, CONFIG.CARD_HEIGHT),
            );
        }
    }

    handleResize() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        let scale = Math.min(screenWidth / CONFIG.DESIGN_WIDTH, screenHeight / CONFIG.DESIGN_HEIGHT);
        scale *= CONFIG.MACHINE_SCALE;
        this.mainContainer.scale.set(scale);
        this.mainContainer.x = screenWidth / 2 + CONFIG.SLOT_OFFSET_X * scale;
        this.mainContainer.y = screenHeight / 2 + CONFIG.SLOT_OFFSET_Y * scale;

        if (this.waterBg?.sprite) {
            this.waterBg.sprite.x = screenWidth / 2;
            this.waterBg.sprite.y = screenHeight / 2;
            this.waterBg.sprite.width = window.innerWidth;
            this.waterBg.sprite.height = window.innerHeight;
        }
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

    // ── Bet Input ─────────────────────────────────────────────────────

    private setupBetInput() {
        window.addEventListener("keydown", (e) => {
            if (!this.isEditingBet) return;
            if (e.key >= "0" && e.key <= "9") {
                let current = this.uiManager.betAmountText.text.replace("₱", "").replace("|", "");
                if (current === "0") current = "";
                if (current.length < 9) {
                    this.betAmount = parseInt(current + e.key);
                    this.uiManager.updateBetTextDisplay(`₱${this.betAmount}|`, true);
                    this.topUI.updateJackpots(this.betAmount);
                }
            } else if (e.key === "Backspace") {
                let current = this.uiManager.betAmountText.text.replace("₱", "").replace("|", "").slice(0, -1);
                if (current === "") current = "0";
                this.betAmount = parseInt(current);
                this.uiManager.updateBetTextDisplay(`₱${this.betAmount}|`, true);
                this.topUI.updateJackpots(this.betAmount);
            } else if (e.key === "Enter" || e.key === "Escape") {
                this.disableBetEditing();
            }
        });

        this.app.stage.eventMode = "static";
        this.app.stage.hitArea = this.app.screen;
        this.app.stage.on("pointerdown", (e) => {
            if (this.isEditingBet && e.target !== this.uiManager.betAmountText) {
                this.disableBetEditing();
            }
        });
    }

    private enableBetEditing() {
        if (this.running) return;
        this.isEditingBet = true;
        this.uiManager.updateBetTextDisplay(`₱${this.betAmount}|`, true);
    }

    private disableBetEditing() {
        this.isEditingBet = false;
        this.betAmount = Math.max(10, Math.min(1_000_000_000, this.betAmount));
        this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
        this.topUI.updateJackpots(this.betAmount);
    }

    private adjustBet(amount: number) {
        if (this.isEditingBet) this.disableBetEditing();
        this.betAmount = Math.max(10, Math.min(1_000_000_000, this.betAmount + amount));
        this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
        this.topUI.updateJackpots(this.betAmount);
    }

    // ── Spin Control ──────────────────────────────────────────────────

    startSpin(_fromAutoSpin = false) {
        if (this.isEditingBet) this.disableBetEditing();

        if (this.running) {
            this.isQuickSpin = true;
            this.spinOrchestrator.isQuickSpin = true;
            gsap.killTweensOf(this.uiManager.spinButton);
            gsap.fromTo(
                this.uiManager.spinButton.scale,
                { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 },
                { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.2, ease: "back.out(2)" },
            );
            this.reels.forEach((r) => {
                gsap.getTweensOf(r).forEach((tween) => tween.progress(1));
            });
            return;
        }

        this.isQuickSpin = false;
        this.spinOrchestrator.isQuickSpin = false;
        const isBonusSpin = this.bonusSpins > 0;
        if (!isBonusSpin && this.balance < this.betAmount) return;
        void this.spinFromBackend(isBonusSpin);
    }

    private startAutoSpin() {
        if (this.autoSpinActive) {
            this.haltUserAutoSpin();
        } else {
            this.autoSpinActive = true;
            this.autoSpinCount = CONFIG.AUTO_SPIN_LIMIT;

            if (this.bonusSpins > 0) {
                gsap.to(this.uiManager.spinButton, {
                    rotation: "+=" + Math.PI * 2, duration: 1.5, repeat: -1, ease: "none",
                });
            } else {
                this.uiManager.autoSpinButton.alpha = 0.8;
                gsap.to(this.uiManager.autoSpinButton, {
                    rotation: "+=" + Math.PI * 2, duration: 1.5, repeat: -1, ease: "none",
                });
            }
            this.autoSpinNext();
        }
    }

    private autoSpinNext() {
        if (!this.autoSpinActive || this.autoSpinCount <= 0) {
            this.haltUserAutoSpin();
            return;
        }
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

    private resolveSpinCompletion(): void {
        this.running = false;

        if (this.bonusSpins > 0) {
            this.uiManager.spinButton.interactive = true;
            this.uiManager.spinButton.alpha = 1;
            if (this.autoSpinActive) {
                gsap.to(this.uiManager.spinButton, {
                    rotation: "+=" + Math.PI * 2, duration: 1.5, repeat: -1, ease: "none", overwrite: "auto",
                });
                gsap.delayedCall(CONFIG.AUTO_SPIN_DELAY / 1000, () => {
                    if (this.autoSpinActive) this.startSpin(true);
                });
            } else {
                this.haltSpinButtonVisuals();
            }
            return;
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
}