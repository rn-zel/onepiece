# Slot Machine — Mechanical & Gameplay Guide

## Context & Purpose
This document provides a deep dive into the **Gameplay Rules**, **Visual Timeline Animations (GSAP)**, and the **Cascade System** of the slot machine exactly as it works in the codebase.

> **Looking for the Architectural Layout or Folder Structure?**
> Please refer to `SYSTEM_OVERVIEW.md` (Domain-Driven Design boundaries) and `README.md` (Tech stack, NPM scripts). This file focuses strictly on *What happens on the reels* rather than *Where the files live*.

---

## Technical Mechanics: How the Reels Operate

The slot machine simulates physical momentum using PixiJS and GSAP. This is handled by **`SpinOrchestrator.ts`** and **`Reel.ts`**. All mathematical results (`win`, `cascaded`, `free_spin`) are strictly dictated by the Node.js backend (`slotApi.ts` calling `http://localhost:3000`). There is no local evaluation math.

### 1. Infinite Scrolling Simulation
Each `Reel` instance hosts exactly 5 vertical sprite nodes, even though only 3 are visible beneath the red graphical mask. As the reel mathematically scrolls downward, the symbol at the bottom that falls out of bounds is teleported back to the top of the column and assigned a randomly generated texture. This allows an illusion of infinite physical scrolling.

### 2. Motion Blur & Physical Easing
While spinning, PixiJS `BlurFilter` is applied dynamically based on the velocity `strengthY`.
- The reels start fast (`power2.inOut`).
- Once the backend resolves a payload, `SpinOrchestrator` calculates the exact distance needed to reach the `finalGrid` target coordinates.
- The `strengthY` blur fades out linearly upon nearing the stopping point, snapping into a heavy, physical `back.out(1.5)` rubber-band bounce.

### 3. Quick-Spin Aborting
If a player taps the spin button again during an active rotation, `SlotMachine.ts` and `SpinOrchestrator` immediately flag `isQuickSpin = true` and `progress(1)`. This forces all tweens to skip their prolonged timelines and instantly slams the resolved payload onto the grid.

---

## The Cascade Engine (Visual Sequence)

When the backend returns a Win with nested `cascaded` steps, `CascadeOrchestrator.ts` visually presents the destruction sequence:

1. **Highlighting**: Non-winning symbols are tinted dark grey (`0x555555`). Winning symbols glow back to full brightness.
2. **Animation Loop**: `SymbolAnimator.ts` instantiates a dynamically scaled PixiJS `AnimatedSprite` (from the `symbols.png` spritesheet) exactly over the winning grid positions and loops the flash frame animation.
3. **Multiplier & Win Chips**: A floating chip with the `stepPayout` (and optionally a glowing Multiplier chip if `multiplier > 1`) bounces out of the central destroyed symbol.
4. **The Shatter**: GSAP tweens the winning base symbols and their overlay animations to quickly shrink and fade to `alpha: 0` while the global `ParticleEmitter` blasts a dust puff.
5. **Gravity Drop**: All sprites physically located above the destroyed coordinates slide vertically downward.
6. **Replenishment**: Over-the-mask coordinates (`newRow`) are populated by the target backend `CascadeStep.rng`. These new symbols drop into the viewable area, readying the board for the next recursion logic.
7. **Live UI Ticking**: During every single step of this process, the `Sequence Win` is progressively pumped directly into the `UIManager` so the player sees their Balance / Total Win actively ticking upwards in real-time.

---

## Game Rules & Triggers (Backend Enforced)

All evaluations are handled securely by the backend via a 243-Ways left-to-right matrix, but the frontend explicitly expects these formats:

### 1. Symbol Tiers
- **Low-Tier Symbols**: `A, K, Q, J` 
- **High-Tier Symbols**: `S1, S2, S3, S4`
- **Wild (wild)**: Substitutes for any symbol evaluation except the Scatter.
- **Scatter (sc)**: Can land randomly to trigger the feature, disregarding paylines.

### 2. The Mega Bonus (Free Spins)
- **Trigger**: 3 or more Scatters (`sc`) landing anywhere during an active base spin. (Can also be forced via `Buy Free Spins`).
- **Award**: Instantly awards **10 Free Spins**.
- **Visual Mechanics**: 
   - A sequence forces all 3 Scatters to dramatically pop and scale larger while pulsing. 
   - A gigantic `MEGA BONUS! 10 SPINS!` banner hits the screen.
   - The UI Theme changes dynamically. The `UIManager` kills all non-essential buttons, and commands `WaterBg.ts`, `Starfield`, and `ModelUI` to switch to a red, high-octane `FREE_SPINS_TINT` palette.
- **Economic Mechanics**: 
   - Cash deductions cease. The `SlotMachine` tracks the `sessionWins` accumulatively. The `UIManager.totalWinText` stays aggressively bound to this running `sessionWins` ticker across every subsequent spin, never resetting.
   - Once `bonusSpins` hits `0`, a final `TOTAL WIN` banner reveals the aggregate sum, the Blackhole VFX plays, and the daytime theme returns.

---

## Configuration Reference (`Config.ts`)
The `Config.ts` file is the master director for tweaking the **feeling/volatility** of the Client side timings. 

*Note: There are no math toggles (like Win Modes) here. Mathematics are permanently 100% backend.*

| Variable | Target Layer | Description |
| :--- | :--- | :--- |
| `REEL_SPIN_DURATION` | Presentation | Base seconds for the mechanical spin graphic before snapping. *(E.g., 2.5s)* |
| `SYMBOL_DROP_SPEED` | Presentation | Speed of gravity during a cascade replenishment drop. *(E.g., 0.3s)* |
| `NORMAL_WIN_DELAY` | Sequence | Time allocated to hold on a single non-cascading win before yielding the spin button back. |
| `SYMBOL_ANIM_SPEED` | Presentation | PixiJS playback internal rate (`0.0 - 1.0`) of the `symbols.png` win spritesheet. |
| `PANEL_POPUP_SPEED` | Presentation | Duration (seconds) it takes big `WinPresenter` overlays to elastic-bounce in. |
| `API_BASE_URL` | Infrastructure | Defaults to `http://localhost:3000`. Set to production URL when deploying. |
| `UI_COLORS` | Presentation | Tints used during normal play vs Free Spins mode. |
