/* End-of-quarter ledger summary. */
(function (BAM) {
  "use strict";

  var UI = BAM.ui = BAM.ui || {};

  UI.renderSummary = function (s) {
    var esc = UI.esc;
    var el = document.getElementById("screen-summary");
    var r = s.lastLedger || {};
    var p = s.player;

    var hist = s.trackHistory;
    var prev = hist.length > 1 ? hist[hist.length - 2] : hist[0];
    var now = hist[hist.length - 1];

    var html = '<div class="summary-wrap"><h1 class="setup-title">Quarter ' + s.round + " — the ledger</h1>";

    html += '<div class="ledger panel"><table class="ledger-table">';
    html += row("Order revenue", "+$" + (r.revenue || 0));
    if (r.modCash) html += row("Ongoing arrangements", (r.modCash > 0 ? "+$" : "−$") + Math.abs(r.modCash));
    html += row("Wages (" + p.staff + " staff)", "−$" + (r.wages || 0));
    if (r.loanPay) html += row("Loan repayments", "−$" + r.loanPay);
    if (r.dividend) html += row("Investor dividend", "−$" + r.dividend);
    html += row("<b>" + (r.profit >= 0 ? "Profit" : "Loss") + "</b>", "<b>" + (r.profit >= 0 ? "+$" : "−$") + Math.abs(r.profit || 0) + "</b>");
    html += row("Cash on hand", "$" + p.cash);
    html += "</table>";

    var notes = [];
    if (r.financialDelta > 0) notes.push("A profitable quarter: Financial +" + r.financialDelta + ".");
    if (r.financialDelta < 0) notes.push("Red ink: Financial " + r.financialDelta + ".");
    if (r.witness) notes.push("Witness through work — a trusted, profitable business preaches by itself: Spiritual +1.");
    if (r.witnessBuilding) notes.push("Witness through work is building — another trusted, profitable quarter will move Spiritual.");
    if (r.burnoutGained) notes.push("No sabbath in three quarters: Burnout +1 (now " + p.burnout + "/3).");
    (r.notes || []).forEach(function (n) { notes.push(n); });
    (r.rivalNotes || []).forEach(function (n) { notes.push("📰 " + n); });
    if (notes.length) {
      html += '<ul class="ledger-notes">' + notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>";
    }
    html += "</div>";

    html += '<div class="panel"><h3 class="panel-h">Your four bottom lines</h3>' + UI.trackBars(p.tracks);
    var deltas = [];
    BAM.engine.TRACK_KEYS.forEach(function (k) {
      var d = now[k] - prev[k];
      if (d !== 0) deltas.push(k.charAt(0).toUpperCase() + k.slice(1) + " " + (d > 0 ? "+" : "") + d);
    });
    if (deltas.length) html += '<div class="hint">This quarter: ' + esc(deltas.join(" · ")) + "</div>";
    html += "</div>";

    html += '<div class="setup-buttons"><button class="btn btn-primary btn-big" data-act="nextround">Begin Quarter ' + (s.round + 1) + " ➜</button></div></div>";
    el.innerHTML = html;

    function row(label, val) {
      return '<tr><td>' + label + '</td><td class="num">' + val + "</td></tr>";
    }
  };
})(typeof BAM !== "undefined" ? BAM : require("../namespace.js"));
