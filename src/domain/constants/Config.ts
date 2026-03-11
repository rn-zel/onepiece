export const DEVICE_TYPES = {
  DESKTOP: "desktop",
  TABLET: "tablet",
  MOBILE: "mobile",
} as const;

export type DeviceType = (typeof DEVICE_TYPES)[keyof typeof DEVICE_TYPES];

// HORIZONTAL (Landscape)
export const LANDSCAPE = {
  DESIGN_WIDTH: 1890,
  DESIGN_HEIGHT: 1280,
  SLOT_OFFSET_X: 0,
  SLOT_OFFSET_Y: 60,
  BACKGROUND_OFFSET_X: 0,
  REEL_OFFSET_X: -10,
  REEL_OFFSET_Y: -20,

  CARD_WIDTH: 370,
  CARD_HEIGHT: 910,
  SYMBOL_SIZE: 270,
  SYMBOL_SPACING: 20,
  CARD_SPACING: 1,
  SYMBOL_MARGIN: 10,
  MACHINE_SCALE: 0.73,
  MASK_PX: 30,
  MASK_PY: 35,
  MASK_OFFSET_Y: -20,
  CONSOLE_Y: 490,

  SPIN_BTN_X: 1150,
  SPIN_BTN_Y: 10,
  SPIN_BTN_SCALE: 0.7,

  AUTO_BTN_X: 1150,
  AUTO_BTN_Y: 380,
  AUTO_BTN_SCALE: 0.7,

  BUY_FREE_X: 1150,
  BUY_FREE_Y: -380,
  BUY_FREE_SCALE: 0.65,

  MENU_BTN_X: -910,
  MENU_BTN_Y: 585,
  MENU_BTN_SCALE: 0.6,

  HUD_BAL_TITLE_X: -795,
  HUD_BAL_TITLE_Y: 560,
  HUD_BAL_BG_X: -830,
  HUD_BAL_BG_Y: 585,
  HUD_BAL_TEXT_X: -780,
  HUD_BAL_TEXT_Y: 595,
  HUD_BAL_BG_SCALE: 0.6,
  HUD_BET_TITLE_X: 550,
  HUD_BET_TITLE_Y: 560,
  HUD_BET_BG_X: 530,
  HUD_BET_BG_Y: 585,
  HUD_BET_TEXT_X: 590,
  HUD_BET_TEXT_Y: 595,
  HUD_BET_BG_SCALE: 0.6,

  BTN_MINUS_X: 450,
  BTN_MINUS_Y: 590,
  BTN_PLUS_X: 853,
  BTN_PLUS_Y: 590,
  BTN_ADJUST_SCALE: 0.5,

  HUD_WIN_TITLE_X: -65,
  HUD_WIN_TITLE_Y: 550,
  HUD_WIN_BG_X: -285,
  HUD_WIN_BG_Y: 585,
  HUD_WIN_TEXT_X: -20,
  HUD_WIN_TEXT_Y: 595,
  HUD_WIN_BG_SCALE: 0.6,
  WIN_TEXT_Y: 0,

  JACKPOT_GRAND_X: 330,
  JACKPOT_GRAND_Y: -810,
  JACKPOT_MAJOR_X: -180,
  JACKPOT_MAJOR_Y: -810,
  JACKPOT_MINI_X: -680,
  JACKPOT_MINI_Y: -810,
  JACKPOT_SCALE: 0.7,

  MODEL_X: -1420,
  MODEL_Y: -510,
  MODEL_SCALE: 0.75,

  HAT_X: -1190,
  HAT_Y: -890,
  HAT_SCALE: 0.6,

  TITLE_X: -1350,
  TITLE_Y: 200,
  TITLE_SCALE: 0.7,

  STATS_BTN_X: -1230,
  STATS_BTN_Y: 550,
  TURBO_BTN_X: 1070,
  TURBO_BTN_Y: 520,

  /** HTML menu  */
  MENU: {
    SIDEBAR_WIDTH: 56,
    SIDEBAR_PADDING: 20,
    SIDEBAR_GAP: 20,

    ICON_BTN_SIZE: 40,
    ICON_SIZE: 100,

    PANEL_MARGIN: 24,
    PANEL_BORDER_RADIUS: 16,
    PANEL_HEADER_PADDING: 20,
    PANEL_HEADER_FONT_SIZE: 28,

    SUBTITLE_FONT_SIZE: 16,
    SUBTITLE_PADDING: 12,
    BODY_PADDING: 24,

    SYMBOL_GRID_GAP: 16,
    SYMBOL_CARD_PADDING: 14,
    SYMBOL_IMAGE_SIZE: 64,

    FOOTER_PADDING: 14,
    FOOTER_FONT_SIZE: 13,
    ACCENT_COLOR: "#d4af37",
    SIDEBAR_BG: "#0f0e0d",
    PANEL_BG: "#1a1918",
    PANEL_BORDER_COLOR: "rgba(186, 138, 76, 0.5)",
    OVERLAY_BG: "rgba(0,0,0,0.75)",
    CARD_BG: "#252220",
    SUBTITLE_BG: "#252220",
  } as const,
};

