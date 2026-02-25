import { Application, Container, Sprite, Texture, Text, TextStyle, Graphics, Assets, AnimatedSprite } from "pixi.js";
import { CONFIG, PAYOUTS, PAYLINES, ASSETS } from "./Config";
import { Reel } from "./Reel";
import gsap from "gsap"; 
import { SymbolAnimator } from "./SymbolAnimator";
import { Starfield } from "./Starfield";
import { SoundManager } from "./Sound"; 

export class SlotMachine {
  app: Application;
  mainContainer = new Container();
  backgroundContainer = new Container();
  reelContainer = new Container();
  uiContainer = new Container();
  reels: Reel[] = [];
  isQuickSpin: boolean = false;

  activeAnimations: AnimatedSprite[] = [];

  // UI Elements
  // characterSprite!: Sprite;
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

  
  running: boolean = false;
  isEditingBet: boolean = false; 
  
  // Game State
  slotTextures: Texture[];
  backgroundTexture: Texture;
  balance: number = PAYOUTS.CURRENT_BALANCE;
  betAmount: number = PAYOUTS.BET_AMOUNT;
  bonusSpins: number = PAYOUTS.FREE_SPIN_COUNT;
  sessionWins: number = 0;
  autoSpinActive: boolean = false;
  autoSpinCount: number = 0;

  blackHole!: Sprite;
  isFreeSpinsTheme: boolean = false;
  freeSpinBorder!: Graphics;
  lightningOverlay!: Graphics;
  borderTween: any;
  starfield!: Starfield;

  soundManager: SoundManager = new SoundManager();


  constructor(app: Application, textures: Texture[], bgTexture: Texture) {
    this.app = app;
    this.slotTextures = textures;
    this.backgroundTexture = bgTexture;

    this.soundManager.init();
    this.soundManager.playBGM(false);

    this.mainContainer.sortableChildren = true;

    this.app.stage.addChild(this.mainContainer);
    this.mainContainer.addChild(this.backgroundContainer);
    this.mainContainer.addChild(this.reelContainer);

    this.uiContainer.zIndex = 100;
    this.mainContainer.addChild(this.uiContainer);



    this.setupBackground();
    this.createReels();
    this.createUI();
    this.setupBetInput(); 
    
    this.setupBlackHole();
    // this.setupTopCharacter();

    this.handleResize();

    window.addEventListener("resize", () => this.handleResize());
  }

  private setupBackground() {
    const bg = new Sprite(this.backgroundTexture);
    const padding = -10;

    bg.anchor.set(0.5);
    bg.width = 1920 + (padding * 2);
    bg.height = 1080 + (padding * 2);
    bg.x = padding + CONFIG.BACKGROUND_OFFSET_X;
    bg.y = padding + 10;
    this.backgroundContainer.addChild(bg);

    //lightning
    this.lightningOverlay = new Graphics();
    this.lightningOverlay.rect(-2000, -2000, 4000, 4000); 
    this.lightningOverlay.fill(0xFF0055); // flash
    this.lightningOverlay.alpha = 0;      
    this.backgroundContainer.addChild(this.lightningOverlay);
  }

