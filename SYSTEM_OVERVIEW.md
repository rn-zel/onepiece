## System Overview

This codebase implements a 5×3 video slot using **PixiJS + TypeScript** on the client and an optional **Node/Express** backend (`slot-free.js`) to drive game math. The system is structured in layers:

- **Presentation layer** (`src/SlotMachine.ts`, UI, reels, VFX, audio): Everything related to rendering and animations.
- **Domain layer** (`src/domain/**`): Pure game rules and math (wins, cascades, spin results, paytable).
- **Infrastructure layer** (`slot-free.js`, `src/api/slotApi.ts`): HTTP API, test data, and integration glue.
- **Configuration layer** (`src/Config.ts`): Layout, payouts, assets, and mode toggles.

The goal is to keep **Pixi/UI code** separate from **game math** and **backend I/O**, following SOLID and DDD-inspired boundaries.

---

## Runtime Modes

The slot can run in two modes, controlled by `CONFIG`:

- **Local mode** (`CONFIG.USE_BACKEND = false`)
  - Symbols are generated locally.
  - Wins are evaluated in the browser using the domain win evaluators.
  - Cascades are driven by the pure `CascadeEngine` and orchestrated by `SlotMachine`.

- **Backend mode** (`CONFIG.USE_BACKEND = true`)
  - `SlotMachine` calls the HTTP API defined in `slot-free.js` via `slotApi.ts`.
  - The backend returns reel layouts, wins, and cascade data.
  - The client only animates what the backend decided (reels, cascades, free spins, jackpots).

Details of the backend API are documented in `SLOT_BACKEND.md`.

---

## High-Level Components

### Presentation layer (Pixi / GSAP)

- **`main.ts`**
  - Bootstraps the Pixi `Application`.
  - Loads textures from `ASSETS.TEXTURES` and `ASSETS.UI`.
  - Creates supporting visuals (`WaterBg`, `Starfield`) and instantiates `SlotMachine`.

- **`SlotMachine.ts`**
  - Central orchestrator of the game session.
  - Manages:
    - Game state: `balance`, `betAmount`, `bonusSpins`, `sessionWins`, `lastSpinWin`, `running`, `autoSpinActive`.
    - Scene graph: `mainContainer`, `backgroundContainer`, `reelContainer`, and `UIManager` container.
    - Systems: `WinManager` (scatter counting), `VFXManager` (black hole/vortex, rumble), `SoundManager`, `LightningBorder`, `WaterBg`, `Starfield`.
  - Responsibilities:
    - Layout and resize:
      - Uses `CONFIG.DESIGN_WIDTH/HEIGHT`, `CONFIG.MACHINE_SCALE`, `CONFIG.SLOT_OFFSET_X` to center and scale the machine.
    - Reels:
      - Builds `Reel` instances (one per column) with proper masking and spacing.
      - Starts/stops spins via `startSpin` and per‑reel GSAP tweens.
    - Spin lifecycle:
      - On spin start:
        - Validates balance / free‑spin state.
        - Plays spin SFX and button animation.
        - Resets symbol tweens, tints, and win text.
      - On spin end (`reelsComplete`):
        - Counts scatters using `WinManager`.
        - Selects the appropriate `WinEvaluator` (paylines vs ways).
        - Uses the **domain spin engine** to compute cascades when enabled.
        - Plays highlight, per‑symbol win overlays, and cascading animations.
        - Updates balance, per‑spin win, and session totals.
        - Triggers free‑spin entry/exit VFX and theme swaps if needed.

- **`Reel.ts`**
  - Manages a single reel:
    - Holds `Sprite` instances for visible symbols.
    - Randomizes symbol textures (optionally excluding scatters during free spins).
    - Maps logical rows to actual sprites (`getSymbolAtRow`, `setSymbolIndexAtRow`).
    - Applies blur and brightness (for highlights).
    - Implements the continuous scroll behavior driven by `position` and `updateSymbols`.

- **`UIManager.ts`**
  - Owns HUD and controls:
    - Spin button, auto‑spin button, bet plus/minus, text fields for balance, bet, total win.
    - `updateTextValues` and `updateBetTextDisplay` keep values in sync with `SlotMachine`.
  - Exposes callbacks to `SlotMachine`:
    - `onSpin`, `onAutoSpin`, `onBetChange`, `onEnableBetEditing`.