// VERTICAL (Portrait)
export const PORTRAIT = {
  DESIGN_WIDTH: 1200,
  DESIGN_HEIGHT: 2200,
  SLOT_OFFSET_X: 0,
  SLOT_OFFSET_Y: 310,
  BACKGROUND_OFFSET_X: 0,
  REEL_OFFSET_X: -10,
  REEL_OFFSET_Y: -20,
  CARD_WIDTH: 370,
  CARD_HEIGHT: 910,
  SYMBOL_SIZE: 270,
  SYMBOL_SPACING: 20,
  CARD_SPACING: 1,
  SYMBOL_MARGIN: 10,
  MACHINE_SCALE: 0.985,
  MASK_PX: 30,
  MASK_PY: 35,
  MASK_OFFSET_Y: -20,
  CONSOLE_Y: 490,

  SPIN_BTN_X: 0,
  SPIN_BTN_Y: 800,
  SPIN_BTN_SCALE: 0.84,
  AUTO_BTN_X: 280,
  AUTO_BTN_Y: 420,
  AUTO_BTN_SCALE: 0.77,
  BUY_FREE_X: -280,
  BUY_FREE_Y: 420,
  BUY_FREE_SCALE: 0.715,
  MENU_BTN_X: -450,
  MENU_BTN_Y: 950,
  MENU_BTN_SCALE: 0.6,

  HUD_BAL_TITLE_X: -500,
  HUD_BAL_TITLE_Y: -950,
  HUD_BAL_BG_X: -500,
  HUD_BAL_BG_Y: -890,
  HUD_BAL_TEXT_X: -450,
  HUD_BAL_TEXT_Y: -890,
  HUD_BAL_BG_SCALE: 0.6,
  HUD_BET_TITLE_X: 100,
  HUD_BET_TITLE_Y: -950,
  HUD_BET_BG_X: 100,
  HUD_BET_BG_Y: -890,
  HUD_BET_TEXT_X: 200,
  HUD_BET_TEXT_Y: -890,
  HUD_BET_BG_SCALE: 0.6,
  BTN_MINUS_X: 140,
  BTN_MINUS_Y: -890,
  BTN_PLUS_X: 440,
  BTN_PLUS_Y: -890,
  BTN_ADJUST_SCALE: 0.5,
  HUD_WIN_TITLE_X: -200,
  HUD_WIN_TITLE_Y: 480,
  HUD_WIN_BG_X: -400,
  HUD_WIN_BG_Y: 580,
  HUD_WIN_TEXT_X: 0,
  HUD_WIN_TEXT_Y: 580,
  HUD_WIN_BG_SCALE: 0.72,
  WIN_TEXT_Y: 100,

  JACKPOT_GRAND_X: 400,
  JACKPOT_GRAND_Y: -1050,
  JACKPOT_MAJOR_X: 0,
  JACKPOT_MAJOR_Y: -1050,
  JACKPOT_MINI_X: -400,
  JACKPOT_MINI_Y: -1050,
  JACKPOT_SCALE: 0.65,

  MODEL_X: -1420,
  MODEL_Y: -510,
  MODEL_SCALE: 0.75,
  HAT_X: -1190,
  HAT_Y: -890,
  HAT_SCALE: 0.6,
  TITLE_X: -1350,
  TITLE_Y: 200,
  TITLE_SCALE: 0.7,

  STATS_BTN_X: -480,
  STATS_BTN_Y: 950,
  TURBO_BTN_X: 420,
  TURBO_BTN_Y: 700,

  /** HTML  vertical layout */
  MENU: {
    SIDEBAR_WIDTH: 52,
    SIDEBAR_PADDING: 12,
    SIDEBAR_GAP: 16,
    ICON_BTN_SIZE: 36,
    ICON_SIZE: 22,
    PANEL_MARGIN: 16,
    PANEL_BORDER_RADIUS: 14,
    PANEL_HEADER_PADDING: 16,
    PANEL_HEADER_FONT_SIZE: 24,
    SUBTITLE_FONT_SIZE: 14,
    SUBTITLE_PADDING: 10,
    BODY_PADDING: 16,
    SYMBOL_GRID_GAP: 12,
    SYMBOL_CARD_PADDING: 12,
    SYMBOL_IMAGE_SIZE: 56,
    FOOTER_PADDING: 12,
    FOOTER_FONT_SIZE: 12,
    ACCENT_COLOR: "#d4af37",
    SIDEBAR_BG: "#0f0e0d",
    PANEL_BG: "#1a1918",
    PANEL_BORDER_COLOR: "rgba(186, 138, 76, 0.5)",
    OVERLAY_BG: "rgba(0,0,0,0.75)",
    CARD_BG: "#252220",
    SUBTITLE_BG: "#252220",
  } as const,
};