 private createReels() {
    const reelCount = CONFIG.REELS_COUNT;
    const totalWidth = (CONFIG.CARD_WIDTH * reelCount) + (CONFIG.CARD_SPACING * (reelCount - 1));
    this.reelContainer.pivot.x = totalWidth / 2;
    this.reelContainer.pivot.y = CONFIG.CARD_HEIGHT / 2.2;
    this.reelContainer.x = CONFIG.REEL_OFFSET_X;
    this.reelContainer.y = CONFIG.REEL_OFFSET_Y; 
    this.reelContainer.sortableChildren = true;
    this.freeSpinBorder = new Graphics();
    this.freeSpinBorder.alpha = 0; 
    this.mainContainer.addChild(this.freeSpinBorder);

    //   mask  reelContainer
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
    //freespin border
    this.freeSpinBorder = new Graphics();
    this.freeSpinBorder.rect(
       -1910 / 2, 
        -1050 / 2,
        1890,      
        1040       
    );
    //   border
    this.freeSpinBorder.stroke({ color: 0xFF0055, width: 15 }); 
    this.freeSpinBorder.alpha = 0; 
    
    this.mainContainer.addChild(this.freeSpinBorder);
  }
  private createUI() {
    const glowStyle = new TextStyle({
      fill: 0xffffff,
      fontSize: 36, 
      fontWeight: "bold",
      dropShadow: { color: 0x00d9ff, blur: 6, distance: 0, angle: 0 },
      align: "center"
    });

    // Spin Button
    this.spinButton = new Sprite(Assets.get("spinBTN.png"));
    this.spinButton.anchor.set(0.5);
    this.spinButton.scale.set(CONFIG.SPIN_BTN_SIZE); 
    this.spinButton.x = CONFIG.BTN_SPIN_X;
    this.spinButton.y = CONFIG.BTN_SPIN_Y;
    this.spinButton.interactive = true;
    this.spinButton.cursor = "pointer";
    this.spinButton.on("pointerdown", () => this.startSpin());
    this.uiContainer.addChild(this.spinButton);

    // gsap.to(this.spinButton, {
    //     rotation: "+=" + (Math.PI * 2),
    //     duration: 15, 
    //     repeat: -1,  
    //     ease: "none"  
    // });

    // Auto Spin
    this.autoSpinButton = new Sprite(Assets.get("autoSpin.png"));
    this.autoSpinButton.anchor.set(0.5);
    this.autoSpinButton.scale.set(CONFIG.BTN_AUTO_SCALE);
    this.autoSpinButton.x = CONFIG.BTN_AUTO_X;
    this.autoSpinButton.y = CONFIG.BTN_AUTO_Y;
    this.autoSpinButton.interactive = true;
    this.autoSpinButton.cursor = "pointer";
    this.autoSpinButton.on("pointerdown", () => this.startAutoSpin());
    this.uiContainer.addChild(this.autoSpinButton);

    // Menu
    this.menuButton = new Sprite(Assets.get("menu.png"));
    this.menuButton.anchor.set(0.5);
    this.menuButton.scale.set(CONFIG.BTN_MENU_SCALE);
    this.menuButton.x = CONFIG.BTN_MENU_X;
    this.menuButton.y = CONFIG.BTN_MENU_Y;
    this.uiContainer.addChild(this.menuButton);

    // Texts
    //  BALANCE
    const balanceBg = new Sprite(Assets.get("balance.png")); 
    balanceBg.anchor.set(0, 0.5); 
    balanceBg.scale.set(CONFIG.BALANCE_BG_SCALE);
    balanceBg.x = CONFIG.BALANCE_BG_X; 
    balanceBg.y = CONFIG.BALANCE_BG_Y;
    this.uiContainer.addChild(balanceBg);

    // Add the text on top
    this.balanceText = new Text(`₱${this.balance}`, glowStyle);
    this.balanceText.anchor.set(0, 0.5);
    this.balanceText.x = CONFIG.TEXT_BAL_X; 
    this.balanceText.y = CONFIG.TEXT_BAL_Y;
    this.balanceText.resolution = 3;
    this.uiContainer.addChild(this.balanceText);

    // BET AMOUNT
    const betBg = new Sprite(Assets.get("bet.png")); 
    betBg.anchor.set(0, 0.5);
    betBg.scale.set(CONFIG.BET_BG_SCALE);
    betBg.x = CONFIG.BET_BG_X; 
    betBg.y = CONFIG.BET_BG_Y;
    this.uiContainer.addChild(betBg);

    this.betAmountText = new Text(`₱${this.betAmount}`, glowStyle);
    this.betAmountText.anchor.set(0, 0.5);
    this.betAmountText.x = CONFIG.TEXT_BET_X;
    this.betAmountText.y = CONFIG.TEXT_BET_Y;
    this.betAmountText.resolution = 3;
    this.betAmountText.interactive = true; 
    this.betAmountText.cursor = "text";
    this.betAmountText.on("pointerdown", () => this.enableBetEditing());
    this.uiContainer.addChild(this.betAmountText);

    // TOTAL WIN
    const winBg = new Sprite(Assets.get("totalwin.png"));
    winBg.anchor.set(0, 0.5);
    winBg.scale.set(CONFIG.TOTALWIN_BG_SCALE);
    winBg.x = CONFIG.TOTALWIN_BG_X;
    winBg.y = CONFIG.TOTALWIN_BG_Y;
    this.uiContainer.addChild(winBg);

    this.totalWinText = new Text("₱0", glowStyle);
    this.totalWinText.anchor.set(0, 0.5);
    this.totalWinText.x = CONFIG.TEXT_TOTALWIN_X;
    this.totalWinText.resolution = 3;
    this.totalWinText.y = CONFIG.TEXT_TOTALWIN_Y;
    this.uiContainer.addChild(this.totalWinText);

    // +/- Buttons
    this.minusButton = new Sprite(Assets.get("minus.png"));
    this.minusButton.anchor.set(0.5);
    this.minusButton.scale.set(CONFIG.BTN_MINUS_SCALE);
    this.minusButton.x = CONFIG.BTN_MINUS_X;
    this.minusButton.y = CONFIG.BTN_MINUS_Y;
    this.minusButton.interactive = true;
    this.minusButton.cursor = "pointer";
    this.minusButton.on("pointerdown", () => this.adjustBet(-10));
    this.uiContainer.addChild(this.minusButton);

    this.plusButton = new Sprite(Assets.get("plus.png"));
    this.plusButton.anchor.set(0.5);
    this.plusButton.scale.set(CONFIG.BTN_PLUS_SCALE);
    this.plusButton.x = CONFIG.BTN_PLUS_X;
    this.plusButton.y = CONFIG.BTN_PLUS_Y;
    this.plusButton.interactive = true;
    this.plusButton.cursor = "pointer";
    this.plusButton.on("pointerdown", () => this.adjustBet(10));
    this.uiContainer.addChild(this.plusButton);

    this.winText = new Text({
        text: "", 
        style: {
            fill: 0xffd700,
            fontSize: 100,
            fontWeight: "bold",
            dropShadow: { color: 0x000000, blur: 15, distance: 0 },
            align: "center"
        }
    });

    this.winText.anchor.set(0.5);
    this.winText.x = 0; 
    this.winText.y = 0; 
    this.winText.resolution = 2;
    this.uiContainer.addChild(this.winText)
    
    // Bonusspin
    this.bonusSpinsText = new Text("", new TextStyle({
        fill: 0xff6b00,
        fontSize: 40,
        fontWeight: "bold",
        stroke: { color: 0x000000, width: 4 }
    }));
    this.bonusSpinsText.anchor.set(0.5);
    this.bonusSpinsText.y = -450; 
    this.bonusSpinsText.resolution = 2;
    this.uiContainer.addChild(this.bonusSpinsText);
  }

