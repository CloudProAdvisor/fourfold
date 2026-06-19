/* FOURFOLD — global namespace. Plain scripts (no modules) so the game runs from file://.
   Node-compatible so the same files power tests/ and the balance simulator. */
var BAM = (typeof window !== "undefined")
  ? (window.BAM = window.BAM || {})
  : (globalThis.BAM = globalThis.BAM || {});
BAM.DATA = BAM.DATA || {};
if (typeof module !== "undefined" && module.exports) module.exports = BAM;