/** Game rules  display and backend sync. */
export const GAME_RULES = {
  GAME_NAME: "Bounty Rush",
  REEL_LAYOUT: "5x3",
  WAYS_TO_WIN: 243,
  MAX_WIN_CAP: "1000x",
  MAX_WIN_MULTIPLIER: 1000,
  RTP: "96.5",
  VOLATILITY: 5,
  BASE_BET_MULTIPLIER: 30,
  BET_LEVELS: [1],
  BET_SIZES: [
    10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 1000, 2000,
    3000, 5000, 10000, 20000, 30000, 40000,
  ],
  JACKPOT_MINI: 1000,
  JACKPOT_MAJOR: 50000,
  JACKPOT_GRAND: 200000,
} as const;

/** Format bet for display  */
export function formatBetAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Total bet values derived from bet sizes  */
const BET_VALUES_FROM_RULES: number[] = GAME_RULES.BET_SIZES.map(
  (b) => b * GAME_RULES.BASE_BET_MULTIPLIER,
);

// Shared (orientation-independent)
const SHARED = {
  REELS_COUNT: 5,
  STATS_BTN_WIDTH: 200,
  STATS_BTN_HEIGHT: 60,
  STATS_BTN_RADIUS: 10,
  STATS_BTN_FONT_SIZE: 40,
  TURBO_BTN_WIDTH: 160,
  TURBO_BTN_HEIGHT: 50,
  TURBO_BTN_RADIUS: 10,
  TURBO_BTN_FONT_SIZE: 30,
  TURBO_BTN_ACTIVE_COLOR: "#FFD700",
  TURBO_BTN_INACTIVE_COLOR: "#555555",
  TURBO_BTN_GLOW_COLOR: 0xf3cb00,
  TURBO_BTN_GLOW_BLUR: 10,
  TITLE_LABEL_FILL: 0xffd700,
  TITLE_LABEL_GLOW: 0xffffff,
  UI_COLORS: {
    DEFAULT_TINT: 0xffffff,
    FREE_SPINS_TINT: 0xffbdd5,
  },
  API_BASE_URL: "http://localhost:3000",
  BUY_COST_MULTIPLIER: 10,
  REEL_SPIN_DURATION: 1.5,
  REEL_STAGGER_DELAY: 0.2,
  TURBO_TIME_SCALE: 0.5,
  REEL_MAX_BLUR: 6,
  REEL_BLUR_FADE_DIST: 2,
  REEL_BOUNCE_OFFSET: 15,
  REEL_BOUNCE_SPEED: 0.4,
  FIRST_WIN_DELAY: 0.8,
  CASCADE_WIN_DELAY: 0.6,
  CASCADE_MULT_SPAWN_DELAY: 0.15,
  NORMAL_WIN_DELAY: 1.5,
  TOTAL_WIN_PANEL_DELAY: 2.0,
  WIN_TEXT_POPUP_SPEED: 0.4,
  PANEL_POPUP_SPEED: 0.6,
  SYMBOL_ANIM_SPEED: 0.08,
  SYMBOL_DROP_SPEED: 0.25,
  WIN_HIGHLIGHT_DELAY: 0.3,
  // Win tiers (total_win / bet)
  BIG_WIN_MULTIPLIER: 10,
  MEGA_WIN_MULTIPLIER: 30,
  MAX_WIN_MULTIPLIER: 100,
  /** Background glow color. */
  TIER_BG_GLOW: {
    big: 0x29b6f6,
    mega: 0xffc107,
    max: 0xe91e63,
  } as const,
  /** Text fill color. */
  TIER_TEXT_FILL: {
    big: 0x29b6f6,
    mega: 0xfbff00,
    max: 0xe91e63,
  } as const,
  BET_VALUES: BET_VALUES_FROM_RULES,
  BET_PRESETS: [
    BET_VALUES_FROM_RULES[0] ?? 300,
    BET_VALUES_FROM_RULES[4] ?? 3000,
    BET_VALUES_FROM_RULES[6] ?? 6000,
    BET_VALUES_FROM_RULES[10] ?? 30000,
  ],
  PARTICLE_ORIGIN_X: 0,
  PARTICLE_ORIGIN_Y: 800,
  CURRENT_BALANCE: 2000,
  BET_AMOUNT: BET_VALUES_FROM_RULES[0] ?? 300,
  AUTO_SPIN_LIMIT: Number.POSITIVE_INFINITY,
  AUTO_SPIN_DELAY: 1500,
  FREE_SPIN_AUTO_DELAY: 800,
  MACHINE_SCALE_DESKTOP_LANDSCAPE: 0.75,
  MACHINE_SCALE_DESKTOP_PORTRAIT: 0.85,
  MACHINE_SCALE_TABLET_LANDSCAPE: 0.7,
  MACHINE_SCALE_TABLET_PORTRAIT: 0.9,
  MACHINE_SCALE_MOBILE_LANDSCAPE: 0.6,
  MACHINE_SCALE_MOBILE_PORTRAIT: 0.985,
  SLOT_OFFSET_Y_MOBILE_PORTRAIT: 310,
  SLOT_OFFSET_Y_TABLET_PORTRAIT: 250,
  SLOT_OFFSET_Y_DESKTOP_PORTRAIT: 150,
};

