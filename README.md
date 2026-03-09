# 🎰 BountyRUSH Slot Engine

> A high-performance, Domain-Driven Design (DDD) slot machine engine built with Pixi.js, GSAP, and strict TypeScript.

Welcome to the **BountyRUSH** project. This repository contains the complete frontend engineering for a production-ready WebGL slot machine. It enforces strict architectural boundaries, 60fps performance standards, and explicit type safety.

---

## ✨ Features

- **Physics-Based Reels:** Smooth acceleration, blurring, and physics-driven bounce-backs powered by GSAP.
- **Dynamic Cascade System:** Multi-stage breaking symbols, falling replacements, and chained wins.
- **Enterprise Architecture:** Strict separation of UI (Pixi.js) from core Game Logic via Domain-Driven Design.
- **Performance Optimized:** Advanced WebGL batching, asset spritesheeting, and isolated VFX contexts.
- **Responsive Sizing:** Auto-scaling camera constraints to maintain the exact aspect ratio on mobile, tablet, and desktop.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Engine** | [Pixi.js v7/v8](https://pixijs.com/) | 2D WebGL rendering pipeline |
| **Animation** | [GSAP](https://greensock.com/gsap/) | Deterministic easing and timeline orchestration |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict typing (`erasableSyntaxOnly`, no `any`) |
| **Tooling** | [Vite](https://vitejs.dev/) | Sub-second HMR development server |

---

## 📦 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `pnpm`

### Getting Started
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/bounty-rush-slot.git
   cd bounty-rush-slot
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Run strict type-checking:** (Recommended before committing)
   ```bash
   npx tsc --noEmit
   ```

---

## 🏗️ System Architecture (Domain-Driven Design)

The `src/` directory is strictly divided into four distinct layers. **Dependencies must always point inward** toward the Domain. The Domain knows nothing about the Pixi.js renderer.

```text
/src
├── /domain              ← [Core] Business Rules (NO Pixi.js imports allowed)
│   ├── /models          Interfaces (GameTypes.ts: SymbolSprite, CascadeStep)
│   ├── /entities        Game Objects (Reel.ts)
│   └── /constants       Globals (Config.ts)
│
├── /application         ← [Flow] Use Cases & Logic
│   ├── /orchestrators   Game Flow (SpinOrchestrator.ts, CascadeOrchestrator.ts)
│   └── SlotMachine.ts   The Composition Root (Wires layers together)
│
├── /infrastructure      ← [External] I/O Boundaries
│   ├── /api             Backend communications (slotApi.ts)
│   └── /audio           Howler/WebAudio adapters (SoundManager.ts)
│
└── /presentation        ← [UI] Pixi.js Rendering & VFX
    ├── /ui              Menus, Buttons, Win Panels (UIManager, WinPresenter)
    ├── /vfx             Particles, Screen Shake (VFXManager, ParticleEmitter)
    └── /animation       Tweens, Shaders (Starfield, LightningBorder)
```

### Architectural Rules for Contributors:
1. **No Mixed Layers:** Do not put HTTP requests inside `presentation/ui`. Do not put Pixi.js `Graphics` inside `domain/models`.
2. **Single Responsibility:** If a file is doing two different things (e.g., drawing a button and calculating odds), split it into two files.
3. **No `any` Types:** Use concrete interfaces defined in `src/domain/models/GameTypes.ts`.

---

## 🎮 Core Engine Modules

Understanding these three orchestrators is critical to working on this codebase:

### 1. The Composition Root (`SlotMachine.ts`)
This class acts as the "Bootstrapper". It initializes the Pixi application, fetches the starting balance from `slotApi.ts`, builds the UI, and passes references down to the orchestrators. 

### 2. The Reel Engine (`SpinOrchestrator.ts`)
Manages the physics of a physical spin:
- Calculates blurring magnitude based on velocity `(remaining / CONFIG.REEL_BLUR_FADE_DIST) * CONFIG.REEL_MAX_BLUR`
- Assigns the final backend grid into the visual symbols.
- Handles Special Symbol (Wild/Scatter) bounce impact animations.

### 3. The Cascade Engine (`CascadeOrchestrator.ts`)
Because this is an avalanche-style slot, the cascade engine is an async pipeline:
1. Receives an array of `CascadePlayStep` from the backend.
2. `[Highlight]`: Tints losing symbols grey and emits glow onto winning lines.
3. `[Break]`: Shrinks and fades winning symbols into dust particles.
4. `[Slide]`: GSAP tweens the surviving symbols down to fill the empty rows.
5. `[Drop]`: Spawns new symbols from above the mask `-y` boundary.
6. Awaits all `Tween` promises before moving to the next cascade step.

---

## 🖌️ Adding New UI Elements or VFX

If you are a frontend or technical artist joining the project to add new visuals:

1. Create your class in `src/presentation/vfx/` or `src/presentation/animation/`.
2. Let the class accept a `PIXI.Container` in its constructor to attach itself to.
3. **Do not** write core game logic in your visual class.
4. Expose simple trigger methods like `play()`, `stop()`, or `showBonusSplash()`.
5. Wire your new visual class up in `SlotMachine.ts` by injecting it.

### Example Visual Injection:
```typescript
// Good:
const lightning = new LightningBorder(sceneContainer);
const vfx = new VFXManager(lightning);

// Bad (Hard coupling):
const vfx = new VFXManager(); // VFX creates LightningBorder itself
```

---

## 🎨 Asset Management
All raw assets should be placed in `src/assets/`. 
- Image assets (PNG, JPG)
- Audio clips (MP3, WAV)
- Spritesheet Atlases (JSON, PNG pairs)

When a new asset is added, use `import myImage from "./assets/myImage.png"` to allow Vite to hash the asset correctly for cache-busting in the production build.

---

💼 *Developed with SOLID Engineering Principles.*
