// 📁 src/animation/WaterBg.ts
import { Sprite, Assets } from "pixi.js";
import bgImagePath from "../../assets/321.png";

export class WaterBg {
  public sprite!: Sprite;
  public isLoaded: boolean = false;

  public async init() {
    try {
      const texture = await Assets.load(bgImagePath);
      this.sprite = new Sprite(texture);
      this.sprite.anchor.set(0.5);
      this.isLoaded = true;
    } catch (error) {
      console.error("WaterBg Init Error:", error);
    }
  }

  public setTheme(isFreeSpins: boolean) {
    if (!this.isLoaded || !this.sprite) return;

    this.sprite.tint = isFreeSpins ? 0xaf3f3b : 0xffffff;
  }

  public play() {}
  public stop() {}
}
