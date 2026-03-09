# 📈 BountyRUSH Architectural Roadmap & Tech Debt

> ✅ = Completed | 🔴 Critical | 🟠 High Priority | 🟡 Medium Value | 🟢 Polish

This document outlines the evolutionary roadmap for the BountyRUSH Slot Engine. Issues are prioritized by their architectural impact (DDD/SOLID adherence) and their value to the end-user sequence.

---

## ✅ Completed Milestones

| Issue | Resolution Notes |
|---|---|
| Domain Boundary Enforcement | `SlotMachine` Refactored from God Class into Orchestrators. |
| Type Verification | 100% `any` elimination across all boundaries via `GameTypes.ts`. |
| Cascade Sequence | Avalanche loop correctly decouples math drops from GSAP gravity routines. |
| Memory Handling | VFX memory pools initialized correctly; no memory leaks during 1+ hour auto-spin testing. |
| Backend API Contract | Asynchronous REST mapping correctly marshals arrays into `CascadeStep`. |
| Paytable Menu | Dynamically routed HelpModal renders decoupled domain math logic natively. |
| Event SFX Mapping | `SoundManager` fully hooked into Orchestrators. |

---

## 🔴 Critical Path (Production Blockers)

> *Current Status: Stable.* There are no unresolved production-blocking bugs violating the core engine sequences.

---

## 🟠 High Priority Features

### 1. Jackpot Visual Celebration State
**Architectural Impact:** Application / Presentation
- **Issue:** The `TopUI` renders current Grand/Major values, and the `/jackpot` HTTP endpoint resolves triggers, but the State Machine lacks a `Jackpot` transition.
- **Solution Action:** Extend `SlotMachine` to intercept a `jackpot_hit` boolean from the API. Delegate to a new `JackpotPresenter.ts` to lock the UI and play an erupting coin shower VFX before returning to the `idle` state.

---

## 🟡 Medium Priority Features

### 2. Bet Preset Injection
**Architectural Impact:** Application / Presentation
- **Issue:** Input controls are limited to granular `+/-` steps.
- **Solution Action:** Add an array of hardcoded preset values to `Config.ts` (e.g., `[10, 50, 100]`). Map them to new button templates in `UIManager` to instantly mutate the `betAmount` context.

### 3. Session Statistics Telemetry
**Architectural Impact:** Domain / Presentation
- **Issue:** The framework currently lacks a formalized session history tracker beyond the immediate spin.
- **Solution Action:** Create a `TelemetryService` in the Domain boundary. Inject it into `SlotMachine` to observe total wagers, total wins, and RTP per session. Display via a new `StatsModal`.

### 4. AutoSpin Logic Extension
**Architectural Impact:** Domain / Application
- **Issue:** `AUTO_SPIN_LIMIT` defaults to `Infinity` without stopping conditions.
- **Solution Action:** Expand the `GameContext` interface to accept `autoSpinConfig` (Stop on Win, Stop on Loss Limit). Provide a UI modal for the user to select predefined lengths (10, 25, 50, 100).

### 5. Configurable Turbo Time Dilation
**Architectural Impact:** Application / Presentation
- **Issue:** Quick-spins require rapid tapping. There is no persistent Turbo speed toggle.
- **Solution Action:** Introduce a `timeScale` multiplier in `Config.ts`. Bind a "Turbo" toggle in `UIManager` that globally accelerates `GSAP.globalTimeline` or truncates the default `REEL_SPIN_DURATION`.

### 6. Mechanical Stagger (Reel Anticipation)
**Architectural Impact:** Application / Presentation
- **Issue:** `SpinOrchestrator` resolves all 5 columns concurrently.
- **Solution Action:** Apply a linear stagger parameter (`index * CONFIG.STAGGER_DELAY`) in the `SpinOrchestrator.animateReels` resolution Promise chain to simulate staggered decelerations left-to-right.

---

## 🟢 System Polish & Tech Debt

### 7. AST Script Purge
**Architectural Impact:** Configuration
- **Issue:** `fix-paths.ts` remains in the tree post-migration.
- **Solution Action:** Move to `.gitignore` or permanently delete, as the Domain refactoring is finalized.

### 8. Backend Persistence Layer
**Architectural Impact:** Infrastructure
- **Issue:** `slot-free.js` tracks `playerBalance` strictly in volatile memory. 
- **Solution Action:** Introduce a rudimentary JSON flat-file save/load routine (`fs.writeFileSync`) for the Node server to maintain balance across reboots.

### 9. Asynchronous Preloader
**Architectural Impact:** Application / Presentation
- **Issue:** Assets block the main thread until resolution.
- **Solution Action:** Mount a `Graphics` loadbar in `main.ts`. Hook into PixiJS `Assets.load` progress callbacks to fade the canvas in smoothly once initialization completes.
