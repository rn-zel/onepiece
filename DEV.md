##  Documentation

This document explains how to work with the codebase as a developer: how to navigate the structure, extend features, and respect the DDD/SOLID boundaries that have been set up.

---

## Project Structure (High Level)

- **Root**
  - `SLOT_MACHINE.md`: Game rules and core slot design.
  - `SLOT_BACKEND.md`: Backend integration design and API contract.
  - `SYSTEM_OVERVIEW.md`: System architecture and data flow.
  - `IMPROVEMENTS`: Roadmap and ideas for future enhancements.
  - `slot-free.js`: Sample Express backend with canned test data.

- **`src/`**
  - **Application / UI**
    - `main.ts`: Boots Pixi and creates `SlotMachine`.
    - `SlotMachine.ts`: Main game controller and orchestrator.
    - `UIManager.ts`: HUD and controls.
    - `VFXManager.ts`: Transitions and special effects.
    - `Reel.ts`: Logical reel representation.
    - `services/SymbolAnimator.ts`: Symbol animation service.
    - `ui/lefttop.ts`, `ui/title.ts`: Hat and title UI components.
  - **Domain**
    - `domain/wins/**`: Win math, paytables, cascades.
    - `domain/spin/**`: Spin engine interface and local implementation.
  - **Infrastructure**
    - `api/slotApi.ts`: HTTP client for `slot-free.js`.
  - **Configuration**
    - `Config.ts`: Layout, payouts, assets, mode toggles.

---

## DDD and SOLID Boundaries

### Domain layer

- Pure TypeScript with **no Pixi or browser dependencies**.
- Key domain abstractions:
  - `Grid`, `Win`, `WinEvaluationResult`, `GridPosition`.
  - `Paytable` – symbol payout rules.
  - `WinEvaluator` – how wins are detected and aggregated (paylines vs 243 ways).
  - `CascadeEngine` – cascade loop (evaluate → remove → drop/fill → repeat).
  - `SpinEngine` / `SpinResult` – high-level “one spin” abstraction.
- You can unit test these types in isolation by passing simple arrays and fake paytables.

### Application / presentation layer

- `SlotMachine` and related Pixi/GSAP code:
  - Responsible only for:
    - **Input**: button presses, auto‑spin.
    - **Output**: animations, text fields, sounds.
  - Talks to:
    - Domain via `WinEvaluator` and `LocalSpinEngine`.
    - Backend via `slotApi` (in backend mode).

### Configuration / infrastructure

- `Config.ts`:
  - `PAYOUTS`, `SYMBOL_BASE`, `WIN_MODE`, `ENABLE_CASCADING`, `USE_BACKEND`, `API_BASE_URL`.
  - Layout constants and UI positions.
- `slotApi.ts`:
  - Knows HTTP details and backend JSON shapes.
- `slot-free.js`:
  - An **example** backend; real production backends can implement the same contract.

---

## Common Tasks

### Change payouts or symbol values

1. Open `Config.ts`.
2. Adjust:
   - `SYMBOL_BASE`: per‑symbol base multiplier for 3‑of‑a‑kind.
   - `PAYOUTS.MULTI_4` / `PAYOUTS.MULTI_5`: multipliers for 4 and 5 of a kind.
   - `PAYOUTS.JACKPOT`: jackpot multiplier for 5 wilds on a payline.
3. Because `ConfigPaytable` reads from these values and both `PaylineWinEvaluator` and `Ways243WinEvaluator` use the paytable, the updated payouts automatically apply to **both** modes.

### Add a new symbol

1. Add the texture file to your assets and update:
   - `ASSETS.TEXTURES` in `Config.ts`.
2. Decide where the new symbol fits:
   - Low (like A,K,Q,J) or high (like S1–S4).
3. Update:
   - `SYMBOL_BASE` to include a base value for the new index.
   - Any UI or art that depends on the symbol count (if necessary).
4. Adjust win evaluators if the symbol should be treated specially (e.g. a new wild or scatter type).

### Switch between paylines and 243 ways

1. Open `Config.ts`.
2. Set:
   - `WIN_MODE: "PAYLINES"` or `"WAYS_243"`.
3. `SlotMachine` will:
   - Use `this.paylineEvaluator` or `this.waysEvaluator` accordingly.
   - The cascade engine and `LocalSpinEngine` adjust automatically based on `mode`.

### Enable or disable cascading

1. Open `Config.ts`.
2. Set:
   - `ENABLE_CASCADING: true` or `false`.
3. Behavior:
   - `false`: `reelsComplete` uses a **single** `WinEvaluator.evaluate` call and updates wins with no domain cascades.
   - `true`: `reelsComplete` calls `LocalSpinEngine.spin`, which uses `CascadeEngine` to compute cascades and total win.

### Use backend vs local math

1. Open `Config.ts`.
2. Set:
   - `USE_BACKEND: false` – all math is local.
   - `USE_BACKEND: true` – game requests outcomes from the backend.
3. Ensure `API_BASE_URL` points to the running backend (e.g. `http://localhost:3000`).
4. For more details, refer to `SLOT_BACKEND.md`.

---

## Extending the System

### Add a new win mode

1. Create a new evaluator implementing `WinEvaluator` in `src/domain/wins`:
   - Example: `ClusterWinEvaluator` for cluster pays.
2. Inject your new evaluator into `SlotMachine` alongside the existing ones.
3. Extend:
   - `WinMode` union in `domain/wins/types.ts` to include your mode.
   - `SpinRequest.mode` to handle the new value.
4. Update `Config.ts`:
   - Add your new `WIN_MODE` option.
5. Switch on the new mode where evaluators are selected (e.g. in `LocalSpinEngine` and `reelsComplete`).

### Adjust animation timing

All relevant timings are in `SlotMachine.ts` and VFX modules:

- Symbol bounce, highlight, and break durations.
- Cascade step delays and win‑text pop delays.
- Auto‑spin delay (`PAYOUTS.AUTO_SPIN_DELAY`).

Pattern:

- Look for `gsap.to`, `gsap.delayedCall`, and `duration` arguments.
- For more consistent tuning, consider extracting critical durations into a small config object (e.g. `ANIMATION_CONFIG`) in `Config.ts` and referencing them from the animation code.

### Integrate a production backend

1. Implement a backend that matches the **API contract** described in `SLOT_BACKEND.md`:
   - Endpoints: `/load`, `/play`, `/play-free-game`, `/buy-free-game`, `/jackpot`.
   - Response JSON shape compatible with `BackendPlayData` and friends in `slotApi.ts`.
2. Adjust:
   - `API_BASE_URL` to point at your deployed backend.
3. Optionally:
   - Replace `slot-free.js` with your own service in CI/dev environments.

---

## Coding Guidelines

- Keep **domain logic** (rules, payouts, grid transformations) in `src/domain/**`.
  - Avoid importing Pixi or browser APIs there.
- Keep **infrastructure concerns** (HTTP, Express, file I/O) in dedicated modules:
  - `slotApi.ts`, `slot-free.js`, or future adapters.
- In presentation layer:
  - Use domain types when possible (`Grid`, `Win`, `SpinResult`) instead of raw arrays or JSON from the backend.
  - Let domain decide **what** happened; let UI decide **how it looks**.

By adhering to these patterns, you preserve a clean, testable, and enterprise‑friendly architecture while still being able to iterate quickly on visuals and UX.

