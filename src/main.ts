// src/main.ts
import { Application, Assets, Texture } from "pixi.js";
import { SlotMachine } from "./SlotMachine";
import {
  ASSETS,
  LANDSCAPE,
  PORTRAIT,
  GAME_RULES,
  CONFIG,
} from "./domain/constants/Config";
import { Starfield } from "./presentation/animation/Starfield";
import { SymbolAnimator } from "./presentation/animation/SymbolAnimator";
import { WaterBg } from "./presentation/animation/WaterBg";

import {
  setAuthToken,
  setSlotApiBaseUrl,
  endSession,
} from "./infrastructure/api/slotApi";

(async () => {
  try {
    // Configure API base URL and auth token from launch URL (?token=...)
    setSlotApiBaseUrl(CONFIG.API_BASE_URL);
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token);
    }
    const container = document.getElementById("app-container")!;
    const app = new Application();
    await app.init({
      resizeTo: container,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });
    container.appendChild(app.canvas);

    //  assets
    await Assets.load([
      ...ASSETS.TEXTURES,
      ...ASSETS.UI,
      // ...ASSETS.SPRITE_SHEET
    ]);

    const animator = new SymbolAnimator();
    await animator.init();

    const waterBg = new WaterBg();
    await waterBg.init();
    app.stage.addChild(waterBg.sprite);

    const starBackground = new Starfield(app);
    app.stage.addChild(starBackground.container);
    await starBackground.init();

    const slotTextures = ASSETS.TEXTURES.map((url) => Texture.from(url));
    const bgTexture = Texture.from("border.png");

    (window as any).slotMachine = new SlotMachine(
      app,
      slotTextures,
      bgTexture,
      starBackground,
      animator,
      waterBg,
    );
    (window as any).slotMenuConfig = {
      landscape: LANDSCAPE.MENU,
      portrait: PORTRAIT.MENU,
    };
    (window as any).slotRulesConfig = GAME_RULES;
    (window as any).slotApiBaseUrl = CONFIG.API_BASE_URL;

    // End the backend session when the game page is being closed or refreshed.
    window.addEventListener("pagehide", () => {
      void endSession();
    });
  } catch (error) {
    console.error("Error starting game:", error);
  }
})();
