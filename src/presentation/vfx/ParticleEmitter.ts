import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import { gsap } from "gsap";

export class ParticleEmitter {
  app: Application;
  container: Container;
  coinTexture: Texture;
  glowTexture: Texture;
  dustTexture: Texture;

  constructor(app: Application, container: Container) {
    this.app = app;
    this.container = container;
    this.coinTexture = this.createCoinTexture();
    this.glowTexture = this.createGlowTexture();
    this.dustTexture = this.createDustTexture();
  }

  private createCoinTexture(): Texture {
    const g = new Graphics();
    g.circle(15, 15, 15);
    g.fill({ color: 0xefce0e });
    g.stroke({ width: 2, color: 0x9b6b27 });

    g.circle(15, 15, 10); // Inner ring
    g.fill({ color: 0xdaa520 });

    return this.app.renderer.generateTexture(g);
  }

  private createGlowTexture(): Texture {
    const g = new Graphics();
    g.circle(20, 20, 20);
    g.fill({ color: 0xffffaa, alpha: 0.8 });

    g.circle(20, 20, 15);
    g.fill({ color: 0xffee55, alpha: 1.0 });

    return this.app.renderer.generateTexture(g);
  }

  private createDustTexture(): Texture {
    const g = new Graphics();
    g.circle(10, 10, 10);
    // Dusty grey/brown
    g.fill({ color: 0xdddddd, alpha: 0.6 });

    return this.app.renderer.generateTexture(g);
  }

  public burst(x: number, y: number, count: number = 60) {
    for (let i = 0; i < count; i++) {
      const coin = new Sprite(this.coinTexture);
      coin.anchor.set(0.5);

      // Randomly scale coins to give depth depth
      const baseScale = Math.random() * 0.5 + 1;
      coin.scale.set(baseScale);

      // Random spin speed for realistic coin flipping effect
      const spinSpeed = (Math.random() - 0.5) * 25;

      coin.x = x;
      coin.y = y;

      this.container.addChild(coin);

      // Fountain upward, slight left/right spread
      const angle = Math.random() * (Math.PI / 2) - Math.PI / 4;
      const speed = Math.random() * 600 + 400;

      let vx = Math.sin(angle) * speed;
      let vy = -Math.cos(angle) * speed;

      const gravity = 800; // Downward acceleration
      const duration = Math.random() * 1.5 + 1.5;

      // GSAP tween to handle frame-by-frame physics
      const dummy = { t: 0, lastT: 0 };
      gsap.to(dummy, {
        t: duration,
        duration: duration,
        ease: "none",
        onUpdate: () => {
          const dt = dummy.t - dummy.lastT;
          dummy.lastT = dummy.t;

          vy += gravity * dt;
          coin.x += vx * dt;
          coin.y += vy * dt;

          // 3D-ish coin flipping
          coin.scale.x = Math.sin(dummy.t * spinSpeed) * baseScale;

          // Fade out
          if (dummy.t > duration * 0.8) {
            coin.alpha = 1 - (dummy.t - duration * 0.8) / (duration * 0.2);
          }
        },
        onComplete: () => {
          if (coin.parent) {
            coin.parent.removeChild(coin);
          }
          coin.destroy();
        },
      });
    }
  }

  // Emits light particles floating upwards around winning symbols
  public emitGlow(x: number, y: number, count: number = 15) {
    for (let i = 0; i < count; i++) {
      const glow = new Sprite(this.glowTexture);
      glow.anchor.set(0.5);
      glow.scale.set(Math.random() * 0.5 + 0.2);
      glow.x = x + (Math.random() * 80 - 40);
      glow.y = y + (Math.random() * 80 - 40);
      glow.blendMode = "add"; // Makes them look bright and energetic like light

      this.container.addChild(glow);

      const duration = Math.random() * 1.5 + 1.0;
      const targetY = glow.y - (Math.random() * 100 + 50); // Float upwards
      const targetX = glow.x + (Math.random() * 40 - 20);

      gsap.to(glow, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: duration,
        ease: "power1.out",
        onComplete: () => {
          if (glow.parent) glow.parent.removeChild(glow);
          glow.destroy();
        },
      });
    }
  }

  // Explosion effect when symbols break in cascades
  public emitDust(x: number, y: number, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const dust = new Sprite(this.dustTexture);
      dust.anchor.set(0.5);
      dust.scale.set(Math.random() * 0.8 + 0.4);
      dust.x = x;
      dust.y = y;

      this.container.addChild(dust);

      const angle = Math.random() * Math.PI * 2; // Full 360 circle
      const distance = Math.random() * 100 + 50;
      const duration = Math.random() * 0.5 + 0.3; // Fast pop

      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      // Tween dust scale directly
      gsap.to(dust.scale, {
        x: dust.scale.x * 1.5,
        y: dust.scale.y * 1.5,
        duration: duration,
        ease: "power2.out",
      });

      gsap.to(dust, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: duration,
        ease: "power2.out",
        onComplete: () => {
          if (dust.parent) dust.parent.removeChild(dust);
          dust.destroy();
        },
      });
    }
  }

  // Spinning aura behind the spin button
  public emitAura(targetContainer: Container) {
    // A single large glowing sprite that spins
    const aura = new Sprite(this.glowTexture);
    aura.anchor.set(0.5);
    aura.scale.set(3); // Make it large enough to surround the button
    aura.alpha = 0;
    aura.blendMode = "add";
    aura.zIndex = 5; // Keep it behind the button text/graphic if possible

    targetContainer.addChildAt(aura, 0);

    // Fade it in quickly
    gsap.to(aura, { alpha: 0.6, duration: 0.3 });

    // Spin it infinitely until manually killed or button stops
    gsap.to(aura, {
      rotation: Math.PI * 2,
      duration: 2,
      repeat: -1,
      ease: "none",
    });

    // Store it so we can kill it later when the spin ends
    return aura;
  }
  // Infinite coin shower from the top
  public shower(duration: number = 5) {
    const startTime = Date.now();
    const spawnInterval = setInterval(() => {
      if (Date.now() - startTime > duration * 1000) {
        clearInterval(spawnInterval);
        return;
      }

      const x = Math.random() * 1920;
      const y = -100;
      const coin = new Sprite(this.coinTexture);
      coin.anchor.set(0.5);
      coin.scale.set(Math.random() * 0.5 + 0.8);
      coin.x = x;
      coin.y = y;
      this.container.addChild(coin);

      const fallDuration = 2.5;

      gsap.to(coin, {
        y: 1200,
        x: x + (Math.random() * 200 - 100),
        rotation: Math.random() * 10,
        duration: fallDuration,
        ease: "none",
        onComplete: () => {
          if (coin.parent) coin.parent.removeChild(coin);
          coin.destroy();
        },
      });
    }, 50);
  }
}
