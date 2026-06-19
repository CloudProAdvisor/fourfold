/* Setup options: business variants, funding models, difficulty seasons.
   Pure data — interpreted by state.newGame(). */
(function (BAM) {
  "use strict";

  BAM.DATA.meta = {
    title: "FOURFOLD",
    tagline: "Build a business that's good news — in every column of the ledger.",
    country: "the Republic of Sorvana",
    city: "Talem"
  };

  BAM.DATA.businesses = [
    {
      id: "textile",
      name: "Talem Textiles",
      blurb: "A garment workshop on Cooper Street. Steady demand, thin margins, lots of hands.",
      img: "assets/img/textile.webp",
      hireCost: 4, skilledIncome: 1, demandCap: 5, trustBonus: 0
    },
    {
      id: "cafe",
      name: "Café Talem",
      blurb: "A riverside café where half the city's conversations happen. Relationships come easier; the market is smaller.",
      img: "assets/img/cafe.webp",
      hireCost: 4, skilledIncome: 1, demandCap: 4, trustBonus: 1
    },
    {
      id: "digital",
      name: "Talem Digital",
      blurb: "A small software-services shop. Skilled staff are gold — and expensive to find.",
      img: "assets/img/digital.webp",
      hireCost: 6, skilledIncome: 2, demandCap: 5, trustBonus: 0
    }
  ];

  BAM.DATA.fundings = [
    {
      id: "bootstrapped",
      name: "Bootstrapped",
      blurb: "Your savings and nothing else. Hard early, clean late.",
      cash: 20, dependency: 0, dividend: 0
    },
    {
      id: "donor",
      name: "Donor-Launched",
      blurb: "A sending agency covered your start-up costs. Easy early — but donor money shapes what you become.",
      cash: 35, dependency: 2, dividend: 0
    },
    {
      id: "investor",
      name: "Investor-Backed",
      blurb: "Kingdom-minded investors expect a return. A middle path, with a meter running.",
      cash: 28, dependency: 0, dividend: 1
    }
  ];

  BAM.DATA.seasons = [
    {
      id: "open",
      name: "Open Season",
      blurb: "A gentler stretch in Sorvana. Good for a first game.",
      startTrust: 4, contractBonus: 0
    },
    {
      id: "standard",
      name: "Standard",
      blurb: "Sorvana as the practitioners describe it.",
      startTrust: 3, contractBonus: 0
    },
    {
      id: "pressure",
      name: "Pressure Season",
      blurb: "Scrutiny is up, trust is scarce, and Argent is hungry.",
      startTrust: 2, contractBonus: 1
    }
  ];

  BAM.DATA.ratings = [
    { min: 65, name: "Fourfold Fruitful", blurb: "Profitable, transformational, sustainable — and still standing. This is what the movement hopes for." },
    { min: 50, name: "Growing", blurb: "A real business doing real good. Keep tending all four columns." },
    { min: 30, name: "Taking Root", blurb: "You survived Sorvana — most first ventures teach more than they earn." },
    { min: 0,  name: "Seedling", blurb: "A hard season. Every practitioner has one. The lessons travel with you." }
  ];

  BAM.DATA.discussionQuestions = [
    "Where did commercial pressure pull you hardest away from your purpose?",
    "Which choice cost you the most — and would you make it again?",
    "What did the game treat as 'spiritual impact'? Do you agree with it?",
    "Argent made money; Hope Door did good for a while. What made your business different — or didn't?",
    "What would Sabbath actually look like in a business you ran?"
  ];
})(typeof BAM !== "undefined" ? BAM : require("../js/namespace.js"));
