

export const CONFIG = {
    DESIGN_WIDTH: 1920,
    DESIGN_HEIGHT: 1080,

    // Global layout offsets 
    SLOT_OFFSET_X: 0,
    SLOT_OFFSET_Y: 60,

    BACKGROUND_OFFSET_X: 0, 
    REEL_OFFSET_X: -10,      
    REEL_OFFSET_Y:-20,    
    
    CARD_WIDTH: 370,       
    CARD_HEIGHT: 910,      
    SYMBOL_SIZE: 270,      
    SYMBOL_SPACING:20,    
    CARD_SPACING: 1,      
    SYMBOL_MARGIN: 20,
    
    REELS_COUNT: 5,
    MACHINE_SCALE: .73,

    MASK_PX: 30,
    MASK_PY: 35,
    MASK_OFFSET_Y: -20,

    CONSOLE_Y: 490,     
    

    // Right
    BTN_RIGHT_COLUMN_X: 1100,
    BTN_BUY_FREE_Y: -400,
    BTN_BUY_FREE_SCALE: 0.65,
    BTN_SPIN_Y: 10,
    BTN_SPIN_X: 1100,
    SPIN_BTN_SIZE: 0.7,
    BTN_AUTO_Y: 380,
    BTN_AUTO_X: 1100,
    BTN_AUTO_SCALE: 0.7,

    BTN_MENU_X: -910,   
    BTN_MENU_Y: 585, 
    BTN_MENU_SCALE: 0.6,

    // Left
    HAT_X: -1190,
    HAT_Y: -890,
    HAT_SCALE: 0.6,

    // Title 
    TITLE_X: -1350,
    TITLE_Y: 200,
    TITLE_SCALE: 0.7,

    // Top 
    TOP_GRAND_X: 330,
    TOP_GRAND_Y: -810,
    TOP_GRAND_SCALE: 0.7,
    TOP_GRAND_TEXT_X: 420,
    TOP_GRAND_TEXT_Y: 200,
    TOP_GRAND_TEXT_COLOR: 0x9C7740,
    TOP_GRAND_TEXT_SIZE: 60,
    TOP_GRAND_TEXT_STROKE_COLOR: 0x000000,
    TOP_GRAND_TEXT_STROKE_WIDTH: 4,

    TOP_MAJOR_X: -180, 
    TOP_MAJOR_Y: -810,
    TOP_MAJOR_SCALE: 0.7,
    TOP_MAJOR_TEXT_X: 380,
    TOP_MAJOR_TEXT_Y: 200,
    TOP_MAJOR_TEXT_COLOR: 0x9C7740,
    TOP_MAJOR_TEXT_SIZE: 60,
    TOP_MAJOR_TEXT_STROKE_COLOR: 0x000000,
    TOP_MAJOR_TEXT_STROKE_WIDTH: 4,

    TOP_MINI_X: -680,
    TOP_MINI_Y: -810,
    TOP_MINI_SCALE: 0.7,
    TOP_MINI_TEXT_X: 380,
    TOP_MINI_TEXT_Y: 200,
    TOP_MINI_TEXT_COLOR: 0x9C7740,
    TOP_MINI_TEXT_SIZE: 60,
    TOP_MINI_TEXT_STROKE_COLOR: 0x000000,
    TOP_MINI_TEXT_STROKE_WIDTH: 4,

    // Model 
    MODEL_X: -1420,
    MODEL_Y: -510,
    MODEL_SCALE: .75,
   


    // TITLE_SHEET_COLS: 11,
    // TITLE_SHEET_ROWS: 11,
    // TITLE_SHEET_FRAMES: 120,
    // TITLE_MAX_WIDTH: 650,
    // TITLE_MAX_HEIGHT: 980,
    // TITLE_ANIM_SPEED: 0.5,


    //bottom
    TITLE_LABEL_FILL: 0xffd700,
    TITLE_LABEL_GLOW: 0xffffff,
    

    TEXT_TOTALWIN_X: -20,
    TEXT_TOTALWIN_Y: 595,
    TOTALWIN_BG_SCALE: 0.6,
    TOTALWIN_BG_X: -285,
    TOTALWIN_BG_Y: 585,
    TITLE_TOTALWIN_X: -65,
    TITLE_TOTALWIN_Y: 550,

    TEXT_BAL_X: -780,  
    TEXT_BAL_Y: 595,
    BALANCE_BG_SCALE: 0.6,
    BALANCE_BG_X: -830,
    BALANCE_BG_Y: 585,
    TITLE_BALANCE_X: -795,
    TITLE_BALANCE_Y: 560,
    
    TITLE_BET_X: 550,
    TITLE_BET_Y: 560,
    TEXT_BET_X: 590,     
    TEXT_BET_Y: 595,
    BET_BG_SCALE: 0.6,
    BET_BG_X: 530,
    BET_BG_Y: 585,
    
    BTN_MINUS_X: 450,
    BTN_MINUS_Y: 590,
    BTN_MINUS_SCALE: 0.5,

    BTN_PLUS_X: 853,
    BTN_PLUS_Y: 590,     
    BTN_PLUS_SCALE: 0.5,

   



    // UI color theme
    UI_COLORS: {
        DEFAULT_TINT: 0xFFFFFF,
        FREE_SPINS_TINT: 0xFFBDD5,
    },
   
    // Backend
    API_BASE_URL: "http://localhost:3000",
    BUY_COST_MULTIPLIER: 10,

    //  ANIMATION TIMINGS 
    REEL_SPIN_DURATION: 2.5,       
    CASCADE_WIN_DELAY: 1.5,        
    CASCADE_MULT_SPAWN_DELAY: 0.2, 
    NORMAL_WIN_DELAY: 3.0,         
    TOTAL_WIN_PANEL_DELAY: 3.5,    
    WIN_TEXT_POPUP_SPEED: 0.5,     
    PANEL_POPUP_SPEED: 0.8,        
    SYMBOL_ANIM_SPEED: 0.09,       
    REEL_BOUNCE_SPEED: .5,        
    SYMBOL_DROP_SPEED: 0.3,
    REEL_BOUNCE_OFFSET: 150,         
    REEL_MAX_BLUR: 100,              
    REEL_BLUR_FADE_DIST: 10,
    WIN_HIGHLIGHT_DELAY: 10,       
    
    // PARTICLE EMITTER
    PARTICLE_ORIGIN_X: 0,         
    PARTICLE_ORIGIN_Y: 800,          

    // PLAYER DEFAULTS 
    CURRENT_BALANCE: 2000,
    BET_AMOUNT: 100,
    AUTO_SPIN_LIMIT: Number.POSITIVE_INFINITY,
    AUTO_SPIN_DELAY: 1500,       
};


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