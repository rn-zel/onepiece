import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let playerBalance = 10000;
let freeSpinCounter = 0;

// ─────────────────────────────────────────────────────────────
// Bet helpers — normalize bet / bet_size / bet_level
// ─────────────────────────────────────────────────────────────
function resolveBet(req, defaultBet) {
    // Support Laravel-style payload: { bets: { bet_size, bet_level } }
    const bets = req.body?.bets;
    if (bets && typeof bets.bet_size === "number" && typeof bets.bet_level === "number") {
        const betAmount = bets.bet_size * bets.bet_level;
        return {
            betAmount,
            bet_size: bets.bet_size,
            bet_level: bets.bet_level,
        };
    }

    // Fallback to simple numeric bet (existing behavior)
    const betAmount = typeof req.body?.bet === "number" ? req.body.bet : defaultBet;

    // Derive bet_size / bet_level from total bet amount.
    // Base size is fixed at 20, level scales with bet.
    const bet_size = 20;
    const bet_level = Math.max(1, Math.round(betAmount / bet_size));

    return { betAmount, bet_size, bet_level };
}

// ─────────────────────────────────────────────────────────────
// CONFIG — must stay in sync with Config.ts on the frontend
// ─────────────────────────────────────────────────────────────
const CFG_SPINS_ON_SCATTER  = 2;  // Must match frontend "10 SPINS!" text
const CFG_SPINS_ON_BUY      = 5;  // Must match BuyFreeSpinsModal display
const CFG_BUY_COST_MULT     = 10;  // Must match Config.ts BUY_COST_MULTIPLIER
const CFG_SCATTER_TRIGGER   = 3;




// Set to true ONLY for debugging specific grid layouts.
// Use slot-dynamic.js for real random gameplay testing.
const USE_CUSTOM_GRID = false;

// initial grid for normal spins
const CUSTOM_GRID = [
    ["s1", "a", "k"],  
    ["s1", "q", "a"], 
    ["s1", "j", "k"],  
    ["s1", "wild", "s1"], 
    ["s1", "s2", "s3"],   
];

// FREE SPINS (

const CUSTOM_FREE_SPIN_GRID = [
    ["sc", "s4", "s3"],   // Reel 0: scatter TOP
    ["s4", "s3", "s2"],   // Reel 1: no scatter
    ["s4", "sc", "s2"],   // Reel 2: scatter MIDDLE
    ["s4", "s3", "s2"],   // Reel 3: no scatter
    ["s4", "s3", "sc"],   // Reel 4: scatter BOTTOM
];

// Staged cascade drops for FREE SPIN test grid
const FREE_SPIN_STAGED_DROPS = [
    ["s3", "s3", "s3", "s3", "s3"],   
    ["s2", "s2", "s2", "s2", "s2"],   
    ["s4", "s4", "s4", "s4", "s4"],   
];

// Math Engine

function generateRandomGrid(forceScatters = false, isFreeSpin = false) {
    if (USE_CUSTOM_GRID) {
        // Return free spin grid when in free spin mode
        if (isFreeSpin) return JSON.parse(JSON.stringify(CUSTOM_FREE_SPIN_GRID));
        return JSON.parse(JSON.stringify(CUSTOM_GRID));
    }

    const grid = [];
    for (let c = 0; c < 5; c++) {
        const col = [];
        for (let r = 0; r < 3; r++) {
            let symbolOptions = ["a", "k", "q", "j", "s1", "s2", "s3", "s4", "a", "k", "q", "j"];
            if (Math.random() > 0.9) symbolOptions.push("wild");
            if (Math.random() > 0.95) symbolOptions.push("sc");
            col.push(symbolOptions[Math.floor(Math.random() * symbolOptions.length)]);
        }
        grid.push(col);
    }
    
    if (forceScatters) {
        grid[0][1] = "sc";
        grid[2][1] = "sc";
        grid[4][1] = "sc";
    }
    
    return grid;
}

