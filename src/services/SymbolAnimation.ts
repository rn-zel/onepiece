import { AnimatedSprite, Sprite } from "pixi.js";
import type { Reel } from "../Reel";

export interface SymbolAnimation {
    init(): Promise<void>;
    play(symbolIndex: number, staticSprite: Sprite, reel: Reel, activeAnimations: AnimatedSprite[], isQuickSpin: boolean): void;
}

