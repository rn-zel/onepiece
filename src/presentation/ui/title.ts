import { Container, Assets, Sprite } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";
// export class TitleUI {
//     private container: Container;
//     private staticSprite: Sprite;
//     private animSprite?: AnimatedSprite;
//     private isFreeSpinsTheme: boolean = false;

//     constructor() {
//         this.container = new Container();

//         this.staticSprite = new Sprite(Assets.get("model.png"));
//         this.staticSprite.anchor.set(0, 0);
//         this.staticSprite.x = CONFIG.TITLE_X;
//         this.staticSprite.y = CONFIG.TITLE_Y;
//         this.staticSprite.scale.set(CONFIG.TITLE_SCALE);
//         this.staticSprite.tint = CONFIG.UI_COLORS.DEFAULT_TINT;
//         this.container.addChild(this.staticSprite);

//         void this.initSpritesheet();
//     }

//     private async initSpritesheet() {
//         const texture = await Assets.load(titleSheetPath);

//         const columns = CONFIG.TITLE_SHEET_COLS;
//         const rows = CONFIG.TITLE_SHEET_ROWS;
//         const totalFrames = CONFIG.TITLE_SHEET_FRAMES;

//         const frameWidth = Math.floor(texture.width / columns);
//         const frameHeight = Math.floor(texture.height / rows);

//         const framesData: any = {};
//         const animationFrames: string[] = [];

//         for (let i = 0; i < totalFrames; i++) {
//             const col = i % columns;
//             const row = Math.floor(i / columns);

//             const xPos = col * frameWidth;
//             const yPos = row * frameHeight;
//             const frameName = `frame${i}`;

//             framesData[frameName] = {
//                 frame: { x: xPos, y: yPos, w: frameWidth, h: frameHeight },
//                 sourceSize: { w: frameWidth, h: frameHeight },
//                 spriteSourceSize: { x: 0, y: 0, w: frameWidth, h: frameHeight },
//             };

//             animationFrames.push(frameName);
//         }

//         const atlasData = {
//             frames: framesData,
//             meta: {
//                 image: titleSheetPath,
//                 format: "RGBA8888",
//                 size: { w: texture.width, h: texture.height },
//                 scale: 1,
//             },
//             animations: {
//                 titleLoop: animationFrames,
//             },
//         };

//         const spritesheet = new Spritesheet(texture, atlasData);
//         await spritesheet.parse();

//         this.animSprite = new AnimatedSprite(spritesheet.animations.titleLoop);
//         this.animSprite.anchor.set(0, 0);
//         this.animSprite.x = CONFIG.TITLE_X ;
//         this.animSprite.y = CONFIG.TITLE_Y ;
//         this.animSprite.blendMode = "screen";

//         const fitScale = Math.min(
//             CONFIG.TITLE_MAX_WIDTH / (frameWidth - 5),
//             CONFIG.TITLE_MAX_HEIGHT / frameHeight
//         );
//         this.animSprite.scale.set(fitScale - 1);

//         this.animSprite.animationSpeed = CONFIG.TITLE_ANIM_SPEED;
//         this.animSprite.loop = true;
//         this.animSprite.visible = false;

//         this.animSprite.tint = this.isFreeSpinsTheme
//             ? CONFIG.UI_COLORS.FREE_SPINS_TINT
//             : CONFIG.UI_COLORS.DEFAULT_TINT;

//         this.container.addChild(this.animSprite);
//     }

//     public setTheme(isFreeSpins: boolean) {
//         this.isFreeSpinsTheme = isFreeSpins;

//         if (isFreeSpins) {
//             if (this.staticSprite) {
//                 this.staticSprite.visible = false;
//             }
//             if (this.animSprite) {
//                 this.animSprite.visible = true;
//                 this.animSprite.tint = CONFIG.UI_COLORS.FREE_SPINS_TINT;
//                 this.animSprite.play();
//             }
//         } else {
//             if (this.animSprite) {
//                 this.animSprite.visible = false;
//                 this.animSprite.stop();
//             }
//             if (this.staticSprite) {
//                 this.staticSprite.visible = true;
//                 this.staticSprite.tint = CONFIG.UI_COLORS.DEFAULT_TINT;
//             }
//         }
//     }

//     getContainer(): Container {
//         return this.container;
//     }
// }

export class TitleUI {
  private container: Container;
  private titleSprite: Sprite;

  constructor() {
    this.container = new Container();
    this.titleSprite = new Sprite(Assets.get("title.png"));
    this.titleSprite.anchor.set(0, 0);
    this.titleSprite.x = CONFIG.TITLE_LANDSCAPE_X;
    this.titleSprite.y = CONFIG.TITLE_LANDSCAPE_Y;
    this.titleSprite.scale.set(CONFIG.TITLE_LANDSCAPE_SCALE);
    this.container.addChild(this.titleSprite);
  }

  public setTheme(isFreeSpins: boolean) {
    if (!this.titleSprite) return;
    this.titleSprite.tint = isFreeSpins
      ? CONFIG.UI_COLORS.FREE_SPINS_TINT
      : CONFIG.UI_COLORS.DEFAULT_TINT;
  }

  public updateResponsiveLayout(isPortrait: boolean) {
    if (isPortrait) {
      this.titleSprite.x = CONFIG.TITLE_PORTRAIT_X;
      this.titleSprite.y = CONFIG.TITLE_PORTRAIT_Y;
      this.titleSprite.scale.set(CONFIG.TITLE_PORTRAIT_SCALE);
    } else {
      this.titleSprite.x = CONFIG.TITLE_LANDSCAPE_X;
      this.titleSprite.y = CONFIG.TITLE_LANDSCAPE_Y;
      this.titleSprite.scale.set(CONFIG.TITLE_LANDSCAPE_SCALE);
    }
  }

  getContainer(): Container {
    return this.container;
  }
}
