import { AnimatedSprite, Sprite } from "pixi.js";
import type { Reel } from "../../domain/entities/Reel";
import type { LeftTopUI } from "../ui/lefttop";

export interface SymbolAnimation {
  init(): Promise<void>;
  play(
    symbolIndex: number,
    staticSprite: Sprite,
    reel: Reel,
    activeAnimations: AnimatedSprite[],
    isQuickSpin: boolean,
    leftTopUI?: LeftTopUI,
  ): void;
}
