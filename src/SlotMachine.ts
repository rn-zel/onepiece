import { Application, Container, Sprite, Texture, Graphics, AnimatedSprite, Text } from "pixi.js";
import { CONFIG } from "./Config";
import * as SlotApi from "./api/slotApi";
import type { BackendCascadeStep } from "./api/slotApi";
import { Reel } from "./Reel";
import gsap from "gsap"; 
import { UIManager } from "./UIManager";
import { VFXManager } from "./VFXManager";
import { SoundManager } from "./Sound";
import { LightningBorder } from "./animation/LightningBorder";
import { Starfield } from "./Starfield";
import { WaterBg } from "./animation/WaterBg";
import { LeftTopUI } from "./ui/lefttop";
import { TopUI } from "./ui/top";
import { TitleUI } from "./ui/title";
import { ModelUI } from "./ui/model";
import { ParticleEmitter } from "./services/ParticleEmitter";

import type { SymbolAnimation } from "./services/SymbolAnimation";

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
  bonusSpins: number = 0; // Always set from backend /load or /play responses
  sessionWins: number = 0;
  lastSpinWin: number = 0;
  
  running: boolean = false;
  isQuickSpin: boolean = false;
  autoSpinActive: boolean = false;
  autoSpinCount: number = 0;
  isEditingBet: boolean = false; 

  lightning: LightningBorder = new LightningBorder();
  starfield: Starfield;

  private symbolAnimator: SymbolAnimation;
  waterBg: any;

  private winPanel!: Container;
  private winPanelBg!: Graphics;
  private bonusPanel!: Container;
  private bonusPanelBg!: Graphics;
  private spinAuraSprite?: Sprite;

  constructor(
      app: Application, 
      textures: Texture[], 
      bgTexture: Texture, 
      starfield: Starfield,
      symbolAnimator: SymbolAnimation,
      waterBg: WaterBg
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
        this.waterBg 
    );
    this.uiManager = new UIManager(
        () => this.startSpin(),
        () => this.startAutoSpin(),
        () => this.openBuyFreeSpinsModal(),
        (amount) => this.adjustBet(amount),
        () => this.enableBetEditing()
    );
    
    // Setup particle emitter
    const particleContainer = new Container();
    particleContainer.zIndex = 15; // Above reels (10), below UI (100)
    this.mainContainer.addChild(particleContainer);
    this.particleEmitter = new ParticleEmitter(this.app, particleContainer);
    
    this.uiManager.container.zIndex = 100;
    this.mainContainer.addChild(this.uiManager.container);

    this.createWinPanel();
    this.createBonusPanel();

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
    this.vfxManager.setupBlackHole();
    this.setupBetInput(); 

    this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
    this.topUI.updateJackpots(this.betAmount);
    this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
    this.waterBg.play();

    SlotApi.setSlotApiBaseUrl(CONFIG.API_BASE_URL);
    void this.loadFromBackend();
  }

  //  DOMAIN DATA NORMALIZATION 
 
  private normalizeBackendGrid(rawGrid: number[][]): number[][] {
         return rawGrid;
  }

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

  private openBuyFreeSpinsModal() {
    if (this.running || this.vfxManager.isFreeSpinsTheme) return;

    const cost = this.betAmount * CONFIG.BUY_COST_MULTIPLIER;
    if (this.balance < cost) return;

    this.uiManager.showBuyFreeSpinsModal(cost, () => {
      void this.confirmBuyFreeSpins();
    });
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
        purchasedGrid = this.normalizeBackendGrid(SlotApi.backendReelToGrid(data.slot.reel));
      } catch (e) {
        console.error("Transaction exception during feature purchase:", e);
        return;
      }

    if (purchasedGrid) this.forceThreeScattersInView(purchasedGrid);
    if (typeof purchasedBalance === "number") this.balance = purchasedBalance;
    if (typeof purchasedFreeSpins === "number") this.bonusSpins = purchasedFreeSpins;

    this.playOneSpinAnimation(() => {
      this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
      this.playPurchasedScatterIntro();
    }, purchasedGrid);
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

  private playOneSpinAnimation(onDone: () => void, targetGrid?: number[][] | null) {
    this.soundManager.playSFX("sfx_spin");
    if (this.starfield) this.starfield.triggerWarp(true);

    // Emit spinning aura behind spin button
    if (this.spinAuraSprite) {
        gsap.killTweensOf(this.spinAuraSprite);
        if (this.spinAuraSprite.parent) this.spinAuraSprite.parent.removeChild(this.spinAuraSprite);
        this.spinAuraSprite.destroy();
    }
    // We add it directly to spinButton's parent if possible, so it rotates independently or with it
    this.spinAuraSprite = this.particleEmitter.emitAura(this.uiManager.spinButton);

    gsap.killTweensOf(this.uiManager.spinButton);
    
    gsap.fromTo(
      this.uiManager.spinButton.scale,
      { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 },
      { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.4, ease: "back.out(2)" }
    );

    if (this.bonusSpins > 0 || this.autoSpinActive) {
        gsap.to(this.uiManager.spinButton, {
            rotation: "+=" + (Math.PI * 2), duration: 1.5, repeat: -1, ease: "none", overwrite: "auto"
        });
    } else {
        gsap.to(this.uiManager.spinButton, {
            rotation: "+=" + (Math.PI * 100), duration: 2.5, ease: "power4.out",
            onComplete: () => {
                gsap.to(this.uiManager.spinButton, {
                    rotation: "+=" + (Math.PI * 2), duration: 15, repeat: -1, ease: "none", overwrite: "auto"
                });
            }
        });
    }

    this.clearActiveAnimations();

    this.reels.forEach((r) => {
      r.container.zIndex = 0;
      r.resetBrightness();
      r.symbols.forEach((s) => {
        gsap.killTweensOf(s);
        gsap.killTweensOf(s.scale);
        s.zIndex = 0;
        s.alpha = 1;
        s.rotation = 0;
      });
    });

    this.running = true;
    this.lastSpinWin = 0;
    this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
    this.uiManager.spinButton.alpha = 0.6;
    this.uiManager.spinButton.interactive = false;
    this.uiManager.winText.text = "";
    this.hideWinPanel();

    this.reels.forEach((r, i) => {
     
      const target = Math.round(r.position) + 30 + i * 4;

      r.targetPosition = target;
      r.finalGrid = targetGrid ? targetGrid[i] : null;

      r.blur.strengthX = 0;
      r.blur.strengthY = CONFIG.REEL_MAX_BLUR;

      const time = CONFIG.REEL_SPIN_DURATION + (i * 0.15); 

      gsap.to(r, {
        position: target,
        duration: time,
        ease: "power2.inOut",
        onUpdate: () => {
          r.updateSymbols();
          const remaining = target - r.position;
          const blurStrength = remaining <= CONFIG.REEL_BLUR_FADE_DIST
            ? Math.max(0, (remaining / CONFIG.REEL_BLUR_FADE_DIST) * CONFIG.REEL_MAX_BLUR)
            : CONFIG.REEL_MAX_BLUR;
          r.blur.strengthY = blurStrength;
        },
        onComplete: () => {
          r.blur.strengthY = 0;

          if (targetGrid) {
              const target = targetGrid[i];
              r.forceSetGrid(target);
          }

          // Clear priming state
          r.targetPosition = -1;
          r.finalGrid = null;

          // bounce 
          const originalY = r.container.y;
          gsap.fromTo(r.container, 
              { y: originalY - CONFIG.REEL_BOUNCE_OFFSET }, 
              { y: originalY, duration: CONFIG.REEL_BOUNCE_SPEED, ease: "back.out(1.5)" }
          );

          this.bounceSpecialSymbols(r);

          if (i === this.reels.length - 1) {
            // Clean up aura since spinning stopped
            if (this.spinAuraSprite) {
                gsap.to(this.spinAuraSprite, { alpha: 0, duration: 0.3, onComplete: () => {
                    gsap.killTweensOf(this.spinAuraSprite!);
                    if (this.spinAuraSprite!.parent) this.spinAuraSprite!.parent.removeChild(this.spinAuraSprite!);
                    this.spinAuraSprite!.destroy();
                    this.spinAuraSprite = undefined;
                }});
            }

            if (this.starfield) this.starfield.triggerWarp(false);
            if (targetGrid) this.applyVisibleGridIndices(targetGrid);
            onDone();
          }
        },
      });
    });
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

    // Stagger-pulse || pop + glow
    scatterSprites.forEach(({ sprite, reel }, i) => {
      gsap.delayedCall(0.1 + i * 0.22, () => {
        // Per-scatter
        this.soundManager.playSFX("sfx_win");
        gsap.timeline()
          .to(sprite.scale, { x: sprite.scale.x * 2.2, y: sprite.scale.y * 2.2, duration: 0.18, ease: "back.out(2)" })
          .to(sprite.scale, { x: sprite.scale.x * 1.5, y: sprite.scale.y * 1.5, duration: 0.25, ease: "power2.inOut" })
          .to(sprite, { alpha: 0.6, duration: 0.15, yoyo: true, repeat: 3, ease: "sine.inOut" }, ">")
          .to(sprite.scale, { x: sprite.scale.x * 1.8, y: sprite.scale.y * 1.8, duration: 0.3, ease: "elastic.out(1,0.4)" }, "<");

        // Trigger the animated win VFX overlay on the scatter
        this.animateSymbolToContainer(sprite, reel);
      });
    });

    const staggerDuration = 0.1 + scatterSprites.length * 0.22;

   
    const ANIM_FINISH_DELAY = 1.8; // SymbolAnimator overlay plays
    gsap.delayedCall(staggerDuration + ANIM_FINISH_DELAY, () => {
      // Quick reel flash to signal the transition
      this.reelContainer.alpha = 0;
      gsap.to(this.reelContainer, { alpha: 1, duration: 0.5, ease: "power2.out" });

      // Sound + panel slam happen at the same frame as the flash
      this.soundManager.playSFX("sfx_maxwin");

      const spinsText = this.bonusSpins > 0 ? `${this.bonusSpins} SPINS!` : "FREE SPINS!";
      this.uiManager.winText.text = `MEGA BONUS!\n\n${spinsText}`;
      this.uiManager.winText.style.fontSize = 100;
      this.uiManager.winText.style.fill = 0xFFD700;
      this.uiManager.winText.scale.set(0.01);
      this.showBonusPanel();

      // Text: slam in hard → elastic settle → gentle breathing loop
      gsap.to(this.uiManager.winText.scale, {
        x: 1.15, y: 1.15, duration: 0.25, ease: "back.out(3)",
        onComplete: () => {
          gsap.to(this.uiManager.winText.scale, {
            x: 1, y: 1, duration: 0.4, ease: "elastic.out(1, 0.5)",
            onComplete: () => {
              gsap.to(this.uiManager.winText.scale, {
                x: 1.04, y: 1.04, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut"
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
                    this.reels.forEach((r) => r.isFreeSpins = true);
                  },
                  () => {
                    this.haltUserAutoSpin();
                    this.running = false;
                    this.resolveSpinCompletion();
                  }
                );
              });
            }
          });
        }
      });
    });
  }


  private async spinFromBackend(isBonusSpin: boolean) {
    this.running = true;
    this.uiManager.spinButton.interactive = false;
    this.uiManager.spinButton.alpha = 0.6;
    
    // Emit spinning aura behind spin button
    if (this.spinAuraSprite) {
        gsap.killTweensOf(this.spinAuraSprite);
        if (this.spinAuraSprite.parent) this.spinAuraSprite.parent.removeChild(this.spinAuraSprite);
        this.spinAuraSprite.destroy();
    }
    this.spinAuraSprite = this.particleEmitter.emitAura(this.uiManager.spinButton);

    // click bounce -> continuous slow rotation
    gsap.killTweensOf(this.uiManager.spinButton);
    gsap.fromTo(this.uiManager.spinButton.scale, 
        { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 }, 
        { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.2, ease: "back.out(2)" }
    );
    gsap.to(this.uiManager.spinButton, { 
        rotation: "+=" + (Math.PI * 2), 
        duration: 2.0, 
        repeat: -1, 
        ease: "none",
        overwrite: "auto"
    });

    // VISUAL RESET 
    // Clear wins from the previous spin before re spin the reels
    gsap.killTweensOf(this.uiManager.winText.scale);
    this.hideWinPanel();
    this.reels.forEach((r) => r.symbols.forEach((s) => { 
        s.tint = 0xFFFFFF; 
        s.zIndex = 0; 
        s.scale.set((s as any).baseScale || 1); 
    }));
    this.clearActiveAnimations();

    this.uiManager.winText.text = "";
    this.lastSpinWin = 0;
    this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

    try {
      const data = isBonusSpin ? await SlotApi.playFreeGame(this.betAmount) : await SlotApi.play(this.betAmount);
      
      this.balance = data.balance;
      this.bonusSpins = data.free_spin?.count ?? 0;
      
      // Parse & Transpose Backend Grid
      const grid = this.normalizeBackendGrid(SlotApi.backendReelToGrid(data.slot.reel));

      this.playOneSpinAnimation(async () => {
        this.reels.forEach((r) => { r.isFreeSpins = this.bonusSpins > 0; });

        const hasCascade = data.slot.cascaded && data.slot.cascaded.length > 0;
        const isEnteringFreeSpins = !!data.free_spin && (data.free_spin.count ?? 0) > 0 && !this.vfxManager.isFreeSpinsTheme;
        const isExitingFreeSpins = this.vfxManager.isFreeSpinsTheme && this.bonusSpins === 0;

        if (hasCascade) {
          console.log("CASCADE DETECTED FROM BACKEND:", data.slot.cascaded);
          this.running = true;
          this.uiManager.spinButton.interactive = false;
          this.uiManager.spinButton.alpha = 0.6;
          await this.playCascadeSequenceFromBackend(data.slot.cascaded!, data.total_win, data.win);
          return;
        }

        if (data.total_win > 0) {
          const winningPositions = data.slot.winnings?.flatMap(w => w.positions?.map(p => ({ reel: p.column, row: p.row })) || []) || [];

          gsap.delayedCall(0, () => {
            this.soundManager.playSFX("sfx_win");
            
            // Only trigger coins for wins above 0, scale amount by win size
            const isBigWin = data.total_win >= this.betAmount * 1;
            const coinCount = isBigWin ? 100 : 30;
            this.particleEmitter.burst(CONFIG.PARTICLE_ORIGIN_X, CONFIG.PARTICLE_ORIGIN_Y, coinCount);

            this.reels.forEach((r) => r.symbols.forEach((s) => (s.tint = 0x555555)));
            this.reels.forEach(r => r.resetBrightness());
            for (const p of winningPositions) {
                const reel = this.reels[p.reel];
                if (!reel) continue;
                reel.setBrightness(p.row, 2);
                const symbolSprite = reel.getSymbolAtRow(p.row);
                if (symbolSprite) {
                    symbolSprite.zIndex = 100;
                    reel.container.zIndex = 100;
                    this.animateSymbolToContainer(symbolSprite, reel);
                    
                    // Emit light glow around winning symbols
                    const globalPos = symbolSprite.getGlobalPosition();
                    const localEmitPos = this.particleEmitter.container.toLocal(globalPos);
                    this.particleEmitter.emitGlow(localEmitPos.x, localEmitPos.y, 10);
                }
            }
          });

          this.sessionWins += data.total_win;
          this.lastSpinWin = data.total_win;
          this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

          if (isBonusSpin) {
            // Accumulate silently — grand total shown only when all spins are done.
            this.resolveSpinCompletion();
            return;
          }

          // Normal spin win panel
          this.uiManager.winText.style.fontSize = 100;
          this.uiManager.winText.text = `WIN ₱${Math.floor(data.total_win).toLocaleString()}`;
          this.uiManager.winText.style.fill = 0xffd700;
          this.uiManager.winText.scale.set(0.01);
          this.showWinPanel(0.8);
          
          gsap.delayedCall(0.5 + 0.8, () => {
             gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: CONFIG.PANEL_POPUP_SPEED, ease: "back.out(1.7)" });
          });

          gsap.delayedCall(CONFIG.NORMAL_WIN_DELAY, () => {
            
             this.resolveSpinCompletion();
          });
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
            this.showWinPanel();
            gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 1, ease: "back.out(1)" });
            gsap.delayedCall(2, () => {
                this.vfxManager.playBlackHoleTransition(false, () => {
                this.vfxManager.swapTheme(false, this.reels);
                this.uiManager.toggleButtonTheme(false);
                this.leftTopUI.setTheme(false);
                this.titleUI.setTheme(false);
                this.modelUI.setTheme(false);
                this.uiManager.winText.text = "";
                this.hideWinPanel();
              }, () => {
                this.sessionWins = 0;
                this.resolveSpinCompletion();
              });
            });
          });
          return;
        }

        this.resolveSpinCompletion();

      }, grid);

    } catch (e) {
      console.error("Backend process failure:", e);
      if (!isBonusSpin) this.balance += this.betAmount;
      this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
      this.resolveSpinCompletion();
    }
  }

  private async playCascadeSequenceFromBackend(
    cascaded: BackendCascadeStep[],
    totalWin: number,
    initialWin: number
  ) {
    this.reels.forEach((r) => r.symbols.forEach((s) => { s.tint = 0x555555; s.alpha = 1; }));

    let accumulatedWin = 0;

    const stepsToPlay: any[] = [];
    
    //  The base win that triggers the first drop
    if (initialWin > 0 && cascaded.length > 0) {
        stepsToPlay.push({
            win: initialWin,
            multiplier: 1,
            cascades: cascaded[0].cascades, // Glow and explode these on the current grid
            rng: cascaded[0].rng            // Drop to this grid
        });
    }

    // Subsequent steps
    for (let i = 0; i < cascaded.length - 1; i++) {
        if (cascaded[i].win > 0) {
            stepsToPlay.push({
                win: cascaded[i].win,
                multiplier: cascaded[i].multiplier,
                cascades: cascaded[i+1].cascades, // Glow and explode these
                rng: cascaded[i+1].rng            // Drop to this grid
            });
        }
    }

    for (let i = 0; i < stepsToPlay.length; i++) {
      const step = stepsToPlay[i];
      let winningPositions = step.cascades.map((c: any) => ({ reel: c.column, row: c.row }));
      if (winningPositions.length === 0) continue;

      const stepPayout = step.win * (step.multiplier ?? 1);
      accumulatedWin += stepPayout;
      this.lastSpinWin = accumulatedWin;
      this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

      this.hideWinPanel();

      this.reels.forEach((r) => r.symbols.forEach((s) => s.tint = 0x555555));

      for (const p of winningPositions) {
        const reel = this.reels[p.reel];
        if (!reel) continue;
        reel.setBrightness(p.row, 2); // Brighten and scale up the winners
        const sprite = reel.getSymbolAtRow(p.row);
        sprite.zIndex = 100;
        reel.container.zIndex = 100;
        this.animateSymbolToContainer(sprite, reel);
        
        // Emit glow around cascade winners
        const globalPos = sprite.getGlobalPosition();
        const localEmitPos = this.particleEmitter.container.toLocal(globalPos);
        this.particleEmitter.emitGlow(localEmitPos.x, localEmitPos.y, 10);
      }

      if (winningPositions.length > 0) {
        winningPositions.sort((a: {reel: number, row: number}, b: {reel: number, row: number}) => a.reel - b.reel);
        const centerPos = winningPositions[Math.floor(winningPositions.length / 2)];
        
        const reel = this.reels[centerPos.reel];
        if (reel) {
            const sprite = reel.getSymbolAtRow(centerPos.row);
            const globalPos = sprite.getGlobalPosition();
            const localPos = this.uiManager.container.toLocal(globalPos);

            const winContainer = new Container();
            winContainer.position.set(localPos.x, localPos.y - 15);
            winContainer.zIndex = 200;
            winContainer.scale.set(0.01);

            const winBgGraphics = new Graphics();
            winBgGraphics.roundRect(-100, -35, 200, 70, 20);
            winBgGraphics.fill({ color: 0x000000, alpha: 0.85 });
            winBgGraphics.stroke({ color: 0xffd700, width: 3, alpha: 0.8 });
            winContainer.addChild(winBgGraphics);

            const winText = new Text({
              text: `₱${Math.floor(stepPayout).toLocaleString()}`,
              style: { fill: 0xffd700, fontSize: 45, fontWeight: "bold", stroke: { color: 0x000000, width: 4 } },
            });
            winText.anchor.set(0.5);
            winText.position.set(0, 0);
            winContainer.addChild(winText);
            
            this.uiManager.container.addChild(winContainer);
            gsap.to(winContainer.scale, { x: 1, y: 1, duration: CONFIG.WIN_TEXT_POPUP_SPEED, ease: "back.out(2)" });
            gsap.to(winContainer, { alpha: 0, duration: 0.5, delay: CONFIG.CASCADE_WIN_DELAY, onComplete: () => winContainer.destroy() });

            const isBigWin = stepPayout >= this.betAmount * 1;
            const coinCount = isBigWin ? 100 : 30;
            gsap.delayedCall(0, () => {
                 this.particleEmitter.burst(CONFIG.PARTICLE_ORIGIN_X, CONFIG.PARTICLE_ORIGIN_Y, coinCount);
            });

            // Only spawn the multiplier pill if it is > 1
            if (step.multiplier > 1) {
                const multContainer = new Container();
                multContainer.position.set(localPos.x, localPos.y + 50);
                multContainer.zIndex = 200;
                multContainer.scale.set(0.01);

                const multBgGraphics = new Graphics();
                multBgGraphics.roundRect(-70, -30, 140, 60, 20);
                multBgGraphics.fill({ color: 0x000000, alpha: 0.85 });
                multBgGraphics.stroke({ color: 0x00ffcc, width: 3, alpha: 0.8 });
                multContainer.addChild(multBgGraphics);

                const multText = new Text({
                  text: `x${step.multiplier}`,
                  style: { fill: 0x00ffcc, fontSize: 40, fontWeight: "bold", stroke: { color: 0x000000, width: 4 } },
                });
                multText.anchor.set(0.5);
                multText.position.set(0, 0);
                multContainer.addChild(multText);

                this.uiManager.container.addChild(multContainer);
                gsap.to(multContainer.scale, { x: 1, y: 1, duration: CONFIG.WIN_TEXT_POPUP_SPEED, delay: CONFIG.CASCADE_MULT_SPAWN_DELAY, ease: "back.out(2)" });
                gsap.to(multContainer, { alpha: 0, duration: 0.5, delay: CONFIG.CASCADE_WIN_DELAY + CONFIG.CASCADE_MULT_SPAWN_DELAY, onComplete: () => multContainer.destroy() });
            }
        }
      }
      
      await this.tweenToEnd(gsap.to({}, { duration: 2.0 }));

      const breakTweens: gsap.core.Tween[] = [];
      for (const p of winningPositions) {
        const reel = this.reels[p.reel];
        if (!reel) continue;
        const sprite = reel.getSymbolAtRow(p.row);
        const baseScale = (sprite as any).baseScale || sprite.scale.x || 1;
        breakTweens.push(gsap.to(sprite, { alpha: 0, duration: 0.25, ease: "power2.out" }));
        breakTweens.push(gsap.to(sprite.scale, { x: baseScale * 0.8, y: baseScale * 0.8, duration: 0.25, ease: "power2.out" }));
        
        // Emit dust explosion when cascade symbol breaks
        const globalPos = sprite.getGlobalPosition();
        const localEmitPos = this.particleEmitter.container.toLocal(globalPos);
        this.particleEmitter.emitDust(localEmitPos.x, localEmitPos.y, 25);
      }
      await Promise.all(breakTweens.map((t) => this.tweenToEnd(t)));
      this.clearActiveAnimations();
      
      if (step.rng) {
          const gridAfterDrop = this.normalizeBackendGrid(SlotApi.backendReelToGrid(step.rng));
          const beforeGrid = this.getVisibleGridIndices();
          await this.animateCascadeDrop(beforeGrid, gridAfterDrop, winningPositions);
      }
      
      this.reels.forEach((r) => r.symbols.forEach((s) => { s.tint = 0x555555; s.zIndex = 0; s.scale.set((s as any).baseScale || 1); }));
    }

    if (totalWin > 0) {
      this.balance += totalWin;
      this.sessionWins += totalWin;
      this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

      // In free spin mode, accumulate silently — grand total shown at exit only.
      if (!this.vfxManager.isFreeSpinsTheme) {
        this.uiManager.winText.style.fontSize = 100;
        this.uiManager.winText.text = `TOTAL WIN\n₱${Math.floor(totalWin).toLocaleString()}`;
        this.uiManager.winText.style.fill = 0xffd700;
        this.uiManager.winText.scale.set(0.01);
        this.showWinPanel(1);
        gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: CONFIG.PANEL_POPUP_SPEED, ease: "back.out(1.7)" });

        await this.tweenToEnd(gsap.to({}, { duration: CONFIG.TOTAL_WIN_PANEL_DELAY }));
        this.hideWinPanel();
      }
    }

    this.reels.forEach((r) => r.symbols.forEach((s) => { s.tint = 0xFFFFFF; s.zIndex = 0; s.scale.set((s as any).baseScale || 1); }));
    this.resolveSpinCompletion();
  }

  private setupBackground() {
    const padding = -10;
    const bg = new Sprite(this.backgroundTexture);
    
    bg.anchor.set(0.5); 
    bg.width = 1920 + (padding * 2);
    bg.height = 1080 + (padding * 2);
    bg.x = padding + CONFIG.BACKGROUND_OFFSET_X;
    bg.y = padding + 10;
    
    this.backgroundContainer.addChild(bg);
  }

  private createReels() {
    const reelCount = CONFIG.REELS_COUNT;
    const totalWidth = (CONFIG.CARD_WIDTH * reelCount) + (CONFIG.CARD_SPACING * (reelCount - 1));
    this.reelContainer.pivot.x = totalWidth / 2;
    this.reelContainer.pivot.y = CONFIG.CARD_HEIGHT / 2.2;
    this.reelContainer.x = CONFIG.REEL_OFFSET_X;
    this.reelContainer.y = CONFIG.REEL_OFFSET_Y; 
    this.reelContainer.sortableChildren = true;

    const mask = new Graphics();
    const paddingX = CONFIG.MASK_PX; 
    const paddingY = CONFIG.MASK_PY; 

    mask.rect(
        -paddingX,
        -paddingY + CONFIG.MASK_OFFSET_Y,
        totalWidth + (paddingX * 2),
        CONFIG.CARD_HEIGHT + (paddingY * 2)
    );
    mask.fill(0xFF0000);
    this.reelContainer.addChild(mask);
    this.reelContainer.mask = mask;

    for (let i = 0; i < reelCount; i++) {
      const rc = new Container();
      rc.sortableChildren = true;
      rc.x = i * (CONFIG.CARD_WIDTH + CONFIG.CARD_SPACING);
      this.reelContainer.addChild(rc);
      const reel = new Reel(rc, this.slotTextures, 3, CONFIG.SYMBOL_SIZE, CONFIG.SYMBOL_SPACING, CONFIG.CARD_WIDTH, CONFIG.CARD_HEIGHT);
      this.reels.push(reel);
    }
  }

  handleResize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const offsetX = CONFIG.SLOT_OFFSET_X;
    const offsetY = CONFIG.SLOT_OFFSET_Y;

    let scale = Math.min(screenWidth / CONFIG.DESIGN_WIDTH, screenHeight / CONFIG.DESIGN_HEIGHT);
    scale *= CONFIG.MACHINE_SCALE;
    this.mainContainer.scale.set(scale);

    this.mainContainer.x = screenWidth / 2 + offsetX * scale; 
    this.mainContainer.y = screenHeight / 2 + offsetY * scale;

    if (this.waterBg && this.waterBg.sprite) {
        this.waterBg.sprite.x = screenWidth / 2;
        this.waterBg.sprite.y = screenHeight / 2;
        this.waterBg.sprite.width = window.innerWidth;
        this.waterBg.sprite.height = window.innerHeight;
    }

    this.vfxManager.handleResize();
  }

  private setupBetInput() {
    window.addEventListener("keydown", (e) => {
        if (!this.isEditingBet) return;
        if (e.key >= "0" && e.key <= "9") {
            let currentBetStr = this.uiManager.betAmountText.text.replace("₱", "").replace("|", "");
            if (currentBetStr === "0") currentBetStr = "";
            if (currentBetStr.length < 9) {
                const newBetStr = currentBetStr + e.key;
                this.betAmount = parseInt(newBetStr);
                this.uiManager.updateBetTextDisplay(`₱${this.betAmount}|`, true); 
                this.topUI.updateJackpots(this.betAmount);
            }
        } 
        else if (e.key === "Backspace") {
            let currentBetStr = this.uiManager.betAmountText.text.replace("₱", "").replace("|", "");
            currentBetStr = currentBetStr.slice(0, -1);
            if (currentBetStr === "") currentBetStr = "0";
            this.betAmount = parseInt(currentBetStr);
            this.uiManager.updateBetTextDisplay(`₱${this.betAmount}|`, true);
            this.topUI.updateJackpots(this.betAmount);
        }
        else if (e.key === "Enter" || e.key === "Escape") {
            this.disableBetEditing();
        }
    });

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e) => {
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
      this.betAmount = Math.max(10, Math.min(1000000000, this.betAmount));
      this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`); 
      this.topUI.updateJackpots(this.betAmount);
  }

  private adjustBet(amount: number) {
    if (this.isEditingBet) this.disableBetEditing();
    this.betAmount = Math.max(10, Math.min(1000000000, this.betAmount + amount));
    this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`); 
    this.topUI.updateJackpots(this.betAmount);
  } 

  private startAutoSpin() {
    if (this.autoSpinActive) {
      this.haltUserAutoSpin();
    } else {
      this.autoSpinActive = true;
      this.autoSpinCount = CONFIG.AUTO_SPIN_LIMIT;
      
      if (this.bonusSpins > 0) {
          gsap.to(this.uiManager.spinButton, { 
              rotation: "+=" + (Math.PI * 2), duration: 1.5, repeat: -1, ease: "none" 
          });
      } else {
          this.uiManager.autoSpinButton.alpha = 0.8; 
          gsap.to(this.uiManager.autoSpinButton, { 
              rotation: "+=" + (Math.PI * 2), duration: 1.5, repeat: -1, ease: "none" 
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
    if (!this.running){
      this.autoSpinCount--;
      this.startSpin(true);
    }
  }

  startSpin(_fromAutoSpin = false) {
    if (this.isEditingBet) this.disableBetEditing();

  
    if (this.running) {
        this.isQuickSpin = true; 
        gsap.killTweensOf(this.uiManager.spinButton);
        gsap.fromTo(this.uiManager.spinButton.scale, 
            { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 }, 
            { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.2, ease: "back.out(2)" }
        );
        this.reels.forEach(r => {
            gsap.getTweensOf(r).forEach(tween => tween.progress(1));
        });
        return;
    }
    
    this.isQuickSpin = false; 
    const isBonusSpin = this.bonusSpins > 0;
    if (!isBonusSpin && this.balance < this.betAmount) return;

    void this.spinFromBackend(isBonusSpin);
  }

  private resolveSpinCompletion(): void {
      this.running = false;

      if (this.bonusSpins > 0) {
          this.uiManager.spinButton.interactive = true;
          this.uiManager.spinButton.alpha = 1;

          if (this.autoSpinActive) {
              gsap.to(this.uiManager.spinButton, { 
                  rotation: "+=" + (Math.PI * 2), 
                  duration: 1.5, 
                  repeat: -1, 
                  ease: "none", 
                  overwrite: "auto" 
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
                  rotation: "+=" + (Math.PI * 2), 
                  duration: 1.5, 
                  repeat: -1, 
                  ease: "none", 
                  overwrite: "auto" 
              });

              gsap.delayedCall(CONFIG.AUTO_SPIN_DELAY / 1000, () => {
                  this.autoSpinNext();
              });
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
      // We don't reset to 0, just let it stop where it is or smoothly decelerate slightly
      const currentRotation = this.uiManager.spinButton.rotation;
      gsap.to(this.uiManager.spinButton, { rotation: currentRotation + 0.2, duration: 0.3, ease: "power2.out" });
  }


  private animateSymbolToContainer(symbolSprite: Sprite, reel: Reel) {
      const symbolIndex = this.slotTextures.indexOf(symbolSprite.texture);
      this.symbolAnimator.play(symbolIndex, symbolSprite, reel, this.activeAnimations, this.isQuickSpin);
  }

  private getVisibleGridIndices(): number[][] {
      const grid: number[][] = [];
      for (let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
          const reel = this.reels[reelIndex];
          const col: number[] = [];
          for (let row = 0; row < 3; row++) {
              const sprite = reel.getSymbolAtRow(row);
              col.push(this.slotTextures.indexOf(sprite.texture));
          }
          grid.push(col);
      }
      return grid;
  }

  private applyVisibleGridIndices(grid: number[][]) {
      for (let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
          const reel = this.reels[reelIndex];
          for (let row = 0; row < 3; row++) {
              const idx = grid[reelIndex]?.[row];
              if (typeof idx === "number" && idx >= 0) {
                  reel.setSymbolIndexAtRow(row, idx);
              }
          }
          reel.resetBrightness();
      }
  }



  private bounceSpecialSymbols(reel: Reel) {
      for (let row = 0; row < 3; row++) {
          const sprite = reel.getSymbolAtRow(row);
          const index = this.slotTextures.indexOf(sprite.texture);
          
          if (index === 8 || index === 9) {
              const baseScale = (sprite as any).baseScale || 1;
              sprite.zIndex = 50; 
              reel.container.zIndex = 50;
              
              gsap.to(sprite.scale, {
                  x: baseScale * 1.1, y: baseScale * 1.1, duration: 0.2, yoyo: true, repeat: 1, delay: 0.1, ease: "back.out(2)",
                  onComplete: () => {
                    sprite.scale.set(baseScale);
                      sprite.zIndex = 0; 
                  }
              });
          }
      }
  }

  private async setupLightning() {
      await this.lightning.init();
      if (this.lightning.sprite) {
          this.uiManager.container.addChild(this.lightning.sprite);
          this.lightning.sprite.zIndex = 10; 
          this.lightning.sprite.eventMode = "none";
      }
  }

  private createWinPanel() {
      const parent = this.uiManager.winText.parent;
      if (!parent) return;

      const originalPosition = this.uiManager.winText.position.clone();

      this.winPanel = new Container();
      this.winPanel.zIndex = 150;
      this.winPanel.position.copyFrom(originalPosition);
      this.winPanel.visible = false;
      this.winPanel.alpha = 0;

      const bgWidth = 900;
      const bgHeight = 260;

      this.winPanelBg = new Graphics()
          .roundRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 40)
          .fill({ color: 0x000000, alpha: 0.92 })
          .stroke({ color: 0xffd700, width: 6, alpha: 0.9 });

      const inner = new Graphics()
          .roundRect(-bgWidth / 2 + 10, -bgHeight / 2 + 10, bgWidth - 20, bgHeight - 20, 30)
          .fill({ color: 0x000000, alpha: 0.9 });

      this.winPanel.addChild(this.winPanelBg);
      this.winPanel.addChild(inner);

      parent.removeChild(this.uiManager.winText);
      this.uiManager.winText.position.set(0, 0);
      this.winPanel.addChild(this.uiManager.winText);

      parent.addChild(this.winPanel);
  }

  private createBonusPanel() {
      const parent = this.uiManager.container;
      if (!this.winPanel) return;

      this.bonusPanel = new Container();
      this.bonusPanel.zIndex = 160;
      this.bonusPanel.position.copyFrom(this.winPanel.position);
      this.bonusPanel.visible = false;
      this.bonusPanel.alpha = 0;

      const bgWidth = 1800;
      const bgHeight = 980;

      this.bonusPanelBg = new Graphics()
          .roundRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 48)
          .fill({ color: 0x000000, alpha: 0.95 })
          .stroke({ color: 0x000000, width: 7, alpha: 1 });

      const innerGlow = new Graphics()
          .roundRect(-bgWidth / 2 + 12, -bgHeight / 2 + 12, bgWidth - 24, bgHeight - 24, 32)
          .fill({ color: 0x000000, alpha: 0.95 });

      this.bonusPanel.addChild(this.bonusPanelBg);
      this.bonusPanel.addChild(innerGlow);

      parent.addChild(this.bonusPanel);
  }

  private showWinPanel(delay: number = 0) {
      if (!this.winPanel) return;
      if (this.bonusPanel) this.bonusPanel.visible = false;

      if (this.uiManager.winText.parent !== this.winPanel) {
          this.uiManager.winText.parent?.removeChild(this.uiManager.winText);
          this.uiManager.winText.position.set(0, 0);
          this.winPanel.addChild(this.uiManager.winText);
      }
      this.winPanel.visible = true;
      gsap.killTweensOf(this.winPanel);
      gsap.killTweensOf(this.winPanel.scale);
      
      this.winPanel.alpha = 0;
      this.winPanel.scale.set(0.01);
      
      gsap.to(this.winPanel, { alpha: 1, duration: 0.25, delay: delay, ease: "power2.out" });
      gsap.to(this.winPanel.scale, { x: 1, y: 1, duration: CONFIG.PANEL_POPUP_SPEED, delay: delay, ease: "back.out(1.7)" });
  }

  private hideWinPanel() {
      const panels: Container[] = [];
      if (this.winPanel) panels.push(this.winPanel);
      if (this.bonusPanel) panels.push(this.bonusPanel);

      panels.forEach(panel => {
          gsap.killTweensOf(panel);
          gsap.killTweensOf(panel.scale);

          gsap.to(panel, {
              alpha: 0, duration: 0.2, ease: "power2.in",
              onComplete: () => {
                  panel.visible = false;
                  panel.scale.set(1);
              },
          });
      });
  }

  private showBonusPanel() {
      if (!this.bonusPanel) return;
      if (this.winPanel) this.winPanel.visible = false;

      if (this.uiManager.winText.parent !== this.bonusPanel) {
          this.uiManager.winText.parent?.removeChild(this.uiManager.winText);
          this.uiManager.winText.position.set(0, 0);
          this.bonusPanel.addChild(this.uiManager.winText);
      }

      this.bonusPanel.visible = true;
      this.bonusPanel.alpha = 0;
      this.bonusPanel.scale.set(0.5);

      gsap.killTweensOf(this.bonusPanel);
      gsap.killTweensOf(this.bonusPanel.scale);

      // Slam in immediately 
      gsap.to(this.bonusPanel, { alpha: 1, duration: 0.2, ease: "power3.out" });
      gsap.to(this.bonusPanel.scale, {
          x: 1.08, y: 1.08, duration: 0.2, ease: "back.out(3)",
          onComplete: () => {
              // Settle + gentle loop shake
              gsap.to(this.bonusPanel.scale, { x: 1, y: 1, duration: 0.3, ease: "elastic.out(1,0.5)" });
              gsap.to(this.bonusPanel, {
                  x: this.bonusPanel.x + 4, duration: 0.07,
                  yoyo: true, repeat: 5, ease: "sine.inOut",
                  onComplete: () => { this.bonusPanel.x = 0; }
              });
          }
      });
  }

  private clearActiveAnimations() {
      this.activeAnimations.forEach(anim => {
          gsap.killTweensOf(anim);
          if (anim.parent) anim.parent.removeChild(anim);
          anim.destroy();
      });
      this.activeAnimations = [];
  }

  private tweenToEnd(tween: gsap.core.Tween | gsap.core.Timeline) {
      return new Promise<void>((resolve) => {
          tween.eventCallback("onComplete", () => resolve());
      });
  }

  private setSpriteToSymbolIndex(reel: Reel, sprite: Sprite, symbolIndex: number) {
      const texture = this.slotTextures[symbolIndex];
      if (!texture) return;

      sprite.texture = texture;
      const availableWidth = reel.cardWidth - (CONFIG.SYMBOL_MARGIN * 2);
      const scale = Math.min(availableWidth / texture.width, reel.symbolSize / texture.height);
      sprite.scale.set(scale);
      (sprite as any).baseScale = scale;
      sprite.alpha = 1;
      sprite.rotation = 0;
  }

  private async animateCascadeDrop(
      beforeGrid: number[][],
      afterGrid: number[][],
      winningPositions: { reel: number; row: number }[]
  ) {
      const removedByReel = new Map<number, number[]>();
      for (const p of winningPositions) {
          const arr = removedByReel.get(p.reel) ?? [];
          arr.push(p.row);
          removedByReel.set(p.reel, arr);
      }
      for (const [reelIndex, rows] of removedByReel) {
          rows.sort((a, b) => a - b);
          removedByReel.set(reelIndex, Array.from(new Set(rows)));
      }

      const tweens: gsap.core.Tween[] = [];
      let totalDrops = 0;

      for (let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
          const reel = this.reels[reelIndex];
          const removedRows = removedByReel.get(reelIndex) ?? [];
          if (removedRows.length === 0) continue;

          const symbolHeight = reel.symbolSize + reel.symbolSpacing;
          const rowSprites: Sprite[] = [
              reel.getSymbolAtRow(0),
              reel.getSymbolAtRow(1),
              reel.getSymbolAtRow(2),
          ];

          const keptOldRows = [0, 1, 2].filter((r) => !removedRows.includes(r));
          const keptValues = keptOldRows.map((r) => beforeGrid[reelIndex][r]);
          const keptCount = keptValues.length;

          for (let k = 0; k < keptCount; k++) {
              const oldRow = keptOldRows[k];
              const newRow = 3 - keptCount + k;
              const sprite = rowSprites[oldRow];
              const baseScale = (sprite as any).baseScale || sprite.scale.x || 1;
              sprite.alpha = 1;
              sprite.scale.set(baseScale);
              sprite.tint = 0xFFFFFF;
              if (newRow >= 0 && newRow < 3) {
                  totalDrops++;
                  tweens.push(
                      gsap.to(sprite, { y: newRow * symbolHeight, duration: CONFIG.SYMBOL_DROP_SPEED, ease: "power2.out" })
                  );
              }
          }

          const newRowsCount = 3 - keptCount;
          for (let newRow = 0; newRow < newRowsCount; newRow++) {
              const sprite = rowSprites[removedRows[newRow] ?? removedRows[0]];
              const symbolIndex = afterGrid[reelIndex][newRow];
              this.setSpriteToSymbolIndex(reel, sprite, symbolIndex);
              sprite.tint = 0xFFFFFF;
              sprite.y = -symbolHeight * (newRowsCount - newRow);
              tweens.push(
                  gsap.to(sprite, { y: newRow * symbolHeight, duration: CONFIG.SYMBOL_DROP_SPEED + 0.06, ease: "power2.out" })
              );
          }
      }

      await Promise.all(tweens.map((t) => this.tweenToEnd(t)));
      this.applyVisibleGridIndices(afterGrid);
  }
}