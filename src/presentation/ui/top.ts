import { Container, Sprite, Assets, Text, Graphics, BlurFilter } from "pixi.js";
import gsap from "gsap";
import { CONFIG, GAME_RULES } from "../../domain/constants/Config";

export class TopUI {
  private container: Container;
  private grandSprite: Sprite;
  private majorSprite: Sprite;
  private miniSprite: Sprite;

  private grandText: Text;
  private majorText: Text;
  private miniText: Text;

  private miniContainer!: Container;
  private majorContainer!: Container;
  private grandContainer!: Container;

  private miniGlow!: Graphics;
  private majorGlow!: Graphics;
  private grandGlow!: Graphics;

  constructor() {
    this.container = new Container();

    this.miniContainer = new Container();
    this.miniContainer.x = CONFIG.JACKPOT_MINI_LANDSCAPE_X;
    this.miniContainer.y = CONFIG.JACKPOT_MINI_LANDSCAPE_Y;
    this.miniContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
    this.container.addChild(this.miniContainer);

    // Mini Glow (Blue)
    this.miniGlow = this.createGlow( 0xffc107);
    this.miniGlow.position.set(320, 170);
    this.miniContainer.addChild(this.miniGlow);

    this.miniSprite = new Sprite(Assets.get("mini.png"));
    this.miniSprite.anchor.set(0, 0);
    this.miniContainer.addChild(this.miniSprite);

    this.miniText = this.createJackpotText(
      380, // Text Offset X (Hardcoded for now as it's a relative offset)
      200, // Text Offset Y
      CONFIG.JACKPOT_VALUE_FILL,
      CONFIG.UI_JACKPOT_MINI_SIZE,
      CONFIG.JACKPOT_VALUE_STROKE_COLOR,
      CONFIG.JACKPOT_VALUE_STROKE_WIDTH,
    );
    this.miniContainer.addChild(this.miniText);

    this.majorContainer = new Container();
    this.majorContainer.x = CONFIG.JACKPOT_MAJOR_LANDSCAPE_X;
    this.majorContainer.y = CONFIG.JACKPOT_MAJOR_LANDSCAPE_Y;
    this.majorContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
    this.container.addChild(this.majorContainer);

    // Major Glow (Yellow/Amber)
    this.majorGlow = this.createGlow(0x29b6f6);
    this.majorGlow.position.set(300, 170);
    this.majorContainer.addChild(this.majorGlow);

    this.majorSprite = new Sprite(Assets.get("major.png"));
    this.majorSprite.anchor.set(0, 0);
    this.majorContainer.addChild(this.majorSprite);

    this.majorText = this.createJackpotText(
      380,
      200,
      CONFIG.JACKPOT_VALUE_FILL,
      CONFIG.UI_JACKPOT_MAJOR_SIZE,
      CONFIG.JACKPOT_VALUE_STROKE_COLOR,
      CONFIG.JACKPOT_VALUE_STROKE_WIDTH,
    );
    this.majorContainer.addChild(this.majorText);

    this.grandContainer = new Container();
    this.grandContainer.x = CONFIG.JACKPOT_GRAND_LANDSCAPE_X;
    this.grandContainer.y = CONFIG.JACKPOT_GRAND_LANDSCAPE_Y;
    this.grandContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
    this.container.addChild(this.grandContainer);

    // Grand Glow (Pink/Red)
    this.grandGlow = this.createGlow(0xe91e63);
    this.grandGlow.position.set(300, 190);
    this.grandContainer.addChild(this.grandGlow);

    this.grandSprite = new Sprite(Assets.get("grand.png"));
    this.grandSprite.anchor.set(0, 0);
    this.grandContainer.addChild(this.grandSprite);

    this.grandText = this.createJackpotText(
      420,
      200,
      CONFIG.JACKPOT_VALUE_FILL,
      CONFIG.UI_JACKPOT_GRAND_SIZE,
      CONFIG.JACKPOT_VALUE_STROKE_COLOR,
      CONFIG.JACKPOT_VALUE_STROKE_WIDTH,
    );
    this.grandContainer.addChild(this.grandText);

    this.startGlowAnimations();
  }

