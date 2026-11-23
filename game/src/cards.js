// The card pool of Emberfall Duel. Four suits of the Ashen Court — Embers, Tides, Thorns and
// Runes — each told apart by colour and by the shape drawn on the card, never by text alone.
// Every card is data: a cost in kindling and a list of ops the duel's interpreter resolves in
// order. The power budget is one kindling ≈ 4 damage or 5 shield; the 3-cost crown sits above
// it on purpose, as the deck's finisher.

export const SUITS = {
  embers: { name: 'Embers', colour: '#e2543e', dark: '#7e2413' },
  tides: { name: 'Tides', colour: '#3e7fe2', dark: '#173f7e' },
  thorns: { name: 'Thorns', colour: '#43a95c', dark: '#1d5c30' },
  runes: { name: 'Runes', colour: '#8a5fd6', dark: '#452a75' },
};

export const CARD_DEFS = [
  { id: 'spark-jab', name: 'Spark Jab', suit: 'embers', cost: 0, text: 'Deal 2 damage.', ops: [{ op: 'damage', n: 2 }] },
  { id: 'flame-lance', name: 'Flame Lance', suit: 'embers', cost: 1, text: 'Deal 4 damage.', ops: [{ op: 'damage', n: 4 }] },
  { id: 'pyre-brand', name: 'Pyre Brand', suit: 'embers', cost: 2, text: 'Deal 3 damage and set the Warden Scorching: 2 burn a turn, through shields, for 2 turns.', ops: [{ op: 'damage', n: 3 }, { op: 'scorch', n: 2, turns: 2 }] },
  { id: 'inferno-crown', name: 'Inferno Crown', suit: 'embers', cost: 3, text: 'Deal 8 damage.', ops: [{ op: 'damage', n: 8 }] },
  { id: 'tide-bulwark', name: 'Tide Bulwark', suit: 'tides', cost: 1, text: 'Gain 6 Shield.', ops: [{ op: 'shield', n: 6 }] },
  { id: 'mist-step', name: 'Mist Step', suit: 'tides', cost: 0, text: 'Gain 2 Shield. Draw 1 card.', ops: [{ op: 'shield', n: 2 }, { op: 'draw', n: 1 }] },
  { id: 'healing-rain', name: 'Healing Rain', suit: 'tides', cost: 2, text: 'Restore 4 Life.', ops: [{ op: 'heal', n: 4 }] },
  { id: 'thorn-lash', name: 'Thorn Lash', suit: 'thorns', cost: 1, text: 'Deal 3 damage. Deal 3 more if you hold any Shield.', ops: [{ op: 'damage', n: 3 }, { op: 'damageIfShield', n: 3 }] },
  { id: 'root-snare', name: 'Root Snare', suit: 'thorns', cost: 2, text: 'Deal 2 damage. The Warden\u2019s next Strike is halved.', ops: [{ op: 'damage', n: 2 }, { op: 'weaken' }] },
  { id: 'briar-wall', name: 'Briar Wall', suit: 'thorns', cost: 2, text: 'Gain 4 Shield and deal 2 damage.', ops: [{ op: 'shield', n: 4 }, { op: 'damage', n: 2 }] },
  { id: 'rune-insight', name: 'Rune Insight', suit: 'runes', cost: 1, text: 'Draw 2 cards.', ops: [{ op: 'draw', n: 2 }] },
  { id: 'kindling-idol', name: 'Kindling Idol', suit: 'runes', cost: 0, text: 'Gain 1 Kindling this turn.', ops: [{ op: 'kindling', n: 1 }] },
];

export const DEF_BY_ID = Object.fromEntries(CARD_DEFS.map((def) => [def.id, def]));

/** Two copies of every card: a 24-card deck where each named card can be planned around. */
export function deckList() {
  const list = [];
  for (const def of CARD_DEFS) {
    list.push(def.id, def.id);
  }
  return list;
}
