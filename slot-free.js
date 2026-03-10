import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let playerBalance = 100000;
let freeSpinCounter = 0;

// ==========================================================
// CONFIGURATION & RULES
// ==========================================================
const CFG = {
    SPINS_ON_SCATTER: 2,
    SPINS_ON_BUY: 5,
    BUY_COST_MULT: 10,
    SCATTER_TRIGGER: 3,
    BASE_BET_MULT: 30,
    MAX_WIN_MULT: 1000,
    BET_LEVELS: [1],
    BET_SIZES: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 1000, 2000, 3000, 5000, 10000, 20000, 30000, 40000],
    JACKPOT: {
        MINI: 1000,
        MAJOR: 50000,
        GRAND: 200000
    },
    SYMBOL_PAYOUTS: {
        "a":    [0, 0,  15,  20,  30],   
        "k":    [0, 0,  10,  16,  20],   
        "q":    [0, 0,   6,   9,  12],   
        "j":    [0, 0,   3,   5,   8],   
        "s1":   [0, 0,  25,  40,  75],   
        "s2":   [0, 0,  60,  95, 140],   
        "s3":   [0, 0,  40,  60, 100],   
        "s4":   [0, 0, 100, 150, 250],   
        "wild": [0, 0,   0,   0,   0],
        "sc":   [0, 0,   0,   0,   0]
    }
};

// ==========================================================
// DEBUG CONTROL
// ==========================================================
const DEBUG_CONFIG = {
    USE_CUSTOM_GRID: false, 
    LOG_CALCULATIONS: true,
    SHOWCASE_TIERS: true, // AUTO CYCLE FOR FRONTEND TESTING
};

let debugSpinIndex = 0;

const CUSTOM_GRID = [
    ["s1", "a", "k"],  
    ["s1", "q", "a"], 
    ["s1", "j", "k"],  
    ["s1", "wild", "s1"], 
    ["s1", "s2", "s3"],   
];

const CUSTOM_FREE_SPIN_GRID = [
    ["sc", "s4", "s3"],
    ["s4", "s3", "s2"],
    ["s4", "sc", "s2"],
    ["s4", "s3", "s2"],
    ["s4", "s3", "sc"],
];

const STAGED_CASCADE_DROPS = [
    ["k", "k", "k", "k", "k"],    
    ["q", "q", "q", "q", "q"],    
    ["j", "j", "j", "j", "j"],    
    ["s2", "s2", "s2", "s2", "s2"], 
    ["s4", "s4", "s4", "s4", "s4"]
];

// ==========================================================
// MATH CORE
// ==========================================================

function logCalc(message) {
    if (DEBUG_CONFIG.LOG_CALCULATIONS) {
        console.log(`[MATH] ${message}`);
    }
}

function resolveBet(req) {
    const bets = req.body?.bets;
    if (bets?.bet_size && bets?.bet_level) {
        return { 
            betAmount: bets.bet_size * bets.bet_level * CFG.BASE_BET_MULT, 
            bet_size: bets.bet_size, 
            bet_level: bets.bet_level 
        };
    }
    const betAmount = req.body?.bet || 300;
    return { betAmount, bet_size: betAmount / CFG.BASE_BET_MULT, bet_level: 1 };
}

function generateRandomGrid(forceScatters = false, isFreeSpin = false) {
    if (DEBUG_CONFIG.USE_CUSTOM_GRID) {
        return isFreeSpin ? JSON.parse(JSON.stringify(CUSTOM_FREE_SPIN_GRID)) : JSON.parse(JSON.stringify(CUSTOM_GRID));
    }

    const grid = [];
    for (let c = 0; c < 5; c++) {
        const col = [];
        for (let r = 0; r < 3; r++) {
            let symbolOptions = ["a", "k", "q", "j", "s1", "s2", "s3", "s4"];
            if (Math.random() > 0.9) symbolOptions.push("wild");
            if (Math.random() > 0.95) symbolOptions.push("sc");
            col.push(symbolOptions[Math.floor(Math.random() * symbolOptions.length)]);
        }
        grid.push(col);
    }
    if (forceScatters) {
        grid[0][1] = "sc"; grid[2][1] = "sc"; grid[4][1] = "sc";
    }
    return grid;
}

