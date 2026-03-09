# 🎰 BountyRUSH WebGL Slot Engine

> **A High-Performance, Domain-Driven Design (DDD) Slot Machine Engine.**
> Built with PixiJS v7, GSAP, and strict TypeScript. Engineered for 60fps performance and long-term extensibility via SOLID principles.

Welcome to the **BountyRUSH** project. This repository contains the complete frontend engineering for a production-ready WebGL slot machine. 

As the Principal Architect of this system, the core mandate was to establish a codebase that survives changing business requirements. We achieve this by enforcing strict architectural boundaries, decoupling the visual presentation from the mathematical game state, and relying heavily on Dependency Inversion.

---

## ✨ System Capabilities

- **Physics-Based Reels:** True momentum, blur filters, and GSAP-driven physical bounce-backs.
- **Avalanche Drop Engine:** A decoupled cascade system supporting multi-stage symbol breaking and chained win evaluations.
- **Strict Separation of Concerns:** Core domain math and orchestrators have zero knowledge of PixiJS or the HTML DOM.
- **Enterprise Type Safety:** Complete elimination of `any` types. Data flow from backend JSON to WebGL Sprite is strictly guarded by TypeScript compilation.
- **O(1) Asset Resolution:** Spritesheet atlasing and pre-loading guarantees zero mid-spin HTTP requests for visual assets.

---

## 🛠️ Technology Stack

| Architecture Layer | Technology | Engineering Purpose |
| :--- | :--- | :--- |
| **Presentation / WebGL** | [PixiJS v8](https://pixijs.com/) | Hardware-accelerated 2D rendering pipeline |
| **Animation / Sequencing** | [GSAP](https://greensock.com/gsap/) | Deterministic easing and timeline orchestration |
| **Domain / Contracts** | [TypeScript](https://www.typescriptlang.org/) | Strict typing (`erasableSyntaxOnly`) bridging I/O boundaries |
| **Build / Tooling** | [Vite](https://vitejs.dev/) | HMR development server and ES module bundling |

---

## 🏗️ Architectural Vision (Domain-Driven Design)

The `src/` directory is strictly divided into four functional layers. **The Golden Rule:** Dependencies must *always* point inward toward the Domain. 

```text
/src
├── /domain              ← [Core] Business Rules & Mathematical Models
│   ├── /models          Type Interfaces (e.g., `GridPosition`, `CascadeStep`)
│   ├── /entities        Stateful Game Objects (e.g., `Reel`)
│   └── /constants       Global Constants (e.g., `Config`)
│
├── /application         ← [Flow] Orchestration & Use Cases
│   ├── /orchestrators   Sequence Drivers (e.g., `SpinOrchestrator`, `CascadeOrchestrator`)
│   └── SlotMachine.ts   The Composition Root (Dependency Injection hub)
│
├── /infrastructure      ← [I/O] External System Drivers
│   ├── /api             Backend HTTP Adapters (`slotApi.ts`)
│   └── /audio           WebAudio Wrappers (`SoundManager.ts`)
│
└── /presentation        ← [UI] PixiJS Rendering & Post-Processing
    ├── /ui              Menus, HUD, Modals (`UIManager`, `BetModal`, `HelpModal`)
    ├── /vfx             Particles, Layout Shaders (`VFXManager`)
    └── /animation       Stateful visual actors (`SymbolAnimator`)
```

### The SOLID Contract for Contributors:
1. **Single Responsibility Principle (SRP):** If a class handles DOM clicks, it *cannot* calculate winning paylines.
2. **Open/Closed Principle (OCP):** New win mechanics (like Cluster Pays) should be implemented by creating a new `WinEvaluator`, not by modifying existing ones `if (mode === 'cluster')`.
3. **Dependency Inversion (DIP):** Presentation layers rely on abstractions. The `SlotMachine` composition root injects concrete instances (like `ParticleEmitter`) into orchestrators via their constructors.
- **Components**: `UIManager` routes clicks outward to delegates. `BetModal` handles specialized input logic via a high-zIndex overlay to prevent background interactions during state mutation. `VFXManager` manages global visual state overrides.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ LTS recommended)
- `npm`

### Bootstrapping the Environment
1. **Clone & Install:**
   ```bash
   git clone https://github.com/your-org/bounty-rush-slot.git
   cd bounty-rush-slot
   npm install
   ```
2. **Launch the Development Server:**
   ```bash
   npm run dev
   ```
3. **Run the Math Simulator (Optional):**
   *(If `USE_BACKEND = true` in `Config.ts`)*
   ```bash
   node slot-free.js
   ```

### Pre-Commit Checks
We rely on the TS compiler for CI/CD integrity. Before opening a Pull Request, ensure the codebase satisfies strict typing:
```bash
npx tsc --noEmit
```

---

*Engineered with strict discipline. Built for scale.*
