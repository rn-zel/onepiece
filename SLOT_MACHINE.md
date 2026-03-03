# Slot Machine — Technical Overview and Game Rules

## Overview
This project is a PixiJS + TypeScript slot machine game. The runtime is organized around a central `SlotMachine` controller that composes rendering containers, reels, UI, visual effects (VFX), win evaluation, and audio.

The game uses:
- **Rendering**: PixiJS (`Application`, `Container`, `Sprite`, `AnimatedSprite`)
- **Animation**: GSAP tweens/timelines
- **Audio**: `@pixi/sound`
- **Configuration**: `src/Config.ts` (layout constants, paylines, payouts, asset lists)

## File-by-file responsibilities

### `src/main.ts` — App bootstrap
- Creates and initializes the Pixi `Application`.
- Loads textures/UI assets via `Assets.load([...ASSETS.TEXTURES, ...ASSETS.UI])`.
- Initializes background systems (`WaterBg`, `Starfield`).
- Instantiates `SlotMachine` with injected dependencies (textures, background, starfield, symbol animator, water background).

### `src/SlotMachine.ts` — Game controller (core loop)
Owns:
- **Game state**: `balance`, `betAmount`, `bonusSpins`, `sessionWins`, `running`, `autoSpinActive`, etc.
- **Scene graph**: `mainContainer`, `backgroundContainer`, `reelContainer`, and an instance of `UIManager`.
- **Systems**: `WinManager`, `VFXManager`, `SoundManager`, `LightningBorder`.

Key responsibilities:
- Build reels (`createReels`) and background (`setupBackground`).
- Handle spins (`startSpin`), quick spin behavior, and auto-spin.
- Resolve outcomes after all reels stop (`reelsComplete`):
  - Evaluate wins via `WinManager.checkPaylineWins`.
  - Count scatters for free-spin entry/exit logic.
  - Trigger VFX and UI theme changes during free-spin transitions.
- Apply responsive layout in `handleResize` (scale + positioning using `CONFIG.DESIGN_WIDTH/HEIGHT`, `CONFIG.MACHINE_SCALE`, `CONFIG.SLOT_OFFSET_X`).

### `src/Config.ts` — Configuration and game constants
Defines:
- **Layout constants**: card sizes, spacing, offsets, UI element positions, scaling, design resolution.
- **Payout constants**: base multipliers and special rules (jackpot, free spins, auto-spin).
- **Paylines**: matrix of fixed paylines.
- **Asset lists**: filenames used by Pixi `Assets.load`.
- **Theme colors**: `CONFIG.UI_COLORS` shared across UI elements.

### `src/Reel.ts` — Reel entity (symbols and scrolling)
Represents one column of the slot machine:
- Maintains symbol sprites and their positions.
- Randomizes textures as the reel scrolls (`randomTexture`, `updateSymbols`).
- Handles brightness/tint for win highlighting (`setBrightness`, `resetBrightness`).
- Free spins rule implementation: when `isFreeSpins` is `true`, `randomTexture()` excludes the scatter symbol (texture index `9`).

### `src/WinManager.ts` — Win evaluation (domain logic)
Encapsulates win detection:
- Categorizes symbols by texture index:
  - `0..4` = LOW
  - `5..7` = HIGH
  - `8` = WILD
  - `9` = SCATTER
- Counts scatters anywhere on the grid (`countScatters`).
- Computes payline wins (`checkPaylineWins`) using the configured paylines.

Important behavior:
- Evaluates the “best win” per payline.
- Wilds substitute to extend a match.
- Scatter symbols are ignored for payline wins.
- Jackpot triggers only for **5 wilds on a payline starting from reel 1** (see Game Rules).

### `src/UIManager.ts` — UI composition and input wiring
Creates and positions UI sprites and text:
- Spin, auto-spin, menu, plus/minus bet buttons
- Balance, bet, total win text overlays
- Handles bet text edit visuals (`updateBetTextDisplay`)
- Theme tinting for UI elements (`toggleButtonTheme`) using `CONFIG.UI_COLORS`

