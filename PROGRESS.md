# FOURFOLD — Progress

## 2026-06-14
- Reviewed all four md files; confirmed game state unchanged (M1–M3 done, tests
  green, Cloudflare deploy still the only outstanding milestone). No code changes.
- Ran the app locally to confirm it still serves (`python -m http.server 8642` →
  HTTP 200); server stopped at end of session.
- Diagnosed a remote-session issue (Ben's mobile/web prompts vanishing): traced
  it to the claude.ai side, not this machine — see memory
  `remote-sessions-prompts-vanishing.md`. Deferred at Ben's request.
**Next:** Cloudflare Pages deploy (`npx wrangler login` then
`npx wrangler pages deploy . --project-name fourfold`); revisit remote sessions.

## 2026-06-12 — Project created; M1–M3 built and verified
- Planned with Ben: educational BAM game, invented from scratch, web browser,
  solo vs AI rivals, hybrid sim (action allocation + event dilemmas),
  15–20 min playthrough, pure client-side static app. Full plan in DESIGN.md.
- Built the whole game: seeded-RNG engine, 30+ event cards, 10 action spaces,
  3 businesses × 3 funding models × 3 seasons, contract tenders vs Argent on
  rounds 3/6/9, scripted rival arcs (Argent Exports, Hope Door Center),
  quadruple-bottom-line scoring (`sum + 3×min + balance bonus`), debrief screen
  with pivotal choices mapped to the 10 BAM Guiding Principles, badges,
  track-history chart, localStorage save/resume, first-game tutorial overlay.
- Tests: 21/21 passing (`node tests/run-tests.js`) incl. full-game replay
  determinism and a 200-game random sweep across all setup combinations.
- Balance (`node tests/simulate.js`): tuned witness-through-work to fire every
  2nd qualifying quarter, financial gain threshold to profit ≥ $4, Open Door
  +2 at Trust 8; greedy policy means ~60–64, ratings set with top band at 65+.
- Verified in browser preview: full playthrough to debrief, mid-game refresh
  resumes exactly, responsive at 375/768/desktop widths, zero console errors.
  (preview_screenshot times out in this env — use preview_snapshot/eval.)
- NOT DONE: Cloudflare Pages deploy (wrangler auth expired — needs
  `npx wrangler login`, then `npx wrangler pages deploy . --project-name fourfold`).
  No git repo yet. Ben to playtest by hand next.
