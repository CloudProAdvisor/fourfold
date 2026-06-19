/* Debrief content: per-event teaching points (mapped to BAM guiding principles)
   and the ten principle badges with their earn conditions (checked in debrief.js). */
(function (BAM) {
  "use strict";

  /* eventId -> { principle, reflection } — used when an event shows up among the
     player's pivotal choices on the debrief screen. */
  BAM.DATA.teaching = {
    inspector:  { principle: "Ethical, Christ-honouring practice", reflection: "Corruption is the single most-reported dilemma among BAM practitioners. The first envelope sets the price of every one that follows." },
    visa:       { principle: "Excellence & integrity", reflection: "Practitioners say their legal standing — visas, licences, taxes — is watched more closely than their preaching ever is." },
    cashflow:   { principle: "Profitability & sustainability", reflection: "Cash-flow, not persecution, closes most kingdom businesses. Reserves are a spiritual discipline with a bank balance." },
    rina:       { principle: "Holistic employee welfare", reflection: "The quadruple bottom line starts with how you treat the person standing closest to you." },
    windfall:   { principle: "Profitability & sustainability", reflection: "Donor money is fast and warm — and quietly rewires a business around pleasing donors instead of customers." },
    prayernet:  { principle: "Intercession & prayer support", reflection: "The BAM principles list prayer support beside profitability. Practitioners who build it report resilience the others envy." },
    wiring:     { principle: "Excellence & integrity", reflection: "Safety spending never shows up in the testimony newsletter — until the quarter it would have." },
    wedding:    { principle: "Strategic networking", reflection: "Presence at the table before you need anything is what makes the table there when you do." },
    supplier:   { principle: "Holistic transformation", reflection: "A BAM business is accountable for its whole chain — the river downstream of the dye-house included." },
    currency:   { principle: "Profitability & sustainability", reflection: "Macro shocks are normal in least-reached economies. Resilience is bought in the calm quarters." },
    twomasters: { principle: "Kingdom motivation & purpose", reflection: "Dual accountability — church asking about souls, investors about margins — is the practitioner's permanent weather. Transparency beats spin." },
    empty:      { principle: "Servant leadership", reflection: "Founder burnout is among the top reported reasons BAM ventures fail. You are stewarding yourself too." },
    scrutiny:   { principle: "Excellence & integrity", reflection: "In sensitive contexts, the question is rarely courage vs. fear — it's whether you've earned the local trust that makes courage wise." },
    flood:      { principle: "Holistic transformation", reflection: "Communities permanently re-categorise a business by what it does in the worst week, not the best quarter." },
    knock:      { principle: "Kingdom motivation & purpose", reflection: "Most spiritual conversations practitioners report began with someone asking about a business decision." },
    poach:      { principle: "Holistic employee welfare", reflection: "People stay for meaning at rates money can't match — but only where dignity has been real all along." },
    counting:   { principle: "Kingdom motivation & purpose", reflection: "Spiritual impact resists metrics. Honest stories beat inflated numbers — and inflated numbers always come due." },
    landlord:   { principle: "Strategic networking", reflection: "Every line of your cost structure is also a relationship that can be tended or burned." },
    powercuts:  { principle: "Creation care", reflection: "Energy choices are where environmental stewardship stops being abstract." },
    survivor:   { principle: "Holistic transformation", reflection: "Freedom businesses — employing trafficking survivors — are one of the BAM movement's most distinctive contributions." },
    theft:      { principle: "Servant leadership", reflection: "Restorative discipline is riskier than dismissal and changes a workplace's idea of what's possible." },
    gathering:  { principle: "Strategic networking", reflection: "Isolation is the practitioner's default. The network is how wisdom compounds." },
    mentor:     { principle: "Servant leadership", reflection: "The veterans all say it: get a mentor before the crisis, not during." },
    accusation: { principle: "Excellence & integrity", reflection: "False accusations are common where competitors can weaponise bureaucracy. Reputation is the cheapest lawyer." },
    festival:   { principle: "Holistic employee welfare", reflection: "Growth that's paid for with your people's rest is a loan against the social bottom line." },
    copycat:    { principle: "Excellence & integrity", reflection: "Imitation is a tax on success. Excellence is the only sustainable moat." },
    eco:        { principle: "Creation care", reflection: "Environmental stewardship that waits for regulators isn't stewardship." },
    audit:      { principle: "Ethical, Christ-honouring practice", reflection: "Clean books are a witness statement that every official can read." },
    partner:    { principle: "Strategic networking", reflection: "Businesses and ministry platforms sharpen each other when they partner honestly about what each is." },
    rain:       { principle: "Intercession & prayer support", reflection: "Not everything that goes well has an explanation in the spreadsheet." },
    fire:       { principle: "Excellence & integrity", reflection: "Deferred maintenance is a decision, even when it doesn't feel like one." },
    exposed:    { principle: "Holistic transformation", reflection: "Supply-chain shortcuts surface at the worst moment, with interest." },
    contract:   { principle: "Profitability & sustainability", reflection: "Winning real commercial contracts against real competitors is what makes a BAM business a business." }
  };

  /* The 10 BAM Guiding Principles as discoverable badges.
     `check` is evaluated by debrief.js against final state. */
  BAM.DATA.badges = [
    { id: "profitability", name: "Profitability & Sustainability", desc: "Four consecutive profitable quarters." },
    { id: "excellence",    name: "Excellence & Integrity",         desc: "Refused the envelope, or passed audit season with clean books." },
    { id: "purpose",       name: "Kingdom Motivation & Purpose",   desc: "Finished with Spiritual 5 or higher." },
    { id: "holistic",      name: "Holistic Transformation",        desc: "Finished with every bottom line at 4 or higher." },
    { id: "welfare",       name: "Holistic Employee Welfare",      desc: "Chose for your people in three staff dilemmas." },
    { id: "impact",        name: "Maximise Kingdom Impact",        desc: "Final score of 45 or higher." },
    { id: "servant",       name: "Servant Leadership",             desc: "Took Sabbath at least three times." },
    { id: "ethics",        name: "Ethical, Christ-Honouring Practice", desc: "Never paid a bribe, all game." },
    { id: "prayer",        name: "Intercession & Prayer Support",  desc: "Built the prayer network." },
    { id: "networking",    name: "Strategic Networking",           desc: "Attended the BAM gathering and won a contract." }
  ];
})(typeof BAM !== "undefined" ? BAM : require("../js/namespace.js"));