  //  Betting Logic 
  private updateBetTextDisplay(textToShow: string) {
      this.betAmountText.text = textToShow;
      const cleanNumber = textToShow.replace(/[^0-9]/g, '');
      const len = cleanNumber.length;
      let newSize = 36;
      if (len >= 7) newSize = 20; 
      else if (len >= 5) newSize = 25; 
      this.betAmountText.style.fontSize = newSize;
  }

  private setupBetInput() {
    window.addEventListener("keydown", (e) => {
        if (!this.isEditingBet) return;
        if (e.key >= "0" && e.key <= "9") {
            let currentBetStr = this.betAmountText.text.replace("₱", "").replace("|", "");
            if (currentBetStr === "0") currentBetStr = "";
            if (currentBetStr.length < 9) {
                const newBetStr = currentBetStr + e.key;
                this.betAmount = parseInt(newBetStr);
                this.updateBetTextDisplay(`₱${this.betAmount}|`); 
            }
        } 
        else if (e.key === "Backspace") {
            let currentBetStr = this.betAmountText.text.replace("₱", "").replace("|", "");
            currentBetStr = currentBetStr.slice(0, -1);
            if (currentBetStr === "") currentBetStr = "0";
            this.betAmount = parseInt(currentBetStr);
            this.updateBetTextDisplay(`₱${this.betAmount}|`);
        }
        else if (e.key === "Enter" || e.key === "Escape") {
            this.disableBetEditing();
        }
    });

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e) => {
        if (this.isEditingBet && e.target !== this.betAmountText) {
             this.disableBetEditing();
        }
    });
  }

  private enableBetEditing() {
      if (this.running) return;
      this.isEditingBet = true;
      this.betAmountText.style.fill = 0x00ff00; 
      this.updateBetTextDisplay(`₱${this.betAmount}|`); 
  }

  private disableBetEditing() {
      this.isEditingBet = false;
      this.betAmountText.style.fill = 0xffffff; 
      this.betAmount = Math.max(10, Math.min(1000000000, this.betAmount));
      this.updateBetTextDisplay(`₱${this.betAmount}`); 
  }

  private adjustBet(amount: number) {
    if (this.isEditingBet) this.disableBetEditing();
    this.betAmount = Math.max(10, Math.min(1000000000, this.betAmount + amount));
    this.updateBetTextDisplay(`₱${this.betAmount}`); 
  } 

  //  Game Loop & Logic 
  handleResize() {
    const DESIGN_WIDTH =   1920;
    const DESIGN_HEIGHT =   1080;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    

    let scale = Math.min(screenWidth / DESIGN_WIDTH, screenHeight / DESIGN_HEIGHT);
    scale *= CONFIG.MACHINE_SCALE;
    this.mainContainer.scale.set(scale);
    this.mainContainer.x = screenWidth / 2;
    this.mainContainer.y = screenHeight / 2.2;
   

  }

  private startAutoSpin() {
    if (this.autoSpinActive) {
      //  off
      this.autoSpinActive = false;
      this.autoSpinCount = 0;
      this.autoSpinButton.alpha = 1;

      // stop and reset
      gsap.killTweensOf(this.autoSpinButton);
      gsap.to(this.autoSpinButton, { rotation: 0, duration: 0.3, ease: "power2.out" });

    } else {
      // on
      this.autoSpinActive = true;
      this.autoSpinCount = PAYOUTS.AUTO_SPIN_LIMIT;
      this.autoSpinButton.alpha = 0.8; 

      // continuous rotation
      gsap.to(this.autoSpinButton, { 
          rotation: "+=" + (Math.PI * 2), 
          duration: 1.5, 
          repeat: -1, 
          ease: "none" 
      });

      this.autoSpinNext();
    }
  }
  private autoSpinNext() {
    if (!this.autoSpinActive || this.autoSpinCount <= 0) {
      this.autoSpinActive = false;
      this.autoSpinButton.alpha = 1;
      return;
    }
   if (!this.running && this.balance < this.betAmount && this.bonusSpins === 0) {
       this.autoSpinActive = false;
       this.autoSpinButton.alpha = 1;
       alert("Out of Balance!");
       return;
    }
   if (!this.running){
    this.autoSpinCount;
    this.startSpin();
   }
  }

  startSpin() {
    gsap.killTweensOf(this.animateSymbolToContainer); 
    if (this.isEditingBet) this.disableBetEditing();

    // stop logic 
    if (this.running) {
        this.isQuickSpin = true; 

        // off speedbutton
        gsap.killTweensOf(this.spinButton);
        
        // press effect
        gsap.fromTo(this.spinButton.scale, 
            { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 }, 
            { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.2, ease: "back.out(2)" }
        );

      

        // Slam the reels to the end
        this.reels.forEach(r => {
            gsap.getTweensOf(r).forEach(tween => tween.progress(1));
        });
        return;
    }
    
    // `start logic 
    this.isQuickSpin = false; 
    const isBonusSpin = this.bonusSpins > 0;
    if (!isBonusSpin && this.balance < this.betAmount) return;
    
    // spin sound
    this.soundManager.playSFX('sfx_spin');

    // speedup spin
    gsap.killTweensOf(this.spinButton);
    gsap.fromTo(this.spinButton.scale, 
        { x: CONFIG.SPIN_BTN_SIZE * 0.85, y: CONFIG.SPIN_BTN_SIZE * 0.85 }, 
        { x: CONFIG.SPIN_BTN_SIZE, y: CONFIG.SPIN_BTN_SIZE, duration: 0.4, ease: "back.out(2)" }
    );
    gsap.to(this.spinButton, {
        rotation: "+=" + (Math.PI * 100), 
        duration: 2.5,
        ease: "power4.out",
        onComplete: () => {
            // slow spin
            gsap.to(this.spinButton, {
                rotation: "+=" + (Math.PI * 2),
                duration: 15,
                repeat: -1,
                ease: "none"
            });
        }
    });

    // Destroy any active Animation
    this.activeAnimations.forEach(anim => {
        gsap.killTweensOf(anim);
        if (anim.parent) anim.parent.removeChild(anim);
        anim.destroy();
    });
    this.activeAnimations = [];
    
    // reset symbols 
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
    
    // Update game state 
    this.running = true;
    if (isBonusSpin) {
      this.bonusSpins--; 
      this.bonusSpinsText.text = this.bonusSpins > 0 ? `FREE SPINS: ${this.bonusSpins}` : "";
    } else {
      this.balance -= this.betAmount;
      this.balanceText.text = `₱${this.balance}`;
    }
    
    // UI Updates
    this.spinButton.alpha = 0.6;
    this.winText.text = "";      

    // spin animations
    this.reels.forEach((r, i) => {
      const target = r.position + 20 + i * 2;
      const time = 2.0 + i * 0.2; 
      
      gsap.to(r, {
          position: target,
          duration: time,
          ease: "power2.out", 
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
    this.spinButton.alpha = 1;
    this.running = false;
    
    // track  themes
    const scatterCount = this.countScatters();
    const isEnteringFreeSpins = scatterCount >= 3 && !this.isFreeSpinsTheme;
    const isExitingFreeSpins = this.isFreeSpinsTheme && this.bonusSpins === 0;
    
    // delay tracker
    let sequenceDelay = 0; 
    
    // win logic
    const wins = this.checkPaylineWins(); 
    
    if(wins.length > 0) {
        let totalWin = 0;
        let isJackpot = false;

        // win sound
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
        this.balanceText.text = `₱${this.balance}`;
        this.totalWinText.text = `₱${this.sessionWins}`;
        
        // MEGABONUS / NORMAL WIN TEXT
        if (!isEnteringFreeSpins && scatterCount < 5) {
            this.winText.style.fontSize = 100;
            if (isJackpot) {
                 this.winText.text = "JACKPOT!!!";
                 this.winText.style.fill = 0xff0000; 
            } else {
                 this.winText.text = `WIN ₱${totalWin}`;
                 this.winText.style.fill = 0xffd700; 
            }
            
            // bounce text
            this.winText.scale.set(.7); 
            gsap.to(this.winText.scale, { x: 1, y: 1, duration: 0.8, ease: "back.out(1.7)" });
            
            // normal win delay
            sequenceDelay = 2.0; 
        }
    }

    // VORTEX 
    if (isEnteringFreeSpins) {
        this.running = true; 
        this.spinButton.interactive = false; 
        this.spinButton.alpha = 0.5;

        // normal win first
        gsap.delayedCall(sequenceDelay, () => {
            this.soundManager.playSFX('sfx_maxwin'); 

            this.bonusSpins += PAYOUTS.SCATTER_SPINS; 
            this.bonusSpinsText.text = `FREE SPINS: ${this.bonusSpins}`;
            
            // animations scatters
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

            this.winText.text = `MEGA BONUS!\n\n10 SPINS!`;
            this.winText.style.fontSize = 100;
            this.winText.style.fill = 0xffd700;

            // Bounce text and then BLACKHOLE
            this.winText.scale.set(0.01); 
            gsap.to(this.winText.scale, { 
                x: 1, y: 1, duration: 3, ease: "elastic.out(1, 0.4)",
                onComplete: () => {
                    this.playBlackHoleTransition(true); 
                }
            });
        });
    } 

    //  VORTEX OUT 
    else if (isExitingFreeSpins) {
        // lock machine and buttons
        this.running = true; 
        this.spinButton.interactive = false; 
        this.spinButton.alpha = 0.5;
        
        //norwal win then final win display
      gsap.delayedCall(sequenceDelay, () => {
            
        // set text to 0 and green
        this.winText.text = `TOTAL WIN\n₱0`; 
        this.winText.style.fill = 0x00FF00;
        this.winText.scale.set(0.01); 
        
        // pop text
        gsap.to(this.winText.scale, { 
            x: 1, y: 1, duration: 1, ease: "back.out(1)"
        });

        // counting animation
        const counter = { val: 0 }; 
        gsap.to(counter, {
            val: this.sessionWins, 
            duration:3,         
            delay: 1.5,           
            ease: "power1.out", 
            onStart: () => {
                // totalwin sound
                this.soundManager.playSFX('sfx_totalwin');
            },   
            onUpdate: () => {
                this.winText.text = `TOTAL WIN\n₱${Math.floor(counter.val)}`;
            },
            onComplete: () => {
                
                this.soundManager.stopSFX('sfx_totalwin');

                
                gsap.delayedCall(1.5, () => {
                    this.sessionWins = 0;
                    this.playBlackHoleTransition(false); 
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

  private getSymbolType(texture: Texture): string {
    const index = this.slotTextures.indexOf(texture);
    if (index >= 0 && index <= 4) return 'LOW'; 
    if (index >= 5 && index <= 7) return 'HIGH'; 
    if (index === 8) return 'WILD'; 
    if (index === 9) return 'SCATTER'; 
    return 'UNKNOWN';
  }

  private countScatters(): number {
    let count = 0;
    for (let r = 0; r < this.reels.length; r++) {
        for (let row = 0; row < 3; row++) {
             const texture = this.reels[r].getSymbolTexture(row);
             if (this.getSymbolType(texture) === 'SCATTER') {
                 count++;
             }
        }
    }
    return count;
  }

  private checkPaylineWins() {
      const wins: any[] = [];
      const WILD_INDEX = 8;     
      const SCATTER_INDEX = 9;  

      PAYLINES.forEach((line, lineIndex) => {
          const symbols = [
              this.slotTextures.indexOf(this.reels[0].getSymbolTexture(line[0])),
              this.slotTextures.indexOf(this.reels[1].getSymbolTexture(line[1])),
              this.slotTextures.indexOf(this.reels[2].getSymbolTexture(line[2])),
              this.slotTextures.indexOf(this.reels[3].getSymbolTexture(line[3])),
              this.slotTextures.indexOf(this.reels[4].getSymbolTexture(line[4]))
          ];

          let bestWinForLine = { payout: 0, isJackpot: false, matchLength: 0, startIndex: 0 };

          for (let start = 0; start <= 2; start++) {
               let targetIndex = symbols[start];
               let matchLength = 1;

               if (targetIndex === WILD_INDEX) {
                   if (start === 0 && 
                       symbols[1] === WILD_INDEX && 
                       symbols[2] === WILD_INDEX && 
                       symbols[3] === WILD_INDEX && 
                       symbols[4] === WILD_INDEX) {
                            wins.push({ lineIndex, payout: this.betAmount * PAYOUTS.JACKPOT, isJackpot: true, matchLength: 5, startIndex: 0 });
                            return; 
                   }
                   
                   for(let k = start + 1; k < 5; k++) {
                       if (symbols[k] !== WILD_INDEX) {
                           targetIndex = symbols[k];
                           break;
                       }
                   }
               }

               if (targetIndex === SCATTER_INDEX) continue; 

               for (let next = start + 1; next < 5; next++) {
                   if (symbols[next] === targetIndex || symbols[next] === WILD_INDEX) {
                       matchLength++;
                   } else {
                       break; 
                   }
               }

               if (matchLength >= 3) {
                   let multiplier = 0;
                   const type = this.getSymbolType(this.slotTextures[targetIndex]);
                   let basePay = (type === 'HIGH') ? PAYOUTS.HIGH : PAYOUTS.LOW;

                   if (matchLength === 3) multiplier = basePay;
                   if (matchLength === 4) multiplier = basePay * PAYOUTS.MULTI_4;
                   if (matchLength === 5) multiplier = basePay * PAYOUTS.MULTI_5;

                   const payout = this.betAmount * multiplier;
                   
                   if (payout > bestWinForLine.payout) {
                       bestWinForLine = { payout, isJackpot: false, matchLength: matchLength, startIndex: start };
                   }
               }
          }

          if (bestWinForLine.payout > 0) {
              wins.push({ 
                  lineIndex, 
                  payout: bestWinForLine.payout, 
                  isJackpot: bestWinForLine.isJackpot,
                  matchLength: bestWinForLine.matchLength,
                  startIndex: bestWinForLine.startIndex 
              });
          }
      });
      return wins;
  }

 private animateSymbolToContainer(symbolSprite: Sprite, reel: Reel) {
    const symbolIndex = this.slotTextures.indexOf(symbolSprite.texture);
    console.log("Winning symbol index:", symbolIndex);
    

    SymbolAnimator.play(symbolIndex, symbolSprite, reel, this.activeAnimations, this.isQuickSpin);
}

private bounceSpecialSymbols(reel: Reel) {
      for (let row = 0; row < 3; row++) {
          const sprite = reel.getSymbolAtRow(row);
          const index = this.slotTextures.indexOf(sprite.texture);
          
          // wild || Scatter
          if (index === 8 || index === 9) {
              const baseScale = (sprite as any).baseScale || 1;
              
              sprite.zIndex = 50; 
              reel.container.zIndex = 50;
              
              // landing bounce
              gsap.to(sprite.scale, {
                  x: baseScale * 1.1,
                  y: baseScale * 1.1,
                  duration: 0.2,
                  yoyo: true,
                  repeat: 1,
                  delay: 0.1,
                  ease: "back.out(2)",
                  onComplete: () => {
                    sprite.scale.set(baseScale);
                      sprite.zIndex = 0; 
                  }
              });
          }
      }
  }

  private setupBlackHole() {
      this.blackHole = new Sprite(Assets.get("vortex.png"));
      this.blackHole.anchor.set(0.5);
      this.blackHole.scale.set(0); 
      this.blackHole.zIndex = 999; 
      
      
      this.blackHole.x = window.innerWidth / 2;
      this.blackHole.y = window.innerHeight / 2;
      
      this.app.stage.addChild(this.blackHole);
  }

 private swapTheme(toFreeSpins: boolean) {
      this.isFreeSpinsTheme = toFreeSpins;
      const bgSprite = this.backgroundContainer.children[0] as Sprite;
      
      //  change music
      this.soundManager.playBGM(toFreeSpins);
      gsap.delayedCall(1.0, () => this.soundManager.playBGM(toFreeSpins));
      
      this.reels.forEach(r => {
          r.isFreeSpins = toFreeSpins;
          if (toFreeSpins) r.removeScattersInstantly(); 
      });
      
      if (toFreeSpins) {
          bgSprite.tint = 0xFF0055; 
          
          //  ON effect
          this.toggleFreeSpinEffects(true); 
      } else {
          bgSprite.tint = 0xFFFFFF; 
          
          // off
          this.toggleFreeSpinEffects(false); 
      }
  }

    private playBlackHoleTransition(toFreeSpins: boolean) {
      this.running = true; 

      //  vortex sound
      this.soundManager.playSFX('sfx_vortex');
      gsap.delayedCall(3.0, () => this.soundManager.playSFX('sfx_vortex'));

      if (this.spinButton) { 
          this.spinButton.interactive = false; 
          this.spinButton.alpha = 0.5;        
      }
      const targetScale = this.mainContainer.scale.x || CONFIG.MACHINE_SCALE;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2.2;
      
     const tl = gsap.timeline({
          onComplete: () => {
              this.running = false; 
              this.winText.scale.set(0); 
              
              if (this.spinButton) {
                  this.spinButton.interactive = true; 
                  this.spinButton.alpha = 1;          
              }
              
              if (toFreeSpins && this.bonusSpins > 0) {
                  this.startSpin();
                  
              } else if (!toFreeSpins && this.autoSpinActive) { 
                
                  gsap.delayedCall(1, () => this.startSpin());
              }
          }
      });
      
      this.blackHole.x = window.innerWidth / 2;
      this.blackHole.y = window.innerHeight / 2;
      this.blackHole.scale.set(0);
      this.blackHole.rotation = 0;

      tl.to(this.blackHole, { rotation: -Math.PI * 15, duration: 3, ease: "none" }, 0);

      //  Vortex grows 
      tl.to(this.blackHole.scale, { x: 5, y: 5, duration: 1.5, ease: "power2.out" }, 0);

      //  machine disappears
      tl.to(this.mainContainer.scale, { x: 0, y: 0, duration: 1, ease: "power4.in" }, 0.5);

      // Swap the theme 
      tl.call(() => {
          this.swapTheme(toFreeSpins); 

          this.winText.scale.set(0);
          this.winText.text = "";
      }, undefined, 1.5);

      //  Vortex shrinks 
      tl.to(this.blackHole.scale, { x: 0, y: 0, duration: 1.5, ease: "power2.in" }, 1.5);

      // explosive pop 
      tl.to(this.mainContainer.scale, {
          x: targetScale * 1.2,
          y: targetScale * 1.2,
          duration: 0.1,
          ease: "power2.out"
      }, 1.0)
      .to(this.mainContainer.scale, {
          x: targetScale,
          y: targetScale,
          duration: 0.2,
          ease: "power2.in"
      }, 3.25)
      .to(this.mainContainer, { rotation: 0, duration: 0.45, ease: "power2.out" }, 3.0);

      //  impact sound
      tl.call(() => this.soundManager.playSFX('sfx_impact'), undefined, 3.0);

      tl.call(() => this.soundManager.stopSFX('sfx_vortex'), undefined, 4);

      // Screen shake at pop
      tl.to(this.mainContainer, { x: centerX + 14, y: centerY + 8, duration: 0.04 }, 3.0);
      tl.to(this.mainContainer, { x: centerX - 12, y: centerY - 6, duration: 0.04 }, 3.04);
      tl.to(this.mainContainer, { x: centerX + 8, y: centerY + 4, duration: 0.04 }, 3.08);
      tl.to(this.mainContainer, { x: centerX, y: centerY, duration: 0.2, ease: "power2.out" }, 3.12);

      // Particle burst
      tl.call(() => this.playExplosionParticles(centerX, centerY), undefined, 3.0);
    }

  private playExplosionParticles(centerX: number, centerY: number) {
      const partContainer = new Container();
      partContainer.zIndex = 1000;
      this.app.stage.addChild(partContainer);

      const colors = [0xFFFFFF, 0xFFDD00, 0xFFAA00, 0xFF6600];
      const count = 38;

      for (let i = 0; i < count; i++) {
          const g = new Graphics();
          const r = 4 + Math.random() * 8;
          g.circle(0, 0, r);
          g.fill(colors[Math.floor(Math.random() * colors.length)]);
          g.alpha = 0.95;
          g.x = centerX;
          g.y = centerY;
          partContainer.addChild(g);

          const angle = Math.random() * Math.PI * 2;
          const dist = 80 + Math.random() * 140;
          const endX = centerX + Math.cos(angle) * dist;
          const endY = centerY + Math.sin(angle) * dist;
          const dur = 0.3 + Math.random() * 0.2;

          gsap.to(g, {
              x: endX,
              y: endY,
              alpha: 0,
              duration: dur,
              ease: "power4.out",
              onComplete: () => g.destroy()
          });
          gsap.to(g.scale, { x: 0.2, y: 0.2, duration: dur, ease: "power4.out" });
      }

      gsap.delayedCall(0.55, () => {
          partContainer.destroy({ children: true });
      });
  }

  private toggleFreeSpinEffects(enable: boolean) {
      if (enable) {
         
          this.freeSpinBorder.alpha = 1;
          this.animateLightningBorder(); 

          // Start  flashes
          this.triggerLightning()
      } else {
          //kill all effects
          gsap.killTweensOf(this.animateLightningBorder);
          gsap.killTweensOf(this.triggerLightning);
          
          this.freeSpinBorder.alpha = 0;
          this.lightningOverlay.alpha = 0;
      }
  }

  private triggerLightning() {
      
      if (!this.isFreeSpinsTheme) return;

      this.soundManager.playSFX('sfx_thunder');
      // flashes
      gsap.to(this.lightningOverlay, {
        alpha: 0.4, 
        duration: 0.05,
        yoyo: true,
        repeat: 5, 
        ease: "none",
        onComplete: () => {
            this.lightningOverlay.alpha = 0; 
            
            gsap.delayedCall(Math.random() * 3, () => this.triggerLightning());
          }
      });
  }

  private drawLightningLine(g: Graphics, x1: number, y1: number, x2: number, y2: number) {
      const segments = 45; 
      g.moveTo(x1, y1);
      
      for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          
          //  straight point
          let px = x1 + (x2 - x1) * t;
          let py = y1 + (y2 - y1) * t;
          
          //  random jagged offset!
          if (i !== segments) {
              const offset = (Math.random() - 0.3) * 60; 
              const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
              px += Math.cos(angle) * offset;
              py += Math.sin(angle) * offset;
          }
          
          g.lineTo(px, py);
      }
  }

  private updateLightningBorder() {
    
      this.freeSpinBorder.clear();
      
      const x = -1920 / 2;
      const y = -1060 / 2;
      const w = 1890;
      const h = 1050;

      const numberOfBolts = 20; 
      
      for (let i = 0; i < numberOfBolts; i++) {
          this.drawLightningLine(this.freeSpinBorder, x, y, x + w, y);         
          this.drawLightningLine(this.freeSpinBorder, x + w, y, x + w, y + h);   
          this.drawLightningLine(this.freeSpinBorder, x + w, y + h, x, y + h);   
          this.drawLightningLine(this.freeSpinBorder, x, y + h, x, y);          
      }       
      
      //  STROKES
      this.freeSpinBorder
          .stroke({ color: 0xFF0055, width: 3, alpha: 0.3, cap: "round", join: "round" }) 
    
  }

  private animateLightningBorder = () => {
      
      if (!this.isFreeSpinsTheme) return;

      this.updateLightningBorder();
      
      gsap.delayedCall(0.1, this.animateLightningBorder);
  }
}