// The duel itself: state, the effect interpreter, playing cards and ending turns.
// Emberfall Duel in one paragraph — you and the Ashen Warden each hold Life (you 20, it 48).
// Each of your turns your Kindling refills to a cap that grows as the duel runs, you draw 2,
// and you play cards from your hand against the Warden's declared intent; end the turn and
// the Warden carries its intent out. Drop the Warden to 0 Life to win; fall to 0 and the
// embers take you. All state lives here and in the zone lists; rendering only reads it.

import { DEF_BY_ID, deckList } from './cards.js';
import { drawCards, makeInstances, moveCard } from './deck.js';
import { makeRng, shuffle } from './random.js';
import { chooseIntent, runWardenTurn } from './warden.js';

export const PLAYER_LIFE = 20;
export const WARDEN_LIFE = 48;
export const OPENING_HAND = 5;
export const DRAW_PER_TURN = 2;

/** Kindling cap by turn: 3 at the start, +1 every second turn, never above 6. */
export function kindlingCap(turn) {
  return Math.min(3 + Math.floor(turn / 2), 6);
}

/** A fresh duel in the title phase; call begin() to deal. */
export function createGame(seed) {
  const rng = makeRng(seed);
  const list = deckList();
  const state = {
    seed,
    rng,
    phase: 'title',
    turn: 0,
    cards: makeInstances(list),
    deck: shuffle(list.map((_, index) => `c${index}`), rng),
    hand: [],
    limbo: [],
    discard: [],
    exhaust: [],
    player: { life: PLAYER_LIFE, maxLife: PLAYER_LIFE, shield: 0, kindling: 0, maxKindling: 0, sap: 0 },
    warden: { life: WARDEN_LIFE, maxLife: WARDEN_LIFE, shield: 0, scorchAmount: 0, scorchTurns: 0, weakened: false, stoke: 0 },
    intent: null,
    log: ['The Ashen Warden waits across the table.'],
    stats: { played: 0, dealt: 0, taken: 0, turns: 0 },
  };
  return state;
}

/** Deal the opening hand and the Warden's first intent; the duel starts on turn 1. */
export function begin(state) {
  state.phase = 'player';
  state.turn = 1;
  state.stats.turns = 1;
  state.player.maxKindling = kindlingCap(1);
  state.player.kindling = state.player.maxKindling;
  drawCards(state, OPENING_HAND);
  chooseIntent(state);
  state.log.push('Your move — the Warden\u2019s intent hangs over its portrait.');
}

/** Hurt the Warden, its shield first; returns the life actually lost. */
function hurtWarden(state, amount) {
  const blocked = Math.min(state.warden.shield, amount);
  state.warden.shield -= blocked;
  const through = amount - blocked;
  state.warden.life -= through;
  state.stats.dealt += through;
  return through;
}

/** One op of a card, resolved against the live state. */
function applyOp(state, op) {
  const warden = state.warden;
  if (op.op === 'damage') {
    hurtWarden(state, op.n);
  } else if (op.op === 'damageIfShield') {
    if (state.player.shield > 0) hurtWarden(state, op.n);
  } else if (op.op === 'shield') {
    state.player.shield += op.n;
  } else if (op.op === 'draw') {
    drawCards(state, op.n);
  } else if (op.op === 'heal') {
    state.player.life = Math.min(state.player.maxLife, state.player.life + op.n);
  } else if (op.op === 'kindling') {
    state.player.kindling += op.n;
  } else if (op.op === 'scorch') {
    warden.scorchAmount = op.n;
    warden.scorchTurns = Math.max(warden.scorchTurns, op.turns);
  } else if (op.op === 'weaken') {
    warden.weakened = true;
  }
}

/** Settle the phase after anything changes: a side at 0 Life ends the duel at once. */
function settle(state) {
  if (state.warden.life <= 0 && state.phase !== 'won') {
    state.phase = 'won';
    state.log.push('The Warden\u2019s flame gutters out.');
  } else if (state.player.life <= 0 && state.phase !== 'lost') {
    state.phase = 'lost';
    state.log.push('Your fire is spent.');
  }
}

/**
 * Play a card instance from the hand. Validates cost and place before anything is paid,
 * resolves the card from the limbo zone so its own draw can never shuffle it back in, and
 * leaves it in the discard. Returns false, changing nothing, when the play is not legal.
 */
export function playCard(state, id) {
  if (state.phase !== 'player') return false;
  const instance = state.cards[id];
  if (!instance || !state.hand.includes(id)) return false;
  const def = DEF_BY_ID[instance.defId];
  if (state.player.kindling < def.cost) return false;
  state.player.kindling -= def.cost;
  moveCard(state, id, 'hand', 'limbo');
  state.stats.played += 1;
  state.log.push(`You play ${def.name}.`);
  for (const op of def.ops) applyOp(state, op);
  moveCard(state, id, 'limbo', 'discard');
  settle(state);
  return true;
}

/**
 * End the player's turn: the Warden carries out its intent, declares the next, and a new
 * turn begins — kindling refilled to the cap (less any Sap), 2 cards drawn.
 */
export function endTurn(state) {
  if (state.phase !== 'player') return;
  const lifeBefore = state.player.life;
  runWardenTurn(state);
  state.stats.taken += Math.max(0, lifeBefore - state.player.life);
  settle(state);
  if (state.phase !== 'player') return;
  state.turn += 1;
  state.stats.turns = state.turn;
  state.player.maxKindling = kindlingCap(state.turn);
  state.player.kindling = Math.max(0, state.player.maxKindling - state.player.sap);
  state.player.sap = 0;
  drawCards(state, DRAW_PER_TURN);
  settle(state);
}

/** A short stable hash of the visible state, for replay checks. */
export function stateHash(state) {
  const parts = [
    state.phase, state.turn, state.player.life, state.player.shield, state.player.kindling,
    state.warden.life, state.warden.shield, state.deck.join(','), state.hand.join(','),
    state.discard.join(','), state.intent ? `${state.intent.kind}:${state.intent.amount}` : '-',
  ].join('|');
  let hash = 0;
  for (let i = 0; i < parts.length; i += 1) hash = (Math.imul(hash, 31) + parts.charCodeAt(i)) >>> 0;
  return hash.toString(16);
}