function evaluate243(grid, bet) {
    // Indices: [0-of, 1-of, 2-of, 3-of, 4-of, 5-of]
    const SYMBOL_PAYOUTS = {
        "a":    [0, 0, 0,  1,  2,   5],
        "k":    [0, 0, 0,  1,  3,  10],
        "q":    [0, 0, 0,  2,  4,  15],
        "j":    [0, 0, 0,  2,  5,  20],
        "s1":   [0, 0, 0,  5, 10,  30],
        "s2":   [0, 0, 0, 10, 20,  50],
        "s3":   [0, 0, 0, 15, 30, 100],
        "s4":   [0, 0, 0, 20, 50, 200],
        "wild": [0, 0, 0,  0,  0,   0],
        "sc":   [0, 0, 0,  2,  5,  20],  // Scatter pays on 3/4/5 (multiplied by bet/100)
    };

    let winnings = [];
    let totalWin = 0;

    const uniqueSymbolsCol0 = [...new Set(grid[0])].filter(s => s !== 'sc' && s !== 'wild');

    for (const sym of uniqueSymbolsCol0) {
        let length = 1;
        let ways = grid[0].filter(s => s === sym || s === 'wild').length;
        let hasWild = grid[0].includes('wild');

        for (let col = 1; col < 5; col++) {
            const matchCount = grid[col].filter(s => s === sym || s === 'wild').length;
            if (matchCount > 0) {
                length++;
                ways *= matchCount;
                if (grid[col].includes('wild')) hasWild = true;
            } else {
                break;
            }
        }

        if (length >= 3) {
            const payoutObj = SYMBOL_PAYOUTS[sym] || [0,0,0,0,0];
            const basePayout = payoutObj[length - 1] || 0;
            const payout = basePayout * ways * (bet / 100); 

            if (payout > 0) {
                totalWin += payout;
                let positions = [];
                for (let c = 0; c < length; c++) {
                    for (let r = 0; r < 3; r++) {
                        if (grid[c][r] === sym || grid[c][r] === 'wild') {
                            positions.push({ column: c, row: r });
                        }
                    }
                }
                winnings.push({
                    symbol: sym,
                    payout: payout,
                    ways: ways,
                    hasWild: hasWild,
                    direction: "ltr",
                    length: length,
                    positions: positions
                });
            }
        }
    }
    
    // Evaluate Scatters (anywhere on reels, no payline rule)
    let scatterPositions = [];
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 3; r++) {
            if (grid[c][r] === 'sc') {
                scatterPositions.push({ column: c, row: r });
            }
        }
    }
    
    // Scatter payout (3/4/5 anywhere)
    if (scatterPositions.length >= CFG_SCATTER_TRIGGER) {
        const scTable = SYMBOL_PAYOUTS["sc"] || [];
        const scPayout = (scTable[scatterPositions.length] ?? 0) * (bet / 100);
        if (scPayout > 0) {
            totalWin += scPayout;
            winnings.push({
                symbol: "sc",
                payout: scPayout,
                ways: 1,
                hasWild: false,
                direction: "scatter",
                length: scatterPositions.length,
                positions: scatterPositions,
            });
        }
    }

    return { winnings, win: totalWin, scatterCount: scatterPositions.length, scatterPositions };
}

