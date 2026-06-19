/* The rules engine. UI-free and deterministic: never touches the DOM, and every
   random call goes through the RNG whose cursor lives in state.rngState.
   applyAction(state, action) -> { state, notes[] } (operates on a clone). */
(function (BAM) {
  "use strict";

  var TRACK_KEYS = ["financial", "social", "environmental", "spiritual"];

  /* ---------- small helpers ---------- */

  function rngFor(state) {
    var rng = BAM.rng.create(0);
    rng.setState(state.rngState);
    return rng;
  }
  function saveRng(state, rng) { state.rngState = rng.getState(); }

  function log(state, text, cls) {
    state.log.push({ round: state.round, text: text, cls: cls || "" });
  }

  function clampTrack(state, key, val) {
    var max = 10;
    if (key === "financial" && state.player.dependency >= 3) max = 6;
    return Math.max(0, Math.min(max, val));
  }

  function bumpTrack(state, key, delta) {
    var t = state.player.tracks;
    var before = t[key];
    t[key] = clampTrack(state, key, before + delta);
    return t[key] - before;
  }

  function business(state) { return BAM.state.business(state); }
  function season(state) { return BAM.state.byId(BAM.DATA.seasons, state.seasonId); }

  function wagesDue(state) {
    var p = state.player;
    var w = 2 * p.staff + p.wageBonus - (p.facilities >= 3 ? 1 : 0);
    return Math.max(0, w);
  }

  function meetsRequire(state, req) {
    if (!req) return true;
    var p = state.player;
    if (req.trust != null && p.trust < req.trust) return false;
    if (req.cash != null && p.cash < req.cash) return false;
    if (req.facilities != null && p.facilities < req.facilities) return false;
    if (req.covered != null && p.covered < req.covered) return false;
    if (req.skilled != null && p.skilled < req.skilled) return false;
    if (req.staff != null && p.staff < req.staff) return false;
    if (req.burnout != null && p.burnout < req.burnout) return false;
    if (req.spiritual != null && p.tracks.spiritual < req.spiritual) return false;
    if (req.flag && !p.flags[req.flag]) return false;
    if (req.notFlag && p.flags[req.notFlag]) return false;
    return true;
  }

  /* ---------- declarative effects interpreter (events are pure data) ---------- */

  function applyEffects(state, effects, ctx) {
    ctx = ctx || {};
    var p = state.player;
    var notes = [];
    if (!effects) return notes;

    if (effects.cash) {
      var amount = effects.cash;
      if (amount < 0 && ctx.tags && ctx.tags.indexOf("corruption") >= 0 && p.flags.bribePaid) {
        amount *= 2; notes.push("Word got around: the price doubled.");
      }
      if (amount < 0 && ctx.tags && ctx.tags.indexOf("accident") >= 0 && p.facilities >= 1) {
        amount = -Math.ceil(-amount / 2); notes.push("Your safe workshop halved the damage.");
      }
      p.cash += amount;
      notes.push((amount >= 0 ? "+" : "−") + "$" + Math.abs(amount));
    }
    if (effects.trust) { p.trust = Math.max(0, Math.min(10, p.trust + effects.trust)); notes.push("Trust " + sign(effects.trust)); }
    if (effects.demand) {
      p.demand = Math.max(1, Math.min(business(state).demandCap, p.demand + effects.demand));
      notes.push("Demand " + sign(effects.demand));
    }
    if (effects.staff) {
      p.staff = Math.max(0, Math.min(8, p.staff + effects.staff));
      if (p.skilled > p.staff) p.skilled = p.staff;
      notes.push("Staff " + sign(effects.staff));
    }
    if (effects.skilled) { p.skilled = Math.max(0, Math.min(p.staff, p.skilled + effects.skilled)); notes.push("Skilled " + sign(effects.skilled)); }
    if (effects.energyNext) { p.energyNextDelta += effects.energyNext; notes.push("Energy next quarter " + sign(effects.energyNext)); }
    if (effects.dependency) { p.dependency = Math.max(0, p.dependency + effects.dependency); notes.push("Dependency " + sign(effects.dependency)); }
    if (effects.burnout) { p.burnout = Math.max(0, p.burnout + effects.burnout); notes.push("Burnout " + sign(effects.burnout)); }
    if (effects.burnoutClear) { p.burnout = 0; notes.push("Burnout cleared"); }
    if (effects.covered) { p.covered = Math.max(0, p.covered + effects.covered); notes.push(effects.covered > 0 ? "Covered in prayer 🛡" : "Covered token spent"); }
    if (effects.wageBonus) { p.wageBonus += effects.wageBonus; notes.push("Wages " + sign(effects.wageBonus) + "$/quarter"); }
    if (effects.warning) { p.flags.warnings = (p.flags.warnings || 0) + effects.warning; notes.push("⚠ Formal warning (" + p.flags.warnings + "/2)"); }

    TRACK_KEYS.forEach(function (k) {
      if (effects[k]) {
        var moved = bumpTrack(state, k, effects[k]);
        if (moved !== 0) notes.push(trackName(k) + " " + sign(moved));
      }
    });

    if (effects.flag) {
      Object.keys(effects.flag).forEach(function (k) { p.flags[k] = effects.flag[k]; });
    }
    if (effects.addLate) {
      if (state.decks.late.indexOf(effects.addLate) < 0) {
        var rng = rngFor(state);
        var pos = rng.int(state.decks.late.length + 1);
        state.decks.late.splice(pos, 0, effects.addLate);
        saveRng(state, rng);
      }
    }
    if (effects.removeLate) {
      var idx = state.decks.late.indexOf(effects.removeLate);
      if (idx >= 0) state.decks.late.splice(idx, 1);
    }
    if (effects.loan) {
      p.cash += effects.loan.now;
      p.loans.push({ label: "Loan", payments: effects.loan.repay.slice(), takenRound: state.round });
      notes.push("+$" + effects.loan.now + " (loan)");
    }
    if (effects.loseRevenue) {
      if (p.revenueThisRound > 0) {
        p.cash -= p.revenueThisRound;
        notes.push("−$" + p.revenueThisRound + " (this quarter's orders)");
        p.revenueThisRound = 0;
      }
    }
    if (effects.schedule) {
      effects.schedule.forEach(function (s) {
        p.scheduled.push({ round: state.round + s.inRounds, effects: s.effects, label: s.label });
      });
    }
    if (effects.modifier) {
      var m = effects.modifier;
      p.modifiers = p.modifiers.filter(function (x) { return x.id !== m.id; });
      p.modifiers.push({ id: m.id, label: m.label, cashPerRound: m.cashPerRound, rounds: m.rounds });
      notes.push(m.label);
    }
    return notes;
  }

  function sign(n) { return (n >= 0 ? "+" : "") + n; }
  function trackName(k) {
    return { financial: "Financial", social: "Social", environmental: "Environmental", spiritual: "Spiritual" }[k];
  }

  /* ---------- action spaces ---------- */

  function legalActions(state) {
    var p = state.player;
    var biz = business(state);
    return BAM.DATA.actions.map(function (a) {
      var item = { id: a.id, enabled: true, reason: "", subs: null };
      if (state.phase !== "plan") { item.enabled = false; item.reason = "Planning is over for this quarter."; return item; }
      if (p.energy < (a.energy || 1)) { item.enabled = false; item.reason = "No Energy left this quarter."; return item; }
      if (a.oncePerRound && p.usedThisRound.indexOf(a.id) >= 0) { item.enabled = false; item.reason = "Once per quarter."; return item; }

      var cashCost = a.cash || 0;
      if (a.cashCostKey) cashCost = p.flags.freeHire ? 0 : biz[a.cashCostKey];
      item.cashCost = cashCost;
      if (cashCost > 0 && p.cash < cashCost) { item.enabled = false; item.reason = "Not enough cash ($" + cashCost + " needed)."; return item; }

      if (a.id === "fulfill" && p.staff < 1) { item.enabled = false; item.reason = "You need at least one worker."; }
      if (a.id === "train" && p.staff - p.skilled < 1) { item.enabled = false; item.reason = "Everyone is already trained."; }
      if (a.id === "train" && p.staff < 1) { item.enabled = false; item.reason = "No staff to train."; }
      if (a.id === "facilities" && p.facilities >= 3) { item.enabled = false; item.reason = "Facilities fully upgraded."; }
      if (a.id === "market" && p.demand >= biz.demandCap) { item.enabled = false; item.reason = "Demand is at its ceiling for now."; }
      if (a.id === "opendoor") {
        if (p.flags.openDoorLocked > 0) { item.enabled = false; item.reason = "You're keeping things quiet for now (" + p.flags.openDoorLocked + " more quarter" + (p.flags.openDoorLocked > 1 ? "s" : "") + ")."; }
        else if (p.trust < (a.minTrust || 0)) { item.enabled = false; item.reason = a.lockedTip; }
      }
      if (a.id === "funding") {
        item.subs = a.subs.map(function (s) {
          var sub = { id: s.id, enabled: true, reason: "" };
          if (s.id === "investorRound" && p.flags.investorTaken) { sub.enabled = false; sub.reason = "Your investors already came in — once per game."; }
          return sub;
        });
      }
      return item;
    });
  }

  var ACTION_HANDLERS = {
    fulfill: function (state) {
      var p = state.player, biz = business(state);
      var revenue = 3 * Math.min(p.staff, p.demand) + biz.skilledIncome * Math.min(p.skilled, p.demand);
      if (p.fulfillCount > 0) revenue = Math.floor(revenue / 2);
      p.fulfillCount++;
      p.cash += revenue;
      p.revenueThisRound += revenue;
      log(state, "Fulfilled orders: +$" + revenue + (p.fulfillCount > 1 ? " (rush jobs, half rate)" : "") + ".");
    },
    market: function (state) {
      state.player.demand = Math.min(business(state).demandCap, state.player.demand + 1);
      log(state, "Marketing push: Demand +1 (now " + state.player.demand + ").");
    },
    hire: function (state) {
      var p = state.player;
      var free = !!p.flags.freeHire;
      if (free) delete p.flags.freeHire; else p.cash -= business(state).hireCost;
      p.staff = Math.min(8, p.staff + 1);
      bumpTrack(state, "social", 1);
      log(state, "Hired locally" + (free ? " (no cost — word of mouth)" : "") + ": Staff " + p.staff + ", Social +1.");
    },
    train: function (state) {
      var p = state.player;
      p.cash -= 3;
      p.skilled = Math.min(p.staff, p.skilled + 1);
      bumpTrack(state, "social", 1);
      log(state, "Trained a worker: now " + p.skilled + " skilled. Social +1.");
    },
    facilities: function (state) {
      var p = state.player;
      p.cash -= 5;
      p.facilities++;
      if (p.facilities === 1) { bumpTrack(state, "social", 1); log(state, "Tier 1 — Safe Workshop: Social +1, accident damage halved."); }
      if (p.facilities === 2) { bumpTrack(state, "environmental", 2); log(state, "Tier 2 — Clean Production: Environmental +2."); }
      if (p.facilities === 3) { bumpTrack(state, "environmental", 2); log(state, "Tier 3 — Solar & Recycling: Environmental +2, wages −$1/quarter."); }
    },
    relate: function (state) {
      var bonus = 1 + (business(state).trustBonus || 0);
      state.player.trust = Math.min(10, state.player.trust + bonus);
      log(state, "Tea, visits, long conversations: Trust +" + bonus + " (now " + state.player.trust + ").");
    },
    serve: function (state) {
      var p = state.player;
      var trustBefore = p.trust;
      p.cash -= 2;
      bumpTrack(state, "social", 1);
      var bonus = 1 + (business(state).trustBonus || 0);
      p.trust = Math.min(10, p.trust + bonus);
      var extra = "";
      if (trustBefore >= 6) { bumpTrack(state, "spiritual", 1); extra = " People are asking why — Spiritual +1."; }
      log(state, "Served the community: Social +1, Trust +" + bonus + "." + extra);
    },
    opendoor: function (state) {
      var p = state.player;
      var gain = p.trust >= 8 ? 2 : 1;
      bumpTrack(state, "spiritual", gain);
      log(state, "Open Door evening: honest questions, open book. Spiritual +" + gain + ".");
    },
    sabbath: function (state) {
      var p = state.player;
      p.burnout = 0;
      p.lastSabbath = state.round;
      p.sabbathCount++;
      bumpTrack(state, "spiritual", 1);
      log(state, "Sabbath kept. Burnout cleared, Spiritual +1.");
    },
    funding: function (state, sub) {
      var p = state.player;
      if (sub === "donorGrant") {
        p.cash += 8; p.dependency++;
        log(state, "Donor grant received: +$8. Dependency " + p.dependency + (p.dependency >= 3 ? " — the business is starting to orbit its donors (Financial capped at 6)." : "."));
      } else if (sub === "investorRound") {
        p.cash += 12; p.dividend += 1; p.flags.investorTaken = true;
        log(state, "Investor round closed: +$12, $1 dividend every quarter from now on.");
      } else {
        var repay = p.flags.networked ? [3, 3] : [4, 4];
        p.cash += 6;
        p.loans.push({ label: "Bank loan", payments: repay.slice(), takenRound: state.round });
        log(state, "Bank loan: +$6, repay $" + repay[0] + " for the next two quarters" + (p.flags.networked ? " (friendly terms via the BAM network)" : "") + ".");
      }
    }
  };

  /* ---------- event drawing & resolution ---------- */

  function bandForRound(round) {
    if (round <= 2) return "early";
    if (round <= 7) return "mid";
    return "late";
  }

  function drawEvent(state) {
    if (BAM.DATA.contracts[state.round]) { buildContract(state); return; }
    var order = { early: ["early", "mid", "late"], mid: ["mid", "late", "early"], late: ["late", "mid", "early"] }[bandForRound(state.round)];
    var card = null;
    for (var b = 0; b < order.length && !card; b++) {
      var deck = state.decks[order[b]];
      for (var i = 0; i < deck.length; i++) {
        var ev = BAM.state.eventCard(deck[i]);
        if (meetsRequire(state, ev.require)) { card = ev; deck.splice(i, 1); break; }
      }
    }
    if (!card) {
      state.currentEvent = { kind: "event", cardId: null, resolved: { title: "A Quiet Quarter", text: "Nothing out of the ordinary. In Talem, that's news too.", notes: [], insight: null } };
      return;
    }
    state.currentEvent = { kind: "event", cardId: card.id, resolved: null };

    // Auto-resolving cards (and auto branches like the audit).
    var autoSpec = null;
    if (card.autoOnly) autoSpec = card.auto;
    else if (card.auto && meetsRequire(state, card.auto.require)) autoSpec = card.auto;

    if (autoSpec) {
      // Offer the Covered token as an escape from purely-bad auto cards.
      if (state.player.covered > 0 && card.autoOnly && isHarmful(autoSpec, state)) {
        state.currentEvent.coveredOffer = true;
        return; // UI presents accept / use-token choices via legalEventChoices
      }
      resolveAuto(state, card, autoSpec);
    }
  }

  function isHarmful(autoSpec, state) {
    var fx = autoSpec.effects;
    if (!fx && autoSpec.branches) {
      var br = pickBranch(state, autoSpec.branches);
      fx = br && br.effects;
    }
    if (!fx) return false;
    var bad = (fx.cash || 0) < 0 || (fx.trust || 0) < 0;
    TRACK_KEYS.forEach(function (k) { if ((fx[k] || 0) < 0) bad = true; });
    return bad;
  }

  function pickBranch(state, branches) {
    for (var i = 0; i < branches.length; i++) {
      if (meetsRequire(state, branches[i].require)) return branches[i];
    }
    return null;
  }

  function resolveAuto(state, card, autoSpec) {
    var text = autoSpec.text, fx = autoSpec.effects;
    if (autoSpec.branches) {
      var br = pickBranch(state, autoSpec.branches);
      text = br.text; fx = br.effects;
    }
    var notes = applyEffects(state, fx, { tags: card.tags });
    state.currentEvent.resolved = { title: card.title, text: text, notes: notes, insight: card.insight };
    log(state, card.title + " — " + text);
    recordDecision(state, "event", card.id, "_auto");
  }

  function legalEventChoices(state) {
    var ce = state.currentEvent;
    if (!ce || ce.resolved) return [];
    if (ce.kind === "contract") return contractChoices(state);
    if (ce.kind === "emergency") {
      return [
        { id: "loan", label: "Take the emergency loan", detail: "+$6 now; repay $5 then $4 over the next two quarters.", enabled: true },
        { id: "fold", label: "Fold the business", detail: "Some seasons end. The lessons don't.", enabled: true }
      ];
    }
    var card = BAM.state.eventCard(ce.cardId);
    if (ce.coveredOffer) {
      return [
        { id: "_accept", label: "Face it", detail: "Take the hit as it comes.", enabled: true },
        { id: "_covered", label: "🛡 Covered in prayer", detail: "Spend your Covered token — this trouble passes you by.", enabled: true }
      ];
    }
    var choices = card.choices.map(function (c) {
      var ok = meetsRequire(state, c.require);
      return { id: c.id, label: c.label, detail: c.detail || "", enabled: ok, reason: ok ? "" : requireText(c.require) };
    });
    if (state.player.covered > 0) {
      choices.push({ id: "_covered", label: "🛡 Covered in prayer", detail: "Spend your Covered token — this trouble passes you by.", enabled: true });
    }
    return choices;
  }

  function requireText(req) {
    if (!req) return "";
    if (req.trust) return "Needs Trust " + req.trust + "+.";
    if (req.cash) return "Needs $" + req.cash + " in reserve.";
    if (req.facilities) return "Needs Facilities Tier " + req.facilities + "+.";
    if (req.covered) return "Needs a Covered token.";
    return "Requirements not met.";
  }

  function resolveChoice(state, choiceId) {
    var ce = state.currentEvent;
    var card = BAM.state.eventCard(ce.cardId);

    if (choiceId === "_covered" || choiceId === "_accept") {
      if (choiceId === "_covered") {
        state.player.covered--;
        state.currentEvent.resolved = { title: card.title, text: "Eleven people half a world away have been praying for exactly this. The trouble, somehow, passes you by.", notes: ["Covered token spent"], insight: card.insight };
        log(state, card.title + " — covered in prayer; no harm done.");
        recordDecision(state, "event", card.id, "_covered");
      } else {
        resolveAuto(state, card, card.auto);
      }
      return;
    }

    var choice = null;
    for (var i = 0; i < card.choices.length; i++) if (card.choices[i].id === choiceId) choice = card.choices[i];
    if (!choice || !meetsRequire(state, choice.require)) return;

    var notes = [], text = "";
    if (choice.chance) {
      var rng = rngFor(state);
      var hit = rng.next() < choice.chance.p;
      saveRng(state, rng);
      // base effects first (e.g. the knock's energy cost applies either way)
      notes = notes.concat(applyEffects(state, choice.effects, { tags: card.tags }));
      if (hit) {
        text = choice.chance.text;
        notes = notes.concat(applyEffects(state, choice.chance.effects, { tags: card.tags }));
      } else {
        text = choice.chance.elseText;
        notes = notes.concat(applyEffects(state, choice.chance.elseEffects, { tags: card.tags }));
      }
    } else if (choice.branches) {
      notes = notes.concat(applyEffects(state, choice.effects, { tags: card.tags }));
      var br = pickBranch(state, choice.branches);
      if (br) {
        text = br.text || "";
        notes = notes.concat(applyEffects(state, br.effects, { tags: card.tags }));
      }
    } else {
      notes = applyEffects(state, choice.effects, { tags: card.tags });
    }

    if (card.tags.indexOf("staffcare") >= 0 && isStaffCareChoice(card.id, choiceId)) {
      state.player.staffCareCount++;
    }

    state.currentEvent.resolved = { title: card.title, text: text || choice.label, notes: notes, insight: card.insight };
    log(state, card.title + ": " + choice.label);
    recordDecision(state, "event", card.id, choiceId);
  }

  function isStaffCareChoice(cardId, choiceId) {
    var caring = { rina: "a", poach: "c", survivor: "a", theft: "a" };
    return caring[cardId] === choiceId;
  }

  function recordDecision(state, type, id, choiceId) {
    state.decisionHistory.push({
      round: state.round, type: type, id: id, choiceId: choiceId,
      tracks: JSON.parse(JSON.stringify(state.player.tracks))
    });
  }

  /* ---------- contracts (rounds 3, 6, 9) ---------- */

  function playerBid(state) {
    var p = state.player;
    return p.staff + p.skilled + Math.floor(p.trust / 3);
  }

  function buildContract(state) {
    var spec = BAM.DATA.contracts[state.round];
    state.currentEvent = { kind: "contract", cardId: "contract" + state.round, spec: spec, resolved: null };
    if (state.round === 9 && state.player.flags.contractBanned) {
      state.currentEvent.resolved = {
        title: spec.name,
        text: "The buyer has read the exposé. Your calls go to voicemail; the contract goes to Argent.",
        notes: ["Argent wins the tender"], insight: "You outsourced the stitching, not the responsibility."
      };
      rivalTrack(state, "argent", "financial", 1);
      log(state, spec.name + " — lost without a hearing (supply-chain exposé).");
      recordDecision(state, "contract", state.currentEvent.cardId, "_banned");
    }
  }

  function contractChoices(state) {
    var p = state.player;
    var bid = playerBid(state);
    var c = [
      { id: "bid", label: "Submit the bid", detail: "Your strength: " + bid + " (Staff + Skilled + Trust÷3).", enabled: true },
      { id: "sharpen", label: "Sharpen the proposal (−$2)", detail: "Strength " + (bid + 2) + ". Samples, references, a better cover letter.", enabled: p.cash >= 2, reason: "Not enough cash." }
    ];
    if (p.covered > 0) {
      c.push({ id: "covered", label: "🛡 Pray it in (Covered token)", detail: "Strength " + (bid + 2) + ".", enabled: true });
    }
    return c;
  }

  function resolveContract(state, choiceId) {
    var ce = state.currentEvent, spec = ce.spec, p = state.player;
    var bid = playerBid(state);
    if (choiceId === "sharpen") { p.cash -= 2; bid += 2; }
    if (choiceId === "covered") { p.covered--; bid += 2; }
    var rng = rngFor(state);
    var argentBid = spec.base + rng.int(3) + (season(state).contractBonus || 0);
    saveRng(state, rng);

    var win = bid >= argentBid;
    if (win) {
      p.cash += 8;
      p.demand = Math.min(business(state).demandCap, p.demand + 1);
      p.contractsWon++;
      ce.resolved = {
        title: spec.name,
        text: "Your bid (" + bid + ") beats Argent's (" + argentBid + "). The contract is yours: +$8, Demand +1.",
        notes: ["+$8", "Demand +1"], insight: "Winning real contracts against real competitors is what makes a BAM business a business."
      };
      log(state, spec.name + " — WON (" + bid + " vs " + argentBid + "): +$8, Demand +1.");
    } else {
      rivalTrack(state, "argent", "financial", 1);
      ce.resolved = {
        title: spec.name,
        text: "Argent's bid (" + argentBid + ") edges out yours (" + bid + "). “Nothing personal,” their manager says, not meaning it.",
        notes: ["Argent takes the contract"], insight: "Capacity and trust win tenders. Both are built quarters in advance."
      };
      log(state, spec.name + " — lost (" + bid + " vs " + argentBid + ").");
    }
    recordDecision(state, "contract", ce.cardId, choiceId + (win ? ":won" : ":lost"));
  }

  /* ---------- rivals ---------- */

  function rivalTrack(state, id, key, delta) {
    var r = null;
    for (var i = 0; i < state.rivals.length; i++) if (state.rivals[i].id === id) r = state.rivals[i];
    if (!r) return;
    var cap = (id === "hopedoor" && (key === "social" || key === "spiritual")) ? 7 : 10;
    r.tracks[key] = Math.max(0, Math.min(cap, r.tracks[key] + delta));
  }

  function advanceRivals(state) {
    var notes = [];
    rivalTrack(state, "argent", "financial", 1 + (state.round % 2 === 0 ? 1 : 0));

    var hd = BAM.state.byId(BAM.DATA.rivals, "hopedoor");
    if (state.round < hd.pivotRound) {
      rivalTrack(state, "hopedoor", "social", 1);
      rivalTrack(state, "hopedoor", "spiritual", 1);
    } else {
      if (state.round === hd.pivotRound) notes.push(hd.pivotText);
      var declines = state.player.flags.partnered ? (state.round % 2 === 1) : true;
      if (declines) {
        rivalTrack(state, "hopedoor", "social", -1);
        rivalTrack(state, "hopedoor", "spiritual", -1);
      }
    }
    return notes;
  }

  /* ---------- the ledger (phase 4) ---------- */

  function runLedger(state) {
    var p = state.player;
    var report = { wages: wagesDue(state), loanPay: 0, dividend: p.dividend, modCash: 0, revenue: p.revenueThisRound, notes: [], rivalNotes: [], witness: false, burnoutGained: 0, emergency: false };

    p.modifiers.forEach(function (m) { report.modCash += m.cashPerRound; });
    p.loans.forEach(function (l) {
      if (l.payments.length && l.takenRound < state.round) report.loanPay += l.payments[0];
    });

    var due = report.wages + report.loanPay + report.dividend;
    var available = p.cash + report.modCash;
    if (available < due) {
      if (available + 6 < due) {
        endGame(state, "bankrupt");
        return;
      }
      state.currentEvent = {
        kind: "emergency", cardId: "emergency",
        spec: { due: due, available: available },
        resolved: null,
        flavor: "Payroll is $" + report.wages + ", obligations total $" + due + ", and the till holds $" + Math.max(0, available) + ". The microfinance office is still open. Just."
      };
      state.phase = "event";
      return; // ledger resumes after the player chooses
    }
    finishLedger(state, report);
  }

  function finishLedger(state, report) {
    var p = state.player;
    p.cash += report.modCash;
    p.cash -= report.wages + report.loanPay + report.dividend;

    p.loans.forEach(function (l) { if (l.payments.length && l.takenRound < state.round) l.payments.shift(); });
    p.loans = p.loans.filter(function (l) { return l.payments.length > 0; });
    p.modifiers = p.modifiers.filter(function (m) {
      if (m.rounds == null) return true;
      m.rounds--; return m.rounds > 0;
    });

    var profit = report.revenue + report.modCash - report.wages - report.loanPay - report.dividend;
    report.profit = profit;
    var fDelta = 0;
    if (profit >= 4) fDelta++;
    if (profit < 0) fDelta--;
    if (p.cash >= 40 && profit >= 0) fDelta++;
    if (fDelta !== 0) report.financialDelta = bumpTrack(state, "financial", fDelta);
    else report.financialDelta = 0;
    p.profitStreak = profit >= 3 ? p.profitStreak + 1 : 0;
    if (p.profitStreak > (p.flags.bestProfitStreak || 0)) p.flags.bestProfitStreak = p.profitStreak;

    // Witness through work: a real, profitable business paying wages on time,
    // run by someone the city trusts — that combination preaches by itself.
    // It compounds slowly: every second qualifying quarter moves the track.
    if (p.trust >= 6 && profit >= 0) {
      p.witnessProgress = (p.witnessProgress || 0) + 1;
      if (p.witnessProgress % 2 === 0) {
        bumpTrack(state, "spiritual", 1);
        report.witness = true;
      } else {
        report.witnessBuilding = true;
      }
    }

    if (state.round - p.lastSabbath >= 3) {
      p.burnout++;
      report.burnoutGained = 1;
      if (p.burnout >= 3) {
        if (!p.flags.collapsedOnce) {
          p.flags.collapsedOnce = true;
          p.burnout = 0;
          p.flags.skipPlan = true;
          bumpTrack(state, "spiritual", -1);
          report.notes.push("You hit the wall. The doctor's orders are not optional: next quarter is a forced sabbatical. (Spiritual −1.)");
        } else {
          endGame(state, "collapse");
          return;
        }
      }
    }

    if (p.flags.openDoorLocked > 0) p.flags.openDoorLocked--;

    report.rivalNotes = advanceRivals(state);

    state.trackHistory.push({
      round: state.round,
      financial: p.tracks.financial, social: p.tracks.social,
      environmental: p.tracks.environmental, spiritual: p.tracks.spiritual
    });

    if (p.trust <= 0) { endGame(state, "expelled"); return; }
    if ((p.flags.warnings || 0) >= 2) { endGame(state, "expelled"); return; }

    state.lastLedger = report;
    log(state, "Ledger: wages $" + report.wages + (report.loanPay ? ", loans $" + report.loanPay : "") + (report.dividend ? ", dividend $" + report.dividend : "") + " — " + (report.profit >= 0 ? "profit" : "loss") + " of $" + Math.abs(report.profit) + ".");
    if (report.witness) log(state, "Witness through work: wages on time, trust high. Spiritual +1.");

    if (state.round >= state.totalRounds) { endGame(state, "complete"); return; }
    state.phase = "summary";
  }

  function resolveEmergency(state, choiceId) {
    var ce = state.currentEvent;
    if (choiceId === "fold") { endGame(state, "bankrupt"); return; }
    var p = state.player;
    p.cash += 6;
    p.loans.push({ label: "Emergency loan", payments: [5, 4], takenRound: state.round });
    ce.resolved = {
      title: "Emergency Loan",
      text: "The microfinance officer counts out the notes slowly. “Most foreigners don't come back from this. Let's see.” +$6, repay $9 over two quarters.",
      notes: ["+$6", "Repay $5 then $4"], insight: "Most BAM businesses don't die of bad mission. They die of bad cash flow."
    };
    log(state, "Emergency loan taken: +$6, repay $9 over two quarters.");
    recordDecision(state, "event", "emergency", "loan");
  }

  /* ---------- game over & scoring ---------- */

  function trackScore(tracks) {
    var sum = 0, min = Infinity, allFive = true;
    TRACK_KEYS.forEach(function (k) {
      sum += tracks[k];
      if (tracks[k] < min) min = tracks[k];
      if (tracks[k] < 5) allFive = false;
    });
    return { total: sum + 3 * min + (allFive ? 10 : 0), sum: sum, min: min, balanceBonus: allFive ? 10 : 0 };
  }

  function score(state) {
    var s = trackScore(state.player.tracks);
    var rating = null;
    for (var i = 0; i < BAM.DATA.ratings.length; i++) {
      if (s.total >= BAM.DATA.ratings[i].min) { rating = BAM.DATA.ratings[i]; break; }
    }
    s.rating = rating;
    s.platformEnding = state.player.tracks.financial <= 1 && state.player.dependency >= 3;
    s.rivals = state.rivals.map(function (r) {
      var rs = trackScore(r.tracks);
      return { id: r.id, tracks: r.tracks, total: rs.total };
    });
    return s;
  }

  var ENDINGS = {
    bankrupt: { title: "Out of Business", text: "The till is empty and the obligations aren't. You hand the keys to the landlord and walk Cooper Street one last time. A business that isn't viable can't bless anyone — real business, not a cover." },
    expelled: { title: "Asked to Leave", text: "The letter is polite, the deadline is not. Without the city's trust — or with one warning too many — your presence in Sorvana ends. Relationships were the real visa all along." },
    collapse: { title: "The Founder Breaks", text: "The business needed you, and you ran yourself to nothing for it. The doctor uses the word 'years'. The sustainability that matters first is the founder's." },
    complete: { title: "Three Years in Talem", text: "Ten quarters. A business, a team, a street that knows your name. Time to read the whole ledger." }
  };

  function endGame(state, type) {
    state.gameOver = { type: type, title: ENDINGS[type].title, text: ENDINGS[type].text };
    state.phase = "gameover";
    log(state, "GAME OVER — " + ENDINGS[type].title);
  }

  /* ---------- the public applyAction ---------- */

  function applyAction(inputState, action) {
    var state = BAM.state.clone(inputState);
    var p = state.player;

    if (state.phase === "gameover") return { state: state };

    switch (action.type) {
      case "place": {
        if (state.phase !== "plan") break;
        var legal = legalActions(state);
        var item = null;
        for (var i = 0; i < legal.length; i++) if (legal[i].id === action.id) item = legal[i];
        if (!item || !item.enabled) break;
        if (action.id === "funding") {
          var sub = null;
          (item.subs || []).forEach(function (s) { if (s.id === action.sub) sub = s; });
          if (!sub || !sub.enabled) break;
        }
        var def = BAM.state.byId(BAM.DATA.actions, action.id);
        p.energy -= (def.energy || 1); // cash costs are paid inside each handler
        p.usedThisRound.push(action.id);
        recordDecision(state, "action", action.id, action.sub || null);
        ACTION_HANDLERS[action.id](state, action.sub);
        break;
      }
      case "endPlan": {
        if (state.phase !== "plan") break;
        state.phase = "event";
        drawEvent(state);
        break;
      }
      case "choose": {
        if (state.phase !== "event" || !state.currentEvent || state.currentEvent.resolved) break;
        if (state.currentEvent.kind === "contract") resolveContract(state, action.choiceId);
        else if (state.currentEvent.kind === "emergency") {
          resolveEmergency(state, action.choiceId);
          break; // continue() will re-run the ledger
        }
        else resolveChoice(state, action.choiceId);
        break;
      }
      case "continue": {
        if (state.phase !== "event" || !state.currentEvent) break;
        if (!state.currentEvent.resolved) break;
        state.currentEvent = null;
        runLedger(state); // after an emergency loan this re-runs with the new cash
        break;
      }
      case "nextRound": {
        if (state.phase !== "summary") break;
        startRound(state);
        break;
      }
    }
    return { state: state };
  }

  function startRound(state) {
    var p = state.player;
    state.round++;
    state.cashAtRoundStart = p.cash;
    p.usedThisRound = [];
    p.fulfillCount = 0;
    p.revenueThisRound = 0;

    // scheduled effects due this round
    var due = p.scheduled.filter(function (s) { return s.round <= state.round; });
    p.scheduled = p.scheduled.filter(function (s) { return s.round > state.round; });
    due.forEach(function (s) {
      applyEffects(state, s.effects, {});
      if (s.label) log(state, s.label);
    });

    var energy = 3 + p.energyNextDelta;
    p.energyNextDelta = 0;
    p.energy = Math.max(1, energy);

    if (p.flags.skipPlan) {
      delete p.flags.skipPlan;
      p.energy = 0;
      p.burnout = 0;
      p.lastSabbath = state.round;
      log(state, "Forced sabbatical: the workshop runs quietly without you this quarter.");
    }

    state.phase = "plan";
    log(state, "— Quarter " + state.round + " begins —");
  }

  BAM.engine = {
    applyAction: applyAction,
    legalActions: legalActions,
    legalEventChoices: legalEventChoices,
    wagesDue: wagesDue,
    playerBid: playerBid,
    score: score,
    trackScore: trackScore,
    runLedgerForTest: runLedger,
    TRACK_KEYS: TRACK_KEYS
  };
})(typeof BAM !== "undefined" ? BAM : require("./namespace.js"));
