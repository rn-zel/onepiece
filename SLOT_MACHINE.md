# Slot Machine — Technical Overview and Game Rules

## Overview

This project is a modern PixiJS + TypeScript slot machine featuring **243-Ways to Win** and **Infinite Cascading Reels**. The game follows a **Backend-as-Source-of-Truth** model, where all math, RNG, and win evaluations are handled by a Node.js API.

The game uses:

- **Rendering**: PixiJS 8.x (`Application`, `Container`, `Sprite`, `AnimatedSprite`)
- **Animation**: GSAP (GreenSock) for reel spins and UI popups.
- **Backend**: Express.js (`slot-dynamic.js` or `slot-free.js`)
- **API Communication**: `src/api/slotApi.ts` using Fetch/JSON.

## Modern Architecture (243-Ways & Cascades)

Unlike traditional slots with fixed paylines, this version uses "Ways." Any matching symbols on adjacent reels starting from the leftmost reel (Reel 0) constitute a win.

### The Cascade Engine

When a win occurs:

1.  **Detection**: The backend identifies winning symbols.
2.  **Symbol Animation**: Winning symbols trigger a high-energy "pop" animation via `SymbolAnimator`.
3.  **Destruction & Drop**: Winning symbols are removed. Above symbols fall down (Gravity Drop), and new symbols replenish the grid from the top.
4.  **Multipliers**: Each successive cascade in a single spin increases the **Win Multiplier** (x2, x3, x4...).

## File-by-file responsibilities

### `src/SlotMachine.ts` — Game Orchestrator

The central controller that drives the visual state based on backend data.

- **Spin Flow**: Sends requests to the API, triggers reel animations, and processes the `cascaded` data array sequentially.
- **UI Management**: Updates balance and win displays via `UIManager`.
- **Win Presentation**: Orchestrates the timing between symbol explosions and text popups using timings from `Config.ts`.

### `src/Config.ts` — Animation & Global Config

Now serves as the primary "Control Panel" for the game's feel:

- **Animation Timings**: `REEL_SPIN_DURATION`, `CASCADE_WIN_DELAY`, `SYMBOL_DROP_SPEED`, etc.
- **Visuals**: `SYMBOL_ANIM_SPEED`, `WIN_TEXT_POPUP_SPEED`.
- **API**: `API_BASE_URL` pointing to the backend.

### `src/api/slotApi.ts` — Backend Connector

Stateless service that handles all POST requests to the backend (`/play`, `/play-free-game`, `/buy-free-game`).

### `src/services/SymbolAnimator.ts` — Win FX

- Loads a master spritesheet from `symbols.png`.
- Creates `AnimatedSprite` instances on top of winning tiles.
- **Pop Scaling**: Uses an increased `animScale` (currently 1.1x) to make winning symbols visually dominant.

### `slot-dynamic.js` & `slot-free.js` — The Math Engine

- **RNG**: Generates the initial 5x3 grid.
- **Evaluator**: Strict Left-To-Right 243-way logic.
- **Cascade Simulator**: Recursively simulates the gravity drop and refills the grid to provide a full "Chain" of wins in a single response.
- **Free Spins**: Manages the `freeSpinCounter` and trigger logic (3+ Scatters = 10 Free Spins).

## Game Rules (Current Implementation)

### 1. Symbols & Payouts

- **Low-Tier**: A, K, Q, J, S1
- **High-Tier**: S2, S3, S4
- **Wild**: Substitutes for any symbol except Scatters.
- **Scatter (sc)**: triggers Free Spins.

### 2. 243-Ways Evaluation

- Wins must start on the leftmost reel.
- Symbols only need to be on adjacent reels (row position does not matter).
- **Ways Calculation**: `Count(Reel0) * Count(Reel1) * Count(Reel2)...`

### 3. Cascading Multipliers

- **Base Spin**: x1 Multiplier (Hidden).
- **Cascade 1**: x2 Multiplier.
- **Cascade 2**: x3 Multiplier.
- **Successive**: Increments by +1 per drop.

### 4. Scatters & Free Spins

- **Trigger**: 3 or more Scatters (`sc`) landing anywhere on the initial spin.
- **Award**: 10 Free Spins.
- **Mechanics**: During Free Spins, the "Buy" is disabled, and spins are deducted from the bonus counter instead of the balance.

## Configuration Reference (`Config.ts`)

| Variable             | Description                                       |
| :------------------- | :------------------------------------------------ |
| `REEL_SPIN_DURATION` | How long reels spin (seconds).                    |
| `SYMBOL_DROP_SPEED`  | How fast symbols fall during cascades.            |
| `NORMAL_WIN_DELAY`   | Delay before the play button unlocks after a win. |
| `SYMBOL_ANIM_SPEED`  | playback speed of the symbol frames.              |
| `PANEL_POPUP_SPEED`  | Global duration for UI panel transitions.         |
