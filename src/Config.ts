

export const CONFIG = {
    BACKGROUND_OFFSET_X: 0, 
    REEL_OFFSET_X: -10,      
    REEL_OFFSET_Y:-20,    
    
    CARD_WIDTH: 370,       
    CARD_HEIGHT: 910,      
    SYMBOL_SIZE: 270,      
    SYMBOL_SPACING: 15,    
    CARD_SPACING: 10,      
    SYMBOL_MARGIN: 20,
    
    REELS_COUNT: 5,
    MACHINE_SCALE: .8,

    MASK_PX: 30,
    MASK_PY: 35,
    MASK_OFFSET_Y: -20,

    CONSOLE_Y: 490,     
    

    // UI Buttons
    BTN_SPIN_X: 0,
    BTN_SPIN_Y: 560,
    SPIN_BTN_SIZE: 0.5,

    BTN_AUTO_X: -200,       
    BTN_AUTO_Y: 560,
    BTN_AUTO_SCALE: 0.5,

    BTN_MENU_X: 893,   
    BTN_MENU_Y: 578, 
    BTN_MENU_SCALE: 0.5,

    BTN_MINUS_X: -913,
    BTN_MINUS_Y: 578,
    BTN_MINUS_SCALE: 0.5,

    BTN_PLUS_X: -600,
    BTN_PLUS_Y: 578,     
    BTN_PLUS_SCALE: 0.5,
    // Text Positions
    TEXT_TOTALWIN_X: 250,
    TEXT_TOTALWIN_Y: 585,
    TOTALWIN_BG_SCALE: 0.6,
    TOTALWIN_BG_X: 230,
    TOTALWIN_BG_Y: 585,

    TEXT_BET_X: -830,     
    TEXT_BET_Y: 585,
    BET_BG_SCALE: 0.5,
    BET_BG_X: -845,
    BET_BG_Y: 585,

    TEXT_BAL_X: 550,  
    TEXT_BAL_Y: 585,
    BALANCE_BG_SCALE: 0.6,
    BALANCE_BG_X: 530,
    BALANCE_BG_Y: 585,

    // model
    MODEL_LEFT_X: -520,
    MODEL_LEFT_Y: 0,
    MODEL_SCALE: 0.5,
};

export const PAYOUTS = {
    CURRENT_BALANCE: 2000,
    BET_AMOUNT: 100,


    LOW: .5,   
    HIGH: 2, 
    WILD: 10,

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

export const ASSETS = {
    TEXTURES: [
        "l1.png", "l2.png", "l3.png", "l4.png", "l5.png",
        "h1.png", "h2.png", "h3.png",
        "wild111.png", "scatter.png"
    ],
    UI: ["reelsbg2.png", "menu.png", 
        "spinBTN.png", "autoSpin.png", "plus.png", 
        "minus.png", "1.png",
         "vortex.png", "bet.png","balance.png","totalwin.png"],
    
    GIF: ["model1.gif"],
    VIDEO: ["redlight.mp4"],
    

    SPRITE_SHEET: ["queen.json",
        "drag.json", "ship.json", 
        "dblue.json", "blue.json",
        "ore.json","red.json","green.json",
        "wild.json","scat.json"],
    

};