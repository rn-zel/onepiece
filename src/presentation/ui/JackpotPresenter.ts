import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { gsap } from "gsap";
import type { ParticleEmitter } from "../vfx/ParticleEmitter";
import { getAppWidth, getAppHeight } from "../../domain/constants/Config";

export class JackpotPresenter {
  private container: Container;
  private overlay: Graphics;
  private titleText: Text;
  private amountText: Text;
  private particleEmitter: ParticleEmitter;

  constructor(parent: Container, particleEmitter: ParticleEmitter) {
    this.particleEmitter = particleEmitter;
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = 200;
    parent.addChild(this.container);

    this.overlay = new Graphics();
    this.overlay.rect(0, 0, 1920, 1080);
    this.overlay.fill({ color: 0x000000, alpha: 0.75 });
    this.container.addChild(this.overlay);

    const titleStyle = new TextStyle({
      fill: { color: 0xffd700 }, // Simplifying to solid for now to fix lint
      fontSize: 120,
      fontWeight: "bold",
      stroke: { color: 0x000000, width: 8 },
      dropShadow: { color: 0x000000, blur: 15, distance: 0 },
      align: "center",
    });

    this.titleText = new Text({ text: "GRAND JACKPOT!", style: titleStyle });
    this.titleText.anchor.set(0.5);
    this.titleText.x = 1920 / 2;
    this.titleText.y = 1080 / 2 - 100;
    this.container.addChild(this.titleText);

    const amountStyle = new TextStyle({
      fill: 0xffffff,
      fontSize: 150,
      fontWeight: "bold",
      stroke: { color: 0x000000, width: 4 },
      dropShadow: { color: 0xffd700, blur: 20, distance: 0 },
      align: "center",
    });

    this.amountText = new Text({ text: "₱0", style: amountStyle });
    this.amountText.anchor.set(0.5);
    this.amountText.x = 1920 / 2;
    this.amountText.y = 1080 / 2 + 100;
    this.container.addChild(this.amountText);
  }

  public async show(
    type: "mini" | "major" | "grand",
    amount: number,
  ): Promise<void> {
    this.container.visible = true;
    this.container.alpha = 0;
    this.titleText.text = `${type.toUpperCase()} JACKPOT!`;
    this.amountText.text = `₱${amount.toLocaleString()}`;

    // Reset text scales for animation
    this.titleText.scale.set(0.5);
    this.amountText.scale.set(0.5);

    // Start coin shower
    this.particleEmitter.shower(6);

    const tl = gsap.timeline();
    tl.to(this.container, { alpha: 1, duration: 0.5 });
    tl.to(
      this.titleText.scale,
      { x: 1.2, y: 1.2, duration: 0.6, ease: "back.out(2)" },
      "-=0.2",
    );
    tl.to(
      this.amountText.scale,
      { x: 1, y: 1, duration: 0.6, ease: "back.out(2)" },
      "-=0.4",
    );

    // Flashy animation
    tl.to(this.titleText, {
      pixi: { tint: 0xff0000 },
      duration: 0.2,
      repeat: 10,
      yoyo: true,
      delay: 0.5,
    } as any);

    return new Promise((resolve) => {
      gsap.delayedCall(5, () => {
        gsap.to(this.container, {
          alpha: 0,
          duration: 0.5,
          onComplete: () => {
            this.container.visible = false;
            resolve();
          },
        });
      });
    });
  }

  public handleResize(width?: number, height?: number) {
    const w = width || getAppWidth();
    const h = height || getAppHeight();

    this.overlay.clear();
    this.overlay.rect(0, 0, w, h);
    this.overlay.fill({ color: 0x000000, alpha: 0.75 });

    this.titleText.x = w / 2;
    this.titleText.y = h / 2 - 100;

    this.amountText.x = w / 2;
    this.amountText.y = h / 2 + 100;
  }
}
