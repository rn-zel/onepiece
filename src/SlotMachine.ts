import { Application, Container, Sprite, Texture, Graphics, AnimatedSprite } from "pixi.js";
import { CONFIG, PAYOUTS, PAYLINES } from "./Config";
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
    // this.vfxManager = new VFXManager(this.app, this.mainContainer, this.backgroundContainer, this.soundManager, this.lightning, this.starfield);
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
    this.uiManager.updateTextValues(this.balance, this.sessionWins, this.bonusSpins);

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
    this.waterBg.play();
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
    if (isBonusSpin) {
      this.bonusSpins--; 
    } else {
      this.balance -= this.betAmount;
    }
    
    this.uiManager.updateTextValues(this.balance, this.sessionWins, this.bonusSpins);
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
                  this.reelsComplete();
              }
          }
      });
    });
  }

    private reelsComplete() {
        this.uiManager.spinButton.alpha = 1;
        this.running = false;
        if (this.starfield) this.starfield.triggerWarp(false);
        
        const scatterCount = this.winManager.countScatters(this.reels);
        const isEnteringFreeSpins = scatterCount >= 3 && !this.vfxManager.isFreeSpinsTheme;
        const isExitingFreeSpins = this.vfxManager.isFreeSpinsTheme && this.bonusSpins === 0;
        
        let sequenceDelay = 0; 
        const wins = this.winManager.checkPaylineWins(this.reels, this.betAmount); 
        
        
        // NORMAL WINS
        
        if(wins.length > 0) {
            let totalWin = 0;
            let isJackpot = false;

            this.soundManager.playSFX('sfx_win');
            this.reels.forEach(r => r.symbols.forEach(s => s.tint = 0x555555));
            

            wins.forEach(w => {
                totalWin += w.payout;
                if (w.isJackpot) isJackpot = true;
                
                const line = PAYLINES[w.lineIndex];
                for(let i = 0; i < w.matchLength; i++) {
                    const realReelIndex = w.startIndex + i;
                    const reel = this.reels[realReelIndex]; 
                    const row = line[realReelIndex];        
                    
                    reel.setBrightness(row, 2); 

                    const symbolSprite = reel.getSymbolAtRow(row); 
                    if (symbolSprite) {
                        symbolSprite.zIndex = 100;    
                        reel.container.zIndex = 100;  
                        this.animateSymbolToContainer(symbolSprite, reel);
                    }
                }
            });
            
            
            this.balance += totalWin;
            this.sessionWins += totalWin;
            this.uiManager.updateTextValues(this.balance, this.sessionWins, this.bonusSpins);
            
            if (!isEnteringFreeSpins && scatterCount < 5) {
                this.uiManager.winText.style.fontSize = 100;
                if (isJackpot) {
                    this.uiManager.winText.text = "JACKPOT!!!";
                    this.uiManager.winText.style.fill = 0xff0000; 
                } else {
                    this.uiManager.winText.text = `WIN ₱${totalWin}`;
                    this.uiManager.winText.style.fill = 0xffd700; 
                }
                
                this.uiManager.winText.scale.set(.7); 
                gsap.to(this.uiManager.winText.scale, { x: 1, y: 1, duration: 0.8, ease: "back.out(1.7)" });
                
                sequenceDelay = 2.0; 
            }
        }

        
        //  VORTEX IN
        
        if (isEnteringFreeSpins) {
            this.running = true; 
            this.uiManager.spinButton.interactive = false; 
            this.uiManager.spinButton.alpha = 0.5;

            gsap.delayedCall(sequenceDelay, () => {
                this.soundManager.playSFX('sfx_maxwin'); 

                this.bonusSpins += PAYOUTS.SCATTER_SPINS; 
                this.uiManager.updateTextValues(this.balance, this.sessionWins, this.bonusSpins);
                
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

   

}
