/* Boot + one delegated click handler for the whole app. */
(function (BAM) {
  "use strict";

  var UI = BAM.ui;

  function onClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    var act = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");

    switch (act) {
      case "new":
        UI.renderSetup(); UI.show("setup"); break;

      case "home":
        UI.gameState = null; UI.renderAll(); break;

      case "continue-game": {
        var saved = BAM.storage.loadGame();
        if (saved) { UI.tutorial = false; UI.setState(saved); }
        break;
      }

      case "pick":
        UI.setupSel[btn.getAttribute("data-group")] = id;
        UI.renderSetup();
        break;

      case "start":
        UI.startGame(); break;

      case "place": {
        var s = UI.gameState;
        if (!s || s.phase !== "plan") break;
        if (id === "funding") { fundingModal(s); break; }
        UI.dispatch({ type: "place", id: id });
        break;
      }

      case "endplan": {
        var st = UI.gameState;
        if (st && st.phase === "plan" && st.player.energy > 0) {
          confirmModal(
            "Energy left over",
            "You still have " + st.player.energy + " ⚡ unspent. End the quarter anyway?",
            "End the quarter", function () { UI.dispatch({ type: "endPlan" }); }
          );
        } else {
          UI.dispatch({ type: "endPlan" });
        }
        break;
      }

      case "nextround":
        UI.dispatch({ type: "nextRound" }); break;

      case "playagain":
        UI._analysis = null; UI.gameState = null;
        UI.renderSetup(); UI.show("setup");
        break;

      case "dismiss-tutorial":
        UI.tutorial = false; UI.renderAll(); break;

      case "confirm-quit":
        quitModal(); break;
    }
  }

  function fundingModal(s) {
    var legal = BAM.engine.legalActions(s);
    var item = null;
    legal.forEach(function (l) { if (l.id === "funding") item = l; });
    if (!item || !item.enabled) return;
    var def = BAM.state.byId(BAM.DATA.actions, "funding");
    var choices = def.subs.map(function (sub) {
      var st = null;
      (item.subs || []).forEach(function (x) { if (x.id === sub.id) st = x; });
      return { id: sub.id, label: sub.name, detail: sub.desc, enabled: st ? st.enabled : true, reason: st ? st.reason : "" };
    });
    choices.push({ id: "_cancel", label: "Never mind", enabled: true });
    UI.modal.show({
      kicker: "Seek Funding", title: "Where should the money come from?",
      bodyHTML: "<p>Each path is real — and each shapes what your business becomes.</p>",
      choices: choices,
      onChoose: function (choiceId) {
        UI.modal.close();
        if (choiceId !== "_cancel") UI.dispatch({ type: "place", id: "funding", sub: choiceId });
      }
    });
  }

  function confirmModal(title, body, okLabel, onOk) {
    UI.modal.show({
      title: title, bodyHTML: "<p>" + UI.esc(body) + "</p>",
      choices: [
        { id: "ok", label: okLabel, enabled: true },
        { id: "cancel", label: "Go back", enabled: true }
      ],
      onChoose: function (id) {
        UI.modal.close();
        if (id === "ok") onOk();
      }
    });
  }

  function quitModal() {
    UI.modal.show({
      title: "Step away from the workshop?",
      bodyHTML: "<p>Your game is saved automatically — you can pick it up from the title screen.</p>",
      choices: [
        { id: "resume", label: "Keep playing", enabled: true },
        { id: "exit", label: "Save & exit to title", enabled: true },
        { id: "abandon", label: "Abandon this game", detail: "Deletes the save.", enabled: true }
      ],
      onChoose: function (id) {
        UI.modal.close();
        if (id === "exit") { UI.gameState = null; UI.renderAll(); }
        if (id === "abandon") { BAM.storage.clearGame(); UI.gameState = null; UI.renderAll(); }
      }
    });
  }

  function boot() {
    UI.modal.init();
    document.addEventListener("click", onClick);
    UI.gameState = null;
    UI.renderAll(); // title screen offers Continue if a save exists
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(BAM);
