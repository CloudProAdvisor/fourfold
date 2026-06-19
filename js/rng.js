/* Seeded PRNG (mulberry32). All game randomness flows through an instance whose
   cursor is persisted in GameState.rngState, so identical seed + identical choices
   = identical game, and mid-game saves resume deterministically. */
(function (BAM) {
  "use strict";

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // xmur3 string hash so word seeds like "TALEM" work.
  function hashSeed(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  function create(seed) {
    var cursor = (typeof seed === "string") ? hashSeed(seed) : (seed >>> 0);
    var rng = {
      next: function () {
        var fn = mulberry32(cursor);
        var v = fn();
        cursor = (cursor + 0x6D2B79F5) | 0; // advance cursor deterministically
        return v;
      },
      int: function (max) { return Math.floor(rng.next() * max); },
      pick: function (arr) { return arr[rng.int(arr.length)]; },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
          var j = rng.int(i + 1);
          var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        return a;
      },
      getState: function () { return cursor >>> 0; },
      setState: function (n) { cursor = n >>> 0; }
    };
    return rng;
  }

  BAM.rng = { create: create, hashSeed: hashSeed };
})(typeof BAM !== "undefined" ? BAM : require("./namespace.js"));