  private createGlow(color: number): Graphics {
    const g = new Graphics();
    g.circle(0, 0, 150).fill({ color, alpha: 0.8 });
    
    g.scale.set(3.0, 1.2);
    
    const blur = new BlurFilter();
    blur.strength = 80;
    g.filters = [blur];
    
    g.blendMode = "add";
    g.alpha = 1;
    return g;
  }

  private startGlowAnimations() {
    [this.miniGlow, this.majorGlow, this.grandGlow].forEach((g, i) => {
      gsap.to(g.scale, {
        x: 1.3,
        y: 1.3,
        duration: 2 + i * 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(g, {
        alpha: 0.6,
        duration: 1.5 + i * 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });
  }

  private createJackpotText(
    x: number,
    y: number,
    color: number,
    size: number,
    strokeColor: number,
    strokeWidth: number,
  ): Text {
    const text = new Text({
      text: "",
      style: {
        fill: color,
        fontSize: size,
        fontWeight: "bold",
        stroke: { color: strokeColor, width: strokeWidth },
        letterSpacing: 2,
      },
      resolution: CONFIG.UI_JACKPOT_RESOLUTION,
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    return text;
  }

  public updateJackpots(prizes?: {
    mini: number;
    major: number;
    grand: number;
  }) {
    const p = prizes ?? {
      mini: GAME_RULES.JACKPOT_MINI,
      major: GAME_RULES.JACKPOT_MAJOR,
      grand: GAME_RULES.JACKPOT_GRAND,
    };
    this.miniText.text = `₱${p.mini.toLocaleString()}`;
    this.majorText.text = `₱${p.major.toLocaleString()}`;
    this.grandText.text = `₱${p.grand.toLocaleString()}`;
  }

  public setTheme(isFreeSpins: boolean) {
    if (!this.grandSprite || !this.majorSprite || !this.miniSprite) return;
    const tint = isFreeSpins
      ? CONFIG.UI_COLORS.FREE_SPINS_TINT
      : CONFIG.UI_COLORS.DEFAULT_TINT;
    this.grandSprite.tint = tint;
    this.majorSprite.tint = tint;
    this.miniSprite.tint = tint;
  }

  public updateResponsiveLayout(isPortrait: boolean) {
    if (isPortrait) {
      this.miniContainer.x = CONFIG.JACKPOT_MINI_PORTRAIT_X;
      this.miniContainer.y = CONFIG.JACKPOT_MINI_PORTRAIT_Y;
      this.miniContainer.scale.set(CONFIG.JACKPOT_PORTRAIT_SCALE);

      this.majorContainer.x = CONFIG.JACKPOT_MAJOR_PORTRAIT_X;
      this.majorContainer.y = CONFIG.JACKPOT_MAJOR_PORTRAIT_Y;
      this.majorContainer.scale.set(CONFIG.JACKPOT_PORTRAIT_SCALE);

      this.grandContainer.x = CONFIG.JACKPOT_GRAND_PORTRAIT_X;
      this.grandContainer.y = CONFIG.JACKPOT_GRAND_PORTRAIT_Y;
      this.grandContainer.scale.set(CONFIG.JACKPOT_PORTRAIT_SCALE);
    } else {
      this.miniContainer.x = CONFIG.JACKPOT_MINI_LANDSCAPE_X;
      this.miniContainer.y = CONFIG.JACKPOT_MINI_LANDSCAPE_Y;
      this.miniContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);

      this.majorContainer.x = CONFIG.JACKPOT_MAJOR_LANDSCAPE_X;
      this.majorContainer.y = CONFIG.JACKPOT_MAJOR_LANDSCAPE_Y;
      this.majorContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);

      this.grandContainer.x = CONFIG.JACKPOT_GRAND_LANDSCAPE_X;
      this.grandContainer.y = CONFIG.JACKPOT_GRAND_LANDSCAPE_Y;
      this.grandContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
    }
  }

  getContainer(): Container {
    return this.container;
  }
}