- **`VFXManager.ts`**
  - Handles vortex/black‑hole transitions and rumble effects:
    - Uses `getSlotCenter` to compute positions that respect layout and scaling.
  - Provides:
    - `playBlackHoleTransition(entering, onSwapTheme, onComplete)`.
    - `swapTheme(toFreeSpins, reels)` to toggle free‑spin visuals for symbols.

- **`LeftTopUI.ts` / `TitleUI.ts`**
  - The **hat** and **title** UI elements.
  - Respect theme state via `setTheme(isFreeSpins: boolean)`:
    - Switch tints based on `CONFIG.UI_COLORS`.
    - `TitleUI` can swap between static sprite and animated spritesheet.

---

## Domain layer (game math)

Domain code lives under `src/domain/**` and is **Pixi‑free** and **I/O‑free**.

### Wins and paytable (`src/domain/wins/**`)

- **`types.ts`**
  - Core types:
    - `Grid`: `SymbolIndex[][]` – `grid[reel][row]`.
    - `GridPosition`: `{ reel; row }`.
    - `Win`: `{ payout; matchLength; positions; meta? }`.
    - `WinEvaluationResult`: `{ wins; totalWin; winningPositions }`.
    - `WinMode`: `"PAYLINES" | "WAYS_243"`.
  - Abstractions:
    - `Paytable`:
      - `getSymbolMultiplier(symbolIndex, matchLength)` → multiplier for 3/4/5 of a kind.
      - `getJackpotMultiplier()` → multiplier for jackpot outcomes.
    - `WinEvaluator`:
      - `evaluate(grid, betAmount)` → `WinEvaluationResult`.

- **`symbols.ts`**
  - Declares special symbol indices:
    - `SYMBOL.WILD`, `SYMBOL.SCATTER`.
  - Helpers:
    - `isScatter(index)`, `isWild(index)`.

- **`ConfigPaytable.ts`**
  - Concrete `Paytable` implementation backed by `Config.ts`:
    - Uses `SYMBOL_BASE` for base 3‑of‑a‑kind multipliers.
    - Uses `PAYOUTS.MULTI_4 / MULTI_5` for 4/5‑of‑a‑kind.
    - Uses `PAYOUTS.JACKPOT` for jackpot (5 wilds).
  - This provides a **single source of truth** for payouts.

- **`PaylineWinEvaluator.ts`**
  - Implements `WinEvaluator` for classic paylines:
    - Uses `PAYLINES` from `Config.ts` to know line shapes.
    - Injected with a `Paytable`:
      - Reads multipliers via `paytable.getSymbolMultiplier`.
      - Reads jackpot multiplier via `paytable.getJackpotMultiplier`.
    - Handles:
      - Wild substitution.
      - Scatter exclusion.
      - Special jackpot rule: 5 wilds on a line.

- **`Ways243WinEvaluator.ts`**
  - Implements `WinEvaluator` for 243‑ways:
    - For each paying symbol (A,K,Q,J,S1–S4), counts matches per reel left‑to‑right.
    - Ways count = product of matches per reel.
    - Uses the same `Paytable` abstraction to compute payouts.

- **`CascadeEngine.ts`**
  - Pure cascade processor:
    - Given an initial `Grid`, a `WinEvaluator`, and a `NextSymbolIndex` function:
      - Evaluates wins.
      - Removes winning positions.
      - Drops down remaining symbols and fills in new ones.
      - Repeats until no more wins or max step count is reached.
  - Produces:
    - `CascadeResult` with `steps[]`, `totalWin`, and `finalGrid`.
    - Each `CascadeStep` includes:
      - `evaluation` (`WinEvaluationResult`).
      - `gridAfterDrop`.
      - `stepIndex`, `multiplier`, `stepWinBase`, `stepWinApplied`.

### Spin engine (`src/domain/spin/**`)

- **`SpinEngine.ts`**
  - Defines:
    - `SpinRequest`: `{ grid, betAmount, mode }`.
    - `SpinResult`: `{ initialGrid, finalGrid, cascades, totalWin }`.
    - `SpinEngine` interface: `spin(request) → Promise<SpinResult>`.

- **`LocalSpinEngine.ts`**
  - Implements `SpinEngine` for **local math**:
    - Injected with:
      - `paylineEvaluator: WinEvaluator`.
      - `waysEvaluator: WinEvaluator`.
      - `nextSymbolIndex(reelIndex)` for symbol refills.
    - On `spin`:
      - Selects evaluator based on `mode`.
      - Uses `CascadeEngine` to produce cascade steps.
      - Returns a `SpinResult` with cascades and final grid.

