/**
 * slot-dynamic.js — Production-Ready Sample Backend
 * ===================================================
 * Full dynamic RNG, 243-ways math engine, cascading multipliers,
 * scatter payouts, free spin retrigger, and jackpot triggers.
 *
 * Run with: node --experimental-vm-modules slot-dynamic.js
 * OR:        npx nodemon slot-dynamic.js
 */

import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// CONFIG — all numbers here should match Config.ts on the client
// ─────────────────────────────────────────────────────────────
const CFG = {
    INITIAL_BALANCE:     150_000,
    BET_DEFAULT:         100,

    // Free Spins
    SPINS_ON_SCATTER:    10,    // Must match frontend "10 SPINS!" text
    SPINS_ON_BUY:        10,    // Must match frontend BuyFreeSpinsModal display
    BUY_COST_MULT:       10,    // Must match Config.ts BUY_COST_MULTIPLIER = 10
    SCATTER_TRIGGER:     3,     // Minimum scatters to trigger free spins

    // Jackpot thresholds (relative to bet)
    JACKPOT_GRAND_MULT:  2000,
    JACKPOT_MAJOR_MULT:  500,
    JACKPOT_MINI_MULT:   50,

    // Jackpot hit probability per spin (1 = always, 0 = never)
    JACKPOT_GRAND_PROB:  0.0005,
    JACKPOT_MAJOR_PROB:  0.002,
    JACKPOT_MINI_PROB:   0.01,
};

// Paytable: symbol -> [0-of-a-kind, 1-of, 2-of, 3-of, 4-of, 5-of]
const SYMBOL_PAYOUTS = {
    "a":    [0, 0, 0,  1,   2,   5],
    "k":    [0, 0, 0,  1,   3,  10],
    "q":    [0, 0, 0,  2,   4,  15],
    "j":    [0, 0, 0,  2,   5,  20],
    "s1":   [0, 0, 0,  5,  10,  30],
    "s2":   [0, 0, 0, 10,  20,  50],
    "s3":   [0, 0, 0, 15,  30, 100],
    "s4":   [0, 0, 0, 20,  50, 200],
    "wild": [0, 0, 0,  0,   0,   0],
    "sc":   [0, 0, 0,  2,   5,  20],  // Scatter pays on 3/4/5 anywhere (multiplied by bet/100)
};

// Symbol rarities for the random grid generator (higher weight = more common)
const SYMBOL_WEIGHTS = [
    { sym: "a",    weight: 30 },
    { sym: "k",    weight: 28 },
    { sym: "q",    weight: 25 },
    { sym: "j",    weight: 22 },
    { sym: "s1",   weight: 15 },
    { sym: "s2",   weight: 10 },
    { sym: "s3",   weight: 7  },
    { sym: "s4",   weight: 4  },
    { sym: "wild", weight: 3  },
    { sym: "sc",   weight: 2  },
];

// Build a weighted pool for fast random selection
const SYMBOL_POOL = SYMBOL_WEIGHTS.flatMap(({ sym, weight }) => Array(weight).fill(sym));

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────
let playerBalance = CFG.INITIAL_BALANCE;
let freeSpinCounter = 0;

// ─────────────────────────────────────────────────────────────
// Random Grid Generator
// ─────────────────────────────────────────────────────────────
function pickSymbol() {
    return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
}

function generateRandomGrid(forceScatters = false) {
    const grid = [];
    for (let c = 0; c < 5; c++) {
        const col = [];
        for (let r = 0; r < 3; r++) {
            col.push(pickSymbol());
        }
        grid.push(col);
    }

    if (forceScatters) {
        // Guarantee 3 scatters spread across different reels
        grid[0][Math.floor(Math.random() * 3)] = "sc";
        grid[2][Math.floor(Math.random() * 3)] = "sc";
        grid[4][Math.floor(Math.random() * 3)] = "sc";
    }

    return grid;
}

