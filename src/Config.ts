

export const CONFIG = {
    DESIGN_WIDTH: 1920,
    DESIGN_HEIGHT: 1080,

    // Global layout offsets 
    SLOT_OFFSET_X: 0,
    SLOT_OFFSET_Y: 0
,

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
    MACHINE_SCALE: .75,

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
    TEXT_BET_X: 570,     
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

    // MODES
    WIN_MODE: "WAYS_243" as "PAYLINES" | "WAYS_243",
    // WIN_MODE: "PAYLINES" as "PAYLINES" | "WAYS_243",
   
    ENABLE_CASCADING: true,

    // Backend
    USE_BACKEND: true,
    API_BASE_URL: "http://localhost:3000",
};



export const PAYOUTS = {
    CURRENT_BALANCE: 2000,
    BET_AMOUNT: 100,

    LOW: 0.25,
    HIGH: 1.25,

    SCATTER_SPINS: 10,
    SCATTER_REQ: 3,
    SCATTER_EXTRA: 3,

    MULTI_4: 3,
    MULTI_5: 10,
    JACKPOT: 2000,

    AUTO_SPIN_LIMIT: Number.POSITIVE_INFINITY,
    AUTO_SPIN_DELAY: 1500,

    FREE_SPIN_COUNT: 0
};

export const PAYLINES = [
    [0,0,0,0,0], 
    [1,1,1,1,1], 
    [2,2,2,2,2], 
    [0,1,2,1,0],
    [2,1,0,1,2],
    // [2,1,2,1,2],
    // [1,2,1,2,1],
    // [0,1,0,1,0],
    // [1,0,1,0,1]
];

// export const REEL_BANDS = [
   
//     [0,0,0,0,1,1,1,2,2,3,3,4,4,5,6,7,8,9,0,1,2], 
    
//     [0,0,0,1,1,1,2,2,3,3,4,4,5,5,6,7,9,0,1,2,3], 
    
//     [0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,9,0,1,2], 
    
//     [0,0,1,1,2,2,3,3,4,4,5,5,6,7,8,9,0,1,2,3,4], 
    
//     [0,0,1,1,2,2,3,4,5,6,7,9,0,1,2,3,4,5,6,7,8]  
// ];

export const SYMBOL_NAMES = ["A", "K", "Q", "J", "S1", "S2", "S3", "S4"] as const;

export const SYMBOL_BASE: number[] = [
    0.15, 0.2, 0.25, 0.3,   // A, K, Q, J (low)
    0.5, 1, 1.5, 2,         // S1, S2, S3, S4 (high)
];

export const ASSETS = {
    // TEXTURES: [
    //     "l1.png", "l2.png", "l3.png", "l4.png", "l5.png",
    //     "h1.png", "h2.png", "h3.png",
    //     "wild111.png", "scatter.png"
    // ],

    TEXTURES: [
        "a.png", "k.png", "q.png", "j.png",
        "s1.png", "s2.png", "s3.png", "s4.png",
        "wild.png", "sc.png"
    ],
    
UI: ["border.png", "menu.png", "freespin.png","hat.png", "title.png","model.png",
        "spinBTN.png", "autoSpin.png", "plus.png", 
        "minus.png", "1.png",
         "vortex.png", "bet.png","balance.png","totalwin.png"],
    
    GIF: ["model1.gif"],
    VIDEO: ["redlight.mp4"],
    

    // SPRITE_SHEET: ["queen.json",
    //     "drag.json", "ship.json", 
    //     "dblue.json", "blue.json",
    //     "ore.json","red.json","green.json",
    //     "wild.json","scat.json"],
    

};