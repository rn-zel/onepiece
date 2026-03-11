# Architecture

This document is the **single reference** for the BountyRUSH Slot Engine architecture: layers, dependency rule, main modules, configuration strategy, and data flow. For mechanics and contribution guidelines, see [SLOT_MACHINE.md](../SLOT_MACHINE.md) and [DEV.md](../DEV.md).

---

## 1. Design goals

- **Testability** – Domain and application logic do not depend on PixiJS or the DOM.
- **Maintainability** – Clear boundaries so UI and backend can change without rewriting game rules.
- **Scalability** – New features (e.g. new win types or modals) are added by extending existing layers, not by patching a monolith.

These are achieved by applying **Clean Architecture** and **DDD**: the domain is at the centre; application orchestrates use cases; infrastructure and presentation are pluggable adapters.

---

## 2. Layered architecture

The codebase is split into four layers. **The dependency rule:** source code dependencies point **inward**. The domain does not depend on anything; presentation and infrastructure depend on application/domain.

```
                    ┌─────────────────────────────────────┐
                    │         PRESENTATION                 │
                    │  (PixiJS, UI, modals, VFX, HTML)    │
                    └─────────────────┬───────────────────┘
                                      │ depends on
                    ┌─────────────────▼───────────────────┐
                    │         APPLICATION                 │
                    │  (Orchestrators, SlotMachine root)   │
                    └─────────────────┬───────────────────┘
                                      │ depends on
        ┌─────────────────────────────▼─────────────────────────────┐
        │                      DOMAIN                                │
        │  (Entities, Config, types – no Pixi/DOM/network)           │
        └─────────────────────────────▲─────────────────────────────┘
                                      │ depends on
                    ┌─────────────────┴───────────────────┐
                    │         INFRASTRUCTURE               │
                    │  (API client, SoundManager)          │
                    └─────────────────────────────────────┘
```

### 2.1 Domain layer (`src/domain/`)

**Responsibility:** Business rules, game state shape, and configuration. No rendering, no I/O.

