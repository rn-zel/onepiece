# BountyRUSH Slot Engine

A production-oriented WebGL slot machine built with **PixiJS**, **GSAP**, and **TypeScript**. The codebase follows **Domain-Driven Design (DDD)** and **SOLID** principles: domain logic is independent of rendering, and the presentation layer depends on the domain via clear contracts.

---

## Features

- **5×3 slot with 243 ways** – Left-to-right evaluation; Wild and Scatter rules.
- **Cascade (Avalanche) engine** – Multi-stage symbol break and drop with multiplier.
- **Free Spins & Bonus Buy** – State machine and UI for bonus mode.
- **Responsive layout** – Separate **landscape** and **portrait** configs for layout and menu.
- **PixiJS rendering** – Reels, blur, symbols, and HUD; HTML overlay for Paytable menu.
- **Backend-agnostic** – Slot math can be driven by local simulator or remote API.

---

## Tech stack

| Layer / concern   | Technology |
|-------------------|------------|
| Rendering         | [PixiJS v8](https://pixijs.com/) |
| Animation         | [GSAP](https://greensock.com/gsap/) |
| Language / types   | [TypeScript](https://www.typescriptlang.org/) |
| Build & dev server| [Vite](https://vitejs.dev/) |
| Audio             | [@pixi/sound](https://pixijs.com/packages/sound) |

---

## Quick start

### Prerequisites

- **Node.js** v18+ (LTS recommended)
- **npm**

### Install and run

```bash
git clone <repository-url>
cd slot
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. `http://localhost:5173`).

### Optional: local backend

To drive the slot with the sample backend (RNG and payouts):

1. Start the backend, e.g. `node sample-backend.js` (or your backend on the port set in config).
2. Set `API_BASE_URL` in `src/domain/constants/Config.ts` to that server (default is `http://localhost:3000`).

---

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start Vite dev server (HMR)    |
| `npm run build`| Type-check (`tsc`) + Vite build|
| `npm run preview` | Serve production build     |

### Pre-commit / CI

Ensure TypeScript compiles before pushing:

```bash
npx tsc --noEmit
```

---

## Project structure (high level)

Dependencies point **inward** toward the domain; presentation and infrastructure depend on application/domain, not the other way around.

```
src/
├── domain/          # Core: entities, config, types (no Pixi/DOM)
├── application/     # Flow: orchestrators, composition root (SlotMachine)
├── infrastructure/  # I/O: API client, audio
└── presentation/    # UI: Pixi components, modals, VFX, animation
```

Configuration is split into **landscape** and **portrait** in `src/domain/constants/Config.ts` (`LANDSCAPE`, `PORTRAIT`) for easy tuning per orientation; `CONFIG` exposes backward-compatible flat keys for the rest of the app.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) | **Architecture reference**: layers, dependency rule, modules, config, data flow. |
| [**docs/RULES.md**](docs/RULES.md) | **Game rules**: betting, winning mechanics, paytable, free spins, configuration. |
| [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) | Directory layout and layer responsibilities. |
| [SLOT_MACHINE.md](SLOT_MACHINE.md) | Game mechanics, reels, cascade, and config parameters. |
| [DEV.md](DEV.md) | Contribution guide and SOLID/DDD practices. |

Start with **docs/ARCHITECTURE.md** for design and boundaries; use the others for deep dives and contribution rules.

---

## License

Private / proprietary. See repository settings or legal notice.
