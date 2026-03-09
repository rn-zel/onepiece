// src/main.ts
import { Application, Assets, Texture } from "pixi.js";
import { SlotMachine } from "./SlotMachine";
import { ASSETS } from "./domain/constants/Config";
import { Starfield } from './presentation/animation/Starfield'; 
import { SymbolAnimator } from "./presentation/animation/SymbolAnimator"
import { WaterBg } from "./presentation/animation/WaterBg";

(async () => {
  try {
    const app = new Application();
    await app.init({ 
        // background: 0x000000, 
        resizeTo: window, 
        resolution: window.devicePixelRatio, 
        autoDensity: true 
    });
    document.body.appendChild(app.canvas);

    //  assets
    await Assets.load([...ASSETS.TEXTURES, ...ASSETS.UI, 
      // ...ASSETS.SPRITE_SHEET
    ]
    );
    

    const animator = new SymbolAnimator();    
    await animator.init();

    const waterBg = new WaterBg();
    await waterBg.init();
    app.stage.addChild(waterBg.sprite); 

    const starBackground = new Starfield(app);
    app.stage.addChild(starBackground.container);
    await starBackground.init();

    const slotTextures = ASSETS.TEXTURES.map(url => Texture.from(url));
    const bgTexture = Texture.from("border.png"); 
    
    (window as any).slotMachine = new SlotMachine(app, slotTextures, bgTexture, starBackground, animator, waterBg);
    
  } catch (error) { 
      console.error("Error starting game:", error); 
  }
})();