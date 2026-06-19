/* The event deck — every card is grounded in a documented BAM practitioner challenge.
   Declarative: engine.applyEffects interprets the `effects` objects; no card needs code.

   Card shape:
     id, band: early|mid|late, tags[], title, flavor,
     require   — deck-eligibility (card skipped while unmet), e.g. {burnout:1}
     auto      — {require, text, effects}: if require met at draw, card resolves itself
     autoOnly  — true: no dilemma, just auto.text/effects and a Continue button
     choices[] — {id, label, detail, require?, effects?, branches?, chance?}
        branches: first entry whose require matches applies (last entry = no require)
        chance:   {p, text, effects, elseText, elseEffects} — seeded RNG decides
     insight   — the BAM teaching takeaway shown after resolving

   Effects keys: cash trust demand staff skilled energyNext dependency burnout
     burnoutClear covered financial social environmental spiritual warning
     flag:{} addLate removeLate loan:{now,repay[]} loseRevenue
     schedule:[{inRounds,effects,label}] modifier:{id,label,cashPerRound,rounds}
   Tags with rules: "corruption" (cash costs double if you ever paid a bribe),
     "accident" (cash damage halved by Facilities Tier 1+). */
(function (BAM) {
  "use strict";

  BAM.DATA.events = [

    /* ============ EARLY (rounds 1–2 draw from here) ============ */
    {
      id: "inspector", band: "early", tags: ["corruption"],
      title: "The Inspector's Envelope",
      flavor: "A customs officer holds your fabric shipment and mentions an unofficial “expedite fee.” Your staff are watching how you respond.",
      choices: [
        { id: "a", label: "Pay it.", detail: "−$3, shipment clears. Spiritual −1. Word gets around.",
          effects: { cash: -3, spiritual: -1, flag: { bribePaid: true } } },
        { id: "b", label: "Refuse.", detail: "Lose $4 of revenue (shipment delayed). Trust +1, Spiritual +1.",
          effects: { cash: -4, trust: 1, spiritual: 1, flag: { bribeRefused: true } } },
        { id: "c", label: "Call your contact at the ministry.", detail: "Shipment clears free. Trust −1 — you spent a favour.",
          require: { trust: 6 }, effects: { trust: -1 } }
      ],
      insight: "Integrity is expensive once. Bribery is expensive forever."
    },
    {
      id: "visa", band: "early", tags: [],
      title: "Visa Renewal",
      flavor: "Your residence permit is up for renewal and the rules changed — again. Plenty of foreigners have quietly not come back from “paperwork trips.”",
      auto: { require: { trust: 5 }, text: "An official remembers you from tea last spring. Stamped, smiled, done — no cost.", effects: {} },
      choices: [
        { id: "a", label: "Hire a fixer.", detail: "−$2, done.", effects: { cash: -2 } },
        { id: "b", label: "Queue yourself.", detail: "Days in line: start next quarter with one less Energy.", effects: { energyNext: -1 } }
      ],
      insight: "Your legal standing is part of your witness — and your relationships are your real visa."
    },
    {
      id: "cashflow", band: "early", tags: [],
      title: "Cash-Flow Crunch",
      flavor: "Your biggest customer is 60 days late paying. Payroll is Friday.",
      choices: [
        { id: "a", label: "Quick loan.", detail: "+$6 now, repay $4 at each of the next two quarters.",
          effects: { loan: { now: 6, repay: [4, 4] } } },
        { id: "b", label: "Delay wages a week.", detail: "Social −1, Trust −1. Staff start asking if this business is real.",
          effects: { social: -1, trust: -1 } },
        { id: "c", label: "Absorb it from reserves.", detail: "No effect — this is what reserves are for.",
          require: { cash: 12 }, effects: {} }
      ],
      insight: "Most BAM businesses don't die of bad mission. They die of bad cash flow."
    },
    {
      id: "rina", band: "early", tags: ["staffcare"],
      require: { staff: 1 },
      title: "Your Best Worker's Mother",
      flavor: "Rina, your most capable worker, must return to her village to care for her mother. She's ashamed to ask for help.",
      choices: [
        { id: "a", label: "Hold her job open and send her with a month's wage.",
          detail: "−$2, −1 Staff for two quarters; she returns Skilled. Social +1, Trust +1.",
          effects: { cash: -2, staff: -1, social: 1, trust: 1,
            schedule: [{ inRounds: 2, effects: { staff: 1, skilled: 1 }, label: "Rina returns — steadier and sharper than ever." }] } },
        { id: "b", label: "Replace her.", detail: "−1 Staff now; hiring is free next quarter.",
          effects: { staff: -1, flag: { freeHire: true } } }
      ],
      insight: "Employee welfare is a bottom line, not a perk."
    },
    {
      id: "windfall", band: "early", tags: ["funding"],
      title: "Donor Windfall",
      flavor: "A foreign foundation loves your story and offers a grant — no strings, they say.",
      choices: [
        { id: "a", label: "Accept.", detail: "+$8, Dependency +1.", effects: { cash: 8, dependency: 1 } },
        { id: "b", label: "Counter-propose a matching loan.", detail: "+$4 now, repay $4 in three quarters. No Dependency.",
          effects: { cash: 4, schedule: [{ inRounds: 3, effects: { cash: -4 }, label: "Foundation loan repaid, with thanks." }] } },
        { id: "c", label: "Decline with thanks.", detail: "Spiritual +1 — clarity of identity.", effects: { spiritual: 1 } }
      ],
      insight: "If donations cover payroll, you have a project, not a business. Projects end when donors do."
    },
    {
      id: "prayernet", band: "early", tags: [],
      title: "The Prayer Network",
      flavor: "Eleven people back home offer to pray for the business weekly — if you'll actually tell them what's happening.",
      choices: [
        { id: "a", label: "Commit to monthly updates.", detail: "−1 Energy next quarter; gain a Covered token (cancel one bad event effect later).",
          effects: { energyNext: -1, covered: 1, flag: { prayerNetwork: true } } },
        { id: "b", label: "“I'll add you to the newsletter.”", detail: "No effect.", effects: {} }
      ],
      insight: "Intercession is infrastructure. The 10 BAM principles list prayer beside profitability for a reason."
    },
    {
      id: "wiring", band: "early", tags: [],
      title: "Exposed Wiring",
      flavor: "A near-miss: sparks from the old fuse box, a bin of fabric scraps. Nobody hurt. This time.",
      choices: [
        { id: "a", label: "Rewire properly.", detail: "−$3, Environmental +1. Removes the fire risk for good.",
          effects: { cash: -3, environmental: 1, removeLate: "fire", flag: { rewired: true } } },
        { id: "b", label: "Tape it and keep moving.", detail: "Free. The fuse box remembers.", effects: {} }
      ],
      insight: "Excellence is invisible until the day it isn't."
    },
    {
      id: "wedding", band: "early", tags: [],
      require: { staff: 1 },
      title: "The Wedding",
      flavor: "Your newest worker's brother is getting married. The whole street is invited. So are you — which means something here.",
      choices: [
        { id: "a", label: "Attend, with a proper gift.", detail: "−$2, −1 Energy next quarter. Trust +2.",
          effects: { cash: -2, energyNext: -1, trust: 2 } },
        { id: "b", label: "Send regrets — orders are due.", detail: "Trust −1.", effects: { trust: -1 } }
      ],
      insight: "In Talem, belonging is built at weddings and funerals, not in meetings."
    },

    /* ============ MID (rounds 4–5, 7 draw from here) ============ */
    {
      id: "supplier", band: "mid", tags: [],
      title: "The Cheap Supplier",
      flavor: "A broker offers fabric 30% cheaper. Everyone uses him. There are rumours about his dye-house: river dumping, kids on the floor.",
      choices: [
        { id: "a", label: "Take the deal.", detail: "+$2 every quarter. Environmental −1, Social −1. Rumours have a way of surfacing.",
          effects: { environmental: -1, social: -1, addLate: "exposed",
            modifier: { id: "cheapSupply", label: "Cheap supplier (+$2/qtr)", cashPerRound: 2, rounds: null } } },
        { id: "b", label: "Decline and source clean.", detail: "−$1 every quarter, Environmental +1.",
          effects: { environmental: 1,
            modifier: { id: "cleanSupply", label: "Clean sourcing (−$1/qtr)", cashPerRound: -1, rounds: null } } }
      ],
      insight: "Your supply chain is your ethics, outsourced."
    },
    {
      id: "currency", band: "mid", tags: [],
      title: "Currency Shock",
      flavor: "Overnight the Sorvan denar drops 20%. Your imported materials just got expensive; so did everything your staff buy.",
      auto: { require: { facilities: 2 }, text: "Clean local production means you barely import — the shock costs you only $1.", effects: { cash: -1 } },
      choices: [
        { id: "a", label: "Raise prices.", detail: "Demand −1, no cash loss.", effects: { demand: -1 } },
        { id: "b", label: "Absorb it.", detail: "−$4.", effects: { cash: -4 } }
      ],
      insight: "Resilience is built before the shock, not during it."
    },
    {
      id: "twomasters", band: "mid", tags: [],
      title: "Two Masters",
      flavor: "Your sending church writes: “We've supported you for two years. How many conversions?” Your business mentor writes the same week: “Why isn't margin growing?”",
      choices: [
        { id: "a", label: "Spend a week on reports framing the numbers each wants.", detail: "−1 Energy next quarter.",
          effects: { energyNext: -1 } },
        { id: "b", label: "Invite both to visit Talem.", detail: "−$3. Trust +1, Spiritual +1 — they've seen it now.",
          effects: { cash: -3, trust: 1, spiritual: 1, flag: { visited: true } } }
      ],
      insight: "Dual accountability tension is normal. Transparency, not spin, resolves it."
    },
    {
      id: "empty", band: "mid", tags: [],
      require: { burnout: 1 },
      title: "Running on Empty",
      flavor: "You wake at 4 a.m. doing payroll math. You can't remember the last time you prayed without an agenda.",
      choices: [
        { id: "a", label: "Push through.", detail: "Spiritual −1, and one less Energy next quarter.",
          effects: { spiritual: -1, energyNext: -1 } },
        { id: "b", label: "Take a retreat week.", detail: "Start next quarter with one less Energy, but clear all Burnout. Spiritual +2.",
          effects: { energyNext: -1, burnoutClear: true, spiritual: 2 } }
      ],
      insight: "You are the business's most fragile asset. Sabbath is maintenance, not indulgence."
    },
    {
      id: "scrutiny", band: "mid", tags: [],
      title: "Quiet Word from the Ministry",
      flavor: "An official mentions, politely, that “religious activity by foreigners is being reviewed.” Your Open Door evenings have been noticed.",
      choices: [
        { id: "a", label: "Pause and go quiet.", detail: "Open Door locked for two quarters. Safe.",
          effects: { flag: { openDoorLocked: 2 } } },
        { id: "b", label: "Continue, openly and lawfully.",
          detail: "If the city trusts you, officials shrug. If not, a formal warning. (Two warnings = expulsion.)",
          branches: [
            { require: { trust: 6 }, text: "The official shrugs. “You run a clean shop. Carry on.”", effects: { spiritual: 1 } },
            { text: "A formal warning arrives by courier. The neighbourhood notices.", effects: { trust: -2, warning: 1 } }
          ] }
      ],
      insight: "Courage and wisdom aren't opposites. Local trust often decides which one the moment requires."
    },
    {
      id: "flood", band: "mid", tags: [],
      title: "The Flood",
      flavor: "The river takes the lower district in a night. Your workshop is dry. Half your staff's families are not.",
      choices: [
        { id: "a", label: "Close for a week and mobilise.", detail: "Lose this quarter's order income. Social +2, Trust +2, Spiritual +1.",
          effects: { loseRevenue: true, social: 2, trust: 2, spiritual: 1 } },
        { id: "b", label: "Donate relief funds.", detail: "−$3, Social +1.", effects: { cash: -3, social: 1 } },
        { id: "c", label: "Stay open — orders are due.", detail: "Keep the income. Trust −2.", effects: { trust: -2 } }
      ],
      insight: "Crises are when the community learns what your business is actually for."
    },
    {
      id: "knock", band: "mid", tags: [],
      title: "A Knock After Hours",
      flavor: "Your foreman stays after closing. “When the inspector wanted money — why didn't you pay? Everyone pays.” He genuinely wants to know.",
      choices: [
        { id: "a", label: "Make tea. Take the evening.",
          detail: "One less Energy next quarter. Spiritual +2 (+1 more if you've refused a bribe).",
          effects: { energyNext: -1 },
          branches: [
            { require: { flag: "bribeRefused" }, text: "He nods slowly. “I saw what it cost you. That's why I'm asking.”", effects: { spiritual: 3 } },
            { text: "The tea goes cold twice. Some questions deserve a whole evening.", effects: { spiritual: 2 } }
          ] },
        { id: "b", label: "“Great question — let's talk Friday.”",
          chance: { p: 0.5, text: "Friday comes, and he does ask again.", effects: { spiritual: 1 },
            elseText: "By Friday the moment has passed. He doesn't bring it up again.", elseEffects: {} } }
      ],
      insight: "Witness is rarely scheduled. It's the interruption you make room for."
    },
    {
      id: "poach", band: "mid", tags: ["staffcare"],
      require: { skilled: 1 },
      title: "The Poach",
      flavor: "Argent Exports offers your skilled worker half again her salary. She tells you herself — which says something.",
      choices: [
        { id: "a", label: "Match it.", detail: "Wages permanently +$1 per quarter.", effects: { wageBonus: 1 } },
        { id: "b", label: "Bless her and let her go.", detail: "Lose 1 Skilled worker. Social +1 — you trained someone the city now values.",
          effects: { staff: -1, skilled: -1, social: 1 } },
        { id: "c", label: "“It's not only about the money here.”", detail: "She stays. Spiritual +1.",
          require: { trust: 6 }, effects: { spiritual: 1 } }
      ],
      insight: "You can't out-pay a profit machine. You can out-mean it."
    },
    {
      id: "counting", band: "mid", tags: [],
      title: "Counting What Matters",
      flavor: "A supporting network wants metrics: “Decisions? Baptisms? Numbers, please.”",
      choices: [
        { id: "a", label: "Send numbers that flatter.",
          detail: "Immediate goodwill. The debrief will remember.",
          branches: [
            { require: { flag: "visited" }, text: "They've seen Talem themselves — your gentle pushback lands well.", effects: {} },
            { text: "The numbers look great. You know what they're worth.", effects: { flag: { inflatedReporting: true } } }
          ] },
        { id: "b", label: "Send stories — named people, slow change.",
          branches: [
            { require: { spiritual: 3 }, text: "There are real stories to tell, and you tell them honestly. Spiritual +1.", effects: { spiritual: 1 } },
            { text: "You write honestly — and notice how few stories there are yet. That's worth knowing too.", effects: {} }
          ] }
      ],
      insight: "Spiritual fruit resists spreadsheets. Measure faithfulness; narrate fruit."
    },
    {
      id: "landlord", band: "mid", tags: [],
      title: "Landlord's New Math",
      flavor: "Your landlord has discovered what foreign tenants pay in the capital. He slides a new contract across the table.",
      choices: [
        { id: "a", label: "Pay the new rent.", detail: "−$1 every quarter from now on.",
          effects: { modifier: { id: "rentHike", label: "Raised rent (−$1/qtr)", cashPerRound: -1, rounds: null } } },
        { id: "b", label: "Relocate across town.", detail: "−$5 once, Trust −1 — the street notices you leaving.",
          effects: { cash: -5, trust: -1 } },
        { id: "c", label: "Negotiate over a long lunch.", detail: "He keeps the old rate. “For a neighbour.”",
          require: { trust: 6 }, effects: {} }
      ],
      insight: "Every cost line is also a relationship."
    },
    {
      id: "powercuts", band: "mid", tags: [],
      title: "Power Cuts",
      flavor: "Rolling blackouts hit the industrial quarter. Machines idle; deadlines don't.",
      choices: [
        { id: "a", label: "Buy a diesel generator.", detail: "−$4, Environmental −1.", effects: { cash: -4, environmental: -1 } },
        { id: "b", label: "Invest in solar + batteries.", detail: "−$7, Environmental +1.", effects: { cash: -7, environmental: 1 } },
        { id: "c", label: "Work around the outages.", detail: "−$2 per quarter for two quarters.",
          effects: { modifier: { id: "outages", label: "Blackout losses (−$2/qtr)", cashPerRound: -2, rounds: 2 } } }
      ],
      insight: "Infrastructure choices are stewardship choices."
    },
    {
      id: "survivor", band: "mid", tags: ["staffcare"],
      title: "The Survivor",
      flavor: "A local shelter asks if you'd employ a young woman rebuilding her life after trafficking. No work history. No references. A lot of courage.",
      choices: [
        { id: "a", label: "Hire her, with extra training and patience.", detail: "−$3. +1 Staff, Social +2, Spiritual +1.",
          effects: { cash: -3, staff: 1, social: 2, spiritual: 1 } },
        { id: "b", label: "Refer her to a bigger employer.", detail: "No effect.", effects: {} }
      ],
      insight: "Freedom businesses exist because a job is the most durable rescue there is."
    },
    {
      id: "theft", band: "mid", tags: ["staffcare"],
      require: { staff: 1 },
      title: "Theft from the Till",
      flavor: "The numbers don't lie: someone trusted has been skimming. He doesn't deny it. His father's medical bills don't either.",
      choices: [
        { id: "a", label: "Restorative path: he stays, repays in instalments.",
          detail: "Trust +1, Spiritual +1. Some risk he slips again.",
          chance: { p: 0.25,
            text: "Months later it happens again — smaller, sadder. (−$2.) You handle it quietly.", effects: { trust: 1, spiritual: 1, cash: -2 },
            elseText: "He repays every denar, and tells the whole floor why.", elseEffects: { trust: 1, spiritual: 1 } } },
        { id: "b", label: "Dismiss him.", detail: "Clean and final. Social −1.", effects: { social: -1 } }
      ],
      insight: "Grace is a risk. So is a workplace where no one believes in second chances."
    },
    {
      id: "gathering", band: "mid", tags: [],
      title: "BAM Gathering in the Capital",
      flavor: "Two days, forty practitioners, one borrowed conference room. People who actually understand your life.",
      choices: [
        { id: "a", label: "Attend.", detail: "−$2, one less Energy next quarter. Better funding terms from now on, Spiritual +1.",
          effects: { cash: -2, energyNext: -1, spiritual: 1, flag: { networked: true } } },
        { id: "b", label: "Skip it — the workshop needs you.", detail: "No effect.", effects: {} }
      ],
      insight: "Strategic networking is a BAM principle, not a luxury. Nobody builds this alone."
    },
    {
      id: "mentor", band: "mid", tags: [],
      title: "The Mentor's Visit",
      flavor: "A veteran practitioner — three businesses, two countries, one famously dry sense of humour — is in Talem for a week. “What shall we look at?”",
      choices: [
        { id: "a", label: "The books.", detail: "Financial +1.", effects: { financial: 1 } },
        { id: "b", label: "The team.", detail: "Social +1.", effects: { social: 1 } },
        { id: "c", label: "Your soul.", detail: "Clear Burnout, Spiritual +1.", effects: { burnoutClear: true, spiritual: 1 } }
      ],
      insight: "Wise counsel goes where you point it. Pointing it at yourself is the brave option."
    },

    /* ============ LATE (rounds 8, 10 draw from here) ============ */
    {
      id: "accusation", band: "late", tags: [],
      title: "False Accusation",
      flavor: "An anonymous complaint accuses you of smuggling. You know exactly which competitor wrote it.",
      auto: { require: { trust: 5 }, text: "The investigating officer laughs. “You? Half the street vouched before I'd parked.” Case closed.", effects: {} },
      choices: [
        { id: "a", label: "Hire a lawyer.", detail: "−$4 in fees. It goes away.", effects: { cash: -4 } },
        { id: "b", label: "Let the process run.", detail: "Trust −2 while the rumour breathes.", effects: { trust: -2 } }
      ],
      insight: "Reputation is a defence you build before you need it."
    },
    {
      id: "festival", band: "late", tags: [],
      title: "Festival Order Surge",
      flavor: "The festival season hits and a wholesaler wants triple volume — by Thursday.",
      choices: [
        { id: "a", label: "Take it. Overtime for everyone.", detail: "+$6, Burnout +1.", effects: { cash: 6, burnout: 1 } },
        { id: "b", label: "Take what you can do well.", detail: "+$2, Social +1 — staff notice you protecting their evenings.",
          effects: { cash: 2, social: 1 } }
      ],
      insight: "Every yes is a no to something. Sometimes the no is to your people's rest."
    },
    {
      id: "copycat", band: "late", tags: [],
      title: "The Copycat",
      flavor: "A stall across the river is selling your exact product line, stitched a little worse, priced a lot less.",
      choices: [
        { id: "a", label: "Innovate past them.", detail: "−$2 and one less Energy next quarter. Demand +1.",
          effects: { cash: -2, energyNext: -1, demand: 1 } },
        { id: "b", label: "Compete on price.", detail: "−$2 every quarter for two quarters.",
          effects: { modifier: { id: "priceWar", label: "Price war (−$2/qtr)", cashPerRound: -2, rounds: 2 } } }
      ],
      insight: "Excellence, not outrage, is the answer to imitation."
    },
    {
      id: "eco", band: "late", tags: [],
      title: "Eco Directive",
      flavor: "New national wastewater regulations land on every workshop in Talem, effective immediately.",
      auto: { require: { facilities: 2 }, text: "Your clean production line already complies. The inspector takes notes — for the others. Environmental +1.", effects: { environmental: 1 } },
      choices: [
        { id: "a", label: "Retrofit properly.", detail: "−$5, compliant.", effects: { cash: -5 } },
        { id: "b", label: "Operate quietly out of spec.", detail: "Environmental −2, and a coin-toss with the fines office.",
          chance: { p: 0.5, text: "The fines office finds you. −$3.", effects: { environmental: -2, cash: -3 },
            elseText: "No inspection comes. The river knows, though.", elseEffects: { environmental: -2 } } }
      ],
      insight: "Creation care that waits for enforcement isn't stewardship, it's compliance."
    },
    {
      id: "audit", band: "late", tags: ["corruption"],
      title: "Audit Season",
      flavor: "Tax auditors are working down Cooper Street, shop by shop. Yours is Tuesday.",
      autoOnly: true,
      auto: {
        branches: [
          { require: { flag: "bribePaid" }, text: "The auditor lingers on the “miscellaneous fees” column. It costs $3 and a long afternoon to explain.", effects: { cash: -3 } },
          { text: "Clean books, clean pass. The auditor is almost disappointed. Trust +1.", effects: { trust: 1 } }
        ]
      },
      insight: "Transparent books are slow-motion evangelism to every official who reads them."
    },
    {
      id: "partner", band: "late", tags: [],
      title: "The Partner Offer",
      flavor: "Hope Door Center proposes a joint job-training programme: your workshop floor, their trainees.",
      choices: [
        { id: "a", label: "Accept.", detail: "−$2. Social +1, Spiritual +1 — and Hope Door's people gain real commercial skills.",
          effects: { cash: -2, social: 1, spiritual: 1, flag: { partnered: true } } },
        { id: "b", label: "Decline — their model worries you.", detail: "No effect.", effects: {} }
      ],
      insight: "Platforms and businesses need each other more than they admit."
    },
    {
      id: "rain", band: "late", tags: [],
      title: "Rain After Drought",
      flavor: "No crisis this quarter. Orders arrive on time, the river behaves, and somebody leaves bread at your door with a note: “for the flood.”",
      autoOnly: true,
      auto: { text: "A season where things simply go well. +$3, Trust +1.", effects: { cash: 3, trust: 1 } },
      insight: "Practitioners report unexplained provision too. Gratitude is also a discipline."
    },
    {
      id: "fire", band: "late", tags: ["accident"],
      title: "Workshop Fire",
      flavor: "The fuse box you taped finally speaks its mind. Smoke, scrap, a terrified apprentice — everyone out safely, barely.",
      autoOnly: true,
      auto: { text: "Stock and equipment lost. −$8, Social −1, Trust −1. (Halved damage with a Safe Workshop.)", effects: { cash: -8, social: -1, trust: -1 } },
      insight: "Deferred maintenance is a loan from the future, at loan-shark rates."
    },
    {
      id: "exposed", band: "late", tags: [], addedOnly: true,
      title: "Exposed",
      flavor: "A capital-city journalist traces festival garments back through your cheap broker to the dye-house — the dumping, the children. Your name is in paragraph four.",
      autoOnly: true,
      auto: { text: "Trust −3. The big year-end contract quietly stops returning your calls.", effects: { trust: -3, flag: { contractBanned: true } } },
      insight: "You outsourced the stitching, not the responsibility."
    }
  ];

  /* Contract tenders on rounds 3, 6, 9 — engine builds the card dynamically.
     Player bid = Staff + Skilled + floor(Trust/3) (+2 if sharpened or Covered). */
  BAM.DATA.contracts = {
    3: { base: 4, name: "The Schoolwear Tender", flavor: "The district school board tenders its uniform contract. Argent Exports wants it too." },
    6: { base: 6, name: "The Port Authority Contract", flavor: "The port authority needs supplier kit for two hundred workers. Argent's bid is already in." },
    9: { base: 8, name: "The Capital Buyer", flavor: "A department store buyer from the capital is choosing one Talem supplier for next year. Argent has booked the same restaurant." }
  };
})(typeof BAM !== "undefined" ? BAM : require("../js/namespace.js"));
