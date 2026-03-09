# 💻 Developer Contribution Guide

> This document establishes the **Domain-Driven Design (DDD)** and **SOLID** engineering standards required for contributing to the BountyRUSH Slot Engine. All pull requests will be evaluated against these principles.

This repository enforces strict architectural boundaries to decouple the PixiJS Presentation layer from the Mathematical Game State and Backend Infrastructure. If you are adding a new feature, modifying payouts, or injecting new visual effects, you must understand where your code belongs.

---

## 🏛️ Project Structure Primer

Before writing any logic, identify your Bounded Context:

- **1. Domain (`src/domain/`)**
  - **What it is:** Pure Types, Primitive Rules, Entities, and Global Config.
  - **Rule:** *No PixiJS, Howler, DOM, or Network logic is allowed here.* 
  - **Examples:** `GridPosition`, `GameContext`, `Reel`, `Config`.

- **2. Application (`src/application/`)**
  - **What it is:** The Orchestrators and the Root Composition Hub (`SlotMachine`).
  - **Rule:** *It manages the workflow (the "When") by commanding interfaces, but implements neither the visual "How" nor the math "What".*
  - **Examples:** `SpinOrchestrator`, `CascadeOrchestrator`.

- **3. Presentation (`src/presentation/`)**
  - **What it is:** The PixiJS Stage, Visual Timelines, Particle Effects, and UI.
  - **Rule:** *It cannot dictate game outcomes, parse JSON, or track logic-critical state. It only reacts to public method invocations from the Application layer.*
  - **Examples:** `WinPresenter`, `BetModal`, `SymbolAnimator`, `VFXManager`.

- **4. Infrastructure (`src/infrastructure/`)**
  - **What it is:** Browsers Adapters, APIs, Audio Contexts.
  - **Rule:** *It translates the outside world into Domain models (Anticorruption Layer) and vice-versa.*
  - **Examples:** `slotApi.ts`, `SoundManager.ts`.

---

## 🏗️ SOLID Feature Implementation Guide

### 1. Extending The System (Open/Closed Principle)
Do not modify existing, stable orchestrators or entities when adding new functionality. Extend via new Services or Implementations.

**Example: Adding a new Particle System (Presentation Layer)**
If you want to add a new "Coin Shower" effect:
1. Create `src/presentation/vfx/CoinShower.ts`.
2. Do not call this directly from the backend payload.
3. Expose a public `burst(amount: number)` method.
4. Pass `CoinShower` explicitly into `SlotMachine` via Dependency Injection in its boot environment, then let the `CascadeOrchestrator` invoke `scene.coinShower.burst()`.

### 2. Modifying Win Mechanics (Single Responsibility Principle)
If you need to switch from Paylines to Cluster Pays, do not embed math into `SlotMachine.ts`.
1. The backend `slot-free.js` generates the win.
2. The infrastructure `slotApi.ts` receives JSON and casts it to matching `GameTypes` (DTOs).
3. The Presentation layer (`SymbolAnimator.ts`) highlights the DTO's `GridPosition` array without caring *why* they won.

### 3. Adding a New Symbol (Separation of Concerns)
1. Drop the base image into `src/assets/`.
2. Register the preload identifier in `Config.ASSETS.TEXTURES`.
3. If the symbol introduces new mathematical logic (like a Multiplier Wild), the **backend** dictates the behavior. The frontend only needs the `id` matched to the texture map to render it.

---

## 🔄 Managing Application Flow

All relevant UI timings, GSAP ease speeds, and interaction halts live primarily within `SlotMachine.ts` and its Orchestrators.

Instead of hardcoding `gsap.to(..., { duration: 1.5 })`:
1. Extract magic values into `src/domain/constants/Config.ts`.
2. Reference `CONFIG.SYMBOL_DROP_SPEED` or `CONFIG.PANEL_POPUP_SPEED`.
3. This ensures balancing the visceral feeling of the presentation layer can be managed by a mathematical designer via a single file.

---

## 🌐 Connecting a Production Backend

To substitute the local `slot-free.js` mathematics simulator for a production RNG Microservice:

1. Guarantee your production server honors the rigorous JSON contract defined in the `BackendPlayData` and `BackendCascadeStep` Types in `slotApi.ts`.
2. Point `API_BASE_URL` in `Config.ts` to your active server IP/Domain.
3. The frontend is agnostic. As long as the Integration Contract is met, it will render flawless 60fps cascading spin sequences dynamically.

---

## 🛡️ Coding Discipline

- Use concrete interfaces defined in `src/domain/models/GameTypes.ts`. **Do not use `any`.**
- If a class is drawing a button and calculating a percentage, split it into two files (A presentation UI and a Domain Service).
- Let the Domain decide **What** happened; let UI decide **How it looks**.

By adhering strictly to these patterns, the BountyRUSH Slot Engine minimizes tech debt and remains impervious to cascading side-effects during architectural scaling.
