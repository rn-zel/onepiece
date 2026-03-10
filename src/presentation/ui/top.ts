import { Container, Sprite, Assets, Text } from "pixi.js";
import { CONFIG, GAME_RULES } from "../../domain/constants/Config";

export class TopUI {
    private container: Container;
    private grandSprite: Sprite;
    private majorSprite: Sprite;
    private miniSprite: Sprite;

    private grandText: Text;
    private majorText: Text;
    private miniText: Text;

    private miniContainer!: Container;
    private majorContainer!: Container;
    private grandContainer!: Container;

    constructor() {
        this.container = new Container();

        this.miniContainer = new Container();
        this.miniContainer.x = CONFIG.JACKPOT_MINI_LANDSCAPE_X;
        this.miniContainer.y = CONFIG.JACKPOT_MINI_LANDSCAPE_Y;
        this.miniContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
        this.container.addChild(this.miniContainer);
        
        this.miniSprite = new Sprite(Assets.get("mini.png"));
        this.miniSprite.anchor.set(0, 0);
        this.miniContainer.addChild(this.miniSprite);

        this.miniText = this.createJackpotText(
            380, // Text Offset X (Hardcoded for now as it's a relative offset)
            200, // Text Offset Y
            0x9C7740,
            60,
            0x000000,
            4
        );
        this.miniContainer.addChild(this.miniText);
        
        this.majorContainer = new Container();
        this.majorContainer.x = CONFIG.JACKPOT_MAJOR_LANDSCAPE_X;
        this.majorContainer.y = CONFIG.JACKPOT_MAJOR_LANDSCAPE_Y;
        this.majorContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
        this.container.addChild(this.majorContainer);

        this.majorSprite = new Sprite(Assets.get("major.png"));
        this.majorSprite.anchor.set(0, 0);
        this.majorContainer.addChild(this.majorSprite);

        this.majorText = this.createJackpotText(
            380,
            200,
            0x9C7740,
            60,
            0x000000,
            4
        );
        this.majorContainer.addChild(this.majorText);

        this.grandContainer = new Container();
        this.grandContainer.x = CONFIG.JACKPOT_GRAND_LANDSCAPE_X;
        this.grandContainer.y = CONFIG.JACKPOT_GRAND_LANDSCAPE_Y;
        this.grandContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
        this.container.addChild(this.grandContainer);

        this.grandSprite = new Sprite(Assets.get("grand.png"));
        this.grandSprite.anchor.set(0, 0);
        this.grandContainer.addChild(this.grandSprite);

        this.grandText = this.createJackpotText(
            420,
            200,
            0x9C7740,
            60,
            0x000000,
            4
        );
        this.grandContainer.addChild(this.grandText);
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

    public updateJackpots(prizes?: { mini: number; major: number; grand: number }) {
        const p = prizes ?? {
            mini: GAME_RULES.JACKPOT_MINI,
            major: GAME_RULES.JACKPOT_MAJOR,
            grand: GAME_RULES.JACKPOT_GRAND,
        };
        this.miniText.text = `₱${p.mini.toLocaleString()}`;
        this.majorText.text = `₱${p.major.toLocaleString()}`;
        this.grandText.text = `₱${p.grand.toLocaleString()}`;
    }

    public setTheme(isFreeSpins: boolean) {
        if (!this.grandSprite || !this.majorSprite || !this.miniSprite) return;
        const tint = isFreeSpins ? CONFIG.UI_COLORS.FREE_SPINS_TINT : CONFIG.UI_COLORS.DEFAULT_TINT;
        this.grandSprite.tint = tint;
        this.majorSprite.tint = tint;
        this.miniSprite.tint = tint;
    }

    public updateResponsiveLayout(isPortrait: boolean) {
        if (isPortrait) {
            this.miniContainer.x = CONFIG.JACKPOT_MINI_PORTRAIT_X;
            this.miniContainer.y = CONFIG.JACKPOT_MINI_PORTRAIT_Y;
            this.miniContainer.scale.set(CONFIG.JACKPOT_PORTRAIT_SCALE);

            this.majorContainer.x = CONFIG.JACKPOT_MAJOR_PORTRAIT_X;
            this.majorContainer.y = CONFIG.JACKPOT_MAJOR_PORTRAIT_Y;
            this.majorContainer.scale.set(CONFIG.JACKPOT_PORTRAIT_SCALE);

            this.grandContainer.x = CONFIG.JACKPOT_GRAND_PORTRAIT_X;
            this.grandContainer.y = CONFIG.JACKPOT_GRAND_PORTRAIT_Y;
            this.grandContainer.scale.set(CONFIG.JACKPOT_PORTRAIT_SCALE);
        } else {
            this.miniContainer.x = CONFIG.JACKPOT_MINI_LANDSCAPE_X;
            this.miniContainer.y = CONFIG.JACKPOT_MINI_LANDSCAPE_Y;
            this.miniContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);

            this.majorContainer.x = CONFIG.JACKPOT_MAJOR_LANDSCAPE_X;
            this.majorContainer.y = CONFIG.JACKPOT_MAJOR_LANDSCAPE_Y;
            this.majorContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);

            this.grandContainer.x = CONFIG.JACKPOT_GRAND_LANDSCAPE_X;
            this.grandContainer.y = CONFIG.JACKPOT_GRAND_LANDSCAPE_Y;
            this.grandContainer.scale.set(CONFIG.JACKPOT_LANDSCAPE_SCALE);
        }
    }

    getContainer(): Container {
        return this.container;
    }
}