`SlotMachine` uses this engine when `CONFIG.ENABLE_CASCADING` is true, keeping the cascade math in the domain and the animations in the presentation layer.

---

## Configuration and Assets (`src/Config.ts`)

- **Layout**
  - `DESIGN_WIDTH`, `DESIGN_HEIGHT` – virtual resolution.
  - `CARD_WIDTH`, `CARD_HEIGHT`, `SYMBOL_SIZE`, `SYMBOL_SPACING`, `CARD_SPACING`, `SYMBOL_MARGIN`.
  - `SLOT_OFFSET_X`, `REEL_OFFSET_X`, `REEL_OFFSET_Y` – machine positioning.
  - Positions and scales for UI elements (buttons, texts, hat, title, BG panels).

- **Modes**
  - `WIN_MODE`: `"PAYLINES"` or `"WAYS_243"`.
  - `ENABLE_CASCADING`: enables domain cascade logic and related animations.
  - `USE_BACKEND`, `API_BASE_URL`: enable backend mode and specify backend base URL.

- **Payouts and Symbols**
  - `PAYOUTS`:
    - Base bet and balance (`BET_AMOUNT`, `CURRENT_BALANCE`).
    - Scatter rules (`SCATTER_SPINS`, `SCATTER_REQ`, `SCATTER_EXTRA`).
    - Multipliers: `MULTI_4`, `MULTI_5`, `JACKPOT`.
    - Auto‑spin configuration.
  - `SYMBOL_BASE`:
    - Per‑symbol base multipliers (A,K,Q,J as low; S1–S4 as high).

- **Assets**
  - `ASSETS.TEXTURES`: symbol textures (`a.png`, `k.png`, …, `wild.png`, `scatter.png`).
  - `ASSETS.UI`: border, buttons, HUD panels, title, hat, etc.
  - `ASSETS.GIF` / `ASSETS.VIDEO`: supporting media.

---

## Backend Layer (`slot-free.js`, `src/api/slotApi.ts`)

- See **`SLOT_BACKEND.md`** for a detailed backend integration guide.
- Summary:
  - `slot-free.js`:
    - Express server with endpoints `/load`, `/play`, `/play-free-game`, `/buy-free-game`, `/jackpot`.
    - Uses seeded `playData` / `freeData` / `loadData` arrays as canned results.
  - `src/api/slotApi.ts`:
    - Wraps HTTP calls and types (`BackendPlayData`, `BackendSlot`, `BackendCascadeStep`).
    - Provides symbol name ↔ index mapping utilities.
    - Converts backend reels to `Grid` via `backendReelToGrid`.

---

## End-to-End Spin Flow (Local Mode)

1. Player presses **Spin**.
2. `SlotMachine.startSpin`:
   - Validates balance / bonus.
   - Starts reel tweens and SFX.
3. When the last reel stops:
   - `reelsComplete` is called.
   - `getVisibleGridIndices` builds the current `Grid`.
   - Chooses evaluator based on `CONFIG.WIN_MODE`.
4. If `CONFIG.ENABLE_CASCADING`:
   - Creates a `LocalSpinEngine` and calls `spin({ grid, betAmount, mode })`.
   - Receives a `SpinResult` with cascades and final grid.
   - Passes `SpinResult.cascades` to `playCascadeSequence` to drive animations.
   - Updates `balance`, `lastSpinWin`, and UI using `SpinResult.totalWin`.
5. Handles free‑spin entry/exit:
   - Uses scatter count and `VFXManager` transitions (vortex in/out, theme swap).
6. If auto‑spin is enabled, schedules the next spin using `PAYOUTS.AUTO_SPIN_DELAY`.

In **backend mode**, the core rendering and animation steps are the same, but the grid, wins, and cascades come from the backend rather than local math.

---

## Related Documentation

- **`SLOT_MACHINE.md`** – Detailed breakdown of the slot machine, reels, rules, and UI.
- **`SLOT_BACKEND.md`** – Backend API contract and integration details.
- **`IMPROVEMENTS`** – Roadmap and technical/UX improvement ideas.

This `SYSTEM_OVERVIEW.md` ties those pieces together to show how the front end, domain layer, backend, and config work as a cohesive, enterprise‑ready slot game architecture.

