# Developer contribution guide

This guide defines how to contribute to the BountyRUSH Slot Engine: where code belongs, how to extend the system without breaking boundaries, and how to connect a production backend. For the overall architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Layer checklist: where does my code go?

Before writing code, decide the **layer** and **bounded context**. Dependencies must point inward (domain has no dependencies on other layers).

| Layer | Path | Allowed | Not allowed |
|-------|------|---------|-------------|
| **Domain** | `src/domain/` | Types, entities, config, pure rules | PixiJS, DOM, `window`, network, audio |
| **Application** | `src/application/` | Orchestration, composition root, flow control | Drawing, low-level rendering, RNG/payout math |
| **Infrastructure** | `src/infrastructure/` | HTTP client, audio, file I/O | Game rules, UI components |
| **Presentation** | `src/presentation/` | PixiJS stage, UI, modals, VFX, animation | Win evaluation, balance mutation, API calls |

**Examples:** `Reel`, `Config`, `GameTypes` → Domain. `SpinOrchestrator`, `CascadeOrchestrator`, `SlotMachine` → Application. `slotApi`, `SoundManager` → Infrastructure. `UIManager`, `BetModal`, `VFXManager`, `SymbolAnimator` → Presentation.

---

## Extending the system (Open/Closed Principle)

Add behavior by **new** modules and wiring, not by branching inside existing ones.

### New VFX or visual effect (Presentation)

1. Implement the effect in `src/presentation/vfx/` (or `animation/` as appropriate).
2. Expose a clear API (e.g. `burst(amount: number)`).
3. Register and inject the component in the composition root (`SlotMachine` or `main.ts`).
4. Let an orchestrator or `SlotMachine` call it when the use case demands it—do not call it directly from API payload parsing.

### New win mechanic or evaluator (Domain / backend)

- Win logic and payouts live in the **backend** (or a domain service that receives backend data). The frontend does not compute who won.
- Infrastructure (`slotApi`) maps backend JSON into domain types (e.g. `GameTypes`).
- Presentation only renders the positions and amounts it is given (e.g. `winningPositions`, `totalWin`).

### New symbol or asset (Presentation + Config)

1. Add the asset under `public/` (or the path your build uses for static assets).
2. Register it in `Config.ASSETS.TEXTURES` (or the relevant list in `Config.ts`).
3. If the symbol has special rules (e.g. multiplier wild), the **backend** defines behavior; the frontend only needs the symbol id and texture to render it.

---

## Configuration and magic numbers

Do not hardcode durations, positions, or layout values in the presentation or application layer.

1. Add constants to `src/domain/constants/Config.ts`.
2. Use **orientation blocks** when values differ by layout:
   - `LANDSCAPE` for horizontal layout (e.g. button positions, scales, menu layout).
   - `PORTRAIT` for vertical layout.
   - Shared values (e.g. `REEL_SPIN_DURATION`, `BET_VALUES`) stay in the shared block or `CONFIG` flat keys.
3. Reference them from the layer that needs them (e.g. `CONFIG.REEL_SPIN_DURATION`, `CONFIG.MENU_BTN_LANDSCAPE_X`).

This keeps tuning in one place and preserves a single source of truth for layout and timing.

---

## Connecting a production backend

The frontend is backend-agnostic as long as the **integration contract** is satisfied.

1. **Contract:** The API client and domain types define the expected request/response shape. See `src/infrastructure/api/slotApi.ts` and `src/domain/models/GameTypes.ts` (or equivalent DTOs).
2. **Config:** Set `API_BASE_URL` in `Config.ts` to your production RNG/backend URL (e.g. `https://api.example.com`).
3. **No frontend payout math:** Probabilities and win calculation stay on the server. The client consumes results and renders them.

The sample backend is `sample-backend.js` (or your own server). The frontend only needs the correct base URL and a backend that matches the contract.

---

## Coding discipline

- **Types:** Use interfaces and types from `src/domain/models/` (e.g. `GameTypes`). Avoid `any`; use `unknown` and narrow if needed.
- **Single responsibility:** If a class both draws UI and computes game logic, split it: one presentation component, one domain (or application) service.
- **Domain decides “what”; presentation decides “how”:** The domain (or backend) defines outcomes and state; the presentation layer only displays and captures input.

Pull requests should respect these boundaries and the dependency rule. For a full picture of layers and data flow, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
