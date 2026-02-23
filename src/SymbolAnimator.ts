import { Sprite, Texture, AnimatedSprite, Assets } from "pixi.js";
import gsap from "gsap";
import { CONFIG } from "./Config";
import { Reel } from "./Reel";

// Create a dictionary mapping the symbol Index to its JSON file
const ANIMATION_MAP: Record<number, string> = {
    0: "dblue.json",
    1: "blue.json",
    2: "ore.json",
    3: "red.json",
    4: "green.json",
    5: "queen.json",
    6: "drag.json",
    7: "ship.json"
};

export class SymbolAnimator {
    static play(
        symbolIndex: number, 
        symbolSprite: Sprite, 
        reel: Reel, 
        activeAnimations: AnimatedSprite[],
        isQuickSpin: boolean
    ) {
        //kill old tweens
        gsap.killTweensOf(symbolSprite);
        gsap.killTweensOf(symbolSprite.scale);
        symbolSprite.alpha = 1;
        symbolSprite.rotation = 0;
        symbolSprite.tint = 0xFFFFFF;

        // find json name
        const jsonName = ANIMATION_MAP[symbolIndex];

        // check if have animation
        if (!jsonName) return; 

        const sheet = Assets.get(jsonName);

        // fallback if JSON fails to load
        if (!sheet || !sheet.textures) {
            console.warn(`${jsonName} missing! Falling back to simple pulse.`);
            const duration = isQuickSpin ? 0.2 : 0.5;
            gsap.to(symbolSprite, { alpha: 0.6, duration: duration, yoyo: true, repeat: -1 }); 
            return; 
        }

        const animFrames = Object.values(sheet.textures) as Texture[];
        if (animFrames.length === 0) return;

        // setup animation
        symbolSprite.alpha = 0; // hide static symbol
        
        const animSprite = new AnimatedSprite(animFrames);
        animSprite.anchor.set(symbolSprite.anchor.x, symbolSprite.anchor.y);
        animSprite.x = symbolSprite.x;
        animSprite.y = symbolSprite.y;
        animSprite.zIndex = 101; 
        
        animSprite.width = CONFIG.SYMBOL_SIZE;
        animSprite.height = CONFIG.SYMBOL_SIZE;
        
        // play animation faster
        animSprite.animationSpeed = isQuickSpin ? 0.25 : 0.1; 
        animSprite.loop = false;
        animSprite.play();

        // add to reel and tracker
        reel.container.addChild(animSprite);
        activeAnimations.push(animSprite);
    }
}