- **entities/** – Stateful domain objects (e.g. `Reel`).
- **constants/** – `Config.ts`: layout, timing, bet values, and orientation-specific blocks (`LANDSCAPE`, `PORTRAIT`).
- **models/** – Shared types and DTOs (e.g. `GameTypes.ts`).
- **services/** – Domain services (e.g. `TelemetryService`).

**Rules:**

- Must not import `pixi.js`, `window`, or `document`.
- Defines interfaces and value objects that other layers implement or use.

### 2.2 Application layer (`src/application/`)

**Responsibility:** Orchestrate use cases and coordinate domain, presentation, and infrastructure.

- **orchestrators/** – `SpinOrchestrator`, `CascadeOrchestrator`: drive spin and cascade flows, call into domain and presentation.
- **SlotMachine.ts** – Composition root: wires dependencies and handles high-level flow (start spin, buy free spins, resize).

**Rules:**

- Does not implement low-level rendering (e.g. drawing Pixi `Graphics`).
- Does not implement pure math or RNG; it consumes results from domain or infrastructure.
- Depends on domain types and injects presentation/infrastructure via constructors or callbacks.

### 2.3 Infrastructure layer (`src/infrastructure/`)

**Responsibility:** Adapt external systems to the application/domain.

- **api/** – `slotApi.ts`: HTTP client; maps backend JSON to domain-shaped data (anticorruption).
- **audio/** – `SoundManager.ts`: Web Audio / @pixi/sound wrapper for SFX and BGM.

**Rules:**

- All external I/O (HTTP, audio) is encapsulated here.
- Exposes results in domain terms (types from `domain/models` or agreed DTOs).

### 2.4 Presentation layer (`src/presentation/`)

**Responsibility:** Everything the user sees and interacts with.

- **ui/** – `UIManager`, `BetModal`, `AutoSpinModal`, `HelpModal`, `StatsModal`, `WinPresenter`, `JackpotPresenter`, layout (top, lefttop, title, model).
- **animation/** – `SymbolAnimator`, `Starfield`, `WaterBg`, `LightningBorder`, etc.
- **vfx/** – `VFXManager`, `ParticleEmitter`.

**Rules:**

- Does not evaluate wins or mutate balance; it displays what the application layer tells it.
- Reads layout and feature flags from `Config` (or equivalent) and exposes methods for the application layer to trigger (e.g. show win, open modal).

**HTML overlay:** The Paytable/menu is implemented as an HTML overlay in `index.html`; it receives config via `window.slotMenuConfig` (set from `Config.LANDSCAPE.MENU` / `Config.PORTRAIT.MENU`) so layout stays driven by the same domain config.

---

## 3. Project structure (reference)

```
src/
├── main.ts                    # Entry: init Pixi, load assets, create SlotMachine
├── SlotMachine.ts             # Composition root & high-level controller
│
├── domain/
│   ├── constants/
│   │   └── Config.ts          # LANDSCAPE, PORTRAIT, CONFIG (flat), ASSETS, helpers
│   ├── entities/
│   │   └── Reel.ts            # Reel column state and symbol mapping
│   ├── models/
│   │   └── GameTypes.ts       # Shared types / DTOs
│   └── services/
│       └── TelemetryService.ts
│
├── application/
│   └── orchestrators/
│       ├── SpinOrchestrator.ts    # Spin timeline, blur, stop, quick-spin
│       └── CascadeOrchestrator.ts # Cascade sequence, drops, VFX/audio triggers
│
├── infrastructure/
│   ├── api/
│   │   └── slotApi.ts         # Backend HTTP adapter
│   └── audio/
│       └── SoundManager.ts    # BGM / SFX
│
└── presentation/
    ├── animation/             # SymbolAnimator, Starfield, WaterBg, etc.
    ├── ui/                    # UIManager, modals, HUD, WinPresenter, JackpotPresenter
    └── vfx/                   # VFXManager, ParticleEmitter
```

---

## 4. Configuration strategy

Layout and behaviour are centralized in **`src/domain/constants/Config.ts`**.

- **LANDSCAPE** – All layout and menu values for horizontal (width ≥ height).
- **PORTRAIT** – All layout and menu values for vertical (height > width).
- **CONFIG** – Backward-compatible flat keys (e.g. `CONFIG.MENU_BTN_LANDSCAPE_X`, `CONFIG.DESIGN_WIDTH_LANDSCAPE`) generated from `LANDSCAPE` and `PORTRAIT` so existing code keeps working.
- **Shared** – Orientation-agnostic values (e.g. `REELS_COUNT`, `BET_VALUES`, animation timings, `API_BASE_URL`) live in a shared block and are merged into `CONFIG`.

Presentation (and the HTML menu) reads from `CONFIG` or, for the overlay, from `window.slotMenuConfig` (landscape/portrait `MENU`). This keeps layout and theming in one place and makes orientation-specific tuning straightforward.

---

## 5. Data flow (spin example)

1. **User** – Clicks spin (Presentation: `UIManager`).
2. **Application** – `SlotMachine.startSpin()` validates (e.g. balance ≥ bet) and calls infrastructure for outcome.
3. **Infrastructure** – `slotApi` requests the Laravel backend (via Herd); returns outcome in domain shape.
4. **Application** – `SpinOrchestrator` runs the spin timeline; when backend is ready, it drives reels to the result.
5. **Presentation** – Reels, blur, and HUD update from orchestrator and domain state.
6. **Application** – If there are wins, `CascadeOrchestrator` runs cascade steps; it calls Presentation (e.g. VFX, WinPresenter) and Infrastructure (e.g. sound).
7. **Presentation** – Shows win amounts, particles, and any modals as instructed by the application layer.

Domain entities (e.g. `Reel`) and config are used by the application and presentation layers; they do not initiate I/O or rendering themselves.

---

## 6. SOLID in practice

- **SRP** – Orchestrators coordinate flow; they do not implement reel math or draw sprites. UI components handle input and display; they do not compute payouts.
- **OCP** – New win types or features are added by new evaluators/orchestrators or new UI components, not by branching inside existing ones.
- **DIP** – Application and presentation depend on abstractions (types, callbacks, injected services); the composition root (`SlotMachine` + `main.ts`) supplies concrete implementations.

---

## 7. Related docs

- [SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md) – Directory structure and layer rules in more detail.
- [SLOT_MACHINE.md](../SLOT_MACHINE.md) – Reels, cascade, free spins, and config parameters.
- [DEV.md](../DEV.md) – Contribution guide and SOLID/DDD practices for contributors.
