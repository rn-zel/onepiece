# Slot machine mechanics

This document describes **gameplay mechanics**, **reel and cascade behavior**, and **configuration parameters** for the BountyRUSH slot. For layer boundaries and data flow, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Reels and spin (SRP)

Reel behavior is split between:

- **Domain:** `Reel` – column state and symbol mapping (no rendering).
- **Application:** `SpinOrchestrator` – when to spin, when to stop, and how to drive the timeline.
- **Presentation:** PixiJS sprites, mask, and blur – how it looks.

### 5×3 masked matrix

- Each reel is a column of symbol sprites; only **3** symbols are visible inside the mask.
- As the reel moves on the Y-axis, symbols that leave the mask are recycled to the top and get new textures from the resolved outcome.
- The backend (or RNG layer) provides the final matrix; the frontend animates reels to that result.

### Motion blur and stop

- While spinning, a **blur filter** is applied; strength can follow velocity (handled in the presentation boundary).
- When the outcome is known, `SpinOrchestrator` drives reels to the target positions. Blur can fade near the end; stop can use a physics-style ease (e.g. `back.out`).

### Quick-spin (abort)

- If the player triggers quick-spin during a spin, the timeline can be forced to completion (e.g. `timeline.progress(1)`) so the resolved outcome is shown immediately without waiting for the full animation.

---

## Cascade (Avalanche) engine (OCP)

Cascade behavior is driven by **server payload**: the frontend does not compute which symbols break or how new symbols fall. It only runs the sequence it is given.

1. **Payload:** Backend sends cascade steps (e.g. positions to remove, new symbols to fill).
2. **Highlight:** Winning positions can be highlighted; others can be dimmed (e.g. tint).
3. **Break:** Symbols at break positions are animated out (e.g. scale to 0, alpha to 0); particles can be triggered at those coordinates.
4. **Drop:** Remaining symbols above the break move down (e.g. GSAP tweens).
5. **Fill:** New symbols are placed from the payload (e.g. from `CascadeStep` data) so the grid is ready for the next evaluation.
6. **UI:** Balance and total win are updated from the payload; the application layer delegates to the presentation layer to show amounts.

The orchestrator **commands** these steps; it does not implement gravity or payout math. New cascade behaviors can be added by extending payload handling and presentation behavior, not by changing core orchestrator logic.

---

## Backend-enforced rules

All **probabilities**, **payouts**, and **feature logic** are determined by the backend (or a dedicated domain service that consumes backend data). The frontend only visualizes and inputs.

### Matrix and wins

- **243 ways:** Wins evaluated left-to-right; backend returns winning positions and amounts.
- **Symbol tiers:** e.g. low (A, K, Q, J) vs high (S1–S4); rules and payouts are server-side.
- **Wild:** Substitutes for other symbols (except Scatter) per backend rules.
- **Scatter:** Triggers (e.g. free spins) and payouts defined by backend.

### Free spins (bonus) state machine

- **Trigger:** e.g. 3+ Scatters (backend decides).
- **Transition:** Composition root and VFX can run a transition (e.g. black hole); Starfield/WaterBg and UI can switch to bonus visuals (e.g. tint, different buttons).
- **During bonus:** Bet may be fixed; total win can accumulate; balance and total-win HUD show session totals. Bet adjustment may be disabled.
- **End:** When bonus spins are exhausted, a final total win can be shown and the game returns to base state.

---

## Config parameters (reference)

Layout and timing are centralized in `src/domain/constants/Config.ts`. Orientation-specific values live in `LANDSCAPE` and `PORTRAIT`; the rest are shared or exposed via flat `CONFIG` keys.

| Parameter / area | Description |
|------------------|-------------|
| `REEL_SPIN_DURATION` | Base spin duration before reels reach the result. |
| `REEL_STAGGER_DELAY` | Delay between reels (e.g. left-to-right). |
| `SYMBOL_DROP_SPEED` | Duration of drop animation during cascade. |
| `NORMAL_WIN_DELAY` | Pause after a win before returning to idle. |
| `PANEL_POPUP_SPEED` | Speed of win/panel pop-in animation. |
| `API_BASE_URL` | Backend base URL (e.g. `http://localhost:3000`). |
| `BET_VALUES` | Allowed bet amounts (e.g. for BetModal slider). |
| `UI_COLORS` | Tints and theme (e.g. free-spins mode). |
| `LANDSCAPE` / `PORTRAIT` | Full layout and menu config per orientation. |

For the full list and structure, see `Config.ts` and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (configuration strategy).
