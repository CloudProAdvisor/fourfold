# FOURFOLD

An educational board-game-style video game for **BAM Global**. You found a small
business in Talem, a city in the fictional Republic of Sorvana, and over ten
quarters try to keep all four bottom lines alive: **Financial, Social,
Environmental, Spiritual**.

Final score = all four tracks + **3 × your lowest track** + 10 if all reach 5.
Balance beats maxing — that's the point.

## Run it

It's a pure static app — no build, no server, no dependencies.

- Double-click `index.html`, **or**
- `python -m http.server 8000` in this folder and open http://localhost:8000

Works on desktop and tablet; saves automatically to localStorage.

**Seeds:** enter a word (e.g. `TALEM26`) on the setup screen and everyone using
that seed gets the identical event deck — built for workshop groups comparing
choices.

## Edit the content

All teaching content is data, no code needed:

| File | Contains |
|---|---|
| `data/events.js` | The 30+ event cards (dilemmas, effects, BAM Insights) |
| `data/actions.js` | The ten action spaces (display text & costs) |
| `data/scenarios.js` | Businesses, funding models, seasons, ratings, discussion questions |
| `data/teaching.js` | Debrief reflections + the 10 Guiding Principle badges |
| `data/ai-profiles.js` | Argent Exports & Hope Door Center (the cautionary rivals) |

Effects are declarative (`{ cash: -3, trust: 1, spiritual: 1 }`) — see the
header comment in `data/events.js` for the full vocabulary.

## Test & balance

```
node tests/run-tests.js        # engine unit tests (determinism, rules, round-trips)
node tests/simulate.js 500     # headless balance sim: greedy policy, all funding models
node tests/simulate.js 500 random   # chaos-monkey coverage
```

Re-run the simulator after any content tweak — it prints score distributions
and ending types per funding model in seconds.

## Deploy

Any static host. Cloudflare Pages:

```
npx wrangler pages deploy . --project-name fourfold
```

Bump the `?v=N` query strings in `index.html` when releasing changed JS/CSS.

## Architecture (for future editors)

- Plain `<script>` tags onto a single `BAM` namespace — runs from `file://`,
  and the same files load in Node for tests.
- `js/engine.js` is the rules: UI-free, deterministic (all randomness goes
  through the seeded RNG stored in `state.rngState` — never use `Math.random`
  in engine or data code, it breaks replay/share-a-seed).
- `js/state.js` defines GameState (fully JSON-serializable; `schemaVersion`
  guards saves across updates).
- `js/ui/*` repaints screens from state; one delegated click listener in
  `js/main.js`; native `<dialog>` modal.
