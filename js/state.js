/* GameState — the single source of truth. Plain serializable object; engine.js is
   the only code that mutates it. */
(function (BAM) {
  "use strict";

  var SCHEMA_VERSION = 1;

  function byId(arr, id) {
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }

  function business(state) { return byId(BAM.DATA.businesses, state.businessId); }
  function eventCard(id) { return byId(BAM.DATA.events, id); }

  function newGame(opts) {
    var biz = byId(BAM.DATA.businesses, opts.businessId) || BAM.DATA.businesses[0];
    var fund = byId(BAM.DATA.fundings, opts.fundingId) || BAM.DATA.fundings[0];
    var season = byId(BAM.DATA.seasons, opts.seasonId) || byId(BAM.DATA.seasons, "standard");
    var rng = BAM.rng.create(opts.seed);

    var decks = { early: [], mid: [], late: [] };
    BAM.DATA.events.forEach(function (ev) {
      if (!ev.addedOnly) decks[ev.band].push(ev.id);
    });
    decks.early = rng.shuffle(decks.early);
    decks.mid = rng.shuffle(decks.mid);
    decks.late = rng.shuffle(decks.late);

    var tracks = { financial: 3, social: 1, environmental: 2, spiritual: 1 };

    var state = {
      schemaVersion: SCHEMA_VERSION,
      seed: opts.seed,
      rngState: rng.getState(),
      businessId: biz.id,
      fundingId: fund.id,
      seasonId: season.id,
      round: 1,
      totalRounds: 10,
      phase: "plan",            // plan | event | summary | gameover
      player: {
        cash: fund.cash,
        staff: 2, skilled: 0,
        energy: 3,
        trust: season.startTrust,
        demand: 2,
        tracks: tracks,
        dependency: fund.dependency,
        burnout: 0,
        covered: 0,
        facilities: 0,
        wageBonus: 0,
        dividend: fund.dividend,
        loans: [],              // [{label, payments:[...]}]
        modifiers: [],          // [{id,label,cashPerRound,rounds|null}]
        scheduled: [],          // [{round, effects, label}]
        flags: { warnings: 0, openDoorLocked: 0 },
        usedThisRound: [],
        fulfillCount: 0,
        revenueThisRound: 0,
        lastSabbath: 0,
        energyNextDelta: 0,
        profitStreak: 0,
        sabbathCount: 0,
        staffCareCount: 0,
        contractsWon: 0
      },
      rivals: BAM.DATA.rivals.map(function (r) {
        return { id: r.id, tracks: JSON.parse(JSON.stringify(r.start)) };
      }),
      decks: decks,
      currentEvent: null,
      lastLedger: null,
      decisionHistory: [],
      trackHistory: [{ round: 0, financial: tracks.financial, social: tracks.social, environmental: tracks.environmental, spiritual: tracks.spiritual }],
      log: [],
      cashAtRoundStart: fund.cash,
      gameOver: null
    };
    return state;
  }

  function clone(state) {
    if (typeof structuredClone === "function") return structuredClone(state);
    return JSON.parse(JSON.stringify(state));
  }

  function serialize(state) { return JSON.stringify(state); }

  function deserialize(json) {
    var s = JSON.parse(json);
    if (!s || s.schemaVersion !== SCHEMA_VERSION) return null;
    return s;
  }

  BAM.state = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    newGame: newGame,
    clone: clone,
    serialize: serialize,
    deserialize: deserialize,
    business: business,
    eventCard: eventCard,
    byId: byId
  };
})(typeof BAM !== "undefined" ? BAM : require("./namespace.js"));
