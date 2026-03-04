import { Application, Container, Sprite, Texture, Graphics, AnimatedSprite, Text } from "pixi.js";
import { CONFIG, PAYOUTS } from "./Config";
import * as SlotApi from "./api/slotApi";
import type { BackendCascadeStep } from "./api/slotApi";
import { Reel } from "./Reel";
import gsap from "gsap"; 
import { UIManager } from "./UIManager";
import { VFXManager } from "./VFXManager";
import { WinManager } from "./WinManager";
import { SoundManager } from "./Sound";
import { LightningBorder } from "./animation/LightningBorder";
import { Starfield } from "./Starfield";
import { WaterBg } from "./animation/WaterBg";
import { LeftTopUI } from "./ui/lefttop";
import { TitleUI } from "./ui/title";
import { PaylineWinEvaluator } from "./domain/wins/PaylineWinEvaluator";
import { Ways243WinEvaluator } from "./domain/wins/Ways243WinEvaluator";
import { SYMBOL } from "./domain/wins/symbols";
import { ConfigPaytable } from "./domain/wins/ConfigPaytable";
import type { WinEvaluator } from "./domain/wins/types";

import type { SymbolAnimation } from "./services/SymbolAnimation";

export class SlotMachine {
  app: Application;
  mainContainer = new Container();
  backgroundContainer = new Container();
  reelContainer = new Container();
  
  uiManager!: UIManager;
  leftTopUI: LeftTopUI;
  titleUI: TitleUI;
  vfxManager!: VFXManager;
  winManager!: WinManager;
  private paylineEvaluator!: WinEvaluator;
  private waysEvaluator!: WinEvaluator;
  soundManager: SoundManager = new SoundManager();

  reels: Reel[] = [];
  activeAnimations: AnimatedSprite[] = [];

  // Game State
  slotTextures: Texture[];
  backgroundTexture: Texture;
  balance: number = PAYOUTS.CURRENT_BALANCE;
  betAmount: number = PAYOUTS.BET_AMOUNT;
  bonusSpins: number = PAYOUTS.FREE_SPIN_COUNT;
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
    
    // Save our injected service!
    this.symbolAnimator = symbolAnimator;
    
    this.soundManager.init();
    this.soundManager.playBGM(false);

    this.mainContainer.sortableChildren = true;
    this.app.stage.addChild(this.mainContainer);
    this.mainContainer.addChild(this.backgroundContainer);
    this.mainContainer.addChild(this.reelContainer);

