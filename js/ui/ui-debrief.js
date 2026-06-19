/* The debrief — the real classroom. Score, track-history chart, pivotal choices
   mapped to BAM principles, rival epilogues, discussion question. */
(function (BAM) {
  "use strict";

  var UI = BAM.ui = BAM.ui || {};
  var COLORS = { financial: "var(--c-track-fin)", social: "var(--c-track-soc)", environmental: "var(--c-track-env)", spiritual: "var(--c-track-spi)" };

  UI.renderDebrief = function (s) {
    var esc = UI.esc;
    var el = document.getElementById("screen-debrief");
    var a = UI._analysis || BAM.debrief.analyze(s);
    var sc = a.score;
    var go = s.gameOver;

    var html = '<div class="debrief-wrap">';
    html += '<h1 class="setup-title">' + esc(go.title) + "</h1>";
    html += '<p class="ending-text">' + esc(go.text) + "</p>";

    if (go.type === "complete") {
      html += '<div class="panel score-panel"><div class="final-score">' + sc.total + "</div>" +
        '<div class="final-rating">' + esc(sc.rating.name) + "</div>" +
        '<p class="hint">' + esc(sc.rating.blurb) + "</p>" +
        '<p class="score-math">All four tracks (' + sc.sum + ") + 3 × lowest (" + sc.min + ")" + (sc.balanceBonus ? " + balance bonus (10)" : "") + "</p>" +
        UI.trackBars(s.player.tracks) + "</div>";
    } else {
      html += '<div class="panel score-panel"><p class="hint">The game ended early, so there is no final score — but there is a ledger:</p>' + UI.trackBars(s.player.tracks) + "</div>";
    }

    a.notes.forEach(function (n) {
      html += '<div class="panel note-panel">' + esc(n) + "</div>";
    });

    // ---- track history chart ----
    html += '<div class="panel"><h3 class="panel-h">Three years, four lines</h3>' + chart(s) +
      '<div class="chart-legend"><span style="color:var(--c-track-fin)">■ Financial</span><span style="color:var(--c-track-soc)">■ Social</span><span style="color:var(--c-track-env)">■ Environmental</span><span style="color:var(--c-track-spi)">■ Spiritual</span></div></div>';

    // ---- pivotal choices ----
    if (a.pivotal.length) {
      html += '<div class="panel"><h3 class="panel-h">Your pivotal choices</h3>';
      a.pivotal.forEach(function (pv) {
        html += '<div class="pivotal"><span class="pivotal-when">Q' + pv.round + "</span><div>" +
          "<b>" + esc(pv.title) + "</b>" +
          (pv.principle ? '<div class="pivotal-principle">' + esc(pv.principle) + "</div>" : "") +
          (pv.reflection ? '<div class="hint">' + esc(pv.reflection) + "</div>" : "") + "</div></div>";
      });
      html += "</div>";
    }

    // ---- rivals ----
    html += '<div class="panel"><h3 class="panel-h">Meanwhile, on Cooper Street</h3>';
    html += '<div class="rival-final"><b>You</b> — ' + (go.type === "complete" ? sc.total : "—") + UI.trackBars(s.player.tracks, true) + "</div>";
    a.rivals.forEach(function (r) {
      html += '<div class="rival-final"><b>' + esc(r.name) + "</b> — " + r.total + UI.trackBars(r.tracks, true) +
        '<p class="hint">' + esc(r.text) + "</p></div>";
    });
    html += "</div>";

    // ---- badges ----
    html += '<div class="panel"><h3 class="panel-h">The 10 BAM Guiding Principles</h3><div class="badges">';
    a.badges.forEach(function (b) {
      html += '<div class="badge' + (b.earned ? " earned" : "") + '" title="' + esc(b.desc) + '">' +
        (b.earned ? "🏅 " : "○ ") + esc(b.name) + "</div>";
    });
    html += "</div></div>";

    // ---- discussion + footer ----
    html += '<div class="panel question-panel"><h3 class="panel-h">For the table</h3><p class="question">' + esc(a.question) + "</p></div>";
    html += '<p class="hint center">Learn more about Business As Mission at <a href="https://bamglobal.org" target="_blank" rel="noopener">bamglobal.org</a>. ' +
      "Most practitioners' first venture taught them more than it earned.</p>";
    html += '<div class="setup-buttons"><button class="btn btn-primary btn-big" data-act="playagain">Play again</button></div></div>';

    el.innerHTML = html;
  };

  function chart(s) {
    var hist = s.trackHistory;
    var W = 560, H = 180, PAD = 24;
    var n = Math.max(hist.length - 1, 1);
    function x(i) { return PAD + (W - 2 * PAD) * (i / n); }
    function y(v) { return H - PAD - (H - 2 * PAD) * (v / 10); }
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" class="chart" role="img" aria-label="Track history">';
    for (var g = 0; g <= 10; g += 5) {
      svg += '<line x1="' + PAD + '" y1="' + y(g) + '" x2="' + (W - PAD) + '" y2="' + y(g) + '" class="chart-grid"/>' +
        '<text x="4" y="' + (y(g) + 4) + '" class="chart-tick">' + g + "</text>";
    }
    BAM.engine.TRACK_KEYS.forEach(function (k) {
      var pts = hist.map(function (h, i) { return x(i) + "," + y(h[k]); }).join(" ");
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + COLORS[k] + '" stroke-width="2.5" stroke-linejoin="round"/>';
    });
    return svg + "</svg>";
  }
})(typeof BAM !== "undefined" ? BAM : require("../namespace.js"));
