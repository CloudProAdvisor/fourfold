# FOURFOLD — BAM Global educational game

Browser board-game-style sim teaching Business As Mission concepts (quadruple
bottom line) for BAM Global. Pure static app: **no build step, no framework,
no server, no dependencies**. Full game design + architecture rationale:
[DESIGN.md](DESIGN.md). Session history: [PROGRESS.md](PROGRESS.md).

## Commands

```
node tests/run-tests.js          # engine unit tests — run after ANY engine/data change
node tests/simulate.js 500      # balance sim (greedy policy, all 3 funding models)
node tests/simulate.js 500 random   # chaos-monkey robustness
python -m http.server 8642      # local play at http://localhost:8642 (file:// also works)
```

Deploy (not yet done — wrangler auth was expired on 2026-06-12):
```
npx wrangler login
npx wrangler pages deploy . --project-name fourfold
```

## Architecture

Plain `<script>` tags load everything onto a single `BAM` namespace
(`js/namespace.js` has a Node-compat guard so the same files power the tests).
Script order in `index.html` matters: namespace → rng → data/* → state →
engine → debrief → storage → ui/* → main.

| Layer | Files | Rule |
|---|---|---|
| Content | `data/*.js` | Pure data objects. Events use the declarative effects DSL documented in the header of `data/events.js`. New cards/scenarios need **no engine code**. |
| Rules | `js/engine.js` | UI-free. The ONLY mutator of GameState. `applyAction(state, action)` clones, mutates, returns. |
| State | `js/state.js` | GameState is fully JSON-serializable. **Bump `SCHEMA_VERSION` on any state-shape change** (old saves are discarded politely, never crash). |
| UI | `js/ui/*.js`, `js/main.js` | Repaint-from-state via innerHTML templates; one delegated click listener (`data-act` attributes); native `<dialog>` modal. Pipe all text through `UI.esc()`. |

## Hard rules (break these and things rot quietly)

1. **No `Math.random()` in engine or data code.** All game randomness goes
   through the seeded RNG persisted in `state.rngState` (see `rngFor`/`saveRng`
   in engine.js). One stray call breaks replay determinism and shareable
   workshop seeds. The "same seed = identical final state" tests guard this.
   (UI-layer randomness, e.g. generating a default seed, is fine.)
2. **Run `node tests/run-tests.js` and `node tests/simulate.js 500` after any
   engine or data tweak.** Balance reference (2026-06-12): tuned greedy policy
   means ~60–64, top rating "Fourfold Fruitful" at 65+; dumb money-only play
   scores ~20; rivals finish ~12 (Argent) and ~14 (Hope Door). If a change
   moves these a lot, it changed the game.
3. **Bump the `?v=N` query strings in index.html** when shipping changed
   JS/CSS, or returning players get stale cached files.
4. **Tone:** fictional country (Sorvana/Talem), the majority faith is never
   named, no real countries/religions, no conversion counters, dignity not
   poverty-porn, insights describe trade-offs and never scold. Failure screens
   stay warm.
5. Engine files never touch `document`/`window`/timers — that's what keeps
   the Node test harness and headless simulator working.

## Gotchas already hit

- `file://` kills ES modules and `fetch` — that's WHY content is `data/*.js`
  object literals, not `.json`. Don't "tidy" it into JSON files.
- Action cash costs are paid **inside** the engine's ACTION_HANDLERS, not in
  `applyAction` (a double-charge bug lived there once; `train: costs exactly $3`
  test guards it).
- Loans store `takenRound` and only start repaying the **following** quarter.
- The preview tool's `preview_screenshot` times out in this environment —
  verify with `preview_snapshot` / `preview_eval` instead.
- `data/events.js` cards with `addedOnly: true` (e.g. "exposed") never start
  in the deck; they enter via another card's `addLate` effect.