function generatePlayResult(betAmount, isFreeSpin = false, forceScatters = false) {
    const grid = generateRandomGrid(forceScatters, isFreeSpin);
    const { winnings, win, scatterCount, scatterPositions } = evaluate243(grid, betAmount);
    
    let triggeredFreeSpins = 0;
    let retriggered = false;

    // Only grant spins on organic hits — not on forceScatters (buy) to avoid double-counting
    if (scatterCount >= CFG_SCATTER_TRIGGER && !forceScatters) {
        triggeredFreeSpins = CFG_SPINS_ON_SCATTER;
        freeSpinCounter += triggeredFreeSpins;
        if (isFreeSpin) retriggered = true; // Scatter hit during free spins = retrigger
    }

    let total_win = win;
    let cascaded = [];

    let currentGrid = JSON.parse(JSON.stringify(grid));
    let currentWinnings = winnings;
    let cascadeMultiplier = 1;

    // CASCADE TEST 5+ drops
    while (currentWinnings.length > 0) {
        let dropPositions = [];
        const nextGrid = JSON.parse(JSON.stringify(currentGrid));
        
        // Find which symbols to destroy
        for (const w of currentWinnings) {
            for (let c = 0; c < w.length && c < 5; c++) {
                for (let r = 0; r < 3; r++) {
                    if (nextGrid[c][r] === w.symbol || nextGrid[c][r] === 'wild') {
                        dropPositions.push({column: c, row: r, symbol: nextGrid[c][r]});
                        nextGrid[c][r] = null;
                    }
                }
            }
        }
        
        const uniqueDrops = dropPositions.filter((v, i, a) => a.findIndex(t => (t.column === v.column && t.row === v.row)) === i);
        if (uniqueDrops.length === 0) break;

        // Ordered arrays force a cascade chain
        //  different  drops for free spins vs normal spins
        const stagedDrops = isFreeSpin ? FREE_SPIN_STAGED_DROPS : [
            ["k", "k", "k", "k", "k"],    
            ["q", "q", "q", "q", "q"],    
            ["j", "j", "j", "j", "j"],    
            ["s2", "s2", "s2", "s2", "s2"], 
            ["s4", "s4", "s4", "s4", "s4"]  
        ];

        // Gravity Drop: move symbols down and fill empty spots at the top
        for (let c = 0; c < 5; c++) {
            let colSymbols = [];
            // Collect remaining non-null symbols
            for (let r = 0; r < 3; r++) {
                if (nextGrid[c][r] !== null) colSymbols.push(nextGrid[c][r]);
            }
            
            // Fill new random or staged symbols at the top
            while (colSymbols.length < 3) {
                let newSym = ["a", "k", "q", "j", "s1", "s2", "s3", "s4"][Math.floor(Math.random() * 8)];
                
                // If we're forcing the test grid, guarantee the next cascade matches our staged drops
                if (USE_CUSTOM_GRID && cascadeMultiplier <= stagedDrops.length) {
                    newSym = stagedDrops[cascadeMultiplier - 1][c];
                }
                
                colSymbols.unshift(newSym);
            }
            // Put it back onto the grid
            for (let r = 0; r < 3; r++) {
                nextGrid[c][r] = colSymbols[r];
            }
        }
        
        currentGrid = nextGrid;
        const cascadeEval = evaluate243(currentGrid, betAmount);
        currentWinnings = cascadeEval.winnings;
        cascadeMultiplier++;

        cascaded.push({
            winnings: currentWinnings,
            rng: currentGrid,
            type: "cascade",
            win: cascadeEval.win,
            multiplier: cascadeMultiplier,
            cascades: uniqueDrops
        });
        
        total_win += cascadeEval.win * cascadeMultiplier;
    }

    return {
        success: true,
        data: {
            win,
            total_win,
            is_free_spin: isFreeSpin,
            scatters: {
                count: scatterCount,
                positions: scatterPositions,
                triggered: triggeredFreeSpins > 0,
                added_spins: triggeredFreeSpins,
                retriggered,
            },
            slot: { reel: grid, winnings, cascaded },
            free_spin: freeSpinCounter > 0
                ? { count: freeSpinCounter, retrigger: retriggered, add: triggeredFreeSpins || null }
                : null,
            balance: playerBalance,
            jackpot_prizes: { grand: 200000, major: 50000, mini: 1000 },
        },
    };
}


// ─────────────────────────────────────────────────────────────
// API Endpoints
// ─────────────────────────────────────────────────────────────