### `src/VFXManager.ts` — Visual effects and theme transitions
Owns and controls VFX elements:
- Vortex (`vortex.png`) “black hole” transition animation.
- Lightning border and overlay flashes for free spins.
- Syncs vortex positioning with the same layout math used by `SlotMachine.handleResize`.

### `src/Sound.ts` — SoundManager
Centralized audio control:
- Registers BGM and SFX aliases (`sound.add`).
- Switches BGM between normal and free-spin theme.
- Plays and stops SFX by alias.

### `src/Starfield.ts` — Background starfield VFX
Procedurally animates stars in 3D perspective.
- Supports a free-spins theme tint (`setTheme`).
- Has a warp effect toggled during spins (`triggerWarp`).

### `src/animation/WaterBg.ts` — Background image layer
Loads and displays `src/assets/download.png` as a full-screen background sprite.
Supports theme tinting via `setTheme`.

### `src/animation/LightningBorder.ts` — Animated lightning border
Builds an `AnimatedSprite` from a spritesheet-like atlas derived from `src/assets/border.png`.
Used as a border overlay during free spins.

### `src/services/SymbolAnimator.ts` and `src/services/SymbolAnimation.ts` — Symbol win animations
`SymbolAnimator` loads a spritesheet from `src/assets/symbols.png` and exposes a `play(...)` method for win animations.
`SymbolAnimation` is the interface that `SlotMachine` depends on (injected into the constructor).

### `src/ui/lefttop.ts` — Left-top UI element
Displays `hat.png` and applies theme tinting using `CONFIG.UI_COLORS`.

### `src/ui/title.ts` — Title UI element
Displays `title.png` and applies theme tinting using `CONFIG.UI_COLORS`.

### `src/counter.ts` — Template utility (Vite scaffold)
Not used by the slot gameplay; it is the default Vite counter sample.

## Game rules (current implementation)
This section describes the rules as implemented in code (`Config.ts`, `WinManager.ts`, `Reel.ts`, `SlotMachine.ts`).

### Grid and symbols
- **Grid**: 5 reels × 3 visible rows.
- **Textures (`ASSETS.TEXTURES`)** are mapped by index:
  - `0..4`: LOW symbols (`a`, `k`, `q`, `j`, `s1`)
  - `5..7`: HIGH symbols (`s2`, `s3`, `s4`)
  - `8`: WILD (`wild.png`)
  - `9`: SCATTER (`scatter.png`)

### Paylines
There are **5 fixed paylines** (`CONFIG.PAYLINES`), each defined as row indices across the 5 reels:
- Top row: `[0,0,0,0,0]`
- Middle row: `[1,1,1,1,1]`
- Bottom row: `[2,2,2,2,2]`
- V shape: `[0,1,2,1,0]`
- Inverted V: `[2,1,0,1,2]`

### Payline win evaluation
Payline wins are computed in `WinManager.checkPaylineWins(...)`:
- For each payline, the evaluator checks match sequences starting at reel index `0`, `1`, and `2` to find the best payout for that line.
- **Scatter symbols do not participate in payline wins.**
- **Wild behavior**:
  - Wilds can substitute for the matching symbol to extend the match length.
  - If the starting symbol is wild, the evaluator chooses the first non-wild symbol to determine the “target” symbol for the match.

### Payout calculation
Payouts are based on the current bet amount:

Base tier multipliers (`PAYOUTS`):
- **LOW**: `0.5`
- **HIGH**: `2.0`

Length multipliers (`PAYOUTS`):
- **4-of-a-kind**: multiply base by `MULTI_4` (`3`)
- **5-of-a-kind**: multiply base by `MULTI_5` (`10`)

Result:
- **3 match payout**: `betAmount * baseTier`
- **4 match payout**: `betAmount * (baseTier * MULTI_4)`
- **5 match payout**: `betAmount * (baseTier * MULTI_5)`

