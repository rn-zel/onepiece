import { Container, Sprite, Texture, Assets, Ticker, Rectangle, Application } from "pixi.js";

interface CloudInstance {
  sprite: Sprite;
  speed: number;
  randomMult: number;
}

export class CloudBackground {
  public container: Container;
  private clouds: CloudInstance[] = [];
  private cloudTextures: Texture[] = [];
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.update = this.update.bind(this);
  }

  public async init() {
    const baseTexture = Assets.get("clouds.png");
    if (!baseTexture) {
      console.warn("CloudBackground: clouds.png not found!");
      return;
    }

    // clouds position i nthe image 
    const regions = [
      { x: 0, y: 0, width: 1105, height: 460 },
      { x: 0, y: 490, width: 1105, height: 460 },
      { x: 0, y: 950, width: 1105, height: 466 },
    ];

    regions.forEach((region) => {
      const tex = new Texture({
        source: baseTexture.source,
        frame: new Rectangle(region.x, region.y, region.width, region.height),
      });
      this.cloudTextures.push(tex);
    });

    for (let i = 0; i < 12; i++) {
      this.spawnCloud(true);
    }

    this.app.ticker.add(this.update);
  }

  private spawnCloud(initial: boolean = false) {
    const tex =
      this.cloudTextures[Math.floor(Math.random() * this.cloudTextures.length)];
    const sprite = new Sprite(tex);

    sprite.anchor.set(0.5);
    sprite.alpha = 0.4 + Math.random() * 0.4;
    
    const randomMult = 0.2 + Math.random() * 0.4;
    const currentScale = this.calculateBaseScale() * randomMult;
    sprite.scale.set(currentScale);

    const screenWidth = this.app.renderer.screen.width;
    const screenHeight = this.app.renderer.screen.height;

    const x = initial
      ? Math.random() * screenWidth
      : -sprite.width / 2;
    const y = Math.random() * screenHeight; 

    sprite.position.set(x, y);

    const cloud: CloudInstance = {
      sprite,
      speed: 0.1 + Math.random() * 0.4,
      randomMult: randomMult,
    };

    this.container.addChild(sprite);
    this.clouds.push(cloud);
  }

  private update(time: Ticker) {
    const screenWidth = this.app.renderer.screen.width;
    const screenHeight = this.app.renderer.screen.height;

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      cloud.sprite.x += cloud.speed * time.deltaTime;

      // Wrap around
      if (cloud.sprite.x > screenWidth + cloud.sprite.width / 2) {
        cloud.sprite.x = -cloud.sprite.width / 2;
        cloud.sprite.y = Math.random() * screenHeight;
      }
    }
  }

  public setTheme(isFreeSpins: boolean) {
    const tint = isFreeSpins ? 0xff0055 : 0xffffff;
    this.clouds.forEach((cloud) => {
      cloud.sprite.tint = tint;
    });
  }

  private calculateBaseScale(): number {
    const screenWidth = this.app.renderer.screen.width;
    const screenHeight = this.app.renderer.screen.height;
    const isPortrait = screenHeight > screenWidth;

    // In Landscape, we want them smaller relative to the width
    // In Portrait, we want them larger to fill the vertical space
    if (isPortrait) {
      return (screenWidth / 1000) * 1.2;
    } else {
      return (screenHeight / 1000) * 0.8; // Smaller base in landscape
    }
  }

  public resize() {
    const screenWidth = this.app.renderer.screen.width;
    const screenHeight = this.app.renderer.screen.height;
    const baseScale = this.calculateBaseScale();

    // Ensure all clouds are within or approaching the new bounds
    this.clouds.forEach((cloud) => {
      cloud.sprite.scale.set(baseScale * cloud.randomMult);
      
      if (cloud.sprite.y > screenHeight) {
        cloud.sprite.y = Math.random() * screenHeight;
      }
      if (cloud.sprite.x > screenWidth + cloud.sprite.width / 2) {
        cloud.sprite.x = Math.random() * screenWidth;
      }
    });
  }

  public destroy() {
    this.app.ticker.remove(this.update);
    this.container.destroy({ children: true });
  }
}
