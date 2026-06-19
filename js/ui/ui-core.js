/* UI core — screen router, state holder, dispatch. All rendering repaints from
   GameState; the engine is the only thing that changes it. */
(function (BAM) {
  "use strict";

  var UI = BAM.ui = BAM.ui || {};
  UI.gameState = null;
  UI._recorded = {};

  UI.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  };

  UI.show = function (name) {
    document.querySelectorAll(".screen").forEach(function (el) { el.classList.remove("active"); });
    var el = document.getElementById("screen-" + name);
    if (el) el.classList.add("active");
  };

  UI.setState = function (s) {
    UI.gameState = s;
    if (s && s.phase !== "gameover") BAM.storage.saveGame(s);
    if (s && s.phase === "gameover") {
      var key = s.seed + "|" + s.round + "|" + s.gameOver.type;
      if (!UI._recorded[key]) {
        UI._recorded[key] = true;
        var analysis = BAM.debrief.analyze(s);
        BAM.storage.recordResult(s, analysis);
        BAM.storage.clearGame();
        UI._analysis = analysis;
      }
    }
    UI.renderAll();
  };

  UI.dispatch = function (action) {
    if (!UI.gameState) return;
    var result = BAM.engine.applyAction(UI.gameState, action);
    UI.setState(result.state);
  };

  UI.renderAll = function () {
    var s = UI.gameState;
    if (!s) { UI.renderTitle(); UI.show("title"); UI.modal.close(); return; }
    if (s.phase === "plan") { UI.renderBoard(s); UI.show("board"); UI.modal.close(); }
    else if (s.phase === "event") { UI.renderBoard(s); UI.show("board"); UI.renderEventModal(s); }
    else if (s.phase === "summary") { UI.renderSummary(s); UI.show("summary"); UI.modal.close(); }
    else if (s.phase === "gameover") { UI.renderDebrief(s); UI.show("debrief"); UI.modal.close(); }
  };
})(typeof BAM !== "undefined" ? BAM : require("../namespace.js"));
