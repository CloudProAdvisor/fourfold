/* Engine unit tests — node tests/run-tests.js (no installs needed). */
"use strict";

var assert = require("node:assert");
var BAM = require("../js/namespace.js");
require("../js/rng.js");
require("../data/scenarios.js");
require("../data/actions.js");
require("../data/events.js");
require("../data/teaching.js");
require("../data/ai-profiles.js");
require("../js/state.js");
require("../js/engine.js");
require("../js/debrief.js");
var sim = require("./simulate.js");

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ok  " + name); }
  catch (e) { failed++; console.error("FAIL  " + name + "\n      " + e.message); }
}

function fresh(opts) {
  opts = opts || {};
  return BAM.state.newGame({
    businessId: opts.businessId || "textile",
    fundingId: opts.fundingId || "bootstrapped",
    seasonId: opts.seasonId || "standard",
    seed: opts.seed != null ? opts.seed : 42
  });
}

/* ---------- RNG ---------- */
test("rng: same seed, same sequence", function () {
  var a = BAM.rng.create(123), b = BAM.rng.create(123);
  for (var i = 0; i < 50; i++) assert.strictEqual(a.next(), b.next());
});
test("rng: shuffle is deterministic per seed", function () {
  var arr = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepStrictEqual(BAM.rng.create(7).shuffle(arr), BAM.rng.create(7).shuffle(arr));
});
test("rng: string seeds hash consistently", function () {
  assert.strictEqual(BAM.rng.hashSeed("TALEM"), BAM.rng.hashSeed("TALEM"));
});

/* ---------- setup ---------- */
test("newGame: funding models set starting cash/dependency/dividend", function () {
  assert.strictEqual(fresh({ fundingId: "bootstrapped" }).player.cash, 20);
  var donor = fresh({ fundingId: "donor" });
  assert.strictEqual(donor.player.cash, 35);
  assert.strictEqual(donor.player.dependency, 2);
  assert.strictEqual(fresh({ fundingId: "investor" }).player.dividend, 1);
});
test("newGame: decks built per band, 'exposed' not in initial deck", function () {
  var s = fresh();
  assert.strictEqual(s.decks.early.length, 8);
  assert.strictEqual(s.decks.mid.length, 15);
  assert.strictEqual(s.decks.late.length, 8); // includes 'fire', excludes 'exposed'
  assert.ok(s.decks.late.indexOf("exposed") < 0);
  assert.ok(s.decks.late.indexOf("fire") >= 0);
});
test("newGame: starting tracks 3/1/2/1", function () {
  var t = fresh().player.tracks;
  assert.deepStrictEqual(t, { financial: 3, social: 1, environmental: 2, spiritual: 1 });
});

