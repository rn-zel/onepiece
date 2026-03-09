# ⚙️ Slot Machine Mechanic Documentation

> This document provides an architectural deep dive into the **Gameplay Mechanics**, **Visual Timelines (GSAP)**, and the **Cascade Engine** of the BountyRUSH Slot.
> 
> *For structural layout and Dependency Inversion guidelines, refer to `SYSTEM_OVERVIEW.md`.*

---

## 🏗️ The Single Responsibility Principle (SRP) in Reels

The slot machine simulates tactile physics using PixiJS and deterministic GSAP tweens. This behavior is separated across `SpinOrchestrator.ts` (Application Layer) and `Reel.ts` (Domain Entity). This guarantees mathematical outcomes are perfectly disjoint from the presentation.

### 1. The 5x3 Masked Matrix
Each `Reel` instance logically hosts 5 vertical sprite nodes, although only 3 are rendered beneath the visual mask. As the physical reel scrolls along the Y-axis, a symbol dropping below the mask teleport-resets to the top of the column and receives a randomly assigned payload texture. This creates a performant illusion of infinite downward velocity.

### 2. Velocity-Driven Motion Blur
While spinning, a dynamic PixiJS `BlurFilter` is applied to the reel container. 
*   **Encapsulation:** The `strengthY` of the blur is calculated based strictly on current pixel velocity, handled entirely within the presentation boundary.
*   **Resolution:** Once `SlotMachine` receives a resolved matrix from the Domain backend, `SpinOrchestrator` computes the exact distance required to align the `finalGrid` target coordinates. The motion blur fades linearly near the terminal coordinate, snapping into a heavy, physics-based `back.out(1.5)` rubber-band ease.

### 3. Asymmetric Abort Flags (Quick-Spin)
If a player taps the spin button during an active rotation, the `SlotMachine` instantly flags `isQuickSpin = true` and fires `timeline.progress(1)`. This O(1) operation skips all prolonged easing curves, immediately materializing the resolved backend payload onto the grid.

---

## 💥 The Open/Closed Cascade Engine

The Cascade engine dynamically handles nested win matrices (Avalanche drops) returned by the server. It is driven by the `CascadeOrchestrator.ts` and adheres strictly to the Open/Closed Principle—the orchestrator only commands abstract steps, never mutating the underlying math.

1. **State Isolation:** The server payload dictates the precise grid of symbols to break and the new symbols to drop. The frontend *does not* calculate gravity collisions.
2. **Visual Highlight:** Non-winning symbols are tinted (`0x555555`). Winning positions are restored to full brightness.
3. **Event Emitting:** `SymbolAnimator.ts` instantiates a dynamically scaled `AnimatedSprite` loop directly over the mathematically verified coordinates.
4. **The Shatter (GSAP):** Base symbols are collapsed via `.to({ scale: 0, alpha: 0 })`, concurrently triggering the global `ParticleEmitter` to blast a dust cache at the exact grid coordinates.
5. **Gravitational Slide:** Surviving Sprites physically above the shattered coordinates are commanded to drop via deterministic timeline tweens.
6. **Mask Replenishment:** Negative-Y coordinates above the visual mask are populated using the `CascadeStep.rng` array from the Server. 
7. **Delegated UI:** The `Sequence Win` string is pumped via Dependency Injection directly into the `UIManager`, ticking the Balance and Total Win progressively in real-time.

---

## 🔒 Feature Contracts (Backend Enforced logic)

**All probabilities, modes, and feature mechanics are calculated in a regulated, secure backend server.** The frontend Presentation Layer expects and visualizes these strict state transitions.

### 1. Matrix Evaluations
- **243 Ways-To-Win:** Evaluated left-to-right.
- **Paylines:** Configurable per backend RNG ruleset. The frontend `SpinOrchestrator` merely reacts to the `winningPositions` array provided.
- **Symbol Tiers:** Evaluates `Low` (A, K) against `High` (S1-S4).
- **Substitutions:** `Wild` symbols bridge the combinations for every sprite except the Scatter. 

### 2. The Free Spins State Machine
- **State Transition:** 3 or more Scatters (`sc`) landing independently of paylines triggers the Free Spins mode.
- **Visual Swap:** The `SlotMachine` Composition Root commands the `VFXManager` to draw a Black Hole transition. When the screen clears, all environmental `Starfield` and `WaterBg` modules tint crimson. The UI purges standard buttons via `UIManager`.
- **Accumulator Context:** The mathematical bet deduction ceases. The `SlotMachine` begins tracking `sessionWins` accumulatively. The `UIManager.totalWinText` is hard-bound to this running total, explicitly bypassing the standard reset tick. (Note: Bet adjustment via `BetModal` is disabled during active bonus spins).
- **Destruction:** Once the `bonusSpins` count hits `0`, a final `TOTAL WIN` execution reveals the aggregate mathematical sum. The state machine unwinds to Base Game aesthetics.

---

## ⚙️ Configuration File Parameters (`Config.ts`)

The `Config.ts` file acts as the ultimate authority for tweaking the **visceral feeling** and **timing** of the Presentation boundary. 

| Variable | Architectural Impact | Description |
| :--- | :--- | :--- |
| `REEL_SPIN_DURATION` | Sequence Control | Base seconds for the physical spin graphic before backend yield. *(E.g., 2.5s)* |
| `SYMBOL_DROP_SPEED` | Easing Parameter | Seconds consumed by gravity during a cascade replenishment timeline. |
| `NORMAL_WIN_DELAY` | Thread Hold | Time to pause the main thread on a win before yielding the state machine back to `Idle`. |
| `PANEL_POPUP_SPEED` | Easing Parameter | Speed at which massive `WinPresenter` SVG overlays elastic-bounce into frame. |
| `API_BASE_URL` | Infrastructure Coupling | Pointer to the active RNG Microservice. *(Default: `http://localhost:3000`)* |
| `UI_COLORS` | CSS/Tint Variables | Hardcoded hexadecimal palettes dictating State Machine shifts (e.g., Free Spins red). |
| `BET_VALUES` | Math Config | Array of allowed bet amounts selectable via the `BetModal` slider. |