/** Append form: DESIGN_WIDTH -> DESIGN_WIDTH_LANDSCAPE (used by slot, VFX, etc.) */
function appendLandscapeKey(shortKey: string): string {
  return shortKey + "_LANDSCAPE";
}
function appendPortraitKey(shortKey: string): string {
  return shortKey + "_PORTRAIT";
}
/** Insert form: MENU_BTN_X -> MENU_BTN_LANDSCAPE_X (used by UIManager, top, etc.) */
function insertLandscapeKey(shortKey: string): string {
  const lastUnderscore = shortKey.lastIndexOf("_");
  if (lastUnderscore <= 0) return shortKey + "_LANDSCAPE";
  return (
    shortKey.slice(0, lastUnderscore) +
    "_LANDSCAPE_" +
    shortKey.slice(lastUnderscore + 1)
  );
}
function insertPortraitKey(shortKey: string): string {
  const lastUnderscore = shortKey.lastIndexOf("_");
  if (lastUnderscore <= 0) return shortKey + "_PORTRAIT";
  return (
    shortKey.slice(0, lastUnderscore) +
    "_PORTRAIT_" +
    shortKey.slice(lastUnderscore + 1)
  );
}

/**
 * Aliases: Presentation layer (UIManager) expects HUD_*_LANDSCAPE_BG_SCALE
 * (orientation after HUD segment), not HUD_*_BG_LANDSCAPE_SCALE from insert rule.
 */