Important note:
- In the current implementation, line wins are priced as LOW/HIGH tier wins. WILD primarily acts as a substitute, except for the jackpot rule below.

### Jackpot rule (5 wilds)
If a payline contains:
- **Wild on all 5 reels**, starting from reel 1 (start index `0`),
then the game awards:
- `betAmount * PAYOUTS.JACKPOT`

Current jackpot multiplier:
- `PAYOUTS.JACKPOT = 2000`

### Scatter and free spins
Scatter behavior is handled in `SlotMachine.reelsComplete()` using `WinManager.countScatters(...)`:
- **Trigger condition**: `scatterCount >= 3` while not already in free-spins theme.
- **Award**: `PAYOUTS.SCATTER_SPINS` (currently `10`) free spins.
- Scatters are counted **anywhere** on the 5×3 grid (not restricted to paylines).

Free spins mechanics:
- When `bonusSpins > 0`, a spin does **not** deduct from balance; instead, it decrements `bonusSpins`.
- During free spins, reels exclude new scatters:
  - `Reel.randomTexture()` filters out texture index `9` (scatter) when `reel.isFreeSpins === true`.
  - `Reel.removeScattersInstantly()` replaces any existing scatters immediately when entering free spins.

Note:
- `PAYOUTS.SCATTER_EXTRA` exists but is not currently applied to increase the awarded free spins for 4+ scatters in the provided implementation.

### Betting and balance rules
- Initial balance: `PAYOUTS.CURRENT_BALANCE` (currently `2000`)
- Initial bet: `PAYOUTS.BET_AMOUNT` (currently `100`)
- When not in free spins, starting a spin deducts `betAmount` from `balance`.
- If not in free spins and `balance < betAmount`, a spin will not proceed.

Bet editing:
- Bet can be edited via clicking the bet text and typing digits.
- Bet text editing is disabled while spinning (`enableBetEditing()` returns early when `running` is true).
- Bet amount is clamped on exit: min `10`, max `1,000,000,000`.

### Auto-spin
Auto-spin behavior is managed by `SlotMachine.startAutoSpin()` and `autoSpinNext()`:
- Auto-spin loops until stopped or until balance is insufficient (when not in free spins).
- Delay between auto-spins is controlled by `PAYOUTS.AUTO_SPIN_DELAY` (currently `1500ms`).

### Visual feedback
- Winning symbols are highlighted by raising brightness (tint reset to white) and scaling.
- Symbols not in a winning line are dimmed (`0x555555`) during win displays.
- Winning symbols may also trigger an animated overlay via `SymbolAnimator`.

### Layout and responsiveness
Responsive layout is handled in `SlotMachine.handleResize()`:
- Base design size: `CONFIG.DESIGN_WIDTH` × `CONFIG.DESIGN_HEIGHT` (1920×1080).
- Scale: `min(screenWidth / DESIGN_WIDTH, screenHeight / DESIGN_HEIGHT) * CONFIG.MACHINE_SCALE`.
- Horizontal positioning uses `CONFIG.SLOT_OFFSET_X` to move the machine right so left-side UI (e.g., title art) can fit.

Vortex and other stage-level VFX align to the same computed slot center via `VFXManager.handleResize()` and `VFXManager.getSlotCenter()`.

## Quick configuration reference
- **Move entire machine right**: `CONFIG.SLOT_OFFSET_X`
- **Change base scaling**: `CONFIG.MACHINE_SCALE`
- **Change theme colors**: `CONFIG.UI_COLORS.DEFAULT_TINT`, `CONFIG.UI_COLORS.FREE_SPINS_TINT`
- **Payout tuning**: `PAYOUTS.LOW`, `PAYOUTS.HIGH`, `PAYOUTS.MULTI_4`, `PAYOUTS.MULTI_5`, `PAYOUTS.JACKPOT`
- **Free spins award**: `PAYOUTS.SCATTER_SPINS`
- **Paylines**: `PAYLINES` array
