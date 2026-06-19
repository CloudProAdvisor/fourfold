/* Headless auto-player & balance simulator.
   Usage: node tests/simulate.js 1000 [greedy|random] [fundingId]
   Also exports playGame()/policies for run-tests.js. */
"use strict";

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

/* ---------- policies ---------- */

function enabledIds(list) {
  return list.filter(function (x) { return x.enabled; }).map(function (x) { return x.id; });
}

// Deterministic heuristic player (no RNG of its own).
function greedyPolicy(state) {
  var p = state.player;
  if (state.phase === "summary") return { type: "nextRound" };
  if (state.phase === "event") {
    var choices = BAM.engine.legalEventChoices(state);
    if (!choices.length) return { type: "continue" };
    var ok = choices.filter(function (c) { return c.enabled && c.id !== "_covered" && c.id !== "fold"; });
    // deterministic: prefer a gated "c" option (usually the trust-payoff), else first enabled
    var pick = ok.filter(function (c) { return c.id === "c"; })[0] || ok[0] || choices[0];
    return { type: "choose", choiceId: pick.id };
  }
  // plan phase
  var legal = {};
  BAM.engine.legalActions(state).forEach(function (l) { legal[l.id] = l; });
  function can(id) { return legal[id] && legal[id].enabled; }
  var wages = BAM.engine.wagesDue(state);

  if (p.energy <= 0) return { type: "endPlan" };
  if (p.cash < wages + 2 && can("fulfill")) return { type: "place", id: "fulfill" };
  if (p.cash < wages && can("funding")) return { type: "place", id: "funding", sub: "bankLoan" };
  if (p.burnout >= 2 && can("sabbath")) return { type: "place", id: "sabbath" };
  if (p.fulfillCount === 0 && can("fulfill")) return { type: "place", id: "fulfill" };
  if (p.trust < 6 && can("relate")) return { type: "place", id: "relate" };
  if (p.demand < Math.min(p.staff, 5) && can("market")) return { type: "place", id: "market" };

  // grow toward the lowest track
  var t = p.tracks;
  var lowest = BAM.engine.TRACK_KEYS.reduce(function (a, k) { return t[k] < t[a] ? k : a; }, "financial");
  if (lowest === "spiritual" && can("opendoor")) return { type: "place", id: "opendoor" };
  if (lowest === "spiritual" && can("sabbath")) return { type: "place", id: "sabbath" };
  if (lowest === "environmental" && p.cash > 12 && can("facilities")) return { type: "place", id: "facilities" };
  if (lowest === "social" && p.cash > 10 && can("hire") && p.staff < p.demand + 1) return { type: "place", id: "hire" };
  if (lowest === "social" && p.cash > 8 && can("train")) return { type: "place", id: "train" };
  if (lowest === "social" && can("serve")) return { type: "place", id: "serve" };

  if (p.cash > 14 && p.staff < p.demand && can("hire")) return { type: "place", id: "hire" };
  if (p.cash > 10 && can("train")) return { type: "place", id: "train" };
  if (state.round - p.lastSabbath >= 2 && can("sabbath")) return { type: "place", id: "sabbath" };
  if (can("serve") && p.cash > 6) return { type: "place", id: "serve" };
  if (can("fulfill")) return { type: "place", id: "fulfill" };
  return { type: "endPlan" };
}

// Seeded-random player (chaos monkey for coverage).
function makeRandomPolicy(seed) {
  var rng = BAM.rng.create(seed);
  return function (state) {
    if (state.phase === "summary") return { type: "nextRound" };
    if (state.phase === "event") {
      var choices = BAM.engine.legalEventChoices(state).filter(function (c) { return c.enabled && c.id !== "fold"; });
      if (!choices.length) return { type: "continue" };
      return { type: "choose", choiceId: rng.pick(choices).id };
    }
    var legal = BAM.engine.legalActions(state).filter(function (l) { return l.enabled; });
    if (state.player.energy <= 0 || !legal.length || rng.next() < 0.15) return { type: "endPlan" };
    var act = rng.pick(legal);
    if (act.id === "funding") {
      var subs = act.subs.filter(function (s) { return s.enabled; });
      return { type: "place", id: "funding", sub: rng.pick(subs).id };
    }
    return { type: "place", id: act.id };
  };
}

