import { Container, Sprite, Graphics, Assets, Application } from "pixi.js";
import gsap from "gsap";
import {
  CONFIG,
  getAppWidth,
  getAppHeight,
  LANDSCAPE,
  PORTRAIT,
  getDeviceType,
  DEVICE_TYPES,
} from "../../domain/constants/Config";
import type { Reel } from "../../domain/entities/Reel";
import type { SoundManager } from "../../infrastructure/audio/SoundManager";
import type { LightningBorder } from "../animation/LightningBorder";
import { Starfield } from "../animation/Starfield";
import { WaterBg } from "../animation/WaterBg";
import { CloudBackground } from "../animation/CloudBackground";

export class VFXManager {
  public isFreeSpinsTheme: boolean = false;
  private blackHole!: Sprite;
  private lightningOverlay: Graphics;

  private app: Application;
  private mainContainer: Container;
  private backgroundContainer: Container;
  private soundManager: SoundManager;
  public lightning: LightningBorder;
  public starfield: Starfield;
  public waterBg: WaterBg;
  public cloudBackground: CloudBackground;

  constructor(
    app: Application,
    mainContainer: Container,
    backgroundContainer: Container,
    soundManager: SoundManager,
    lightning: LightningBorder,
    starfield: Starfield,
    waterBg: WaterBg,
    cloudBackground: CloudBackground,
  ) {
    this.app = app;
    this.mainContainer = mainContainer;
    this.backgroundContainer = backgroundContainer;
    this.lightning = lightning;
    this.soundManager = soundManager;

    this.waterBg = waterBg;
    this.cloudBackground = cloudBackground;
    this.lightningOverlay = new Graphics();
    this.setupLightningOverlay();
    this.starfield = starfield;
  }

  private setupLightningOverlay() {
    this.lightningOverlay.rect(-2000, -2000, 4000, 4000);
    this.lightningOverlay.fill(0xff0055);
    this.lightningOverlay.alpha = 0;
    this.backgroundContainer.addChild(this.lightningOverlay);
  }

  setupBlackHole() {
    this.blackHole = new Sprite(Assets.get("vortex.png"));
    this.blackHole.anchor.set(0.5);
    this.blackHole.scale.set(0);
    this.blackHole.zIndex = 999;
    this.updateBlackHolePosition();
    this.app.stage.addChild(this.blackHole);
  }

  handleResize() {
    this.updateBlackHolePosition();
  }

  private getSlotCenter(forcedIsFreeSpins?: boolean): { x: number; y: number; scale: number } {
    const screenWidth = getAppWidth();
    const screenHeight = getAppHeight();
    const isPortrait = screenHeight > screenWidth;
    const deviceType = getDeviceType();

    const designWidth = isPortrait
      ? CONFIG.DESIGN_WIDTH_PORTRAIT
      : CONFIG.DESIGN_WIDTH_LANDSCAPE;
    const designHeight = isPortrait
      ? CONFIG.DESIGN_HEIGHT_PORTRAIT
      : CONFIG.DESIGN_HEIGHT_LANDSCAPE;
    
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

    const slotOffX = isPortrait
      ? CONFIG.SLOT_OFFSET_X_PORTRAIT
      : CONFIG.SLOT_OFFSET_X_LANDSCAPE;
    const slotOffY = isPortrait
      ? CONFIG.SLOT_OFFSET_Y_PORTRAIT
      : CONFIG.SLOT_OFFSET_Y_LANDSCAPE;

    let scale = Math.min(
      screenWidth / designWidth,
      screenHeight / designHeight,
    );
    scale *= machineScale;

    const isFStheme = forcedIsFreeSpins !== undefined ? forcedIsFreeSpins : this.isFreeSpinsTheme;

    if (isFStheme) {
      const freeSpinsMult = isPortrait
        ? PORTRAIT.FREE_SPINS_SCALE_MULT
        : LANDSCAPE.FREE_SPINS_SCALE_MULT;
      scale *= freeSpinsMult;
    }

    return {
      x: screenWidth / 2 + slotOffX * scale,
      y: screenHeight / 2 + slotOffY * scale,
      scale,
    };
  }

  private updateBlackHolePosition() {
    if (!this.blackHole) return;
    const { x, y } = this.getSlotCenter();
    this.blackHole.x = x;
    this.blackHole.y = y;
  }

  swapTheme(toFreeSpins: boolean, reels: Reel[], skipLightning: boolean = false) {
    this.isFreeSpinsTheme = toFreeSpins;

    // change music
    this.soundManager.playBGM(toFreeSpins);
    gsap.delayedCall(1.0, () => this.soundManager.playBGM(toFreeSpins));

    reels.forEach((r) => {
      r.isFreeSpins = toFreeSpins;
      if (toFreeSpins) r.removeScattersInstantly();
    });

    if (toFreeSpins) {
      if (this.waterBg) this.waterBg.setTheme(true);
      if (this.starfield) this.starfield.setTheme(true);
      if (this.cloudBackground) this.cloudBackground.setTheme(true);
      if (!skipLightning) this.toggleFreeSpinEffects(true);
    } else {
      if (this.waterBg) this.waterBg.setTheme(false);
      if (this.starfield) this.starfield.setTheme(false);
      if (this.cloudBackground) this.cloudBackground.setTheme(false);
      this.toggleFreeSpinEffects(false);
    }
  }

