# Game Rules

This document describes the **Bounty Rush** (Dragon God) slot game rules. The single source of truth for numeric values is `src/domain/constants/Config.ts` (`GAME_RULES`) and the backend `slot-free.js`.

---

## Game overview

| Parameter      | Value   |
|----------------|---------|
| **Game name**  | Bounty Rush |
| **Reel layout**| 5×3 (5 reels, 3 rows) |
| **Ways to win**| 243 |
| **Max win cap**| 1000× total bet |
| **RTP**        | 96.5% |
| **Volatility** | 5 (high) |
| **Base bet multiplier** | 30 |

---

## Betting

### Bet Per Way

**Bet Per Way = Bet Level × Bet Size**

### Available bet levels

| Level |
|-------|
| 1     |

### Available bet sizes

10.00, 20.00, 30.00, 40.00, 50.00, 60.00, 70.00, 80.00, 90.00, 100.00, 200.00, 300.00, 400.00, 500.00, 1000.00, 2000.00, 3000.00, 5000.00, 10000.00, 20000.00, 30000.00, 40000.00

### Credits

Credits display the cash available for wager.

---

## Winning mechanics

### Ways to win

- Winning symbols must appear in succession on **consecutive reels**.
- **Left-to-right (LTR):** From the leftmost reel to the right.

### How wins are evaluated (243 ways)

- Each reel shows **3 symbols**.
- For a given symbol, the game counts how many matching symbols (or **Wilds**) appear on each consecutive reel from the **leftmost** reel.
- If there are matches on at least **3 consecutive reels**, that symbol produces a win.
- **Ways** are the product of the match counts per reel (e.g., \(2 \times 1 \times 3 = 6\) ways).

### Payout formula

**Winning symbol payout = Bet Per Way × Symbol pay table × Ways to win**

Symbol payouts are defined in the [Paytable](#paytable) and scaled by bet and ways.

### Cascading wins & win multipliers

This game uses a **cascading (avalanche)** mechanic:

- After a win, the winning symbols are removed.
- Remaining symbols **drop down** and new symbols fill from the top.
- The new grid is evaluated again for additional wins.

**Multiplier rule:**

- The **base spin win** is paid with **no multiplier**.
- Each cascade step increases the multiplier by \(+1\), starting at **×2** for the **first** cascade, then **×3**, **×4**, etc.
- Total win is the sum of: base win + (cascade step win × its multiplier) + any jackpot win (if applicable).

### Maximum winning cap

Total win per spin is capped at **1000× total bet**.

---

## Special symbols

### Wild

- Substitutes for all symbols **except** the Scatter.
- Does not pay on its own.

### Scatter

- 3, 4, or 5 Scatters anywhere trigger **Free Spins**.
- Scatter pays according to the paytable (3×, 4×, 5×).

---

## Free spins

- Free spins use the **same bet size and bet level** as the triggering spin.
- Free spins can **retrigger** on additional scatter hits.
- All winnings are added to the total.

---

## Jackpot prizes

| Jackpot | Prize (default) |
|---------|-----------------|
| **Mini** | 1,000 |
| **Major** | 50,000 |
| **Grand** | 200,000 |

Configured in `GAME_RULES` (Config.ts) and `slot-free.js` (`CFG_JACKPOT_*`). Displayed in the top HUD and returned by `/load` and `/play`.

---

## Other features

- **Auto Spin** – Automatically plays for a selected number of rounds.
- **Bonus Buy** – Purchase free spins at 10× the current bet.
- **Cascading wins** – Winning symbols are removed; new symbols drop; additional wins are evaluated with increasing multipliers.

---

## Paytable

Symbol payouts (3×, 4×, 5×) are defined in:

- Frontend: `src/presentation/ui/HelpModal.ts`, `index.html` (menu overlay)
- Backend: `slot-free.js` (`SYMBOL_PAYOUTS`)

See the in-game **Paytable** (menu) or **Help** modal for current values.

---

## Configuration

| Config key | Location | Description |
|------------|----------|-------------|
| `GAME_RULES` | `Config.ts` | Game name, reel layout, ways, max win, RTP, volatility, bet levels, bet sizes, jackpot prizes |
| `GAME_RULES.JACKPOT_MINI/MAJOR/GRAND` | `Config.ts` | Mini, Major, Grand jackpot prize amounts |
| `BUY_COST_MULTIPLIER` | `Config.ts` | Cost to buy free spins (× bet) |
| `CFG_JACKPOT_MINI/MAJOR/GRAND` | `slot-free.js` | Jackpot prize amounts (must match Config) |
| `CFG_SPINS_ON_SCATTER` | `slot-free.js` | Free spins granted on 3+ scatters |
| `CFG_SPINS_ON_BUY` | `slot-free.js` | Free spins granted on bonus buy |
| `CFG_SCATTER_TRIGGER` | `slot-free.js` | Minimum scatters to trigger free spins (3) |

Frontend and backend must stay in sync for bet sizes, paytable, and free-spin parameters.