// ─────────────────────────────────────────────────────────────
// 243-Ways Win Evaluator
// ─────────────────────────────────────────────────────────────
function evaluate243(grid, bet) {
    let winnings = [];
    let totalWin = 0;

    // ── Payline symbols (start on Reel 0) ──
    const uniqueSymbolsCol0 = [...new Set(grid[0])].filter(s => s !== "sc" && s !== "wild");

    for (const sym of uniqueSymbolsCol0) {
        let length = 1;
        let ways = grid[0].filter(s => s === sym || s === "wild").length;
        let hasWild = grid[0].includes("wild");

        for (let col = 1; col < 5; col++) {
            const matchCount = grid[col].filter(s => s === sym || s === "wild").length;
            if (matchCount > 0) {
                length++;
                ways *= matchCount;
                if (grid[col].includes("wild")) hasWild = true;
            } else {
                break;
            }
        }

        if (length >= 3) {
            const payoutTable = SYMBOL_PAYOUTS[sym] || [];
            const basePayout = payoutTable[length] ?? 0;
            const payout = basePayout * ways * (bet / 100);

            if (payout > 0) {
                totalWin += payout;
                const positions = [];
                for (let c = 0; c < length; c++) {
                    for (let r = 0; r < 3; r++) {
                        if (grid[c][r] === sym || grid[c][r] === "wild") {
                            positions.push({ column: c, row: r });
                        }
                    }
                }
                winnings.push({ symbol: sym, payout, ways, hasWild, direction: "ltr", length, positions });
            }
        }
    }

    // ── Scatter Evaluation (anywhere on grid, no left-right rule) ──
    const scatterPositions = [];
    for (let c = 0; c < 5; c++) {
        for (let r = 0; r < 3; r++) {
            if (grid[c][r] === "sc") {
                scatterPositions.push({ column: c, row: r });
            }
        }
    }

    const scatterCount = scatterPositions.length;
    if (scatterCount >= CFG.SCATTER_TRIGGER) {
        const scPayout = (SYMBOL_PAYOUTS["sc"][scatterCount] ?? 0) * (bet / 100);
        if (scPayout > 0) {
            totalWin += scPayout;
            winnings.push({
                symbol: "sc",
                payout: scPayout,
                ways: 1,
                hasWild: false,
                direction: "scatter",
                length: scatterCount,
                positions: scatterPositions,
            });
        }
    }

    return { winnings, win: totalWin, scatterCount, scatterPositions };
}

// ─────────────────────────────────────────────────────────────
// Cascade Simulator
// ─────────────────────────────────────────────────────────────
function simulateCascades(initialGrid, initialWinnings, betAmount) {
    let total_win = 0; // Initial win NOT included here; caller adds it separately
    const cascaded = [];

    let currentGrid = JSON.parse(JSON.stringify(initialGrid));
    let currentWinnings = initialWinnings;
    let cascadeMultiplier = 1;

    while (currentWinnings.length > 0) {
        // Find all symbols to destroy
        const dropSet = new Map(); // key="c,r" → {column, row, symbol}
        for (const w of currentWinnings) {
            for (let c = 0; c < w.length && c < 5; c++) {
                for (let r = 0; r < 3; r++) {
                    if (currentGrid[c][r] === w.symbol || currentGrid[c][r] === "wild") {
                        const key = `${c},${r}`;
                        if (!dropSet.has(key)) {
                            dropSet.set(key, { column: c, row: r, symbol: currentGrid[c][r] });
                        }
                    }
                }
            }
        }

        const uniqueDrops = [...dropSet.values()];
        if (uniqueDrops.length === 0) break;

        // Apply gravity — pull survivors down, fill from top with new randoms
        const nextGrid = JSON.parse(JSON.stringify(currentGrid));
        for (const { column: c, row: r } of uniqueDrops) {
            nextGrid[c][r] = null;
        }
        for (let c = 0; c < 5; c++) {
            const survivors = nextGrid[c].filter(s => s !== null);
            while (survivors.length < 3) {
                // New symbol — no wilds or scatters on cascade refills
                const refillPool = ["a", "k", "q", "j", "s1", "s2", "s3", "s4"];
                survivors.unshift(refillPool[Math.floor(Math.random() * refillPool.length)]);
            }
            for (let r = 0; r < 3; r++) nextGrid[c][r] = survivors[r];
        }

        currentGrid = nextGrid;
        cascadeMultiplier++;

        const cascadeEval = evaluate243(currentGrid, betAmount);
        currentWinnings = cascadeEval.winnings;

        const cascadeStepPayout = cascadeEval.win * cascadeMultiplier;
        total_win += cascadeStepPayout;

        cascaded.push({
            winnings: currentWinnings,
            rng: JSON.parse(JSON.stringify(currentGrid)),
            type: "cascade",
            win: cascadeEval.win,
            multiplier: cascadeMultiplier,
            cascades: uniqueDrops,
        });
    }

    return { cascaded, cascadeTotalWin: total_win };
}