function evaluateWays(grid, bet) {
    let winnings = [];
    let totalWin = 0;
    const unitBet = bet / 100;

    const uniqueSymbols = [...new Set(grid[0])].filter(s => s !== 'sc' && s !== 'wild');

    for (const sym of uniqueSymbols) {
        let length = 1;
        let ways = grid[0].filter(s => s === sym || s === 'wild').length;

        for (let col = 1; col < 5; col++) {
            const matchCount = grid[col].filter(s => s === sym || s === 'wild').length;
            if (matchCount > 0) {
                length++;
                ways *= matchCount;
            } else break;
        }

        if (length >= 3) {
            const basePayout = CFG.SYMBOL_PAYOUTS[sym][length - 1];
            const payout = basePayout * ways * unitBet;
            if (payout > 0) {
                totalWin += payout;
                const positions = [];
                for (let c = 0; c < length; c++) {
                    for (let r = 0; r < 3; r++) {
                        if (grid[c][r] === sym || grid[c][r] === 'wild') positions.push({ column: c, row: r });
                    }
                }
                winnings.push({ symbol: sym, payout, ways, length, positions });
            }
        }
    }

    return { winnings, win: totalWin };
}

function generatePlayResult(req, betAmount, isFreeSpin = false) {
    const forceScatters = req.body?.force_scatters === true;
    const forceWinTier = req.body?.force_win_tier; 
    const forceJackpot = req.body?.force_jackpot === true;

    console.log(`\n--- SPIN START (Bet: ${betAmount}, FS: ${isFreeSpin}) ---`);

    const grid = generateRandomGrid(forceScatters, isFreeSpin);
    const evalResult = evaluateWays(grid, betAmount);
    
    let baseWin = evalResult.win;
    let winnings = evalResult.winnings;
    let cascaded = [];

    // Cascade Logic
    let currentGrid = JSON.parse(JSON.stringify(grid));
    let currentWinnings = winnings;
    let multiplier = 1;
    let evalTotalWin = baseWin;

    while (currentWinnings.length > 0 && multiplier < 6) {
        multiplier++;
        const nextGrid = JSON.parse(JSON.stringify(currentGrid));
        let dropPositions = [];

        for (const w of currentWinnings) {
            for (const pos of w.positions) {
                dropPositions.push({ column: pos.column, row: pos.row, symbol: nextGrid[pos.column][pos.row] });
                nextGrid[pos.column][pos.row] = null;
            }
        }

        for (let c = 0; c < 5; c++) {
            let col = [];
            for (let r = 0; r < 3; r++) if (nextGrid[c][r] !== null) col.push(nextGrid[c][r]);
            while (col.length < 3) {
                let newSym = ["a", "k", "q", "j", "s1", "s2", "s3", "s4"][Math.floor(Math.random() * 8)];
                if (DEBUG_CONFIG.USE_CUSTOM_GRID && multiplier - 2 < STAGED_CASCADE_DROPS.length) {
                    newSym = STAGED_CASCADE_DROPS[multiplier - 2][c];
                }
                col.unshift(newSym);
            }
            for (let r = 0; r < 3; r++) nextGrid[c][r] = col[r];
        }

        currentGrid = nextGrid;
        const cascadeEval = evaluateWays(currentGrid, betAmount);
        evalTotalWin += cascadeEval.win * multiplier;
        
        cascaded.push({
            winnings: cascadeEval.winnings,
            rng: currentGrid,
            win: cascadeEval.win,
            multiplier: multiplier,
            cascades: dropPositions.filter((v, i, a) => a.findIndex(t => t.column === v.column && t.row === v.row) === i)
        });

        currentWinnings = cascadeEval.winnings;
    }

    // Determine target total_win
    let targetTotalWin = evalTotalWin;
    if (forceWinTier || (DEBUG_CONFIG.USE_CUSTOM_GRID && DEBUG_CONFIG.SHOWCASE_TIERS && !isFreeSpin)) {
        const tier = forceWinTier || (debugSpinIndex % 3 === 0 ? 'big' : debugSpinIndex % 3 === 1 ? 'mega' : 'max');
        debugSpinIndex++;
        const tierMult = tier === 'big' ? 15 : tier === 'mega' ? 40 : 120;
        targetTotalWin = betAmount * tierMult;
        logCalc(`FORCED TIER [${tier.toUpperCase()}]: Target total_win is ${targetTotalWin}`);
    }

    // Distribute targetTotalWin across steps so math matches
    // Formula: Actual total = baseWin + sum(cascaded[i].win * cascaded[i].multiplier)
    // We want to force this sum to equal targetTotalWin.
    
    if (targetTotalWin !== evalTotalWin) {
        logCalc(`Adjusting step payouts to match target total...`);
        if (cascaded.length > 0) {
            // Distribute the difference to the last cascade step
            // lastStepTotal = (targetTotalWin - baseWin - sum(previousSteps))
            let sumPrevious = 0;
            for (let i = 0; i < cascaded.length - 1; i++) {
                sumPrevious += cascaded[i].win * (cascaded[i].multiplier || 1);
            }
            const lastStep = cascaded[cascaded.length - 1];
            const neededValue = targetTotalWin - baseWin - sumPrevious;
            // Adjust the base 'win' of the last step so when multiplied it hits the target
            lastStep.win = neededValue / (lastStep.multiplier || 1);
            logCalc(`Adjusted last cascade step (m=${lastStep.multiplier}) to base win ${lastStep.win} to reach target.`);
        } else {
            // No cascades, adjust baseWin directly
            baseWin = targetTotalWin;
            logCalc(`No cascades found. Adjusted baseWin to ${baseWin} to reach target.`);
        }
    }

    let finalTotalWin = targetTotalWin;

    // Handle Jackpots (ADDITIVE to normal total_win)
    let jackpot_hit = false;
    let jackpot_type = null;
    if (forceJackpot) {
        jackpot_hit = true;
        jackpot_type = "grand";
        finalTotalWin += CFG.JACKPOT.GRAND;
        logCalc(`FORCED JACKPOT [GRAND]: Adding ${CFG.JACKPOT.GRAND} to total win. New Final: ${finalTotalWin}`);
    }

    // Cap at Max Win (unless jackpot/debug)
    const maxAllowed = betAmount * CFG.MAX_WIN_MULT;
    if (finalTotalWin > maxAllowed && !forceJackpot && !forceWinTier) {
        logCalc(`MAX WIN CAPPED: ${finalTotalWin} -> ${maxAllowed}`);
        finalTotalWin = maxAllowed;
    }

    const scatterPositions = [];
    for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) if (grid[c][r] === 'sc') scatterPositions.push({ column: c, row: r });
    const triggered = scatterPositions.length >= CFG.SCATTER_TRIGGER;

    logCalc(`FINAL TOTAL WIN REPORTED: ${finalTotalWin}`);
    console.log(`--- SPIN END ---\n`);

    return {
        win: baseWin,
        total_win: finalTotalWin,
        balance: playerBalance + finalTotalWin,
        is_free_spin: isFreeSpin,
        jackpot_hit,
        jackpot_type,
        jackpot_prizes: CFG.JACKPOT,
        scatters: {
            count: scatterPositions.length,
            positions: scatterPositions,
            triggered
        },
        slot: { reel: grid, winnings, cascaded },
        free_spin: triggered ? { count: CFG.SPINS_ON_SCATTER, add: CFG.SPINS_ON_SCATTER } : null
    };
}

