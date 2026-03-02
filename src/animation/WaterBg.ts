// 📁 src/animation/WaterBg.ts
import { Sprite, Assets } from "pixi.js";
import bgImagePath from '../assets/download.png'; 

export class WaterBg {
    public sprite!: Sprite;
    public isLoaded: boolean = false;

    public async init() {
        try {
            const texture = await Assets.load(bgImagePath);
            this.sprite = new Sprite(texture);
            this.sprite.anchor.set(0.5);
            
            this.sprite.tint = 0xFFFFFF; 
            
            this.isLoaded = true;
            console.log("✅ Background Initialized!");

        } catch (error) {
            console.error("❌ Failed to load ", error);
        }
    }

   public setTheme(isFreeSpins: boolean) {
        if (!this.isLoaded || !this.sprite) return;
        
      
        console.log("running?", isFreeSpins);
        
         
        this.sprite.tint = isFreeSpins ? 0xaf3f3b : 0xFFFFFF;
    }

    public play() {}
    public stop() {}
}