// ─────────────────────────────────────────────────────────────
// Jackpot Roll
// ─────────────────────────────────────────────────────────────
function rollJackpot(bet) {
    const prizes = {
        grand: Math.round(bet * CFG.JACKPOT_GRAND_MULT),
        major: Math.round(bet * CFG.JACKPOT_MAJOR_MULT),
        mini:  Math.round(bet * CFG.JACKPOT_MINI_MULT),
    };

    if (Math.random() < CFG.JACKPOT_GRAND_PROB) return { type: "grand", amount: prizes.grand };
    if (Math.random() < CFG.JACKPOT_MAJOR_PROB) return { type: "major", amount: prizes.major };
    if (Math.random() < CFG.JACKPOT_MINI_PROB)  return { type: "mini",  amount: prizes.mini  };
    return null;
}

// ─────────────────────────────────────────────────────────────
// Core result builder
// ─────────────────────────────────────────────────────────────
function generatePlayResult(betAmount, isFreeSpin = false, forceScatters = false) {
    const grid = generateRandomGrid(forceScatters);
    const { winnings, win, scatterCount, scatterPositions } = evaluate243(grid, betAmount);

    // Free Spin trigger — only on base spin organic hits, not on buy-forced scatters
    let triggeredFreeSpins = 0;
    let retriggered = false;

    if (scatterCount >= CFG.SCATTER_TRIGGER && !forceScatters) {
        if (isFreeSpin) {
            // Retrigger during free spins — add more spins on top
            triggeredFreeSpins = CFG.SPINS_ON_SCATTER;
            freeSpinCounter += triggeredFreeSpins;
            retriggered = true;
        } else {
            triggeredFreeSpins = CFG.SPINS_ON_SCATTER;
            freeSpinCounter += triggeredFreeSpins;
        }
    }

    // Cascade simulation
    const { cascaded, cascadeTotalWin } = simulateCascades(grid, winnings, betAmount);

    // Jackpot roll (base spins only)
    const jackpotHit = !isFreeSpin ? rollJackpot(betAmount) : null;
    const jackpotWin = jackpotHit ? jackpotHit.amount : 0;

    const total_win = win + cascadeTotalWin + jackpotWin;

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
            jackpot_hit: jackpotHit,
            slot: { reel: grid, winnings, cascaded },
            free_spin: freeSpinCounter > 0
                ? { count: freeSpinCounter, retrigger: retriggered, add: triggeredFreeSpins || null }
                : null,
            balance: playerBalance,
            jackpot_prizes: {
                grand: Math.round(betAmount * CFG.JACKPOT_GRAND_MULT),
                major: Math.round(betAmount * CFG.JACKPOT_MAJOR_MULT),
                mini:  Math.round(betAmount * CFG.JACKPOT_MINI_MULT),
            },
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
            buy_cost_multiplier: CFG.BUY_COST_MULT,
            spins_on_scatter:    CFG.SPINS_ON_SCATTER,
            spins_on_buy:        CFG.SPINS_ON_BUY,
            scatter_trigger:     CFG.SCATTER_TRIGGER,
        },
    });
});

