/* Native <dialog>-based modal. Game-critical modals (events) are not dismissible. */
(function (BAM) {
  "use strict";

  var UI = BAM.ui = BAM.ui || {};

  UI.modal = {
    el: null,
    onChoose: null,

    init: function () {
      this.el = document.getElementById("modal");
      if (!this.el.showModal) { // ancient fallback: behave like a fixed div
        this.el.showModal = function () { this.setAttribute("open", "open"); };
        this.el.close = function () { this.removeAttribute("open"); };
      }
      var self = this;
      this.el.addEventListener("cancel", function (e) { e.preventDefault(); }); // no Esc-dismiss
      this.el.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-choice]");
        if (btn && !btn.disabled && self.onChoose) self.onChoose(btn.getAttribute("data-choice"));
      });
    },

    show: function (opts) {
      var esc = UI.esc;
      var html = "";
      if (opts.imgSrc) html += '<img class="modal-img" src="' + esc(opts.imgSrc) + '" alt="">';
      if (opts.kicker) html += '<div class="modal-kicker">' + esc(opts.kicker) + "</div>";
      html += '<h2 class="modal-title">' + esc(opts.title) + "</h2>";
      if (opts.bodyHTML) html += '<div class="modal-body">' + opts.bodyHTML + "</div>";
      if (opts.choices && opts.choices.length) {
        html += '<div class="modal-choices">';
        opts.choices.forEach(function (c) {
          html += '<button class="choice-btn" data-choice="' + esc(c.id) + '"' + (c.enabled === false ? " disabled" : "") + ">"
            + '<span class="choice-label">' + esc(c.label) + "</span>"
            + (c.detail ? '<span class="choice-detail">' + esc(c.detail) + "</span>" : "")
            + (c.enabled === false && c.reason ? '<span class="choice-reason">' + esc(c.reason) + "</span>" : "")
            + "</button>";
        });
        html += "</div>";
      }
      this.el.innerHTML = html;
      this.onChoose = opts.onChoose || null;
      if (!this.el.open) this.el.showModal();
    },

    close: function () {
      if (this.el && this.el.open) this.el.close();
      this.onChoose = null;
    }
  };
})(typeof BAM !== "undefined" ? BAM : require("../namespace.js"));
