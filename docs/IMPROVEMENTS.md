# Roadmap and improvements

This document tracks completed milestones, current focus, and planned improvements. Use it for sprint planning and tech-debt prioritization.

**Legend:** Done | Critical | High | Medium | Polish

---

## Done

| Area | Notes |
|------|------|
| Layered architecture | Domain, Application, Infrastructure, Presentation with dependency rule; orchestrators and composition root in place. |
| Type safety | Domain and API boundaries use shared types/DTOs; minimal `any`. |
| Cascade (Avalanche) | Cascade sequence driven by server payload; GSAP and presentation decoupled from win math. |
| Backend contract | `slotApi` maps backend JSON to domain-shaped data; frontend agnostic to backend implementation. |
| Betting and HUD | `BetModal` slider; balance/bet/total-win HUD; layout and scales from Config (including HUD alias keys). |
| Orientation config | `LANDSCAPE` and `PORTRAIT` blocks in Config; flat `CONFIG` keys for backward compatibility; menu overlay config via `slotMenuConfig`. |
| Paytable / menu | HTML overlay Paytable with sidebar and symbol grid; driven by Config `MENU` (landscape/portrait). |
| Modals and UI | AutoSpin, BuyFreeSpins, Help (Pixi), Stats, Bet; sizing aligned with Stats-style modals where applicable. |
| Audio | `SoundManager` integrated with orchestrators for SFX/BGM. |
| Jackpots and telemetry | `JackpotPresenter`; `TelemetryService` and Stats modal for session RTP/wagers. |
| Turbo and stagger | Turbo mode and reel stagger (e.g. left-to-right) configurable and integrated. |

---

## Critical (production blockers)

*None at this time.* Core spin and cascade flows are stable. Any new blocker should be listed here with a short description and owner.

---

## High priority

*(Current focus: resilience, performance, and UX.)*

- **Backend resilience:** Retry/backoff and clear error handling when the RNG/backend is unavailable or slow.
- **Loading experience:** Optional preloader or progress indicator during asset load in `main.ts` so the first paint is predictable.

---

## Medium priority

- **Backend persistence (sample backend):** If using the sample Node backend, add simple persistence (e.g. file or DB) for balance/session so state survives restarts.
- **Preloader (Application/Presentation):** Use PixiJS `Assets.load` progress (or equivalent) and a simple progress bar or splash so users see load state instead of a blank screen.

---

## Polish and tech debt

- **Dead or obsolete scripts:** Remove or ignore one-off scripts (e.g. old path-fix or migration scripts) that are no longer part of the normal workflow.
- **Documentation:** Keep README, ARCHITECTURE, and this file in sync when adding features or changing structure.
- **Tests:** Add unit tests for domain and application logic where it adds the most value (e.g. win evaluation, config shape).

---

When completing an item, move it to **Done** with a brief note. When adding new work, place it under the appropriate priority and keep the list concise.
