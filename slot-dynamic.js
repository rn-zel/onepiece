import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let playerBalance = 150000;
let freeSpinCounter = 0;


//  FREE SPIN CONFIG                
const CFG_SPINS_ON_SCATTER  = 5;  
const CFG_SPINS_ON_BUY      = 15;  
const CFG_BUY_COST_MULT     = 10; 
const CFG_SCATTER_TRIGGER   = 3;  


const SYMBOLS = ["a", "k", "q", "j", "s1", "s2", "s3", "s4", "wild", "sc"];

// Dynamic RNG Math Engine
function generateRandomGrid(forceScatters = false) {
    const grid = [];
    for (let c = 0; c < 5; c++) {
        const col = [];
        for (let r = 0; r < 3; r++) {
            // Mostly pick normal symbols and rarely wilds
            let symbolOptions = ["a", "k", "q", "j", "s1", "s2", "s3", "s4", "a", "k", "q", "j"];
            if (Math.random() > 0.9) symbolOptions.push("wild");
            if (Math.random() > 0.95) symbolOptions.push("sc");
            
            col.push(symbolOptions[Math.floor(Math.random() * symbolOptions.length)]);
        }
        grid.push(col);
    }
    
    if (forceScatters) {
        grid[0][0] = "sc";  
        grid[2][1] = "sc";  
        grid[4][2] = "sc";  
    }
    
    return grid;
}

// Basic 243 Ways Evaluator
function evaluate243(grid, bet) {
    const SYMBOL_PAYOUTS = {
        "a": [0,0,1,2,5],
        "k": [0,0,1,3,10],
        "q": [0,0,2,4,15],
        "j": [0,0,2,5,20],
        "s1": [0,0,5,10,30],
        "s2": [0,0,10,20,50],
        "s3": [0,0,15,30,100],
        "s4": [0,0,20,50,200],
        "wild": [0,0,0,0,0],
        "sc": [0,0,0,0,0] 
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
    
    // Evaluate Scatters (anywhere on reels)
    let scatterPositions = [];
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 3; r++) {
            if (grid[c][r] === 'sc') {
                scatterPositions.push({ column: c, row: r });
            }
        }
    }
    
    return { winnings, win: totalWin, scatterCount: scatterPositions.length, scatterPositions };
}

function generatePlayResult(betAmount, isFreeSpin = false, forceScatters = false) {
    const grid = generateRandomGrid(forceScatters);
    const { winnings, win, scatterCount, scatterPositions } = evaluate243(grid, betAmount);
    
    // Trigger Free Spins if 3+ scatters land (not during cascades usually, but on base spin)
    let triggeredFreeSpins = 0;
    // Only add spins on organic scatter hits. Skip when called from /buy-free-game
    // (forceScatters=true) to avoid double-counting the buy grant.
    if (scatterCount >= CFG_SCATTER_TRIGGER && !forceScatters) {
        triggeredFreeSpins = CFG_SPINS_ON_SCATTER;
        freeSpinCounter += triggeredFreeSpins;
    }

    let total_win = win;
    let cascaded = [];

    let currentGrid = JSON.parse(JSON.stringify(grid));
    let currentWinnings = winnings;
    let cascadeMultiplier = 1;

    // Loop cascade simulation indefinitely until no new wins exist
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

        // Gravity Drop
        for (let c = 0; c < 5; c++) {
            let colSymbols = [];
            for (let r = 0; r < 3; r++) {
                if (nextGrid[c][r] !== null) colSymbols.push(nextGrid[c][r]);
            }
            while (colSymbols.length < 3) {
                const newSym = ["a", "k", "q", "j", "s1", "s2", "s3"][Math.floor(Math.random() * 7)];
                colSymbols.unshift(newSym);
            }
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
        data: {
            win: win,
            total_win: total_win,
            is_free_spin: isFreeSpin,
            scatters: {
                count: scatterCount,
                positions: scatterPositions,
                triggered: triggeredFreeSpins > 0,
                added_spins: triggeredFreeSpins
            },
            slot: {
                reel: grid,
                winnings: winnings,
                cascaded: cascaded
            },
            free_spin: freeSpinCounter > 0 ? { count: freeSpinCounter } : null,
            balance: playerBalance,
            jackpot_prizes: {
                title: "Slot Jackpot",
                super: "1000", major: "500", mini: "10"
            }
        },
        success: true
    };
}


// --- API ENDPOINTS ---

app.post("/load", (req, res) => {
    // Reset free spin counter on every fresh page load so stale counts don't accumulate
    freeSpinCounter = 0;
    res.json({
        success: true,
        data: {
            player: { balance: playerBalance },
            free_spin: freeSpinCounter > 0 ? { count: freeSpinCounter } : null,
            jackpot_prizes: {
                title: "Slot Jackpot",
                super: "1000", major: "500", mini: "10"
            }
        }
    });
});

app.post("/play", (req, res) => {
    const bet = typeof req.body?.bet === "number" ? req.body.bet : 100;
    playerBalance -= bet;
    
    const result = generatePlayResult(bet, false, false);
    
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    
    res.json(result);
});

app.post("/play-free-game", (req, res) => {
    if (freeSpinCounter <= 0) {
        return res.status(400).json({ success: false, message: "No free spins remaining." });
    }
    freeSpinCounter--;
    
    // Use the bet from the frontend so payouts scale correctly
    const bet = typeof req.body?.bet === "number" ? req.body.bet : 100;
    const result = generatePlayResult(bet, true, false); 
    
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    result.data.free_spin = { count: freeSpinCounter };
    
    res.json(result);
});

app.post("/buy-free-game", (req, res) => {
    const bet = typeof req.body?.bet === "number" ? req.body.bet : 100;
    const cost = bet * CFG_BUY_COST_MULT;
    playerBalance -= cost;
    freeSpinCounter += CFG_SPINS_ON_BUY;
    
    const result = generatePlayResult(bet, false, true); // Force scatters
    
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    result.data.free_spin = { count: freeSpinCounter };
    
    res.json(result);
});

app.post("/jackpot", (req, res) => {
    playerBalance += 10000;
    res.json({
        success: true,
        data: {
            win: 10000,
            balance: playerBalance,
        }
    });
});

app.listen(PORT, () => {
    console.log(`Backend Dev API running on http://localhost:${PORT}`);
    console.log(`Dynamic RNG & 243-Way Math Engine is active.`);
});
