import { AnimatedSprite, Spritesheet, Assets } from "pixi.js";

import gridImagePath from "../../assets/border.png";

export class LightningBorder {
  public sprite!: AnimatedSprite;
  public isLoaded: boolean = false;

  public async init() {
    try {
      const frameWidth = 450;
      const frameHeight = 256;
      const columns = 13;
      const rows = 13;
      const totalFrames = 161;

      const framesData: any = {};
      const flashArray: string[] = [];

      for (let i = 0; i < totalFrames; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);

        const xPos = col * frameWidth;
        const yPos = row * frameHeight;
        const frameName = `frame${i}`;

        framesData[frameName] = {
          frame: { x: xPos, y: yPos, w: frameWidth, h: frameHeight },
          sourceSize: { w: frameWidth, h: frameHeight },
          spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
        };

        flashArray.push(frameName);
      }

      const atlasData = {
        frames: framesData,
        meta: {
          image: gridImagePath,
          format: "RGBA8888",
          size: { w: columns * frameWidth, h: rows * frameHeight },
          scale: 1,
        },
        animations: {
          flash: flashArray,
        },
      };

      const texture = await Assets.load(gridImagePath);
      const spritesheet = new Spritesheet(texture, atlasData);
      await spritesheet.parse();

      this.sprite = new AnimatedSprite(spritesheet.animations.flash);

      this.sprite.anchor.set(0.5);

      this.sprite.animationSpeed = 0.5;
      this.sprite.loop = true;
      this.sprite.alpha = 0;

      this.sprite.blendMode = "add";

      this.isLoaded = true;
    } catch (error) {
      console.error("Failed to load the Grid Spritesheet!", error);
    }
  }

  public show() {
    if (!this.isLoaded) return;
    this.sprite.alpha = 1;
    this.sprite.play();
  }

  public hide() {
    if (!this.isLoaded) return;
    this.sprite.alpha = 0;
    this.sprite.stop();
    this.sprite.gotoAndStop(0);
  }
}
