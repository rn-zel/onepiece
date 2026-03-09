export const DEVICE_TYPES = {
    DESKTOP: "desktop",
    TABLET: "tablet",
    MOBILE: "mobile"
} as const;

export type DeviceType = typeof DEVICE_TYPES[keyof typeof DEVICE_TYPES];

export const CONFIG = {
    DESIGN_WIDTH_LANDSCAPE: 1920,
    DESIGN_HEIGHT_LANDSCAPE: 1080,
    DESIGN_WIDTH_PORTRAIT: 1200,
    DESIGN_HEIGHT_PORTRAIT: 2200,

    // Global layout offsets 
    SLOT_OFFSET_X_LANDSCAPE: 0,
    SLOT_OFFSET_Y_LANDSCAPE: 60,
    SLOT_OFFSET_X_PORTRAIT: 0,
    SLOT_OFFSET_Y_PORTRAIT: 310, 

    BACKGROUND_OFFSET_X_LANDSCAPE: 0, 
    BACKGROUND_OFFSET_X_PORTRAIT: 0,

    REEL_OFFSET_X_LANDSCAPE: -10,
    REEL_OFFSET_Y_LANDSCAPE: -20,
    REEL_OFFSET_X_PORTRAIT: -10,
    REEL_OFFSET_Y_PORTRAIT: -20,
    
    CARD_WIDTH_LANDSCAPE: 370,
    CARD_HEIGHT_LANDSCAPE: 910,
    CARD_WIDTH_PORTRAIT: 370,
    CARD_HEIGHT_PORTRAIT: 910,

    SYMBOL_SIZE_LANDSCAPE: 270,
    SYMBOL_SPACING_LANDSCAPE: 20,
    SYMBOL_SIZE_PORTRAIT: 270,
    SYMBOL_SPACING_PORTRAIT: 20,

    CARD_SPACING_LANDSCAPE: 1,
    CARD_SPACING_PORTRAIT: 1,
    SYMBOL_MARGIN_LANDSCAPE: 20,
    SYMBOL_MARGIN_PORTRAIT: 20,
    
    REELS_COUNT: 5,
    MACHINE_SCALE_LANDSCAPE: 0.73,
    MACHINE_SCALE_PORTRAIT: 0.985,

    MASK_PX_LANDSCAPE: 30,
    MASK_PY_LANDSCAPE: 35,
    MASK_OFFSET_Y_LANDSCAPE: -20,
    MASK_PX_PORTRAIT: 30,
    MASK_PY_PORTRAIT: 35,
    MASK_OFFSET_Y_PORTRAIT: -20,

    CONSOLE_Y_LANDSCAPE: 490,
    CONSOLE_Y_PORTRAIT: 490,
    
    // --- LAYOUT CONSTANTS ---
    
    // Spin Button
    SPIN_BTN_LANDSCAPE_X: 1150,
    SPIN_BTN_LANDSCAPE_Y: 10,
    SPIN_BTN_PORTRAIT_X: 0,
    SPIN_BTN_PORTRAIT_Y: 800,
    SPIN_BTN_LANDSCAPE_SCALE: 0.7,
    SPIN_BTN_PORTRAIT_SCALE: 0.84, // 0.7 * 1.2

    // Auto Spin Button
    AUTO_BTN_LANDSCAPE_X: 1150,
    AUTO_BTN_LANDSCAPE_Y: 380,
    AUTO_BTN_PORTRAIT_X: 280,
    AUTO_BTN_PORTRAIT_Y: 420,
    AUTO_BTN_LANDSCAPE_SCALE: 0.7,
    AUTO_BTN_PORTRAIT_SCALE: 0.77, // 0.7 * 1.1

    // Buy Free Spins Button
    BUY_FREE_LANDSCAPE_X: 1150,
    BUY_FREE_LANDSCAPE_Y: -380,
    BUY_FREE_PORTRAIT_X: -280,
    BUY_FREE_PORTRAIT_Y: 420,
    BUY_FREE_LANDSCAPE_SCALE: 0.65,
    BUY_FREE_PORTRAIT_SCALE: 0.715, // 0.65 * 1.1

    // Menu Button
    MENU_BTN_LANDSCAPE_X: -910,
    MENU_BTN_LANDSCAPE_Y: 585,
    MENU_BTN_PORTRAIT_X: -450,
    MENU_BTN_PORTRAIT_Y: 950,
    MENU_BTN_LANDSCAPE_SCALE: 0.6,
    MENU_BTN_PORTRAIT_SCALE: 0.6,

    // Balance HUD
    HUD_BAL_TITLE_LANDSCAPE_X: -795,
    HUD_BAL_TITLE_LANDSCAPE_Y: 560,
    HUD_BAL_BG_LANDSCAPE_X: -830,
    HUD_BAL_BG_LANDSCAPE_Y: 585,
    HUD_BAL_TEXT_LANDSCAPE_X: -780,
    HUD_BAL_TEXT_LANDSCAPE_Y: 595,
    
    HUD_BAL_TITLE_PORTRAIT_X: -500,
    HUD_BAL_TITLE_PORTRAIT_Y: -950,
    HUD_BAL_BG_PORTRAIT_X: -500,
    HUD_BAL_BG_PORTRAIT_Y: -890,
    HUD_BAL_TEXT_PORTRAIT_X: -450,
    HUD_BAL_TEXT_PORTRAIT_Y: -890,
    HUD_BAL_LANDSCAPE_BG_SCALE: 0.6,
    HUD_BAL_PORTRAIT_BG_SCALE: 0.6,

    // Bet HUD
    HUD_BET_TITLE_LANDSCAPE_X: 550,
    HUD_BET_TITLE_LANDSCAPE_Y: 560,
    HUD_BET_BG_LANDSCAPE_X: 530,
    HUD_BET_BG_LANDSCAPE_Y: 585,
    HUD_BET_TEXT_LANDSCAPE_X: 590,
    HUD_BET_TEXT_LANDSCAPE_Y: 595,
    
    HUD_BET_TITLE_PORTRAIT_X: 100,
    HUD_BET_TITLE_PORTRAIT_Y: -950,
    HUD_BET_BG_PORTRAIT_X: 100,
    HUD_BET_BG_PORTRAIT_Y: -890,
    HUD_BET_TEXT_PORTRAIT_X: 200,
    HUD_BET_TEXT_PORTRAIT_Y: -890,
    HUD_BET_LANDSCAPE_BG_SCALE: 0.6,
    HUD_BET_PORTRAIT_BG_SCALE: 0.6,
    
    BTN_MINUS_LANDSCAPE_X: 450,
    BTN_MINUS_LANDSCAPE_Y: 590,
    BTN_MINUS_PORTRAIT_X: 140,
    BTN_MINUS_PORTRAIT_Y: -890,
    
    BTN_PLUS_LANDSCAPE_X: 853,
    BTN_PLUS_LANDSCAPE_Y: 590,
    BTN_PLUS_PORTRAIT_X: 440,
    BTN_PLUS_PORTRAIT_Y: -890,
    BTN_ADJUST_LANDSCAPE_SCALE: 0.5,
    BTN_ADJUST_PORTRAIT_SCALE: 0.5,

    // Total Win HUD
    HUD_WIN_TITLE_LANDSCAPE_X: -65,
    HUD_WIN_TITLE_LANDSCAPE_Y: 550,
    HUD_WIN_BG_LANDSCAPE_X: -285,
    HUD_WIN_BG_LANDSCAPE_Y: 585,
    HUD_WIN_TEXT_LANDSCAPE_X: -20,
    HUD_WIN_TEXT_LANDSCAPE_Y: 595,
    HUD_WIN_BG_LANDSCAPE_SCALE: 0.6,

    HUD_WIN_TITLE_PORTRAIT_X: -200,
    HUD_WIN_TITLE_PORTRAIT_Y: 480,
    HUD_WIN_BG_PORTRAIT_X: -400,
    HUD_WIN_BG_PORTRAIT_Y: 580,
    HUD_WIN_TEXT_PORTRAIT_X: 0,
    HUD_WIN_TEXT_PORTRAIT_Y: 580,
    HUD_WIN_BG_PORTRAIT_SCALE: 0.72, // 0.6 * 1.2

    WIN_TEXT_LANDSCAPE_Y: 0,
    WIN_TEXT_PORTRAIT_Y: 100,

    // Jackpot Top Bar
    JACKPOT_GRAND_LANDSCAPE_X: 330,
    JACKPOT_GRAND_LANDSCAPE_Y: -810,
    JACKPOT_MAJOR_LANDSCAPE_X: -180,
    JACKPOT_MAJOR_LANDSCAPE_Y: -810,
    JACKPOT_MINI_LANDSCAPE_X: -680,
    JACKPOT_MINI_LANDSCAPE_Y: -810,
    JACKPOT_LANDSCAPE_SCALE: 0.7,

    JACKPOT_GRAND_PORTRAIT_X: 400,
    JACKPOT_GRAND_PORTRAIT_Y: -1050,
    JACKPOT_MAJOR_PORTRAIT_X: 0,
    JACKPOT_MAJOR_PORTRAIT_Y: -1050,
    JACKPOT_MINI_PORTRAIT_X: -400,
    JACKPOT_MINI_PORTRAIT_Y: -1050,
    JACKPOT_PORTRAIT_SCALE: 0.65,

    // Machine Positioning
    // (Deprecated individual machine constants in favor of SLOT_OFFSET_Y_PORTRAIT etc.)

    // Model 
    MODEL_LANDSCAPE_X: -1420,
    MODEL_LANDSCAPE_Y: -510,
    MODEL_LANDSCAPE_SCALE: 0.75,
    MODEL_PORTRAIT_X: -1420,
    MODEL_PORTRAIT_Y: -510,
    MODEL_PORTRAIT_SCALE: 0.75,

    // Left Hat
    HAT_LANDSCAPE_X: -1190,
    HAT_LANDSCAPE_Y: -890,
    HAT_LANDSCAPE_SCALE: 0.6,
    HAT_PORTRAIT_X: -1190,
    HAT_PORTRAIT_Y: -890,
    HAT_PORTRAIT_SCALE: 0.6,

    // Title 
    TITLE_LANDSCAPE_X: -1350,
    TITLE_LANDSCAPE_Y: 200,
    TITLE_LANDSCAPE_SCALE: 0.7,
    TITLE_PORTRAIT_X: -1350,
    TITLE_PORTRAIT_Y: 200,
    TITLE_PORTRAIT_SCALE: 0.7,

    // STATS BUTTON
    STATS_BTN_WIDTH: 200,
    STATS_BTN_HEIGHT: 60,
    STATS_BTN_RADIUS: 10,
    STATS_BTN_FONT_SIZE: 40,
    STATS_BTN_LANDSCAPE_X: -1230,
    STATS_BTN_LANDSCAPE_Y: 550,
    STATS_BTN_PORTRAIT_X: -480,
    STATS_BTN_PORTRAIT_Y: 950,

    // TURBO BUTTON
    TURBO_BTN_WIDTH: 160,
    TURBO_BTN_HEIGHT: 50,
    TURBO_BTN_RADIUS: 10,
    TURBO_BTN_FONT_SIZE: 30,
    TURBO_BTN_ACTIVE_COLOR: "#FFD700",
    TURBO_BTN_INACTIVE_COLOR: "#555555",
    TURBO_BTN_GLOW_COLOR: 0xF3CB00,
    TURBO_BTN_GLOW_BLUR: 10,
    TURBO_BTN_LANDSCAPE_X: 1070,
    TURBO_BTN_LANDSCAPE_Y: 520,
    TURBO_BTN_PORTRAIT_X: 420,
    TURBO_BTN_PORTRAIT_Y: 700,

    // UI Styles
    TITLE_LABEL_FILL: 0xffd700,
    TITLE_LABEL_GLOW: 0xffffff,

    // UI color theme
    UI_COLORS: {
        DEFAULT_TINT: 0xFFFFFF,
        FREE_SPINS_TINT: 0xFFBDD5,
    },
   
    // Backend
    API_BASE_URL: "http://localhost:3000",
    BUY_COST_MULTIPLIER: 10,

    //  ANIMATION TIMINGS 
    REEL_SPIN_DURATION: 1.5,       
    REEL_STAGGER_DELAY: 0.2,
    TURBO_TIME_SCALE: 0.5,
    REEL_MAX_BLUR: 6,
    REEL_BLUR_FADE_DIST: 2,
    REEL_BOUNCE_OFFSET: 15,
    REEL_BOUNCE_SPEED: 0.4,
    
    FIRST_WIN_DELAY: 3,          
    CASCADE_WIN_DELAY: 1.5,        
    CASCADE_MULT_SPAWN_DELAY: 0.2, 
    NORMAL_WIN_DELAY: 3.0,         
    TOTAL_WIN_PANEL_DELAY: 3.5,    
    WIN_TEXT_POPUP_SPEED: 0.5,     
    PANEL_POPUP_SPEED: 0.8,        
    SYMBOL_ANIM_SPEED: 0.09,       
    SYMBOL_DROP_SPEED: 0.3,
    WIN_HIGHLIGHT_DELAY: 1,       
    
    // BETTING
    BET_VALUES: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 10000],
    BET_PRESETS: [100, 500, 1000, 5000], // Keep for backward compat if any, but slider will use BET_VALUES

    // PARTICLE EMITTER
    PARTICLE_ORIGIN_X: 0,         
    PARTICLE_ORIGIN_Y: 800,          

    // PLAYER DEFAULTS 
    CURRENT_BALANCE: 2000,
    BET_AMOUNT: 100,
    AUTO_SPIN_LIMIT: Number.POSITIVE_INFINITY,
    AUTO_SPIN_DELAY: 1500,       
    FREE_SPIN_AUTO_DELAY: 800,   // ms pause between auto-fired free spins

    // DEVICE SPECIFIC OVERRIDES (Optional, can be expanded)
    MACHINE_SCALE_DESKTOP_LANDSCAPE: 0.73,
    MACHINE_SCALE_DESKTOP_PORTRAIT: 0.85,
    MACHINE_SCALE_TABLET_LANDSCAPE: 0.70,
    MACHINE_SCALE_TABLET_PORTRAIT: 0.90,
    MACHINE_SCALE_MOBILE_LANDSCAPE: 0.60,
    MACHINE_SCALE_MOBILE_PORTRAIT: 0.985,

    SLOT_OFFSET_Y_MOBILE_PORTRAIT: 310,
    SLOT_OFFSET_Y_TABLET_PORTRAIT: 250,
    SLOT_OFFSET_Y_DESKTOP_PORTRAIT: 150,
};

