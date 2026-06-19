/* The two Cooper Street neighbours — cautionary models, not enemies.
   Their per-round progression is scripted in js/ai.js from these profiles. */
(function (BAM) {
  "use strict";

  BAM.DATA.rivals = [
    {
      id: "argent",
      name: "Argent Exports",
      short: "Argent",
      blurb: "A sharp expat trader. One bottom line, pursued brilliantly.",
      start: { financial: 3, social: 1, environmental: 1, spiritual: 0 },
      epilogue: "Argent Exports posted record margins every year. Ask anyone on Cooper Street what Argent is *for*, and you get a shrug. The formula gives it a 3× multiplier on its lowest line — which is zero."
    },
    {
      id: "hopedoor",
      name: "Hope Door Center",
      short: "Hope Door",
      blurb: "A kind-hearted foreign-run craft 'business' that has never priced anything at cost.",
      start: { financial: 1, social: 2, environmental: 2, spiritual: 2 },
      pivotRound: 7,
      pivotText: "Hope Door's funding agency announces a strategy shift to another region. The programmes begin to close.",
      epilogue: "Hope Door did real good — for exactly as long as someone else paid for it. When the donor strategy changed, the good ended with the grant.",
      epiloguePartnered: "Hope Door's funding still ended — but the trainees who came through your workshop floor kept their skills, and several kept their jobs. Partnership softened the landing."
    }
  ];
})(typeof BAM !== "undefined" ? BAM : require("../js/namespace.js"));
