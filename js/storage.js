/* localStorage persistence: in-progress game + lifetime records.
   Every access is wrapped — private browsing or quota issues degrade to memory-only. */
(function (BAM) {
  "use strict";

  var SAVE_KEY = "fourfold.save.v1";
  var RECORDS_KEY = "fourfold.records.v1";

  function safeGet(key) {
    try { return (typeof localStorage !== "undefined") ? localStorage.getItem(key) : null; }
    catch (e) { return null; }
  }
  function safeSet(key, val) {
    try { if (typeof localStorage !== "undefined") localStorage.setItem(key, val); } catch (e) { /* memory-only */ }
  }
  function safeRemove(key) {
    try { if (typeof localStorage !== "undefined") localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function saveGame(state) { safeSet(SAVE_KEY, BAM.state.serialize(state)); }

  function loadGame() {
    var raw = safeGet(SAVE_KEY);
    if (!raw) return null;
    try { return BAM.state.deserialize(raw); } catch (e) { return null; }
  }

  function clearGame() { safeRemove(SAVE_KEY); }

  function loadRecords() {
    var raw = safeGet(RECORDS_KEY);
    if (raw) {
      try {
        var r = JSON.parse(raw);
        if (r && r.v === 1) return r;
      } catch (e) { /* fall through */ }
    }
    return { v: 1, gamesPlayed: 0, bestScore: null, bestRating: null, badges: [] };
  }

  function recordResult(state, analysis) {
    var rec = loadRecords();
    rec.gamesPlayed++;
    if (state.gameOver && state.gameOver.type === "complete") {
      if (rec.bestScore == null || analysis.score.total > rec.bestScore) {
        rec.bestScore = analysis.score.total;
        rec.bestRating = analysis.score.rating ? analysis.score.rating.name : null;
      }
    }
    analysis.badges.forEach(function (b) {
      if (b.earned && rec.badges.indexOf(b.id) < 0) rec.badges.push(b.id);
    });
    safeSet(RECORDS_KEY, JSON.stringify(rec));
    return rec;
  }

  BAM.storage = {
    saveGame: saveGame,
    loadGame: loadGame,
    clearGame: clearGame,
    loadRecords: loadRecords,
    recordResult: recordResult
  };
})(typeof BAM !== "undefined" ? BAM : require("./namespace.js"));
