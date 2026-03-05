import { Assets, Container, Sprite } from "pixi.js";
import { CONFIG } from "../Config";

export class ModelUI {
    private container: Container;
    private modelSprite: Sprite;

    constructor() {
        this.container = new Container();

        this.modelSprite = new Sprite(Assets.get("model.png"));
        this.modelSprite.anchor.set(0, 0);
        
        this.modelSprite.x = CONFIG.MODEL_X;
        this.modelSprite.y = CONFIG.MODEL_Y;
        this.modelSprite.scale.set(CONFIG.MODEL_SCALE);

        this.container.addChild(this.modelSprite);
    }

    public setTheme(isFreeSpins: boolean) {
        if (!this.modelSprite) return;
        this.modelSprite.tint = isFreeSpins ? CONFIG.UI_COLORS.FREE_SPINS_TINT : CONFIG.UI_COLORS.DEFAULT_TINT;
    }

    getContainer(): Container { 
        return this.container;
    }
}