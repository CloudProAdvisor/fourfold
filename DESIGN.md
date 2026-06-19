# FOURFOLD — BAM Global Educational Video Game

## Context

Ben (BAM Global) wants a board-game-style video game that teaches Business As Mission concepts experientially. Decisions made with him: invent the game from scratch, purpose = teach BAM concepts, web browser, solo vs AI, hybrid sim mechanics (action allocation + event dilemmas), 15–20 min playthrough, pure client-side static app (no server — free static hosting, works offline). Research confirmed no existing BAM simulation game exists, so this fills a real gap; design vocabulary comes from bamglobal.org, Lausanne Paper 59, and the BAM 10 Guiding Principles.

**New project folder:** `C:\Users\benbl\Claude Projects\BAM Global Game` (working game title **FOURFOLD** — refers to the quadruple bottom line; easy to rename later, title lives in one data string).

## Game design (authoritative summary)

**Theme:** You found a small workshop business in Talem, a city in the fictional Republic of Sorvana (no real countries/religions named; tone hopeful, dignified, never preachy). Two AI "neighbors" serve as cautionary models, not enemies.

**Core loop — 10 rounds (one business quarter each), 4 phases:**
1. **PLAN** — place 3 Energy tokens (founder time) on action spaces; some also cost Cash/Staff.
2. **WORK** — actions auto-resolve.
3. **EVENT** — draw 1 event card (real BAM practitioner challenge), choose A/B (sometimes gated C), see a 1–2 sentence "BAM Insight" takeaway.
4. **LEDGER** — pay wages ($2/Staff), loans/dividends; Financial track moves on profitability; **Witness Through Work check** (paid wages on time + Trust ≥ 5 → Spiritual +1); burnout check; AI rivals advance; scoreboard.

**Resources:** Cash (start 20), Staff (start 2; upgradeable to Skilled), Energy (3/round), Trust (0–10, start 3), Demand (1–5, start 2). Counters: Dependency (donor money), Burnout, Covered token (prayer network). Income: Fulfill Orders = $3 × min(Staff, Demand) + $1/Skilled — the math itself teaches "real business, not a cover."

**10 action spaces:** Fulfill Orders, Market & Sell, Hire Locally (+Social), Train Staff (+Social), Improve Facilities (3 tiers, +Social/+Environmental), Build Relationships (+Trust), Serve the Community, Open Door (gated on Trust ≥ 4 — "earn the right to be heard"), Sabbath (clears Burnout, +Spiritual), Seek Funding (donor grant vs investor vs loan — each with long-term consequences).