export function getAppWidth(): number {
    const container = document.getElementById('app-container');
    return container && container.clientWidth > 0 ? container.clientWidth : window.innerWidth;
}

export function getAppHeight(): number {
    const container = document.getElementById('app-container');
    return container && container.clientHeight > 0 ? container.clientHeight : window.innerHeight;
}

export function getDeviceType(): DeviceType {
    const ua = navigator.userAgent;
    const width = getAppWidth();
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return DEVICE_TYPES.TABLET;
    }
    if (/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return DEVICE_TYPES.MOBILE;
    }
    
    // Fallback based on width if UA is generic
    if (width <= 768) return DEVICE_TYPES.MOBILE;
    if (width <= 1024) return DEVICE_TYPES.TABLET;
    
    return DEVICE_TYPES.DESKTOP;
}


export const SYMBOL_NAMES = ["a", "k", "q", "j", "s1", "s2", "s3", "s4", "wild", "sc"] as const;

export const SYMBOL_BASE: number[] = [
    0.15, 0.2, 0.25, 0.3,   // a, k, q, j (low)
    0.5, 1, 1.5, 2,       // s1, s2, s3, s4 (high)
];

export const ASSETS = {
    TEXTURES: [
        "a.png", "k.png", "q.png", "j.png",
        "s1.png", "s2.png", "s3.png", "s4.png",
        "wild.png", "sc.png"
    ],
    
UI: ["border.png", "menu.png", "freespin.png","hat.png", "title.png","model.png",
        "spinBTN.png", "autoSpin.png", "plus.png","grand.png","mini.png","major.png", 
        "minus.png", "1.png",
         "vortex.png", "bet.png","balance.png","totalwin.png"],
    
    GIF: ["model1.gif"],
    VIDEO: ["redlight.mp4"]
};