// ==========================================================
// ROUTES
// ==========================================================

app.post("/load", (req, res) => {
    res.json({ success: true, data: { player: { balance: playerBalance }, jackpot_prizes: CFG.JACKPOT } });
});

app.post("/play", (req, res) => {
    const { betAmount } = resolveBet(req);
    playerBalance -= betAmount;
    const result = generatePlayResult(req, betAmount, false);
    playerBalance = result.balance;
    res.json({ success: true, data: result });
});

app.post("/play-free-game", (req, res) => {
    const { betAmount } = resolveBet(req);
    const result = generatePlayResult(req, betAmount, true);
    playerBalance = result.balance;
    res.json({ success: true, data: result });
});

app.post("/buy-free-game", (req, res) => {
    const { betAmount } = resolveBet(req);
    playerBalance -= (betAmount * CFG.BUY_COST_MULT);
    const result = generatePlayResult(req, betAmount, false); 
    result.scatters.triggered = true;
    result.free_spin = { count: CFG.SPINS_ON_BUY, add: CFG.SPINS_ON_BUY };
    playerBalance = result.balance;
    res.json({ success: true, data: result });
});

app.listen(PORT, () => {
    console.log(`\n==========================================================`);
    console.log(`  BountyRUSH — PERFECT DEBUG BACKEND (V2 - Win Distributed)`);
    console.log(`  Target: http://localhost:${PORT}`);
    console.log(`  Detailed Math Logging: ENABLED`);
    console.log(`  Custom Grid: ENABLED`);
    console.log(`==========================================================\n`);
});
