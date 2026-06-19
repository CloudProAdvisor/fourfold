/* Title screen + new-game setup (business, funding model, season, seed). */
(function (BAM) {
  "use strict";

  var UI = BAM.ui = BAM.ui || {};
  UI.setupSel = { businessId: "textile", fundingId: "bootstrapped", seasonId: "standard" };

  UI.renderTitle = function () {
    var esc = UI.esc;
    var rec = BAM.storage.loadRecords();
    var hasSave = !!BAM.storage.loadGame();
    var el = document.getElementById("screen-title");
    var html =
      '<div class="title-wrap">' +
      '<img class="title-hero" src="assets/img/hero.webp?v=2" alt="" width="1200" height="686">' +
      '<h1 class="game-title">' + esc(BAM.DATA.meta.title) + "</h1>" +
      '<p class="tagline">' + esc(BAM.DATA.meta.tagline) + "</p>" +
      '<p class="title-sub">A Business As Mission game · ' + esc(BAM.DATA.meta.city) + ", " + esc(BAM.DATA.meta.country) + "</p>" +
      '<div class="title-buttons">';
    if (hasSave) html += '<button class="btn btn-primary" data-act="continue-game">Continue game</button>';
    html += '<button class="btn ' + (hasSave ? "" : "btn-primary") + '" data-act="new">New game</button></div>';
    if (rec.gamesPlayed > 0) {
      html += '<div class="title-records">Games played: ' + rec.gamesPlayed +
        (rec.bestScore != null ? " · Best: " + rec.bestScore + " (" + esc(rec.bestRating || "") + ")" : "") +
        " · Principles discovered: " + rec.badges.length + "/10</div>";
    }
    html += '<p class="title-foot">Four bottom lines. One business. Keep them all alive.</p></div>';
    el.innerHTML = html;
  };

  UI.renderSetup = function () {
    var esc = UI.esc;
    var sel = UI.setupSel;
    var el = document.getElementById("screen-setup");

    function cards(group, items, selectedId) {
      var h = '<div class="pick-row">';
      items.forEach(function (it) {
        h += '<button class="pick-card' + (it.id === selectedId ? " selected" : "") + '" data-act="pick" data-group="' + group + '" data-id="' + it.id + '">' +
          (it.img ? '<img class="pick-img" src="' + it.img + '?v=2" alt="" width="720" height="540">' : "") +
          '<span class="pick-name">' + esc(it.name) + "</span>" +
          '<span class="pick-blurb">' + esc(it.blurb) + "</span></button>";
      });
      return h + "</div>";
    }

    el.innerHTML =
      '<div class="setup-wrap">' +
      '<h1 class="setup-title">Setting up in Talem</h1>' +
      "<h3>Your business</h3>" + cards("businessId", BAM.DATA.businesses, sel.businessId) +
      "<h3>How it's funded <span class='hint'>— the big strategic fork</span></h3>" + cards("fundingId", BAM.DATA.fundings, sel.fundingId) +
      "<h3>Season</h3>" + cards("seasonId", BAM.DATA.seasons, sel.seasonId) +
      '<h3>Seed <span class="hint">— optional; share one so a group plays the identical game</span></h3>' +
      '<input type="text" id="seed-input" class="seed-input" placeholder="e.g. TALEM26" maxlength="24">' +
      '<div class="setup-buttons"><button class="btn" data-act="home">Back</button>' +
      '<button class="btn btn-primary" data-act="start">Open for business ➜</button></div></div>';
  };

  UI.startGame = function () {
    var seedEl = document.getElementById("seed-input");
    var seed = seedEl && seedEl.value.trim() ? seedEl.value.trim().toUpperCase() : Math.floor(Math.random() * 1e9);
    var s = BAM.state.newGame({
      businessId: UI.setupSel.businessId,
      fundingId: UI.setupSel.fundingId,
      seasonId: UI.setupSel.seasonId,
      seed: seed
    });
    var rec = BAM.storage.loadRecords();
    UI.tutorial = rec.gamesPlayed === 0;
    UI.setState(s);
  };
})(typeof BAM !== "undefined" ? BAM : require("../namespace.js"));