  // vortex
  playBlackHoleTransition(
    _toFreeSpins: boolean,
    onSwapTextCall: () => void,
    onCompleteCall: () => void,
  ) {
    this.soundManager.playSFX("sfx_vortex");
    gsap.delayedCall(3.0, () => this.soundManager.playSFX("sfx_vortex"));

    const { x: centerX, y: centerY, scale: targetScale } = this.getSlotCenter(_toFreeSpins);
    this.blackHole.x = centerX;
    this.blackHole.y = centerY;
    this.blackHole.scale.set(0);
    this.blackHole.rotation = 0;

    const tl = gsap.timeline({
      onComplete: onCompleteCall,
    });

    if (_toFreeSpins) {
      this.blackHole.tint = 0xff246e;
    } else {
      this.blackHole.tint = 0xffffff;
    }

    tl.to(
      this.blackHole,
      { rotation: -Math.PI * 15, duration: 3, ease: "none" },
      0,
    );
    tl.to(
      this.blackHole.scale,
      { x: 5, y: 5, duration: 1.5, ease: "power4.out" },
      0,
    );
    tl.to(
      this.mainContainer.scale,
      { x: 0, y: 0, duration: 1, ease: "power4.in" },
      0.5,
    );

    // Swap  theme
    tl.call(onSwapTextCall, undefined, 1.5);

    tl.to(
      this.blackHole.scale,
      { x: 0, y: 0, duration: 1.5, ease: "power2.in" },
      1.5,
    );

    // explosive pop
    tl.to(
      this.mainContainer.scale,
      {
        x: targetScale * 1.2,
        y: targetScale * 1.2,
        duration: 0.1,
        ease: "power2.out",
      },
      1.0,
    )
      .to(
        this.mainContainer.scale,
        { x: targetScale, y: targetScale, duration: 0.2, ease: "power2.in" },
        3.25,
      )
      .to(
        this.mainContainer,
        { rotation: 0, duration: 0.45, ease: "power2.out" },
        3.0,
      );

    // impact sound
    tl.call(() => this.soundManager.playSFX("sfx_impact"), undefined, 3.0);
    tl.call(() => this.soundManager.stopSFX("sfx_vortex"), undefined, 4);

    tl.to(
      this.mainContainer,
      { x: centerX + 14, y: centerY + 8, duration: 0.04 },
      3.0,
    );
    tl.to(
      this.mainContainer,
      { x: centerX - 12, y: centerY - 6, duration: 0.04 },
      3.04,
    );
    tl.to(
      this.mainContainer,
      { x: centerX + 8, y: centerY + 4, duration: 0.04 },
      3.08,
    );
    tl.to(
      this.mainContainer,
      { x: centerX, y: centerY, duration: 0.2, ease: "power2.out" },
      3.12,
    );

    // Particle burst
    tl.call(
      () => this.playExplosionParticles(centerX, centerY),
      undefined,
      3.0,
    );
  }

  private playExplosionParticles(centerX: number, centerY: number) {
    const partContainer = new Container();
    partContainer.zIndex = 1000;
    this.app.stage.addChild(partContainer);

    const colors = [0xffffff, 0xffdd00, 0xffaa00, 0xff6600];
    const count = 38;

    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      const r = 4 + Math.random() * 20;
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
        onComplete: () => g.destroy(),
      });
      gsap.to(g.scale, { x: 0.2, y: 0.2, duration: dur, ease: "power4.out" });
    }

    gsap.delayedCall(0.55, () => {
      partContainer.destroy({ children: true });
    });
  }

  public toggleFreeSpinEffects(enable: boolean) {
    if (enable) {
      this.lightning.show();
      this.triggerLightning();

      this.triggerRumble();
    } else {
      this.lightning.hide();

      gsap.killTweensOf(this.triggerLightning);
      if (this.lightningOverlay) {
        gsap.killTweensOf(this.lightningOverlay);
        this.lightningOverlay.alpha = 0;
      }
    }
  }

  private triggerLightning() {
    if (!this.isFreeSpinsTheme) return;
    this.soundManager.playSFX("sfx_thunder");

    gsap.to(this.lightningOverlay, {
      alpha: 0.4,
      duration: 0.2,
      yoyo: true,
      repeat: 5,
      ease: "none",
      onComplete: () => {
        this.lightningOverlay.alpha = 0;
        gsap.delayedCall(Math.random() * 5, () => this.triggerLightning());
      },
    });
  }

  private triggerRumble() {
    const { x: centerX, y: centerY } = this.getSlotCenter();

    if (!this.isFreeSpinsTheme) {
      gsap.to(this.mainContainer, { x: centerX, y: centerY, duration: 0.1 });
      return;
    }

    //  intensity
    const intensity = 3;

    // X and Y around the offset slot center
    const randomX = centerX + (Math.random() * intensity * 2.5 - intensity);
    const randomY = centerY + (Math.random() * intensity * 2 - intensity);

    gsap.to(this.mainContainer, {
      x: randomX,
      y: randomY,
      duration: 0.02, 
      ease: "none",
      onComplete: () => this.triggerRumble(),
    });
  }
}
