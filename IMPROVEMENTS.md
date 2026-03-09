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
| Betting System Overhaul | Replaced static presets with `BetModal` slider and interaction blocking. |
| Jackpot Visuals | `JackpotPresenter` implemented for Grand/Major/Mini celebrations. |
| Session Telemetry | `TelemetryService` & `StatsModal` track real-time RTP and wagers. |
| AutoSpin Extension | `AutoSpinModal` provides predefined counts and stop conditions. |
| Turbo Mode | Configurable `TURBO_TIME_SCALE` integrated into all visual timelines. |
| Mechanical Stagger | Left-to-right reel deceleration implemented in `SpinOrchestrator`. |

---

## 🔴 Critical Path (Production Blockers)

> *Current Status: Stable.* There are no unresolved production-blocking bugs violating the core engine sequences.

---

## 🟠 High Priority Features

*(Current Focus: Backend Resilience and Preloader Performance)*

---

## 🟡 Medium Priority Features

### 1. Backend Persistence Layer
**Architectural Impact:** Infrastructure
- **Issue:** `slot-free.js` tracks `playerBalance` strictly in volatile memory. 
- **Solution Action:** Introduce a rudimentary JSON flat-file save/load routine (`fs.writeFileSync`) for the Node server to maintain balance across reboots.

### 2. Asynchronous Preloader
**Architectural Impact:** Application / Presentation
- **Issue:** Assets block the main thread until resolution.
- **Solution Action:** Mount a `Graphics` loadbar in `main.ts`. Hook into PixiJS `Assets.load` progress callbacks to fade the canvas in smoothly once initialization completes.

---

## 🟢 System Polish & Tech Debt

### 3. AST Script Purge
**Architectural Impact:** Configuration
- **Issue:** `fix-paths.ts` remains in the tree post-migration.
- **Solution Action:** Move to `.gitignore` or permanently delete, as the Domain refactoring is finalized.
