

export const CONFIG = {
    BACKGROUND_OFFSET_X: 0, 
    REEL_OFFSET_X: -5,      
    REEL_OFFSET_Y:-20,    
    
    CARD_WIDTH: 370,       
    CARD_HEIGHT: 900,      
    SYMBOL_SIZE: 280,      
    SYMBOL_SPACING:20,    
    CARD_SPACING: 10,      
    SYMBOL_MARGIN: 5,
    
    REELS_COUNT: 5,
    MACHINE_SCALE: .85,

    MASK_PX: 30,
    MASK_PY: 50,
    MASK_OFFSET_Y: -20,

    CONSOLE_Y: 490,     
    SPIN_BTN_SIZE: 0.3,

    // UI Buttons
    BTN_SPIN_X: 0,
    BTN_SPIN_Y: 590,
    BTN_AUTO_X: -367,       
    BTN_AUTO_Y: 590,
    BTN_MENU_X: 845,   
    BTN_MENU_Y: 590,    
    BTN_MINUS_X: -758,
    BTN_MINUS_Y: 595,     
    BTN_PLUS_X: -570,
    BTN_PLUS_Y: 595,     
    
    // Text Positions
    TEXT_TOTALWIN_X: 250,
    TEXT_TOTALWIN_Y: 595,
    TEXT_BET_X: -710,     
    TEXT_BET_Y: 595,
    TEXT_BAL_X: 550,  
    TEXT_BAL_Y: 595,

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
    UI: ["reelsbg.png", "menu.png", 
        "spinBTN.png", "auto.png", "plus.png", 
        "minus.png", "1.png",
         "vortex.png"],
    
    GIF: ["model1.gif"],

    SPRITE_SHEET: ["queen.json",
        "drag.json", "ship.json", 
        "dblue.json", "blue.json",
        "ore.json","red.json","green.json",
        "wild.json","scat.json"],
    

};