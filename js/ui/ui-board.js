/* Main board: resources, quadruple-bottom-line tracks, action spaces, rivals, log.
   Also renders the event/dilemma modal (engine supplies all choice legality). */
(function (BAM) {
  "use strict";

  var UI = BAM.ui = BAM.ui || {};
  var TRACKS = [
    { key: "financial", name: "Financial", icon: "💰" },
    { key: "social", name: "Social", icon: "🧑‍🤝‍🧑" },
    { key: "environmental", name: "Environmental", icon: "🌿" },
    { key: "spiritual", name: "Spiritual", icon: "✨" }
  ];

  function trackBars(tracks, small) {
    var h = '<div class="tracks' + (small ? " tracks-small" : "") + '">';
    TRACKS.forEach(function (t) {
      var v = tracks[t.key];
      h += '<div class="track"><span class="track-label">' + t.icon + " " + (small ? "" : t.name) + '</span>' +
        '<span class="track-bar"><span class="track-fill track-' + t.key + '" style="width:' + (v * 10) + '%"></span></span>' +
        '<span class="track-val">' + v + "</span></div>";
    });
    return h + "</div>";
  }
  UI.trackBars = trackBars;

  UI.renderBoard = function (s) {
    var esc = UI.esc;
    var p = s.player;
    var biz = BAM.state.business(s);
    var el = document.getElementById("screen-board");
    var legal = BAM.engine.legalActions(s);
    var live = BAM.engine.trackScore(p.tracks);

    var html = '<div class="board-grid">';

    // ---- header / resource bar ----
    html += '<div class="topbar">' +
      '<div class="topbar-left"><span class="biz-name">' + esc(biz.name) + '</span>' +
      '<span class="round-chip">Quarter ' + s.round + " / " + s.totalRounds + "</span></div>" +
      '<div class="resources">' +
      res("💵", "$" + p.cash, "Cash — working capital (thousands)") +
      res("👷", p.staff + (p.skilled ? " (" + p.skilled + "★)" : ""), "Staff (★ = skilled). Wages $2 each per quarter.") +
      res("⚡", energyPips(p.energy), "Energy — your founder time this quarter") +
      res("🤲", p.trust, "Trust — your standing with the city (0–10)") +
      res("📈", p.demand + "/" + biz.demandCap, "Demand — caps how many staff can earn revenue") +
      (p.dependency > 0 ? res("🪢", p.dependency, "Dependency — donor reliance. At 3+, Financial is capped at 6.") : "") +
      (p.burnout > 0 ? res("🔥", p.burnout + "/3", "Burnout — sabbath clears it. At 3, you break.") : "") +
      (p.covered > 0 ? res("🛡", p.covered, "Covered token — cancel one bad event") : "") +
      '</div><button class="btn btn-ghost btn-small" data-act="confirm-quit">Menu</button></div>';

    // ---- left column: tracks + rivals ----
    html += '<div class="side-col"><div class="panel"><h3 class="panel-h">Quadruple Bottom Line</h3>' +
      trackBars(p.tracks) +
      '<div class="score-line" title="Total of all four + 3× your lowest + 10 if all reach 5. Balance beats maxing.">Score if it ended now: <b>' + live.total + "</b><br><span class='hint'>sum " + live.sum + " + 3×lowest (" + live.min + ")" + (live.balanceBonus ? " + balance 10" : "") + "</span></div></div>";

    html += '<div class="panel"><h3 class="panel-h">Cooper Street</h3><div class="rivals">';
    html += '<div class="rival"><span class="rival-name">You</span>' + trackBars(p.tracks, true) + "</div>";
    s.rivals.forEach(function (r) {
      var def = BAM.state.byId(BAM.DATA.rivals, r.id);
      html += '<div class="rival" title="' + esc(def.blurb) + '"><span class="rival-name">' + esc(def.name) + "</span>" + trackBars(r.tracks, true) + "</div>";
    });
    html += "</div></div></div>";

    // ---- centre: action spaces ----
    html += '<div class="actions-col"><div class="actions-grid">';
    BAM.DATA.actions.forEach(function (a) {
      var st = null;
      legal.forEach(function (l) { if (l.id === a.id) st = l; });
      var cost = [];
      cost.push("⚡" + (a.energy || 1));
      var cashCost = st && st.cashCost != null ? st.cashCost : (a.cash || 0);
      if (a.cashCostKey) cashCost = st ? st.cashCost : 0;
      if (cashCost > 0) cost.push("$" + cashCost);
      html += '<button class="action-card' + (st && st.enabled ? "" : " disabled") + '" data-act="place" data-id="' + a.id + '" ' +
        'title="' + esc(a.desc + (st && !st.enabled && st.reason ? " — " + st.reason : "")) + '">' +
        '<span class="action-head"><span class="action-icon">' + a.icon + '</span><span class="action-name">' + esc(a.name) + '</span><span class="action-cost">' + cost.join(" ") + "</span></span>" +
        '<span class="action-desc">' + esc(st && !st.enabled && st.reason ? st.reason : a.desc) + "</span></button>";
    });
    html += "</div>";

    var wages = BAM.engine.wagesDue(s);
    html += '<div class="endbar"><span class="hint">At the ledger: wages $' + wages +
      (p.dividend ? ", dividend $" + p.dividend : "") + loanPreview(s) +
      '</span><button class="btn btn-primary btn-big" data-act="endplan">' +
      (p.energy > 0 ? "End planning (" + p.energy + "⚡ left) ➜" : "Close the quarter ➜") + "</button></div></div>";

    // ---- right: log ----
    html += '<div class="log-col panel"><h3 class="panel-h">The Quarterly Letter</h3><div class="log">';
    s.log.slice(-40).reverse().forEach(function (e) {
      html += '<div class="log-line"><span class="log-round">Q' + e.round + "</span> " + esc(e.text) + "</div>";
    });
    html += "</div></div></div>";

    // ---- first-game tutorial ----
    if (UI.tutorial && s.round === 1 && s.phase === "plan") {
      html += '<div class="tutorial"><div class="tutorial-box"><h3>Welcome to Talem</h3><ol>' +
        "<li>Each quarter you have <b>3 ⚡ Energy</b> — spend it on the action spaces.</li>" +
        "<li><b>Fulfill Orders</b> earns money; everything else builds the business or the four bottom lines.</li>" +
        "<li>End planning and an <b>event</b> from real practitioner life will test you.</li>" +
        "<li>At the <b>ledger</b> you pay wages ($2/worker). Profit moves Financial; paying on time with high Trust moves Spiritual.</li>" +
        "<li>Final score = all four tracks + <b>3× your lowest</b>. Balance wins. Neglect nothing.</li></ol>" +
        '<button class="btn btn-primary" data-act="dismiss-tutorial">Open the shutters</button></div></div>';
    }

    el.innerHTML = html;
  };

  function res(icon, val, tip) {
    return '<span class="res" title="' + UI.esc(tip) + '"><span class="res-icon">' + icon + '</span>' + val + "</span>";
  }
  function energyPips(n) {
    var h = "";
    for (var i = 0; i < Math.max(n, 0); i++) h += "●";
    return h || "0";
  }
  function loanPreview(s) {
    var due = 0;
    s.player.loans.forEach(function (l) { if (l.payments.length && l.takenRound < s.round) due += l.payments[0]; });
    return due ? ", loans $" + due : "";
  }

  /* ---- event / dilemma modal ---- */

  UI.renderEventModal = function (s) {
    var esc = UI.esc;
    var ce = s.currentEvent;
    if (!ce) return;

    if (ce.resolved) {
      var r = ce.resolved;
      var body = "<p>" + esc(r.text) + "</p>";
      if (r.notes && r.notes.length) {
        body += '<div class="effect-notes">' + r.notes.map(function (n) { return "<span>" + esc(n) + "</span>"; }).join("") + "</div>";
      }
      if (r.insight) body += '<div class="insight">💡 <i>' + esc(r.insight) + "</i></div>";
      UI.modal.show({
        kicker: "What happened", title: r.title, bodyHTML: body,
        choices: [{ id: "_continue", label: "To the ledger ➜", enabled: true }],
        onChoose: function () { UI.dispatch({ type: "continue" }); }
      });
      return;
    }

    var title, flavor, kicker;
    if (ce.kind === "contract") { title = ce.spec.name; flavor = ce.spec.flavor; kicker = "Contract tender — vs Argent Exports"; }
    else if (ce.kind === "emergency") { title = "Payroll Crisis"; flavor = ce.flavor; kicker = "The ledger"; }
    else {
      var card = BAM.state.eventCard(ce.cardId);
      title = card.title; flavor = card.flavor; kicker = "Quarter " + s.round + " — event";
    }
    var choices = BAM.engine.legalEventChoices(s);
    UI.modal.show({
      kicker: kicker, title: title, bodyHTML: "<p>" + esc(flavor) + "</p>",
      choices: choices,
      onChoose: function (id) { UI.dispatch({ type: "choose", choiceId: id }); }
    });
  };
})(typeof BAM !== "undefined" ? BAM : require("../namespace.js"));