/** GET /config — expose server config so frontend can stay in sync */
app.get("/config", (_req, res) => {
    res.json({
        success: true,
        data: {
            buy_cost_multiplier: CFG_BUY_COST_MULT,
            spins_on_scatter:    CFG_SPINS_ON_SCATTER,
            spins_on_buy:        CFG_SPINS_ON_BUY,
            scatter_trigger:     CFG_SCATTER_TRIGGER,
            use_custom_grid:     USE_CUSTOM_GRID,
        },
    });
});

/** POST /load — initial player state */
app.post("/load", (_req, res) => {
    freeSpinCounter = 0;
    res.json({
        success: true,
        data: {
            player: { balance: playerBalance },
            free_spin: null,
            jackpot_prizes: { grand: 200000, major: 50000, mini: 1000 },
        },
    });
});

/** POST /play — main game spin */
app.post("/play", (req, res) => {
    const { betAmount, bet_size, bet_level } = resolveBet(req, 100);

    if (playerBalance < betAmount) {
        return res.status(400).json({ success: false, message: "Insufficient balance." });
    }

    playerBalance -= betAmount;
    const forceJackpot = req.body?.force_jackpot === true;
    const result = generatePlayResult(betAmount, false, false);
    
    if (forceJackpot) {
        result.data.jackpot_hit = true;
        result.data.jackpot_type = "grand";
        result.data.total_win += 200000;
    }

    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    result.data.bet_size = bet_size;
    result.data.bet_level = bet_level;
    res.json(result);
});

/** POST /play-free-game — consume one free spin */
app.post("/play-free-game", (req, res) => {
    if (freeSpinCounter <= 0) {
        return res.status(400).json({ success: false, message: "No free spins remaining." });
    }
    freeSpinCounter--;
    const { betAmount, bet_size, bet_level } = resolveBet(req, 100);
    const result = generatePlayResult(betAmount, true, false);
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    result.data.free_spin = {
        count: freeSpinCounter,
        retrigger: result.data.scatters.retriggered,
        add: result.data.scatters.retriggered ? CFG_SPINS_ON_SCATTER : null,
    };
    result.data.bet_size = bet_size;
    result.data.bet_level = bet_level;
    res.json(result);
});

/** POST /buy-free-game — purchase free spins */
app.post("/buy-free-game", (req, res) => {
    const { betAmount, bet_size, bet_level } = resolveBet(req, 100);
    const cost = betAmount * CFG_BUY_COST_MULT;

    if (playerBalance < cost) {
        return res.status(400).json({ success: false, message: "Insufficient balance to buy free spins." });
    }

    playerBalance -= cost;
    freeSpinCounter += CFG_SPINS_ON_BUY;
    const result = generatePlayResult(betAmount, false, true);
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    result.data.free_spin = { count: freeSpinCounter, retrigger: false, add: CFG_SPINS_ON_BUY };
    result.data.bet_size = bet_size;
    result.data.bet_level = bet_level;
    res.json(result);
});

/** POST /jackpot — debug jackpot claim */
app.post("/jackpot", (_req, res) => {
    const jackpotWin = 200000;
    playerBalance += jackpotWin;
    res.json({ success: true, data: { win: jackpotWin, balance: playerBalance, type: "grand" } });
});

app.listen(PORT, () => {
    console.log(`\n==========================================================`);
    console.log(`  BountyRUSH — Debug/Test Slot Backend (slot-free.js)`);
    console.log(`  Running on   http://localhost:${PORT}`);
    console.log(`  USE_CUSTOM_GRID : ${USE_CUSTOM_GRID}  (set true for fixed test grids)`);
    console.log(`  Buy Cost Mult   : x${CFG_BUY_COST_MULT}`);
    console.log(`  Free Spins      : ${CFG_SPINS_ON_SCATTER} on scatter / ${CFG_SPINS_ON_BUY} on buy`);
    console.log(`==========================================================\n`);
});
