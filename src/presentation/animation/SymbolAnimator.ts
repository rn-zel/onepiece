import {
  AnimatedSprite,
  Spritesheet,
  Assets,
  Sprite,
  Container,
} from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";
import type { SymbolAnimation } from "./SymbolAnimation";
import symbolsImagePath from "../../assets/symbols.png";
import type { Reel } from "../../domain/entities/Reel";

export class SymbolAnimator implements SymbolAnimation {
  private masterSpritesheet!: Spritesheet;
  private isLoaded: boolean = false;

  public async init(): Promise<void> {
    try {
      const frameWidth = 450;
      const frameHeight = 400;
      const sheetWidth = 1800;
      const sheetHeight = 4004;

      const symbolFrameCounts: Record<number, number> = {
        0: 4,
        1: 4,
        2: 4,
        3: 4,
        4: 4,
        5: 4,
        6: 4,
        7: 4,
        8: 4,
        9: 4,
      };

      const framesData: any = {};
      const animationsData: any = {};

      for (const key in symbolFrameCounts) {
        const symbolIndex = parseInt(key);
        const frameCount = symbolFrameCounts[symbolIndex];
        const flashArray: string[] = [];

        for (let frameNum = 0; frameNum < frameCount; frameNum++) {
          const borderOffset = 10;
          const innerWidth = frameWidth - borderOffset * 2;
          const innerHeight = frameHeight - borderOffset * 2;

          const xPos = frameNum * frameWidth + borderOffset;
          const yPos = symbolIndex * frameHeight + borderOffset;
          const frameName = `sym_${symbolIndex}_frame_${frameNum}`;

          framesData[frameName] = {
            frame: { x: xPos, y: yPos, w: innerWidth, h: innerHeight },
            sourceSize: { w: innerWidth, h: innerHeight },
            spriteSourceSize: { x: 0, y: 0, w: innerWidth, h: innerHeight },
          };

          flashArray.push(frameName);
        }

        animationsData[`symbol_${symbolIndex}`] = flashArray;
      }

      const atlasData = {
        frames: framesData,
        meta: {
          image: symbolsImagePath,
          format: "RGBA8888",
          size: { w: sheetWidth, h: sheetHeight },
          scale: 1,
        },
        animations: animationsData,
      };

      const texture = await Assets.load(symbolsImagePath);
      this.masterSpritesheet = new Spritesheet(texture, atlasData);
      await this.masterSpritesheet.parse();

      this.isLoaded = true;
    } catch (error) {
      console.error("FAILED TO LOAD SYMBOL ANIMATION", error);
    }
  }

  public play(
    symbolIndex: number,
    staticSprite: Sprite,
    reel: Reel,
    activeAnimations: AnimatedSprite[],
    _isQuickSpin: boolean,
  ): void {
    if (!this.isLoaded) return;

    const textures = this.masterSpritesheet.animations[`symbol_${symbolIndex}`];
    if (!textures) return;

    const winContainer = new Container();
    winContainer.sortableChildren = true;

    const trueScale = (staticSprite as any).baseScale || staticSprite.scale.x;
    const renderedHeight = staticSprite.texture.height * trueScale;

    const frameHeight = 400;
    const borderOffset = 10;
    const innerHeight = frameHeight - borderOffset * 2;
    const animScale = (renderedHeight / innerHeight) * 1.1;

    winContainer.x = staticSprite.x;
    winContainer.y = staticSprite.y + renderedHeight * 0.5;
    winContainer.zIndex = 100;

    const animatedSymbol = new AnimatedSprite(textures);
    animatedSymbol.anchor.set(0.5, 0.5);
    animatedSymbol.scale.set(animScale);
    animatedSymbol.x = 0;
    animatedSymbol.y = 0;
    animatedSymbol.zIndex = 1;
    animatedSymbol.animationSpeed = CONFIG.SYMBOL_ANIM_SPEED;
    animatedSymbol.loop = true;

    winContainer.addChild(animatedSymbol);

    staticSprite.alpha = 0.3;

    reel.container.addChild(winContainer);
    activeAnimations.push(winContainer as any);

    animatedSymbol.play();
  }
}
