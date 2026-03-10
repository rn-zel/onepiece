# System overview

This document summarizes **directory structure**, **layer responsibilities**, and **main flows** for the BountyRUSH Slot Engine. The single source of truth for architecture (dependency rule, design goals, data flow) is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). This file is a short companion for structure and runtime behavior.

---

## Directory structure

Dependencies point **inward**: domain has no dependencies on other layers; application, infrastructure, and presentation depend on domain (and application where applicable).

```text
slot/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── sample-backend.js          # Optional: local RNG/backend simulator
├── sampleAPI.ts              # Optional: API usage examples / helpers
│
├── docs/
│   ├── ARCHITECTURE.md        # Main architecture reference
│   └── README.md              # Doc index
│
└── src/
    ├── main.ts                # Entry: init app, load assets, create SlotMachine
    ├── SlotMachine.ts         # Composition root and high-level controller
    │
    ├── domain/
    │   ├── constants/
    │   │   └── Config.ts      # LANDSCAPE, PORTRAIT, CONFIG, ASSETS
    │   ├── entities/
    │   │   └── Reel.ts
    │   ├── models/
    │   │   └── GameTypes.ts
    │   └── services/
    │       └── TelemetryService.ts
    │
    ├── application/
    │   └── orchestrators/
    │       ├── SpinOrchestrator.ts
    │       └── CascadeOrchestrator.ts
    │
    ├── infrastructure/
    │   ├── api/
    │   │   └── slotApi.ts
    │   └── audio/
    │       └── SoundManager.ts
    │
    └── presentation/
        ├── animation/         # SymbolAnimator, Starfield, WaterBg, etc.
        ├── ui/                # UIManager, BetModal, AutoSpinModal, HelpModal, StatsModal, WinPresenter, etc.
        └── vfx/               # VFXManager, ParticleEmitter
```

---

## Layer responsibilities (summary)

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| **Domain** | Entities, config, types, pure rules | Depend on PixiJS, DOM, network, or audio |
| **Application** | Orchestrate use cases; wire and call domain, presentation, infrastructure | Implement rendering or RNG/payout math |
| **Infrastructure** | HTTP, audio, other I/O; translate to/from domain shape | Contain game rules or UI components |
| **Presentation** | Rendering, input, VFX, animation | Evaluate wins, mutate balance, or call backend directly |

For detailed rules and SOLID alignment, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## End-to-end spin flow

1. **User** – Clicks spin (Presentation: UIManager).
2. **Application** – SlotMachine validates (e.g. balance ≥ bet) and requests outcome from infrastructure.
3. **Infrastructure** – slotApi calls backend; returns outcome in domain shape.
4. **Application** – SpinOrchestrator runs spin timeline; when outcome is ready, drives reels to final positions.
5. **Presentation** – Reels, blur, and HUD update from orchestrator and domain state.
6. **Application** – If wins exist, CascadeOrchestrator runs cascade steps; triggers VFX and sound via presentation and infrastructure.
7. **Presentation** – Shows win amounts and any modals as instructed by the application layer.

---

## Runtime modes

- **With local backend:** Run the sample backend (e.g. `node sample-backend.js`). Set `API_BASE_URL` in Config to that server (e.g. `http://localhost:3000`). The frontend uses it for RNG and payouts.
- **With production backend:** Point `API_BASE_URL` to your production RNG/API. The frontend works as long as the contract in `slotApi` (and domain types) is satisfied.
- **Offline / mock:** Backend can be stubbed or replaced by a local module that returns the same shape as the API client expects.

For configuration (LANDSCAPE/PORTRAIT, CONFIG, menu), see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and `Config.ts`.
