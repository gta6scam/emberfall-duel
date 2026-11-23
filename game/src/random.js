// Seeded randomness for Emberfall Duel. The deck and the Warden's intents draw from one
// mulberry32 generator seeded per game, so a seed plus the same plays always replays to the
// same duel — the game's own deck never touches the host's global random source.

/** A mulberry32 generator: call it for a float in [0, 1). State advances on every call. */
export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [0, bound) from the generator. */
export function nextInt(rng, bound) {
  return Math.floor(rng() * bound);
}

/** Fisher-Yates shuffle, in place, driven by the game's own generator. Returns the list. */
export function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = nextInt(rng, i + 1);
    const held = list[i];
    list[i] = list[j];
    list[j] = held;
  }
  return list;
}
