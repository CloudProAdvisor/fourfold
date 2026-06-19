/* The ten action spaces. Display data + costs/gating here; resolution logic lives
   in engine.js ACTION_HANDLERS (actions are core rules; events are the extensible content). */
(function (BAM) {
  "use strict";

  BAM.DATA.actions = [
    {
      id: "fulfill", name: "Fulfill Orders", icon: "📦", energy: 1,
      desc: "Earn $3 × min(Staff, Demand), plus a skilled bonus. Repeat uses this quarter earn half (rush jobs).",
      needsStaff: true, repeatable: true
    },
    {
      id: "market", name: "Market & Sell", icon: "📣", energy: 1,
      desc: "Demand +1. New customers, new orders.",
      oncePerRound: true
    },
    {
      id: "hire", name: "Hire Locally", icon: "🤝", energy: 1, cashCostKey: "hireCost",
      desc: "+1 Staff, Social +1. Jobs are impact."
    },
    {
      id: "train", name: "Train Staff", icon: "🎓", energy: 1, cash: 3,
      desc: "Upgrade one worker to Skilled. Social +1. Skilled staff earn more and resist poaching."
    },
    {
      id: "facilities", name: "Improve Facilities", icon: "🏭", energy: 1, cash: 5,
      desc: "Tier 1: Safe Workshop (Social +1, halves accident damage). Tier 2: Clean Production (Env +2). Tier 3: Solar & Recycling (Env +2, −$1 wages/quarter)."
    },
    {
      id: "relate", name: "Build Relationships", icon: "🍵", energy: 1,
      desc: "Trust +1. Tea with officials, neighbours, the landlord.",
      oncePerRound: true
    },
    {
      id: "serve", name: "Serve the Community", icon: "🌱", energy: 1, cash: 2,
      desc: "Social +1, Trust +1. If Trust ≥ 6, also Spiritual +1 — people start asking why."
    },
    {
      id: "opendoor", name: "Open Door", icon: "🚪", energy: 1, minTrust: 4,
      desc: "Spiritual conversations with willing staff & neighbours. Spiritual +1 (+2 if Trust ≥ 8).",
      oncePerRound: true,
      lockedTip: "No one's asking yet. Earn the right to be heard. (Needs Trust 4+)"
    },
    {
      id: "sabbath", name: "Sabbath", icon: "🕯️", energy: 1,
      desc: "Clear all Burnout, Spiritual +1. Rest is an act of trust, not lost productivity.",
      oncePerRound: true
    },
    {
      id: "funding", name: "Seek Funding", icon: "🏦", energy: 1,
      desc: "Raise money: a donor grant, an investor round, or a bank loan — each shapes your future differently.",
      subs: [
        { id: "donorGrant", name: "Donor grant", desc: "+$8 now. Dependency +1 — donor money is fast but distorting." },
        { id: "investorRound", name: "Investor round", desc: "+$12 once per game. Pay a $1 dividend every quarter after." },
        { id: "bankLoan", name: "Bank loan", desc: "+$6 now, repay $4 at each of the next two quarters." }
      ]
    }
  ];
})(typeof BAM !== "undefined" ? BAM : require("../js/namespace.js"));