/** POST /load — initial player state */
app.post("/load", (_req, res) => {
    freeSpinCounter = 0; // Reset stale session state on fresh load
    res.json({
        success: true,
        data: {
            player: { balance: playerBalance },
            free_spin: null,
            jackpot_prizes: {
                grand: Math.round(CFG.BET_DEFAULT * CFG.JACKPOT_GRAND_MULT),
                major: Math.round(CFG.BET_DEFAULT * CFG.JACKPOT_MAJOR_MULT),
                mini:  Math.round(CFG.BET_DEFAULT * CFG.JACKPOT_MINI_MULT),
            },
        },
    });
});

/** POST /play — main game spin */
app.post("/play", (req, res) => {
    const bet = typeof req.body?.bet === "number" ? req.body.bet : CFG.BET_DEFAULT;

    if (playerBalance < bet) {
        return res.status(400).json({ success: false, message: "Insufficient balance." });
    }

    playerBalance -= bet;
    const result = generatePlayResult(bet, false, false);
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;

    res.json(result);
});

/** POST /play-free-game — consume one free spin */
app.post("/play-free-game", (req, res) => {
    if (freeSpinCounter <= 0) {
        return res.status(400).json({ success: false, message: "No free spins remaining." });
    }

    freeSpinCounter--;
    const bet = typeof req.body?.bet === "number" ? req.body.bet : CFG.BET_DEFAULT;

    const result = generatePlayResult(bet, true, false);
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    result.data.free_spin = {
        count: freeSpinCounter,
        retrigger: result.data.scatters.retriggered,
        add: result.data.scatters.retriggered ? CFG.SPINS_ON_SCATTER : null,
    };

    res.json(result);
});

/** POST /buy-free-game — purchase free spins feature */
app.post("/buy-free-game", (req, res) => {
    const bet = typeof req.body?.bet === "number" ? req.body.bet : CFG.BET_DEFAULT;
    const cost = bet * CFG.BUY_COST_MULT;

    if (playerBalance < cost) {
        return res.status(400).json({ success: false, message: "Insufficient balance to buy free spins." });
    }

    playerBalance -= cost;
    freeSpinCounter += CFG.SPINS_ON_BUY;

    const result = generatePlayResult(bet, false, true); // Force scatter display
    playerBalance += result.data.total_win;
    result.data.balance = playerBalance;
    result.data.free_spin = { count: freeSpinCounter, retrigger: false, add: CFG.SPINS_ON_BUY };

    res.json(result);
});

/** POST /jackpot — manually claim jackpot (debug) */
app.post("/jackpot", (req, res) => {
    const bet = typeof req.body?.bet === "number" ? req.body.bet : CFG.BET_DEFAULT;
    const jackpotWin = Math.round(bet * CFG.JACKPOT_GRAND_MULT);
    playerBalance += jackpotWin;
    res.json({ success: true, data: { win: jackpotWin, balance: playerBalance, type: "grand" } });
});

app.listen(PORT, () => {
    console.log(`\n==========================================================`);
    console.log(`  BountyRUSH — Dynamic Slot Backend`);
    console.log(`  Running on  http://localhost:${PORT}`);
    console.log(`  Buy Cost Multiplier : x${CFG.BUY_COST_MULT}`);
    console.log(`  Free Spins (Scatter): ${CFG.SPINS_ON_SCATTER} spins`);
    console.log(`  Free Spins (Buy)    : ${CFG.SPINS_ON_BUY} spins`);
    console.log(`==========================================================\n`);
});
