import { Assets, Container, Sprite } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";

export class ModelUI {
    private container: Container;
    private modelSprite: Sprite;

    constructor() {
        this.container = new Container();

        this.modelSprite = new Sprite(Assets.get("model.png"));
        this.modelSprite.anchor.set(0, 0);
        
        this.modelSprite.x = CONFIG.MODEL_LANDSCAPE_X;
        this.modelSprite.y = CONFIG.MODEL_LANDSCAPE_Y;
        this.modelSprite.scale.set(CONFIG.MODEL_LANDSCAPE_SCALE);

        this.container.addChild(this.modelSprite);
    }

    public setTheme(isFreeSpins: boolean) {
        if (!this.modelSprite) return;
        this.modelSprite.tint = isFreeSpins ? CONFIG.UI_COLORS.FREE_SPINS_TINT : CONFIG.UI_COLORS.DEFAULT_TINT;
    }

    public updateResponsiveLayout(isPortrait: boolean) {
        this.container.visible = !isPortrait; // Hide character in portrait
    }

    getContainer(): Container { 
        return this.container;
    }
}