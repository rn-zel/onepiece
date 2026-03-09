# System Overview

This codebase implements a 5×3 video slot using **PixiJS + TypeScript** on the client and an optional **Node/Express** backend (`slot-free.js`) to drive game math. The system relies on a strictly typed **Domain-Driven Design (DDD)** architecture to keep Pixi/UI code separate from game state logic and backend I/O.

---

## Complete Project Directory Structure

```text
C:\Users\Trainee\Desktop\BountyRUSH\slot\
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- slot-free.js                 # Backend Node Simulator Server
|
\---src
    |-- main.ts                  # Application Entry Point & Preloader
    |-- SlotMachine.ts           # Root Dependency Injection / Composition Root
    |
    +---application              # Application Layer (Orchestration rules)
    |   \---orchestrators
    |           CascadeOrchestrator.ts   # Sequence logic for symbol breaking/dropping
    |           SpinOrchestrator.ts      # Core mechanical layout for spinning/blurring
    |
    +---domain                   # Core Enterprise Logic (No Pixi.js direct logic)
    |   +---constants
    |   |       Config.ts        # Hardcoded Rules & Mathematical Parameters
    |   +---entities
    |   |       Reel.ts          # Core Reel Entity mapping math logic to visual columns
    |   \---models
    |           GameTypes.ts     # Global system Types & Interfaces
    |
    +---infrastructure           # External System Drivers (I/O, Network, Browser Audio)
    |   +---api
    |   |       slotApi.ts       # HTTP Client wrapper interacting with slot-free.js
    |   \---audio
    |           SoundManager.ts  # Singleton interfacing with Howler/HTML5 audio context
    |
    \---presentation             # Presentation Layer (Strictly Visual Rendering)
        +---animation
        |       LightningBorder.ts
        |       Starfield.ts
        |       SymbolAnimation.ts
        |       SymbolAnimator.ts
        |       WaterBg.ts
        |
        +---ui
        |       BuyFreeSpinsModal.ts
        |       lefttop.ts
        |       model.ts
        |       title.ts
        |       top.ts
        |       UIManager.ts
        |       WinPresenter.ts
        |
        \---vfx                  # Particle and Shader Post-Processing Effects
                ParticleEmitter.ts
                VFXManager.ts
```

---

## Layer Responsibilities and Components

### 1. Presentation Layer (`src/presentation/**`)

Everything related to PixiJS rendering, UI buttons, HTML DOM alignment, and visual timelines.

- **`animation/`**: Stateful sprite managers. E.g., `SymbolAnimator.ts` implements the `SymbolAnimation` interface and controls the GSAP timeline that overlays animated winning symbols. `Starfield.ts` and `WaterBg.ts` control environment graphics.
- **`ui/`**: Static menus and controls. `UIManager.ts` delegates to smaller modular files (`BuyFreeSpinsModal.ts`, `WinPresenter.ts`, `lefttop.ts`) to manage HUD overlay updates, listening to the core machine events.
- **`vfx/`**: Ephemeral physics visuals. `ParticleEmitter.ts` handles Pixi.js emitter nodes. `VFXManager.ts` acts as a repository for global visual state overrides like transitions and black holes.

### 2. Application Layer (`src/application/**`)

Orchestrates sequences between multiple layers. The orchestrators control the *order of operations* when interacting with game entities.

- **`SpinOrchestrator.ts`**: Coordinates turning the user's Spin command into physical Reel tweens, injecting motion blur, and detecting when all wheels settle using Promises.
- **`CascadeOrchestrator.ts`**: Receives winning layout grids, tells `VFXManager` to draw particles, tells `SymbolAnimator` to play win clips, and then tweens out winning symbols so new mathematical models can fall into place.

### 3. Domain Layer (`src/domain/**`)

The business logic rulebook. It does not import presentation specifics, relying on interfaces and primitive types.

- **`models/GameTypes.ts`**: Global primitive Data Transfer Objects.
- **`constants/Config.ts`**: Layout parameters, API endpoints, multiplier logic, auto-spin configurations.
- **`entities/Reel.ts`**: A dedicated entity linking physical reel grid positions, logical mappings, and tracking their target symbols.

### 4. Infrastructure Layer (`src/infrastructure/**`)

Connecting the slot machine to the outside world.

- **`api/slotApi.ts`**: Maps HTTP parameters mapped out in `slot-free.js` to strictly-typed Promise results. Translates raw JSON back into local Domain models like the physical `Grid`.
- **`audio/SoundManager.ts`**: Maps text triggers (`sfx_spin`) to underlying sound system invocations securely, allowing sound pools to be muted system-wide.

---

## End-to-End Spin Flow (DDD Driven)

1. **User Action (Presentation):** The user clicks the SPIN button injected in `UIManager`.
2. **State Validation (Root):** `SlotMachine.startSpin()` intercepts the call, checking if `domain/Config.ts` allows spinning (e.g., verifying `balance >= betAmount`).
3. **Network Call (Infrastructure):** `SlotMachine` fires an HTTP query via `slotApi.ts` to `slot-free.js` to roll the RNG server payload.
4. **Mechanical Action (Application):** While downloading, `SpinOrchestrator` applies motion blur and infinite rotation to the `Reel` entities.
5. **Data Merge (Application):** `slotApi.ts` resolves successfully with a target matrix. `SlotMachine` commands `SpinOrchestrator` to forcefully target the final `Reel` indices.
6. **Win Sequence (Application):** `SpinOrchestrator` yields. If there are wins, `SlotMachine` tasks `CascadeOrchestrator` to fade/destroy symbols while delegating sound commands to `SoundManager` (Infrastructure).

---

## Runtime Modes

The slot can run in two modes, controlled manually by `CONFIG`:

- **Testing Mode** (`slot-free.js`)
  - The local `slot-free.js` express server drives random configurations based on pre-set static data logic loops. Excellent for testing layouts rapidly without internet connection.

- **Real Backend Mode** 
  - Simply remap `API_BASE_URL` in `src/domain/constants/Config.ts` to point toward a production RNG mathematics backend. The frontend will dynamically ingest payouts perfectly as long as the HTTP interfaces defined in `slotApi.ts` are met.