/* ---------- actions ---------- */
test("legalActions: open door gated on trust", function () {
  var s = fresh(); // trust 3
  var od = BAM.engine.legalActions(s).filter(function (l) { return l.id === "opendoor"; })[0];
  assert.strictEqual(od.enabled, false);
  s.player.trust = 4;
  od = BAM.engine.legalActions(s).filter(function (l) { return l.id === "opendoor"; })[0];
  assert.strictEqual(od.enabled, true);
});
test("fulfill: $3 × min(staff, demand), repeat at half", function () {
  var s = fresh(); // staff 2, demand 2, cash 20
  var r = BAM.engine.applyAction(s, { type: "place", id: "fulfill" });
  assert.strictEqual(r.state.player.cash, 26);
  assert.strictEqual(r.state.player.revenueThisRound, 6);
  var r2 = BAM.engine.applyAction(r.state, { type: "place", id: "fulfill" });
  assert.strictEqual(r2.state.player.cash, 29); // floor(6/2)=3
});
test("hire: pays cost once (no double-charge), staff+1, social+1", function () {
  var s = fresh();
  var r = BAM.engine.applyAction(s, { type: "place", id: "hire" });
  assert.strictEqual(r.state.player.cash, 16);
  assert.strictEqual(r.state.player.staff, 3);
  assert.strictEqual(r.state.player.tracks.social, 2);
});
test("train: costs exactly $3", function () {
  var s = fresh();
  var r = BAM.engine.applyAction(s, { type: "place", id: "train" });
  assert.strictEqual(r.state.player.cash, 17);
  assert.strictEqual(r.state.player.skilled, 1);
});
test("serve: spiritual bonus only at trust 6+", function () {
  var s = fresh();
  var r = BAM.engine.applyAction(s, { type: "place", id: "serve" });
  assert.strictEqual(r.state.player.tracks.spiritual, 1); // no bonus at trust 3
  var s2 = fresh(); s2.player.trust = 6;
  var r2 = BAM.engine.applyAction(s2, { type: "place", id: "serve" });
  assert.strictEqual(r2.state.player.tracks.spiritual, 2);
});
test("funding: investor round only once", function () {
  var s = fresh();
  var r = BAM.engine.applyAction(s, { type: "place", id: "funding", sub: "investorRound" });
  assert.strictEqual(r.state.player.cash, 32);
  assert.strictEqual(r.state.player.dividend, 1);
  r.state.player.energy = 3;
  var legal = BAM.engine.legalActions(r.state).filter(function (l) { return l.id === "funding"; })[0];
  var inv = legal.subs.filter(function (x) { return x.id === "investorRound"; })[0];
  assert.strictEqual(inv.enabled, false);
});
test("once-per-round actions are blocked on repeat", function () {
  var s = fresh();
  var r = BAM.engine.applyAction(s, { type: "place", id: "relate" });
  var rel = BAM.engine.legalActions(r.state).filter(function (l) { return l.id === "relate"; })[0];
  assert.strictEqual(rel.enabled, false);
});
test("cafe variant: relate gives +2 trust", function () {
  var s = fresh({ businessId: "cafe" });
  var r = BAM.engine.applyAction(s, { type: "place", id: "relate" });
  assert.strictEqual(r.state.player.trust, 5);
});

/* ---------- scoring ---------- */
test("score formula: sum + 3×min + balance bonus", function () {
  assert.strictEqual(BAM.engine.trackScore({ financial: 5, social: 5, environmental: 5, spiritual: 5 }).total, 45);
  assert.strictEqual(BAM.engine.trackScore({ financial: 10, social: 1, environmental: 1, spiritual: 0 }).total, 12);
  assert.strictEqual(BAM.engine.trackScore({ financial: 10, social: 10, environmental: 10, spiritual: 10 }).total, 80);
});

/* ---------- serialization ---------- */
test("serialize → deserialize round-trips exactly", function () {
  var s = fresh({ seed: "TALEM" });
  s = BAM.engine.applyAction(s, { type: "place", id: "fulfill" }).state;
  var back = BAM.state.deserialize(BAM.state.serialize(s));
  assert.deepStrictEqual(back, s);
});
test("deserialize rejects wrong schema version", function () {
  var s = fresh();
  s.schemaVersion = 999;
  assert.strictEqual(BAM.state.deserialize(BAM.state.serialize(s)), null);
});

/* ---------- determinism: full-game replay ---------- */
test("same seed + same policy = identical final state (greedy)", function () {
  var a = sim.playGame({ seed: 777, policy: sim.greedyPolicy });
  var b = sim.playGame({ seed: 777, policy: sim.greedyPolicy });
  assert.deepStrictEqual(a, b);
});
test("same seed + same policy = identical final state (random policy, seeded)", function () {
  var a = sim.playGame({ seed: 321, policy: sim.makeRandomPolicy(5) });
  var b = sim.playGame({ seed: 321, policy: sim.makeRandomPolicy(5) });
  assert.deepStrictEqual(a, b);
});
test("different seeds diverge", function () {
  var a = sim.playGame({ seed: 1, policy: sim.greedyPolicy });
  var b = sim.playGame({ seed: 2, policy: sim.greedyPolicy });
  assert.notDeepStrictEqual(a.log, b.log);
});

/* ---------- robustness sweep ---------- */
test("200 random-policy games all terminate without throwing", function () {
  for (var i = 0; i < 200; i++) {
    var s = sim.playGame({
      seed: 5000 + i,
      fundingId: ["bootstrapped", "donor", "investor"][i % 3],
      businessId: ["textile", "cafe", "digital"][i % 3],
      seasonId: ["open", "standard", "pressure"][i % 3],
      policy: sim.makeRandomPolicy(i)
    });
    assert.ok(s.gameOver, "game " + i + " ended");
    var d = BAM.debrief.analyze(s); // debrief must never throw either
    assert.ok(d.badges.length === 10);
  }
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