    this.setupLightning();
    this.winManager = new WinManager(this.slotTextures);
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
        (amount) => this.adjustBet(amount),
        () => this.enableBetEditing()
    );
    this.uiManager.container.zIndex = 100;
    this.mainContainer.addChild(this.uiManager.container);

    // Domain win evaluation wiring (SOLID: inject shared paytable into evaluators)
    const paytable = new ConfigPaytable();
    this.paylineEvaluator = new PaylineWinEvaluator(paytable);
    this.waysEvaluator = new Ways243WinEvaluator(paytable);

    this.leftTopUI = new LeftTopUI();
    this.leftTopUI.getContainer().zIndex = 20; 
    this.titleUI = new TitleUI();
    this.titleUI.getContainer().zIndex = 15; 
    this.uiManager.container.addChild(this.leftTopUI.getContainer());
    this.uiManager.container.addChild(this.titleUI.getContainer());
    
    // Ensure UI starts in non-free-spins theme.
    this.leftTopUI.setTheme(false);
    this.titleUI.setTheme(false);

    this.setupBackground();
    this.createReels();
    this.vfxManager.setupBlackHole();
    this.setupBetInput(); 

    // Sync initial UI text
    this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`);
    this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
    this.waterBg.play();

    // BACKEND MODE START
    if (CONFIG.USE_BACKEND) {
      SlotApi.setSlotApiBaseUrl(CONFIG.API_BASE_URL);
      void this.loadFromBackend();
    }
  }

  /** Load balance and free spin count from backend (when USE_BACKEND). */
  private async loadFromBackend() {
    try {
      const data = await SlotApi.load();
      this.balance = data.player?.balance ?? this.balance;
      this.bonusSpins = data.free_spin?.count ?? 0;
      this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
    } catch (e) {
      console.error("Backend load failed:", e);
    }
  }

  /** Backend mode: call play or play-free-game, then apply result and run cascade/win flow. */
  private async spinFromBackend(isBonusSpin: boolean) {
    this.soundManager.playSFX("sfx_spin");
    if (this.starfield) this.starfield.triggerWarp(true);
    this.uiManager.spinButton.alpha = 0.6;
    this.uiManager.spinButton.interactive = false;
    this.uiManager.winText.text = "";
    this.lastSpinWin = 0;
    this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

    try {
      const data = isBonusSpin ? await SlotApi.playFreeGame() : await SlotApi.play(this.betAmount);
      if (this.starfield) this.starfield.triggerWarp(false);
      this.balance = data.balance;
      this.bonusSpins = data.free_spin?.count ?? 0;

      const grid = SlotApi.backendReelToGrid(data.slot.reel);
      this.applyVisibleGridIndices(grid);
      this.reels.forEach((r) => { r.isFreeSpins = this.bonusSpins > 0; });

      const hasCascade = data.slot.cascaded && data.slot.cascaded.length > 0 && data.slot.cascaded.some((s) => s.win > 0);
      const isEnteringFreeSpins = !!data.free_spin && (data.free_spin.count ?? 0) > 0 && !this.vfxManager.isFreeSpinsTheme;
      const isExitingFreeSpins = this.vfxManager.isFreeSpinsTheme && this.bonusSpins === 0;

      if (hasCascade) {
        this.running = true;
        this.uiManager.spinButton.interactive = false;
        this.uiManager.spinButton.alpha = 0.6;
        await this.playCascadeSequenceFromBackend(data.slot.cascaded!, data.total_win);
        this.balance = data.balance;
        this.sessionWins += data.total_win;
        this.lastSpinWin = data.total_win;
        this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
        this.running = false;
        this.uiManager.spinButton.interactive = true;
        this.uiManager.spinButton.alpha = 1;
        if (this.autoSpinActive) gsap.delayedCall(PAYOUTS.AUTO_SPIN_DELAY / 1000, () => this.autoSpinNext());
        return;
      }

      if (data.total_win > 0) {
        this.soundManager.playSFX("sfx_win");
        this.reels.forEach((r) => r.symbols.forEach((s) => (s.tint = 0x555555)));
        this.sessionWins += data.total_win;
        this.lastSpinWin = data.total_win;
        this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
        this.uiManager.winText.style.fontSize = 100;
        this.uiManager.winText.text = `WIN ₱${Math.floor(data.total_win)}`;
        this.uiManager.winText.style.fill = 0xffd700;
        this.uiManager.winText.scale.set(0.01);
        gsap.delayedCall(0.35, () => {
          gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 0.8, ease: "back.out(1.7)" });
        });
      }

      if (isEnteringFreeSpins) {
        this.running = true;
        this.uiManager.spinButton.interactive = false;
        this.uiManager.spinButton.alpha = 0.5;
        gsap.delayedCall(1.5, () => {
          this.soundManager.playSFX("sfx_maxwin");
          this.uiManager.winText.text = "MEGA BONUS!\n\n10 SPINS!";
          this.uiManager.winText.style.fontSize = 100;
          this.uiManager.winText.style.fill = 0xffd700;
          this.uiManager.winText.scale.set(0.01);
          gsap.to(this.uiManager.winText.scale, {
            x: 1, y: 1, duration: 3, ease: "elastic.out(1, 0.4)",
            onComplete: () => {
              this.vfxManager.playBlackHoleTransition(true, () => {
                this.vfxManager.swapTheme(true, this.reels);
                this.uiManager.toggleButtonTheme(true);
                this.leftTopUI.setTheme(true);
                this.titleUI.setTheme(true);
              }, () => {
                this.running = false;
                this.uiManager.spinButton.interactive = true;
                this.uiManager.spinButton.alpha = 1;
                this.uiManager.winText.text = "";
                if (this.bonusSpins > 0) this.startSpin();
              });
            },
          });
        });
        return;
      }

      if (isExitingFreeSpins) {
        this.running = true;
        this.uiManager.spinButton.interactive = false;
        this.uiManager.spinButton.alpha = 0.5;
        gsap.delayedCall(1, () => {
          this.uiManager.winText.text = `TOTAL WIN\n₱${Math.floor(this.sessionWins)}`;
          this.uiManager.winText.style.fill = 0x00ff00;
          this.uiManager.winText.scale.set(0.01);
          gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 1, ease: "back.out(1)" });
          gsap.delayedCall(2, () => {
            this.vfxManager.playBlackHoleTransition(false, () => {
              this.vfxManager.swapTheme(false, this.reels);
              this.uiManager.toggleButtonTheme(false);
              this.leftTopUI.setTheme(false);
              this.titleUI.setTheme(false);
              this.uiManager.winText.text = "";
            }, () => {
              this.running = false;
              this.uiManager.spinButton.interactive = true;
              this.uiManager.spinButton.alpha = 1;
              this.sessionWins = 0;
              if (this.autoSpinActive) gsap.delayedCall(1, () => this.startSpin());
            });
          });
        });
        return;
      }

      this.running = false;
      this.uiManager.spinButton.interactive = true;
      this.uiManager.spinButton.alpha = 1;
      if (this.autoSpinActive) gsap.delayedCall(PAYOUTS.AUTO_SPIN_DELAY / 1000, () => this.autoSpinNext());
    } catch (e) {
      console.error("Backend spin failed:", e);
      if (isBonusSpin) this.bonusSpins++; else this.balance += this.betAmount;
      this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
      this.running = false;
      this.uiManager.spinButton.interactive = true;
      this.uiManager.spinButton.alpha = 1;
    }
  }

  /** Run cascade animation from backend cascaded steps (same visuals as local cascade). */
  private async playCascadeSequenceFromBackend(
    cascaded: BackendCascadeStep[],
    totalWin: number
  ) {
    this.reels.forEach((r) => r.symbols.forEach((s) => { s.tint = 0x555555; s.alpha = 1; }));

    const steps = cascaded.filter((s) => s.win > 0);
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const winningPositions = step.cascades.map((c) => ({ reel: c.column, row: c.row }));
      if (winningPositions.length === 0) continue;
      const gridAfterDrop = SlotApi.backendReelToGrid(step.rng);
      const beforeGrid = this.getVisibleGridIndices();

      this.reels.forEach((r) => r.resetBrightness());
      for (const p of winningPositions) {
        const reel = this.reels[p.reel];
        if (!reel) continue;
        reel.setBrightness(p.row, 2);
        const sprite = reel.getSymbolAtRow(p.row);
        sprite.zIndex = 100;
        reel.container.zIndex = 100;
        this.animateSymbolToContainer(sprite, reel);
      }
      const perSymbolApplied = step.win / winningPositions.length * step.multiplier;
      for (const pos of winningPositions) {
        const reel = this.reels[pos.reel];
        if (!reel) continue;
        const sprite = reel.getSymbolAtRow(pos.row);
        const globalPos = sprite.getGlobalPosition();
        const localPos = this.uiManager.container.toLocal(globalPos);
        const winText = new Text({
          text: `₱${Math.floor(perSymbolApplied)}`,
          style: { fill: 0xffd700, fontSize: 60, fontWeight: "bold", stroke: { color: 0x000000, width: 4 } },
        });
        winText.anchor.set(0.5);
        winText.position.set(localPos.x, localPos.y - 20);
        winText.scale.set(0.01);
        this.uiManager.container.addChild(winText);
        gsap.to(winText.scale, { x: 1, y: 1, duration: 1, ease: "back.out(2)" });
        gsap.to(winText, { alpha: 0, duration: 1, delay: 1, onComplete: () => winText.destroy() });
        const multText = new Text({
          text: `x${step.multiplier}`,
          style: { fill: 0x00ffcc, fontSize: 50, fontWeight: "bold", stroke: { color: 0x000000, width: 4 } },
        });
        multText.anchor.set(0.5);
        multText.position.set(localPos.x, localPos.y + 5);
        this.uiManager.container.addChild(multText);
        gsap.delayedCall(0.5, () => {
          gsap.to(multText, { alpha: 0, duration: 0.2, delay: 1, onComplete: () => multText.destroy() });
        });
      }
      await this.tweenToEnd(gsap.to({}, { duration: 1.2 }));

      const breakTweens: gsap.core.Tween[] = [];
      for (const p of winningPositions) {
        const reel = this.reels[p.reel];
        if (!reel) continue;
        const sprite = reel.getSymbolAtRow(p.row);
        const baseScale = (sprite as any).baseScale || sprite.scale.x || 1;
        breakTweens.push(gsap.to(sprite, { alpha: 0, duration: 0.25, ease: "power2.out" }));
        breakTweens.push(gsap.to(sprite.scale, { x: baseScale * 0.8, y: baseScale * 0.8, duration: 0.25, ease: "power2.out" }));
      }
      await Promise.all(breakTweens.map((t) => this.tweenToEnd(t)));
      this.clearActiveAnimations();
      await this.animateCascadeDrop(beforeGrid, gridAfterDrop, winningPositions);
      this.reels.forEach((r) => r.symbols.forEach((s) => { s.tint = 0x555555; s.zIndex = 0; s.scale.set((s as any).baseScale || s.scale.x); }));
    }

    if (totalWin > 0) {
      this.uiManager.winText.style.fontSize = 100;
      this.uiManager.winText.text = `WIN ₱${Math.floor(totalWin)}`;
      this.uiManager.winText.style.fill = 0xffd700;
      this.uiManager.winText.scale.set(0.01);
      gsap.delayedCall(0.35, () => {
        gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 0.8, ease: "back.out(1.7)" });
      });
    }
  }
      // BACKEND MODE END




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

    // Mask reelContainer
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

    let scale = Math.min(screenWidth / CONFIG.DESIGN_WIDTH, screenHeight / CONFIG.DESIGN_HEIGHT);
    scale *= CONFIG.MACHINE_SCALE;
    this.mainContainer.scale.set(scale);

    // this.mainContainer.x = screenWidth / 2;
    this.mainContainer.x = screenWidth / 2 + offsetX * scale; 
    this.mainContainer.y = screenHeight / 2.2;

    if (this.waterBg && this.waterBg.sprite) {
        this.waterBg.sprite.x = screenWidth / 2;
        this.waterBg.sprite.y = screenHeight / 2;

        this.waterBg.sprite.width = window.innerWidth;
        this.waterBg.sprite.height = window.innerHeight;
        
        // const bgScaleX = screenWidth / DESIGN_WIDTH;
        // const bgScaleY = screenHeight / DESIGN_HEIGHT;
        // this.waterBg.sprite.scale.set(Math.max(bgScaleX, bgScaleY));
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
            }
        } 
        else if (e.key === "Backspace") {
            let currentBetStr = this.uiManager.betAmountText.text.replace("₱", "").replace("|", "");
            currentBetStr = currentBetStr.slice(0, -1);
            if (currentBetStr === "") currentBetStr = "0";
            this.betAmount = parseInt(currentBetStr);
            this.uiManager.updateBetTextDisplay(`₱${this.betAmount}|`, true);
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
  }

  private adjustBet(amount: number) {
    if (this.isEditingBet) this.disableBetEditing();
    this.betAmount = Math.max(10, Math.min(1000000000, this.betAmount + amount));
    this.uiManager.updateBetTextDisplay(`₱${this.betAmount}`); 
  } 

  private startAutoSpin() {
    if (this.autoSpinActive) {
      this.autoSpinActive = false;
      this.autoSpinCount = 0;
      this.uiManager.autoSpinButton.alpha = 1;
      
      gsap.killTweensOf(this.uiManager.autoSpinButton);
      gsap.to(this.uiManager.autoSpinButton, { rotation: 0, duration: 0.3, ease: "power2.out" });
    } else {
      this.autoSpinActive = true;
      this.autoSpinCount = PAYOUTS.AUTO_SPIN_LIMIT;
      this.uiManager.autoSpinButton.alpha = 0.8; 

      gsap.to(this.uiManager.autoSpinButton, { 
          rotation: "+=" + (Math.PI * 2), duration: 1.5, repeat: -1, ease: "none" 
      });

      this.autoSpinNext();
    }
  }

  private autoSpinNext() {
    if (!this.autoSpinActive || this.autoSpinCount <= 0) {
      this.autoSpinActive = false;
      this.uiManager.autoSpinButton.alpha = 1;
      return;
    }
   if (!this.running && this.balance < this.betAmount && this.bonusSpins === 0) {
       this.autoSpinActive = false;
       this.uiManager.autoSpinButton.alpha = 1;
       alert("Out of Balance!");
       return;
    }
   if (!this.running){
    this.autoSpinCount--;
    this.startSpin();
   }
  }

  startSpin() {
    gsap.killTweensOf(this.animateSymbolToContainer); 
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

    if (CONFIG.USE_BACKEND) {
      void this.spinFromBackend(isBonusSpin);
      return;
    }
    
    this.soundManager.playSFX('sfx_spin');
    
    if (this.starfield) this.starfield.triggerWarp(true); 

    gsap.killTweensOf(this.uiManager.spinButton);
    gsap.fromTo(this.uiManager.spinButton.scale, 
        { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 }, 
        { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.4, ease: "back.out(2)" }
    );
    gsap.to(this.uiManager.spinButton, {
        rotation: "+=" + (Math.PI * 100), duration: 2.5, ease: "power4.out",
        onComplete: () => {
            gsap.to(this.uiManager.spinButton, {
                rotation: "+=" + (Math.PI * 2), duration: 15, repeat: -1, ease: "none"
            });
        }
    });

    this.activeAnimations.forEach(anim => {
        gsap.killTweensOf(anim);
        if (anim.parent) anim.parent.removeChild(anim);
        anim.destroy();
    });
    this.activeAnimations = [];
    
    this.reels.forEach(r => {
        r.container.zIndex = 0;
        r.resetBrightness(); 
        r.symbols.forEach(s => {
            gsap.killTweensOf(s);
            gsap.killTweensOf(s.scale);
            s.zIndex = 0;
            s.alpha = 1;   
            s.rotation = 0;  
        });
    });
    
    this.running = true;
    if (!CONFIG.USE_BACKEND) {
      if (isBonusSpin) {
        this.bonusSpins--; 
      } else {
        this.balance -= this.betAmount;
      }
    }

    // Reset per-spin win display at spin start.
    this.lastSpinWin = 0;
    
    this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
    this.uiManager.spinButton.alpha = 0.6;
    this.uiManager.spinButton.interactive = true; 
    this.uiManager.winText.text = "";      

    this.reels.forEach((r, i) => {
      const target = r.position + 20 + i * 2;
      const time = 2.0 + i * 0.2; 
      
      gsap.to(r, {
          position: target, duration: time, ease: "power4.out", 
          onUpdate: () => r.updateSymbols(),
          onComplete: () => {
              this.bounceSpecialSymbols(r); 
              if (i === this.reels.length - 1) {
                  void this.reelsComplete();
              }
          }
      });
    });
  }

    private async reelsComplete() {
        this.uiManager.spinButton.alpha = 1;
        this.running = false;
        if (this.starfield) this.starfield.triggerWarp(false);
        
        const scatterCount = this.winManager.countScatters(this.reels);
        const isEnteringFreeSpins = scatterCount >= 3 && !this.vfxManager.isFreeSpinsTheme;
        const isExitingFreeSpins = this.vfxManager.isFreeSpinsTheme && this.bonusSpins === 0;
        
        let sequenceDelay = 0; 
        const grid = this.getVisibleGridIndices();
        const evaluator =
            CONFIG.WIN_MODE === "WAYS_243" ? this.waysEvaluator : this.paylineEvaluator;

        // Use local spin engine when cascading is enabled; fall back to direct evaluation otherwise.
        let evaluation = evaluator.evaluate(grid, this.betAmount);
        let totalWinAllCascades = evaluation.totalWin;
        let cascadeResult: { steps: any[]; totalWin: number; finalGrid: number[][] } = {
            steps: [],
            totalWin: evaluation.totalWin,
            finalGrid: grid,
        };

        if (CONFIG.ENABLE_CASCADING) {
            const { LocalSpinEngine } = await import("./domain/spin/LocalSpinEngine");
            const engine = new LocalSpinEngine(
                this.paylineEvaluator,
                this.waysEvaluator,
                (reelIndex) => this.randomSymbolIndexForReel(reelIndex),
                20
            );
            const spinResult = await engine.spin({
                grid,
                betAmount: this.betAmount,
                mode: CONFIG.WIN_MODE,
            });
            cascadeResult = {
                steps: spinResult.cascades,
                totalWin: spinResult.totalWin,
                finalGrid: spinResult.finalGrid,
            };
            totalWinAllCascades = cascadeResult.totalWin;
            if (spinResult.cascades.length > 0) {
                evaluation = spinResult.cascades[0].evaluation;
            }
        }

        const wins = evaluation.wins;
        
        
        // NORMAL WINS
        
        // Cascading flow: play step-by-step "break → drop" before counting total win.
        if (
            CONFIG.ENABLE_CASCADING &&
            cascadeResult.steps.length > 0 &&
            !isEnteringFreeSpins &&
            !isExitingFreeSpins
        ) {
            this.running = true;
            this.uiManager.spinButton.interactive = false;
            this.uiManager.spinButton.alpha = 0.6;
            void this.playCascadeSequence(cascadeResult);
            return;
        }

        if(totalWinAllCascades > 0) {
            let isJackpot = false;

            this.soundManager.playSFX('sfx_win');
            this.reels.forEach(r => r.symbols.forEach(s => s.tint = 0x555555));

            const popEachWin = async () => {
                for (const w of wins) {
                    const meta = (w as any).meta as any;
                    if (meta?.isJackpot) isJackpot = true;

                    this.reels.forEach(r => r.resetBrightness());
                    const positions = (w.positions ?? []) as { reel: number; row: number }[];
                    for (const p of positions) {
                        const reel = this.reels[p.reel];
                        if (!reel) continue;
                        reel.setBrightness(p.row, 2);
                        const symbolSprite = reel.getSymbolAtRow(p.row);
                        if (symbolSprite) {
                            symbolSprite.zIndex = 100;
                            reel.container.zIndex = 100;
                            this.animateSymbolToContainer(symbolSprite, reel);
                        }
                    }
                    await new Promise<void>(r => gsap.delayedCall(1, r));
                }
            };
            if (!isEnteringFreeSpins && scatterCount < 5) sequenceDelay = 2.0;
            void popEachWin().then(() => {
                this.balance += totalWinAllCascades;
                this.sessionWins += totalWinAllCascades;
                this.lastSpinWin = totalWinAllCascades;
                this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

                if (CONFIG.ENABLE_CASCADING && cascadeResult.steps.length > 0) {
                    this.applyVisibleGridIndices(cascadeResult.finalGrid);
                }

                if (!isEnteringFreeSpins && scatterCount < 5) {
                    this.uiManager.winText.style.fontSize = 100;
                    if (isJackpot) {
                        this.uiManager.winText.text = "JACKPOT!!!";
                        this.uiManager.winText.style.fill = 0xff0000;
                    } else {
                        this.uiManager.winText.text = `WIN ₱${Math.floor(totalWinAllCascades)}`;
                        this.uiManager.winText.style.fill = 0xffd700;
                    }
                    this.uiManager.winText.scale.set(0.01);
                    gsap.delayedCall(0.35, () => {
                        gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 0.8, ease: "back.out(1.7)" });
                    });
                }
            });
        }

        
        //  VORTEX IN
        
        if (isEnteringFreeSpins) {
            this.running = true; 
            this.uiManager.spinButton.interactive = false; 
            this.uiManager.spinButton.alpha = 0.5;

            gsap.delayedCall(sequenceDelay, () => {
                this.soundManager.playSFX('sfx_maxwin'); 

                this.bonusSpins += PAYOUTS.SCATTER_SPINS; 
                this.lastSpinWin = 0;
                this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);
                
                this.reels.forEach(r => {
                    for (let row = 0; row < PAYOUTS.SCATTER_REQ; row++) {
                        const sprite = r.getSymbolAtRow(row);
                        if (this.slotTextures.indexOf(sprite.texture) === 9) { 
                            sprite.zIndex = 100;
                            r.container.zIndex = 100;
                            this.animateSymbolToContainer(sprite, r);
                        }
                    }
                });

                this.uiManager.winText.text = `MEGA BONUS!\n\n10 SPINS!`;
                this.uiManager.winText.style.fontSize = 100;
                this.uiManager.winText.style.fill = 0xffd700;
                this.uiManager.winText.scale.set(0.01); 

                // Animate text|| Black Hole
                gsap.to(this.uiManager.winText.scale, { 
                    x: 1, y: 1, duration: 3, ease: "elastic.out(1, 0.4)",
                    onComplete: () => {
                        this.vfxManager.playBlackHoleTransition(
                            true, 
                            //  Theme Swap 
                            () => {
                                this.vfxManager.swapTheme(true, this.reels);
                                this.uiManager.toggleButtonTheme(true);
                                this.leftTopUI.setTheme(true);
                                this.titleUI.setTheme(true);
                            },
                            //  Clean up
                            () => {
                                this.running = false;
                                this.uiManager.spinButton.interactive = true; 
                                this.uiManager.spinButton.alpha = 1; 
                                this.uiManager.winText.text = "";
                                if (this.bonusSpins > 0) this.startSpin();
                            }
                        );
                    }
                });
            });
        } 

        
        //  VORTEX OUT
        
        else if (isExitingFreeSpins) {
            this.running = true; 
            this.uiManager.spinButton.interactive = false; 
            this.uiManager.spinButton.alpha = 0.5;
            
            gsap.delayedCall(sequenceDelay, () => {
                this.uiManager.winText.text = `TOTAL WIN\n₱0`; 
                this.uiManager.winText.style.fill = 0x00FF00;
                this.uiManager.winText.scale.set(0.01); 

                gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 1, ease: "back.out(1)" });

                const counter = { val: 0 }; 
                gsap.to(counter, {
                    val: this.sessionWins, duration: 3, delay: 1.5, ease: "power1.out", 
                    onStart: () => this.soundManager.playSFX('sfx_totalwin'),   
                    onUpdate: () => {
                        this.uiManager.winText.text = `TOTAL WIN\n₱${Math.floor(counter.val)}`;
                    },
                    onComplete: () => {
                        this.soundManager.stopSFX('sfx_totalwin');
                        gsap.delayedCall(1.5, () => {
                            this.sessionWins = 0;
                            
                            this.vfxManager.playBlackHoleTransition(
                                false, 
                                //  Theme Swap
                                () => {
                                    this.vfxManager.swapTheme(false, this.reels);
                                    this.uiManager.toggleButtonTheme(false);
                                    this.leftTopUI.setTheme(false);
                                    this.titleUI.setTheme(false);
                                    this.uiManager.winText.scale.set(0);
                                    this.uiManager.winText.text = "";
                                },
                                () => {
                                    this.running = false;
                                    this.uiManager.spinButton.interactive = true; 
                                    this.uiManager.spinButton.alpha = 1; 
                                    if (this.autoSpinActive) gsap.delayedCall(1, () => this.startSpin());
                                }
                            ); 
                        });
                    }
                });
            });
        }

        
        // AUTOSPIN 
        
        else if(this.autoSpinActive && !isEnteringFreeSpins && !isExitingFreeSpins) {
            setTimeout(() => {
                this.autoSpinNext();
            }, PAYOUTS.AUTO_SPIN_DELAY + (sequenceDelay * 1000)); 
        }
    }

  startFreeSpins() {
        console.log("Free spins started!");
      
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

    private randomSymbolIndexForReel(reelIndex: number): number {
        const reel = this.reels[reelIndex];
        const indices: number[] = [];
        for (let i = 0; i < this.slotTextures.length; i++) {
            if (reel?.isFreeSpins && i === 9) continue; // no scatters during free spins
            indices.push(i);
        }
        return indices[Math.floor(Math.random() * indices.length)];
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

  private async playCascadeSequence(cascadeResult: { steps: any[]; totalWin: number; finalGrid: number[][] }) {
      
      this.reels.forEach(r => r.symbols.forEach(s => { s.tint = 0x555555; s.alpha = 1; }));

      let isJackpot = false;

      for (const step of cascadeResult.steps) {
          const evaluation = step.evaluation as { wins: any[]; totalWin: number; winningPositions: { reel: number; row: number }[] };
          if (!evaluation || evaluation.totalWin <= 0) break;

          const beforeGrid = this.getVisibleGridIndices();

          // Detect jackpot in any step 
          evaluation.wins?.forEach((w: any) => {
              if (w?.meta?.isJackpot) isJackpot = true;
          });

          // Pop each win group (pairing) one by one; win value only on real symbols, not on wilds
          const { multiplier } = step as { multiplier: number };
          const winsInStep = evaluation.wins ?? [];

          for (const win of winsInStep) {
              const positions = (win.positions ?? []) as { reel: number; row: number }[];
              if (!positions.length || typeof win.payout !== "number") continue;

              const meta = (win as any).meta as { targetIndex?: number; isJackpot?: boolean } | undefined;
              const targetIndex = meta?.targetIndex;
              const isJackpotWin = !!meta?.isJackpot;

              this.reels.forEach(r => r.resetBrightness());
              for (const p of positions) {
                  const reel = this.reels[p.reel];
                  if (!reel) continue;
                  reel.setBrightness(p.row, 2);
                  const sprite = reel.getSymbolAtRow(p.row);
                  sprite.zIndex = 100;
                  reel.container.zIndex = 100;
                  this.animateSymbolToContainer(sprite, reel);
              }

              const perSymbolBase = win.payout / positions.length;
              const perSymbolApplied = perSymbolBase * multiplier;

              let jackpotShown = false;
              for (const pos of positions) {
                  const symbolAtPos = beforeGrid[pos.reel]?.[pos.row];
                  const isRealSymbol = symbolAtPos === targetIndex;
                  const showValue = isJackpotWin ? !jackpotShown : isRealSymbol;
                  if (isJackpotWin) jackpotShown = true;
                  if (!showValue || symbolAtPos === SYMBOL.WILD && !isJackpotWin) continue;

                  const reel = this.reels[pos.reel];
                  if (!reel) continue;
                  const sprite = reel.getSymbolAtRow(pos.row);
                  const globalPos = sprite.getGlobalPosition();
                  const localPos = this.uiManager.container.toLocal(globalPos);

                  const winText = new Text({
                      text: `₱${Math.floor(perSymbolApplied)}`,
                      style: {
                          fill: 0xffd700,
                          fontSize: 60,
                          fontWeight: "bold",
                          stroke: { color: 0x000000, width: 4 },
                      },
                  });
                  winText.anchor.set(0.5);
                  winText.position.set(localPos.x, localPos.y - 20);
                  winText.scale.set(0.01);
                  this.uiManager.container.addChild(winText);
                  gsap.to(winText.scale, { x: 1, y: 1, duration: 1, ease: "back.out(2)" });
                  gsap.to(winText, { alpha: 0, duration: 1, delay: 1, onComplete: () => winText.destroy() });

                  const multText = new Text({
                      text: `x${multiplier}`,
                      style: {
                          fill: 0x00ffcc,
                          fontSize: 50,
                          fontWeight: "bold",
                          stroke: { color: 0x000000, width: 4 },
                      },
                  });
                  multText.anchor.set(0.5);
                  multText.position.set(localPos.x, localPos.y + 5);
                  multText.scale.set(1);
                  this.uiManager.container.addChild(multText);
                  gsap.delayedCall(0.5, () => {
                      gsap.to(multText.scale, { x: 1, y: 1, duration: 1, ease: "back.out(2)" });
                      gsap.to(multText, { alpha: 0, duration: 0.2, delay: 1, onComplete: () => multText.destroy() });
                  });
              }

              await this.tweenToEnd(gsap.to({}, { duration: 1.2 }));
          }

          await this.tweenToEnd(gsap.to({}, { duration: 0.3 }));

          // Break symbols 
          const breakTweens: gsap.core.Tween[] = [];
          for (const p of evaluation.winningPositions) {
              const reel = this.reels[p.reel];
              if (!reel) continue;
              const sprite = reel.getSymbolAtRow(p.row);
              const baseScale = (sprite as any).baseScale || sprite.scale.x || 1;
              breakTweens.push(gsap.to(sprite, { alpha: 0, duration: 0.25, ease: "power2.out" }));
              breakTweens.push(gsap.to(sprite.scale, { x: baseScale * 0.8, y: baseScale * 0.8, duration: 0.25, ease: "power2.out" }));
          }
          await Promise.all(breakTweens.map(t => this.tweenToEnd(t)));

          // Cleanup 
          this.clearActiveAnimations();
          await this.animateCascadeDrop(beforeGrid, step.gridAfterDrop, evaluation.winningPositions);

          // Dim again 
          this.reels.forEach(r => r.symbols.forEach(s => { s.tint = 0x555555; s.zIndex = 0; s.scale.set((s as any).baseScale || s.scale.x); }));
      }

      // Count total win  end of cascade 
      const totalWinAllCascades = cascadeResult.totalWin || 0;
      if (totalWinAllCascades > 0) {
          this.balance += totalWinAllCascades;
          this.sessionWins += totalWinAllCascades;
          this.lastSpinWin = totalWinAllCascades;
          this.uiManager.updateTextValues(this.balance, this.lastSpinWin, this.bonusSpins);

          this.uiManager.winText.style.fontSize = 100;
          if (isJackpot) {
              this.uiManager.winText.text = "JACKPOT!!!";
              this.uiManager.winText.style.fill = 0xff0000;
          } else {
              this.uiManager.winText.text = `WIN ₱${Math.floor(totalWinAllCascades)}`;
              this.uiManager.winText.style.fill = 0xffd700;
          }
          this.uiManager.winText.scale.set(0.01);
          gsap.delayedCall(0.35, () => {
              gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 0.8, ease: "back.out(1.7)" });
          });
      }

      // Restore interactivity and continue autos
      this.running = false;
      this.uiManager.spinButton.interactive = true;
      this.uiManager.spinButton.alpha = 1;

      if (this.autoSpinActive) {
          gsap.delayedCall(PAYOUTS.AUTO_SPIN_DELAY / 1000, () => this.autoSpinNext());
      }
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

          // Map kept symbols to their new rows after compaction
          for (let k = 0; k < keptCount; k++) {
              const oldRow = keptOldRows[k];
              const newRow = 3 - keptCount + k;
              const sprite = rowSprites[oldRow];
              const baseScale = (sprite as any).baseScale || sprite.scale.x || 1;
              sprite.alpha = 1;
              sprite.scale.set(baseScale);
              sprite.tint = 0xFFFFFF;
              tweens.push(
                  gsap.to(sprite, { y: newRow * symbolHeight, duration: 0.32, ease: "power2.out" })
              );
          }

          // Use removed sprites to spawn new symbols above and drop them into empty rows at the top
          const newRowsCount = 3 - keptCount;
          for (let newRow = 0; newRow < newRowsCount; newRow++) {
              const sprite = rowSprites[removedRows[newRow] ?? removedRows[0]];
              const symbolIndex = afterGrid[reelIndex][newRow];
              this.setSpriteToSymbolIndex(reel, sprite, symbolIndex);
              sprite.tint = 0xFFFFFF;
              sprite.y = -symbolHeight * (newRowsCount - newRow);
              tweens.push(
                  gsap.to(sprite, { y: newRow * symbolHeight, duration: 0.38, ease: "power2.out" })
              );
          }
      }

      await Promise.all(tweens.map((t) => this.tweenToEnd(t)));

      this.applyVisibleGridIndices(afterGrid);
  }

   

}