/* ---------- driver ---------- */

function playGame(opts) {
  var state = BAM.state.newGame({
    businessId: opts.businessId || "textile",
    fundingId: opts.fundingId || "bootstrapped",
    seasonId: opts.seasonId || "standard",
    seed: opts.seed
  });
  var policy = opts.policy;
  var guard = 0;
  while (state.phase !== "gameover" && guard++ < 600) {
    var before = state.phase + "|" + state.round + "|" + state.player.energy + "|" + JSON.stringify(state.currentEvent ? state.currentEvent.resolved : null);
    var action = policy(state);
    state = BAM.engine.applyAction(state, action).state;
    var after = state.phase + "|" + state.round + "|" + state.player.energy + "|" + JSON.stringify(state.currentEvent ? state.currentEvent.resolved : null);
    if (before === after) { // policy proposed an illegal/no-op action — bail out of planning
      state = BAM.engine.applyAction(state, { type: state.phase === "plan" ? "endPlan" : "continue" }).state;
    }
  }
  if (guard >= 600) throw new Error("Game did not terminate (seed " + opts.seed + ")");
  return state;
}

module.exports = { playGame: playGame, greedyPolicy: greedyPolicy, makeRandomPolicy: makeRandomPolicy };

/* ---------- CLI ---------- */

if (require.main === module) {
  var N = parseInt(process.argv[2] || "500", 10);
  var policyName = process.argv[3] || "greedy";
  var fundingId = process.argv[4] || null;

  var fundings = fundingId ? [fundingId] : ["bootstrapped", "donor", "investor"];
  fundings.forEach(function (fid) {
    var endings = {}, scores = [], tracksSum = { financial: 0, social: 0, environmental: 0, spiritual: 0 };
    var beatArgent = 0, beatHope = 0, completed = 0;
    for (var i = 0; i < N; i++) {
      var policy = policyName === "random" ? makeRandomPolicy(900000 + i) : greedyPolicy;
      var s = playGame({ seed: 1000 + i, fundingId: fid, policy: policy });
      endings[s.gameOver.type] = (endings[s.gameOver.type] || 0) + 1;
      if (s.gameOver.type === "complete") {
        completed++;
        var sc = BAM.engine.score(s);
        scores.push(sc.total);
        BAM.engine.TRACK_KEYS.forEach(function (k) { tracksSum[k] += s.player.tracks[k]; });
        sc.rivals.forEach(function (r) {
          if (r.id === "argent" && sc.total > r.total) beatArgent++;
          if (r.id === "hopedoor" && sc.total > r.total) beatHope++;
        });
      }
    }
    scores.sort(function (a, b) { return a - b; });
    function pct(p) { return scores.length ? scores[Math.floor(scores.length * p)] : "-"; }
    var mean = scores.length ? (scores.reduce(function (a, b) { return a + b; }, 0) / scores.length).toFixed(1) : "-";
    console.log("\n=== " + fid + " · " + policyName + " · " + N + " games ===");
    console.log("endings:", JSON.stringify(endings));
    if (completed) {
      console.log("score  mean " + mean + " | p10 " + pct(0.1) + " p50 " + pct(0.5) + " p90 " + pct(0.9) + " max " + scores[scores.length - 1]);
      var avg = {};
      BAM.engine.TRACK_KEYS.forEach(function (k) { avg[k] = (tracksSum[k] / completed).toFixed(1); });
      console.log("tracks avg:", JSON.stringify(avg));
      console.log("beat Argent " + (100 * beatArgent / completed).toFixed(0) + "% | beat Hope Door " + (100 * beatHope / completed).toFixed(0) + "%");
    }
  });
}