function applyHudScaleAliases(flat: Record<string, unknown>): void {
  (flat as any).HUD_BAL_LANDSCAPE_BG_SCALE = (
    LANDSCAPE as any
  ).HUD_BAL_BG_SCALE;
  (flat as any).HUD_BAL_PORTRAIT_BG_SCALE = (PORTRAIT as any).HUD_BAL_BG_SCALE;
  (flat as any).HUD_BET_LANDSCAPE_BG_SCALE = (
    LANDSCAPE as any
  ).HUD_BET_BG_SCALE;
  (flat as any).HUD_BET_PORTRAIT_BG_SCALE = (PORTRAIT as any).HUD_BET_BG_SCALE;
}

function buildFlatConfig(): Record<string, unknown> {
  const flat: Record<string, unknown> = { ...SHARED, LANDSCAPE, PORTRAIT };
  for (const k of Object.keys(LANDSCAPE)) {
    if (k === "MENU") continue;
    const v = (LANDSCAPE as any)[k];
    (flat as any)[appendLandscapeKey(k)] = v;
    (flat as any)[insertLandscapeKey(k)] = v;
  }
  for (const k of Object.keys(PORTRAIT)) {
    if (k === "MENU") continue;
    const v = (PORTRAIT as any)[k];
    (flat as any)[appendPortraitKey(k)] = v;
    (flat as any)[insertPortraitKey(k)] = v;
  }
  applyHudScaleAliases(flat);
  return flat;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CONFIG = buildFlatConfig() as typeof SHARED & {
  LANDSCAPE: typeof LANDSCAPE;
  PORTRAIT: typeof PORTRAIT;
} & { [k: string]: any };

export function getAppWidth(): number {
  const container = document.getElementById("app-container");
  return container && container.clientWidth > 0
    ? container.clientWidth
    : window.innerWidth;
}

export function getAppHeight(): number {
  const container = document.getElementById("app-container");
  return container && container.clientHeight > 0
    ? container.clientHeight
    : window.innerHeight;
}

export function getDeviceType(): DeviceType {
  const ua = navigator.userAgent;
  const width = getAppWidth();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return DEVICE_TYPES.TABLET;
  }
  if (
    /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return DEVICE_TYPES.MOBILE;
  }

  if (width <= 768) return DEVICE_TYPES.MOBILE;
  if (width <= 1024) return DEVICE_TYPES.TABLET;

  return DEVICE_TYPES.DESKTOP;
}

export const SYMBOL_NAMES = [
  "a",
  "k",
  "q",
  "j",
  "s1",
  "s2",
  "s3",
  "s4",
  "wild",
  "sc",
] as const;

export const SYMBOL_BASE: number[] = [0.15, 0.2, 0.25, 0.3, 0.5, 1, 1.5, 2];

export const ASSETS = {
  TEXTURES: [
    "a.png",
    "k.png",
    "q.png",
    "j.png",
    "s1.png",
    "s2.png",
    "s3.png",
    "s4.png",
    "wild.png",
    "sc.png",
  ],
  UI: [
    "border.png",
    "menu.png",
    "freespin.png",
    "hat.png",
    "title.png",
    "model.png",
    "spinBTN.png",
    "autoSpin.png",
    "plus.png",
    "grand.png",
    "mini.png",
    "major.png",
    "minus.png",
    "1.png",
    "vortex.png",
    "bet.png",
    "balance.png",
    "totalwin.png",
  ],
  GIF: ["model1.gif"],
  VIDEO: ["redlight.mp4"],
};
