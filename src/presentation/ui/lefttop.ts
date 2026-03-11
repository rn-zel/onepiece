import { Container, Sprite, Assets } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";

export class LeftTopUI {
  private container: Container;
  private hatSprite: Sprite;

  constructor() {
    this.container = new Container();
    this.hatSprite = new Sprite(Assets.get("hat.png"));
    this.hatSprite.anchor.set(0, 0);
    this.hatSprite.x = CONFIG.HAT_LANDSCAPE_X;
    this.hatSprite.y = CONFIG.HAT_LANDSCAPE_Y;
    this.hatSprite.scale.set(CONFIG.HAT_LANDSCAPE_SCALE);
    this.container.addChild(this.hatSprite);
  }
  public setTheme(isFreeSpins: boolean) {
    if (!this.hatSprite) return;
    this.hatSprite.tint = isFreeSpins
      ? CONFIG.UI_COLORS.FREE_SPINS_TINT
      : CONFIG.UI_COLORS.DEFAULT_TINT;
  }

  public updateResponsiveLayout(isPortrait: boolean) {
    this.container.visible = !isPortrait; // Hide hat in portrait
  }

  getContainer(): Container {
    return this.container;
  }
}
