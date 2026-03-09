# 🏛️ System Architecture Overview

> This document details the **Domain-Driven Design (DDD)** and **SOLID** principles guiding the BountyRUSH Slot Engine. It serves as the definitive reference for the system's bounded contexts and data flow.

This codebase implements a 5x3 WebGL video slot engine using **PixiJS + TypeScript** on the client. To ensure the system remains testable, scalable, and isolated from UI churn, it relies on a strictly typed architectural pattern. The PixiJS presentation layer is decoupled entirely from the game state logic and backend I/O.

---

## 🗂️ Complete Enterprise Directory Structure

The structure reflects the Dependency Rule: *Source code dependencies must point inward, toward higher-level policies (the Domain).*

```text
C:\Users\Trainee\Desktop\BountyRUSH\slot\
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- slot-free.js                 # Local Back-End RNG Simulator
|
\---src
    |-- main.ts                  # Application Entry & Preloader
    |-- SlotMachine.ts           # The Composition Root (Dependency Injection Hub)
    |
    +---application              # [Flow] Orchestration Layer
    |   \---orchestrators
    |           CascadeOrchestrator.ts   # Avalanche sequence driver
    |           SpinOrchestrator.ts      # Core mechanic timeline (spin, blur, stop)
    |
    +---domain                   # [Core] Enterprise Logic (NO PixiJS ALLOWED)
    |   +---constants
    |   |       Config.ts        # Hardcoded constraints & Math configuration
    |   +---entities
    |   |       Reel.ts          # Physical reel column mapping
    |   \---models
    |           GameTypes.ts     # Global system Data Transfer Objects (DTOs)
    |
    +---infrastructure           # [I/O] External System Boundaries
    |   +---api
    |   |       slotApi.ts       # HTTP Client adapter (Anticorruption Layer)
    |   \---audio
    |           SoundManager.ts  # WebAudio/Howler wrapper
    |
    \---presentation             # [UI] PixiJS Rendering & Post-Processing
        +---animation            # Stateful sprite managers
        |       SymbolAnimator.ts
        |       Starfield.ts
        |
        +---ui                   # Static HUD and Input Controls
        |       UIManager.ts
        |       WinPresenter.ts
        |       HelpModal.ts
        |
        \---vfx                  # Shaders & Particles
                ParticleEmitter.ts
                VFXManager.ts
```

---

## 🏗️ Layer Responsibilities

Each layer in the system has a strictly defined, singular responsibility, adhering to the Single Responsibility Principle (SRP).

### 1. Presentation Layer (`src/presentation/**`)
Everything related to PixiJS rendering, user input, HTML DOM alignment, and visual timelines.
- **Rules:** 
  - Cannot evaluate logical wins or mutate player balances.
  - Exposes public methods like `showWinPanel()` or `emitGlow()` that higher layers call.
- **Components:** `UIManager` routes clicks outward to delegates. `VFXManager` manages global visual state overrides (like a Blackhole transition).

### 2. Application Layer (`src/application/**`)
Orchestrates the *order of operations* between multiple layers. The orchestrators receive intent, interact with the Domain, and output commands to the Presentation and Infrastructure layers.
- **Rules:**
  - Cannot contain presentation implementation details (e.g., drawing `Graphics`).
  - Cannot contain pure math or probability calculations.
- **Components:** `SpinOrchestrator` determines *when* a reel stops. `CascadeOrchestrator` tells `VFXManager` *when* to draw particles after a resolved win drops.

### 3. Domain Layer (`src/domain/**`)
The heart of the system. It contains the business logic rulebook and does not import presentation specifics, relying entirely on interfaces and primitive types.
- **Rules:**
  - Absolute zero knowledge of `pixi.js`, `window`, or `document`.
  - Driven by the Open/Closed Principle (OCP)—behaviors can be extended via new interfaces without touching existing logic.
- **Components:** `GameTypes.ts` defines the exact shape of a `GridPosition` or an incoming `CascadeStep`. `Reel.ts` links physical grid positions to their targeting logic.

### 4. Infrastructure Layer (`src/infrastructure/**`)
Connecting the core game to the outside world.
- **Rules:**
  - Isolates external protocols (HTTP, WebAudio) from the core logic. 
- **Components:** `slotApi.ts` acts as an Anticorruption Layer, translating raw JSON payloads from the Node backend into strictly-typed `Domain` models.

---

## 🔄 End-to-End Spin Flow (DDD Driven)

The flow exactly mirrors the Dependency Inversion Principle (DIP). The `SlotMachine` composition root delegates tasks across boundaries via injected interfaces.

1. **User Action [Presentation]:** The user triggers an interaction via the `UIManager.spinButton`.
2. **Evaluation [Root]:** `SlotMachine.startSpin()` acts as the controller, validating `Config` and ensuring the action is legally playable (`balance >= betAmount`).
3. **I/O Request [Infrastructure]:** `SlotMachine` fires an async query via `slotApi.ts` to `slot-free.js` to roll the RNG payload.
4. **Visual Anticipation [Application -> Presentation]:** While waiting, `SpinOrchestrator` continuously pushes motion blur and transforms onto the physical `Reel` entities.
5. **Payload Translation [Infrastructure -> Domain]:** `slotApi.ts` resolves effectively with a target matrix. The JSON is mutated into local Data Transfer Objects (DTOs).
6. **Execution [Application]:** `SlotMachine` commands `SpinOrchestrator` to forcefully target the final `Reel` indices.
7. **Resolution Sequence [Application -> Presentation/Infrastructure]:** `SpinOrchestrator` yields. If the payload indicates wins, `SlotMachine` tasks `CascadeOrchestrator` to coordinate the breakdown and slide effects, simultaneously delegating audio commands to the `SoundManager` (Infrastructure).

---

## ⚙️ Runtime Modes

The system architecture allows the math engine to be entirely decoupled from the client via endpoints.

- **Local Mathematics Simulator Mode** (`slot-free.js`)
  - The local Node.js express server drives random configurations based on pre-set loops. Ideal for offline feature testing and rapid animation iteration.

- **Production API Mode** 
  - Map `API_BASE_URL` in `src/domain/constants/Config.ts` to a live, regulated RNG mathematics backend. The frontend seamlessly ingests payouts as long as the Integration Contract defined in `slotApi.ts` is satiated.