**Event deck:** 30 cards in Early/Mid/Late bands — corruption (The Inspector's Envelope), visas, cash-flow crunch, staff welfare, donor windfall, supply-chain ethics, currency shock, dual accountability, burnout, government scrutiny, flood (community crisis), spiritual opportunity, poaching, impact measurement, prayer network, etc. 16 fully written in the design doc (agent output preserved below in "Source designs"), 14 sketched. Rounds 3/6/9 are fixed **Contract Events** — bid vs rival Argent using Staff + Skilled + ⌊Trust/3⌋.

**Scoring — quadruple bottom line.** Four 0–10 tracks (Financial 3, Social 1, Environmental 2, Spiritual 1 at start). Final score = `(F+S+E+Sp) + 3 × min(F,S,E,Sp) + 10 if all ≥ 5`. The 3× lowest-track multiplier (shown from round 1) makes balance the winning strategy — the central teaching point. Roughly half of available Spiritual points come from non-"ministry" sources (rejecting the sacred–secular divide). Failure states: bankruptcy, expulsion (Trust 0 / two warnings), founder collapse (Burnout), and the soft "Platform ending" (low Financial + high Dependency).

**AI rivals (scripted + light RNG, scoreboard side-by-side every round):**
- **Argent Exports** — profit-only machine; ends with Financial 10 but score ≈ 13 (the formula delivers the lesson).
- **Hope Door Center** — donor-funded "platform," not a real business; thrives rounds 1–6, funding agency pivots round 7, declines after. Score ≈ 15–20.

**Setup variants (replayability):** funding model fork (Bootstrapped $20 / Donor-Launched $35 + Dependency 2 / Investor-Backed $28 + dividend), 3 business variants (Textile / Café / Digital — data swaps), 3 difficulty seasons, and **seeded shuffles** so a workshop cohort can play the identical deck and compare choices.

**Teaching integration:** per-choice BAM Insight blurbs; 10 Guiding Principles as discoverable achievement badges; end-game **Debrief screen** — track graph over time with event markers, 3 most pivotal choices mapped to principles, rival comparison paragraphs, one group-discussion question, link to BAM Global resources. Tutorial = 5-step overlay on round 1.

## Architecture

Pure static app, **no build step, no framework, no server**. Plain `<script>` tags (dependency order) onto a single `window.BAM` namespace — runs from `file://` and any static host (ES modules/fetch fail on `file://`, so content lives in `data/*.js` as object literals, not `.json`).

```
BAM Global Game/
├── index.html                  # SPA shell; screens as <section>, scripts in order
├── css/ theme.css layout.css components.css   # CSS vars: navy/teal/warm, 4 track colors
├── js/
│   ├── namespace.js            # window.BAM + node-compat guard (module.exports = BAM)
│   ├── rng.js                  # mulberry32 seeded PRNG; cursor stored in state
│   ├── state.js                # GameState POJO: newGame/clone/serialize, schemaVersion
│   ├── engine.js               # legalActions(), applyAction(), applyEffects(), ledger, score()
│   ├── ai.js                   # rival scripted progression + contract bids
│   ├── debrief.js              # decisionHistory → teaching points
│   ├── storage.js              # localStorage save/records, migration, try/catch wrapped
│   ├── ui/  ui-core.js ui-setup.js ui-board.js ui-modal.js ui-summary.js ui-debrief.js
│   └── main.js
├── data/  scenarios.js actions.js events.js teaching.js ai-profiles.js
├── assets/icons/               # inline SVG first
└── tests/  run-tests.js  simulate.js
```

**Key patterns (proven in the Dune Imperium project, adapted client-side):**
- Engine is UI-free and deterministic: every random call goes through the state-tracked RNG; effects in data are declarative (`{cash:-2, "tracks.social":+1, addModifier:"..."}`) interpreted by one `applyEffects()` — new content needs no new code.
- `legalActions()` returns disabled actions **with reasons** (tooltips double as teaching).
- UI = repaint-from-state via template-literal `innerHTML` per screen + one event-delegation listener per screen root; `<dialog>`-based modal system; event-log panel.
- `GameState` includes `decisionHistory` (fuel for the debrief) and `rngState` (mid-game saves resume deterministically; shareable seeds).
- Responsive: desktop 3-column grid → tablet top-bar tracks → phone single column; tap-then-confirm (no drag), 44px touch targets.

**Testing (no installs):** `node tests/run-tests.js` (node:assert — RNG determinism, same-seed full-game replay deep-equals, resource math, serialize round-trip); `node tests/simulate.js 1000` headless auto-player printing track distributions — the balance tool, built early (M2) and rerun after every data tweak.

## Milestones

- **M1 — Engine + ugly playable prototype.** namespace/rng/state/engine/ai stub, 4 actions + 3 events placeholder data, board + modal UI, run-tests.js. *Verify:* tests green; play a 3-round game from `file://` and via local server to a score.
- **M2 — Full content + balance.** All 10 actions, 30 events, scenarios/funding models, rival profiles, teaching data, debrief.js, setup/summary/debrief screens, simulate.js. *Verify:* `node tests/simulate.js 1000` — no degenerate strategy, no unreachable track; manual playthrough lands 15–20 min.
- **M3 — Polish + persistence + responsive.** storage.js, full CSS, track animations (CSS transitions), SVG icons, tutorial overlay, README. *Verify:* refresh mid-game resumes exactly; DevTools at 768px and 380px; records persist.
- **M4 — Deploy.** Cloudflare Pages: `npx wrangler pages deploy . --project-name fourfold` (no secrets, no build). *Verify:* full game on live URL; same seed on two devices → identical event order.

## Gotchas already accounted for
- `file://` kills ES modules and fetch → plain scripts + data-as-JS.
- One stray `Math.random()` breaks reproducibility → replay-determinism unit test.
- Save schema drift → schemaVersion + discard-with-notice; never let a stale save brick the title screen.
- Sensitive content tone → fictional country, unnamed majority faith, no conversion counters in UI, warm failure screens.

## Verification (end-to-end)
1. `node tests/run-tests.js` and `node tests/simulate.js 1000` green/sane after each milestone.
2. Playtest via local server (per dev-server skill) and from `file://`.
3. Full playthrough each of: bootstrapped win, donor-launch Platform ending, bankruptcy, burnout collapse — confirm each debrief teaches the right principle.
4. Deploy to Cloudflare Pages; cross-device seed check.
