import { Container, Sprite, Assets, Text } from "pixi.js";
import { CONFIG } from "../../domain/constants/Config";

export class TopUI {
    private container: Container;
    private grandSprite: Sprite;
    private majorSprite: Sprite;
    private miniSprite: Sprite;

    private grandText: Text;
    private majorText: Text;
    private miniText: Text;

    constructor() {
        this.container = new Container();

         this.miniSprite = new Sprite(Assets.get("mini.png"));
        this.miniSprite.anchor.set(0, 0);
        this.miniSprite.x = CONFIG.TOP_MINI_X;
        this.miniSprite.y = CONFIG.TOP_MINI_Y;
        this.miniSprite.scale.set(CONFIG.TOP_MINI_SCALE);
        this.container.addChild(this.miniSprite);

        this.miniText = this.createJackpotText(
            CONFIG.TOP_MINI_TEXT_X, 
            CONFIG.TOP_MINI_TEXT_Y,
            CONFIG.TOP_MINI_TEXT_COLOR,
            CONFIG.TOP_MINI_TEXT_SIZE,
            CONFIG.TOP_MINI_TEXT_STROKE_COLOR,
            CONFIG.TOP_MINI_TEXT_STROKE_WIDTH
        );
        this.miniSprite.addChild(this.miniText);
        
        this.majorSprite = new Sprite(Assets.get("major.png"));
        this.majorSprite.anchor.set(0, 0);
        this.majorSprite.x = CONFIG.TOP_MAJOR_X;
        this.majorSprite.y = CONFIG.TOP_MAJOR_Y;
        this.majorSprite.scale.set(CONFIG.TOP_MAJOR_SCALE);
        this.container.addChild(this.majorSprite);

        this.majorText = this.createJackpotText(
            CONFIG.TOP_MAJOR_TEXT_X, 
            CONFIG.TOP_MAJOR_TEXT_Y,
            CONFIG.TOP_MAJOR_TEXT_COLOR,
            CONFIG.TOP_MAJOR_TEXT_SIZE,
            CONFIG.TOP_MAJOR_TEXT_STROKE_COLOR,
            CONFIG.TOP_MAJOR_TEXT_STROKE_WIDTH
        );
        this.majorSprite.addChild(this.majorText);


        this.grandSprite = new Sprite(Assets.get("grand.png"));
        this.grandSprite.anchor.set(0, 0);
        this.grandSprite.x = CONFIG.TOP_GRAND_X;
        this.grandSprite.y = CONFIG.TOP_GRAND_Y;
        this.grandSprite.scale.set(CONFIG.TOP_GRAND_SCALE);
        this.container.addChild(this.grandSprite);

        this.grandText = this.createJackpotText(
            CONFIG.TOP_GRAND_TEXT_X, 
            CONFIG.TOP_GRAND_TEXT_Y,
            CONFIG.TOP_GRAND_TEXT_COLOR,
            CONFIG.TOP_GRAND_TEXT_SIZE,
            CONFIG.TOP_GRAND_TEXT_STROKE_COLOR,
            CONFIG.TOP_GRAND_TEXT_STROKE_WIDTH
        );
        this.grandSprite.addChild(this.grandText);
    }

    private createJackpotText(x: number, y: number, color: number, size: number, strokeColor: number, strokeWidth: number): Text {
        const text = new Text({
            text: "",
            style: { 
                fill: color, 
                fontSize: size, 
                fontWeight: "bold", 
                stroke: { color: strokeColor, width: strokeWidth }, 
                letterSpacing: 2 
            }
        });
        text.anchor.set(0.5);
        text.position.set(x, y); 
        return text;
    }

    public updateJackpots(betAmount: number) {
        // Example base multipliers for jackpots: 
        // Mini (10x), Major (50x), Grand (1000x)
        this.miniText.text = `₱${Math.floor(betAmount * 10).toLocaleString()}`;
        this.majorText.text = `₱${Math.floor(betAmount * 50).toLocaleString()}`;
        this.grandText.text = `₱${Math.floor(betAmount * 1000).toLocaleString()}`;
    }

    public setTheme(isFreeSpins: boolean) {
        if (!this.grandSprite || !this.majorSprite || !this.miniSprite) return;
        const tint = isFreeSpins ? CONFIG.UI_COLORS.FREE_SPINS_TINT : CONFIG.UI_COLORS.DEFAULT_TINT;
        this.grandSprite.tint = tint;
        this.majorSprite.tint = tint;
        this.miniSprite.tint = tint;
    }

    getContainer(): Container {
        return this.container;
    }
}
