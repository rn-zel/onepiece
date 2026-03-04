# Backend Integration 


two operating modes:

- **Local mode** – the client (Pixi `SlotMachine`) generates symbols, evaluates wins, and runs cascades entirely in the browser.
- **Backend mode** – the client delegates spin logic to a backend API (the sample Express server in `slot-free.js`) and only handles presentation (reels, animations, and UI).

Backend mode is controlled from `Config.ts`:

- **`CONFIG.USE_BACKEND`**  
  - `false`: use local RNG and local win evaluation.  
  - `true`: use the HTTP API defined in `slot-free.js`.
- **`CONFIG.API_BASE_URL`** – Base URL of the slot backend (by default `http://localhost:3000`).

When backend mode is enabled, the client never fabricates game results; it always uses the server’s response as the single source of truth.

---

## Backend API (sample: `slot-free.js`)

The sample backend is an Express app that exposes the following endpoints:

- **`POST /load`**
  - **Purpose**: initial machine load – returns player balance, current free‑spin state, and jackpot prize data.
  - **Response** (`data`):
    - `player.balance`: current player balance.
    - `free_spin.count` (optional): remaining free spins.
    - `jackpot_prizes`: current jackpot meter values.

- **`POST /play`**
  - **Purpose**: perform a **paid spin**.
  - **Request body**:
    - `bet: number` – stake for this spin (the client passes `SlotMachine.betAmount`).
  - **Response** (`data`):
    - `balance`: updated balance after the spin and any wins.
    - `win`: base win for the main spin.
    - `total_win`: total win for this spin including cascades.
    - `slot.reel: string[5][3]` – symbol names for each column/row (A,K,Q,J,S1–S4, `wild`, `sc`).
    - `slot.winnings`: array of win objects (symbol, payout, ways, hasWild, length, direction).
    - `slot.cascaded`: array of cascade steps (see below).
    - `free_spin` (optional): new free‑spin state if spin triggered or retriggered free spins.
    - `jackpot_prizes`: updated jackpots after this spin.

- **`POST /play-free-game`**
  - **Purpose**: perform a **free spin** within a free‑spin session.
  - **Response** shape matches `/play`, but `balance` is only updated when free spins end and total free‑spin win is credited.

- **`POST /buy-free-game`**
  - **Purpose**: perform a “buy free spins” action (e.g. bet × 10).
  - **Behavior** (sample): deducts purchase cost from balance and returns a pre‑canned free‑spin entry result.

- **`POST /jackpot`**
  - **Purpose**: settle a jackpot prize.
  - **Response** (`data`):
    - `win`: jackpot amount.
    - `balance`: updated player balance.

The `slot-free.js` file also contains seeded `playData`, `freeData`, and `loadData` arrays that act as canned responses for testing.

---

## Data Structures and Mapping

### Symbol mapping

The backend uses **string codes** for symbols (e.g. `"a"`, `"k"`, `"s1"`, `"wild"`, `"sc"`), whereas the client uses **integer symbol indices** aligned with `ASSETS.TEXTURES`.

`src/api/slotApi.ts` defines the mapping:

- `symbolNameToIndex(name: string): number` – maps backend symbol name → client symbol index.
- `symbolIndexToName(index: number): string` – reverse mapping, primarily for debugging.
- `backendReelToGrid(reel: string[][]): number[][]` – converts backend reel columns into the numeric grid used by `SlotMachine` and the cascade engine.

### Cascades

Each cascade step from the backend has this shape:

- `winnings: BackendWinning[]`
  - `symbol`: symbol name (e.g. `"s2"`).
  - `payout`: win amount for this grouping before multipliers.
  - `ways`: number of ways (243‑ways).
  - `hasWild`, `direction`, `length`: metadata for analytics or UI.
- `rng: string[5][3]` – the resulting reel configuration after this cascade step.
- `win: number` – total win for this cascade step (already including multiplier).
- `multiplier: number` – cascade multiplier (e.g. 2×, 3×, 4×…).
- `cascades: { column, row, symbol }[]` – coordinates of symbols that are removed (“broken”) in this step.

