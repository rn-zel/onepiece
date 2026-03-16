import { Application, Assets, Sprite, Container, Ticker } from "pixi.js";

interface Star {
  sprite: Sprite;
  speed: number;
  originalColor: number;
}

export class Starfield {
  public app: Application;
  public container: Container;
  private starAmount: number;
  private stars: Star[];

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.starAmount = 20; 
    this.stars = [];
    this.update = this.update.bind(this);
  }

  async init() {
    const starTexture = await Assets.load("https://pixijs.com/assets/star.png");

    for (let i = 0; i < this.starAmount; i++) {
      const star: Star = {
        sprite: new Sprite(starTexture),
        speed: 0,
        originalColor: 0xffffff,
      };

      star.sprite.tint = 0xffffff;
      star.sprite.anchor.set(0.5, 0); 
      
      this.randomizeStar(star, true);
      this.container.addChild(star.sprite);
      this.stars.push(star);
    }

    this.app.ticker.add(this.update);
  }

  public setTheme(isFreeSpins: boolean) {
    const tint = isFreeSpins ? 0xff0055 : 0xffffff;
    this.stars.forEach((star) => {
      star.sprite.tint = tint;
    });
  }

  randomizeStar(star: Star, initial: boolean = false) {
    const screenWidth = this.app.renderer.screen.width;
    const screenHeight = this.app.renderer.screen.height;

    star.sprite.x = Math.random() * screenWidth;
    star.sprite.y = initial ? Math.random() * screenHeight : -Math.random() * 200 - 50;
    
    star.speed = 5 + Math.random() * 10;
    const scaleX = .01 + Math.random() * .05;
    const scaleY = .1 + Math.random() * 5; 
    
    star.sprite.scale.set(scaleX, scaleY);
    star.sprite.alpha = 0.2 + Math.random() * 0.5;
  }

  update(time: Ticker) {
    const screenHeight = this.app.renderer.screen.height;
    const delta = time.deltaTime;

    for (let i = 0; i < this.starAmount; i++) {
      const star = this.stars[i];
      
      // Move down
      star.sprite.y += star.speed * delta;

      // Wrap back to top
      if (star.sprite.y > screenHeight + 100) {
        this.randomizeStar(star);
      }
    }
  }

  destroy() {
    this.app.ticker.remove(this.update);
    this.container.destroy({ children: true });
  }

  public triggerWarp(isWarping: boolean) {
    this.stars.forEach(s => {
       s.speed *= isWarping ? 2 : 0.5;
    });
  }
}
