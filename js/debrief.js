/* Debrief — turns decisionHistory + final state into the teaching screen:
   earned principle badges, the three most pivotal choices, rival epilogues. */
(function (BAM) {
  "use strict";

  function sawEvent(state, id) {
    return state.decisionHistory.some(function (d) { return d.type === "event" && d.id === id; });
  }

  function earnedBadges(state, scoreObj) {
    var p = state.player, f = p.flags, t = p.tracks;
    var checks = {
      profitability: (f.bestProfitStreak || 0) >= 4,
      excellence: !!f.bribeRefused || (sawEvent(state, "audit") && !f.bribePaid),
      purpose: t.spiritual >= 5,
      holistic: t.financial >= 4 && t.social >= 4 && t.environmental >= 4 && t.spiritual >= 4,
      welfare: p.staffCareCount >= 3,
      impact: scoreObj.total >= 45,
      servant: p.sabbathCount >= 3,
      ethics: !f.bribePaid,
      prayer: !!f.prayerNetwork,
      networking: !!f.networked && p.contractsWon >= 1
    };
    return BAM.DATA.badges.map(function (b) {
      return { id: b.id, name: b.name, desc: b.desc, earned: !!checks[b.id] };
    });
  }

  function pivotalChoices(state) {
    var prev = state.trackHistory[0];
    var scored = [];
    state.decisionHistory.forEach(function (d) {
      var delta = 0;
      BAM.engine.TRACK_KEYS.forEach(function (k) { delta += Math.abs(d.tracks[k] - prev[k]); });
      if ((d.type === "event" || d.type === "contract") && d.id !== "emergency") {
        scored.push({ d: d, delta: delta });
      }
      prev = d.tracks;
    });
    scored.sort(function (a, b) { return b.delta - a.delta || a.d.round - b.d.round; });
    return scored.slice(0, 3).map(function (s) {
      var key = s.d.type === "contract" ? "contract" : s.d.id;
      var card = s.d.type === "contract" ? null : BAM.state.eventCard(s.d.id);
      var teach = BAM.DATA.teaching[key] || {};
      return {
        round: s.d.round,
        title: card ? card.title : (BAM.DATA.contracts[s.d.round] ? BAM.DATA.contracts[s.d.round].name : "Contract tender"),
        principle: teach.principle || "",
        reflection: teach.reflection || ""
      };
    });
  }

  function rivalEpilogues(state) {
    return BAM.DATA.rivals.map(function (r) {
      var text = r.epilogue;
      if (r.id === "hopedoor" && state.player.flags.partnered && r.epiloguePartnered) text = r.epiloguePartnered;
      var rs = null;
      state.rivals.forEach(function (x) { if (x.id === r.id) rs = x; });
      return { id: r.id, name: r.name, tracks: rs.tracks, total: BAM.engine.trackScore(rs.tracks).total, text: text };
    });
  }

  function analyze(state) {
    var scoreObj = BAM.engine.score(state);
    var notes = [];
    if (scoreObj.platformEnding) {
      notes.push("The Platform Ending: your business survived on donor money, not customers. The year donor priorities shift — and they always shift — this story ends. Sustainability is the kindest thing you can build.");
    }
    if (state.player.flags.inflatedReporting) {
      notes.push("About those numbers you sent home: inflated impact reporting is one of the quiet integrity leaks the BAM movement warns about most. The people praying for you can handle the truth.");
    }
    var qIdx = (typeof state.seed === "string" ? BAM.rng.hashSeed(state.seed) : state.seed) % BAM.DATA.discussionQuestions.length;
    return {
      score: scoreObj,
      badges: earnedBadges(state, scoreObj),
      pivotal: pivotalChoices(state),
      rivals: rivalEpilogues(state),
      notes: notes,
      question: BAM.DATA.discussionQuestions[Math.abs(qIdx)]
    };
  }

  BAM.debrief = { analyze: analyze };
})(typeof BAM !== "undefined" ? BAM : require("./namespace.js"));