On the client side, the cascade steps are replayed visually using the same animation pipeline as the local cascade engine:

1. Highlight winning symbols and animate them towards the center.
2. Show **per‑symbol win** and **multiplier** text overlays.
3. “Break” (fade and shrink) winning symbols.
4. Drop remaining symbols down and spawn new ones from the top based on `rng`.

At the end of all cascades, the backend’s `total_win` is displayed as the spin’s total win.

---

## Frontend Integration (Pixi `SlotMachine`)

### Enabling backend mode

1. **Run the backend** (from project root):

   ```bash
   node slot-free.js
   ```

   This starts Express on `http://localhost:3000`.

2. **Configure the client** in `src/Config.ts`:

   ```ts
   USE_BACKEND: true,
   API_BASE_URL: "http://localhost:3000",
   ```

3. Build/run the frontend as usual; the game will now call the backend for load and spins.

### Load phase

In the `SlotMachine` constructor:

- If `CONFIG.USE_BACKEND` is `true`:
  - `SlotApi.setSlotApiBaseUrl(CONFIG.API_BASE_URL)` is called.
  - `loadFromBackend()` executes:
    - Calls `SlotApi.load()`.
    - Sets `balance` from `data.player.balance`.
    - Sets `bonusSpins` from `data.free_spin.count` when available.
    - Syncs these values to the UI via `UIManager.updateTextValues`.

If `USE_BACKEND` is `false`, the game uses the local defaults from `PAYOUTS` (e.g. `CURRENT_BALANCE`, `BET_AMOUNT`).

### Spin flow (backend mode)

When the player presses the spin button:

1. `SlotMachine.startSpin()` checks `CONFIG.USE_BACKEND`.
2. If backend mode is enabled, `startSpin()` **does not** run the local RNG or local evaluators. Instead it calls:

   ```ts
   spinFromBackend(isBonusSpin: boolean)
   ```

3. `spinFromBackend` chooses the appropriate endpoint:
   - For a **paid spin**: `SlotApi.play(this.betAmount)`.
   - For a **free spin**: `SlotApi.playFreeGame()`.

4. On a successful response:
   - `balance` is updated from `data.balance`.
   - `bonusSpins` is updated from `data.free_spin?.count`.
   - The visible reels are updated using:
     - `SlotApi.backendReelToGrid(data.slot.reel)` → `applyVisibleGridIndices(grid)`.
   - Each `Reel`’s `isFreeSpins` flag is updated based on the current free‑spin state.

5. The client then chooses the visual flow:
   - If `data.slot.cascaded` contains winning steps (any `step.win > 0`):
     - Calls `playCascadeSequenceFromBackend(cascaded, data.total_win)`.
     - This method:
       - Replays each cascade step (highlight → per‑symbol win/multiplier → break → drop).
       - Applies `step.rng` as the new grid after each cascade.
       - Displays the final `total_win` when all steps are done.
   - Else if `data.total_win > 0`:
     - Plays standard win animations (symbol tint, central **WIN** text with amount).
   - If `data.free_spin` indicates entry into free spins or exit from free spins:
     - The same **vortex** and **theme swap** flows used by local mode are triggered (via `VFXManager` and `UIManager`).

During backend mode:

- The **client never subtracts the bet locally**; it trusts `data.balance` from the server.
- All per‑spin totals and cascades use `data.total_win` and the backend’s reel snapshots.

---

## Local vs Backend Behavior Summary

- **Local mode (`USE_BACKEND = false`)**
  - Reels spin physically (position tween), symbols are chosen from local RNG.
  - Wins are evaluated in the browser (`PaylineWinEvaluator` / `Ways243WinEvaluator`).
  - Cascades are generated by `CascadeEngine` and animated by `SlotMachine.playCascadeSequence`.

- **Backend mode (`USE_BACKEND = true`)**
  - The backend decides symbol layout, wins, cascades, and balance.
  - The client:
    - Maps backend reels to textures.
    - Replays cascades visually using backend data.
    - Displays balance, free spins, jackpots, and total wins from the server.

This separation keeps **game math and fairness** on the server while the client focuses on **graphics and user experience**, which is the recommended architecture for production slot games.

