import { Sprite, Texture, AnimatedSprite, Assets } from "pixi.js";
import gsap from "gsap";
import { CONFIG } from "./Config";
import { Reel } from "./Reel";


const ANIMATION_MAP: Record<number, string> = {
    0: "dblue.json",
    1: "blue.json",
    2: "ore.json",
    3: "red.json",
    4: "green.json",
    5: "queen.json",
    6: "drag.json",
    7: "ship.json",
    8: "wild.json",
    9: "scat.json"
};

export class SymbolAnimator {
   static play(
        symbolIndex: number, 
        symbolSprite: Sprite, 
        reel: Reel, 
        activeAnimations: AnimatedSprite[],
        isQuickSpin: boolean
    ) {
        gsap.killTweensOf(symbolSprite);
        gsap.killTweensOf(symbolSprite.scale);
        symbolSprite.alpha = 1;
        symbolSprite.rotation = 0;
        symbolSprite.tint = 0xFFFFFF;

        const jsonName = ANIMATION_MAP[symbolIndex];

        if (!jsonName) {
            const baseScale = (symbolSprite as any).baseScale || 1;
            gsap.to(symbolSprite.scale, {
                x: baseScale * 1.15,
                y: baseScale * 1.15,
                duration: 0.6,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
            return; 
        }

        const sheet = Assets.get(jsonName);

        if (!sheet || !sheet.textures) {
            console.warn(`${jsonName} missing! Falling back to simple pulse.`);
            const duration = isQuickSpin ? 0.2 : 0.5;
            gsap.to(symbolSprite, { alpha: 0.6, duration: duration, yoyo: true, repeat: -1 }); 
            return; 
        }

        const animFrames = Object.values(sheet.textures) as Texture[];
        if (animFrames.length === 0) return;

        symbolSprite.alpha = 0;
        
        const animSprite = new AnimatedSprite(animFrames);
        animSprite.anchor.set(symbolSprite.anchor.x, symbolSprite.anchor.y);
        animSprite.x = symbolSprite.x;
        animSprite.y = symbolSprite.y;
        animSprite.zIndex = 101; 
        
        animSprite.width = CONFIG.SYMBOL_SIZE;
        animSprite.height = CONFIG.SYMBOL_SIZE;
        
        animSprite.animationSpeed = isQuickSpin ? 0.15 : 0.08; 
        animSprite.loop = false;
        animSprite.play();

        reel.container.addChild(animSprite);
        activeAnimations.push(animSprite);
    }
}