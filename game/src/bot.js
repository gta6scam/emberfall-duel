// A greedy practice bot that plays the real rules. It steers the screenshot scenes and the
// headless balance tests. Its policy, one card at a time: lethal damage first, then damage,
// then shield when the Warden's declared Strike would bite through, then the rest — scorch
// and snares, drawing and kindling, shields, healing. The idle policy below plays nothing,
// which is how the loss scene is reached honestly.

import { DEF_BY_ID } from './cards.js';
import { endTurn, playCard } from './duel.js';

function affordableByKinds(state, kinds) {
  return state.hand
    .map((id) => ({ id, def: DEF_BY_ID[state.cards[id].defId] }))
    .filter(({ def }) => def.cost <= state.player.kindling && def.ops.some((op) => kinds.includes(op.op)));
}

function damageOf(def) {
  return def.ops.filter((op) => op.op === 'damage').reduce((sum, op) => sum + op.n, 0);
}

/** Play a single card by the greedy policy. Returns false when it plays nothing. */
export function playGreedyCard(state) {
  if (state.phase !== 'player') return false;
  const lethal = affordableByKinds(state, ['damage'])
    .find(({ def }) => damageOf(def) >= state.warden.life + state.warden.shield);
  if (lethal) return playCard(state, lethal.id);
  const bigStrike = state.intent && state.intent.kind === 'strike'
    && state.intent.amount + state.warden.stoke > state.player.shield + 4;
  const order = bigStrike
    ? [['shield'], ['damage'], ['scorch', 'weaken', 'draw', 'kindling', 'heal']]
    : [['damage'], ['scorch', 'weaken'], ['draw', 'kindling'], ['shield'], ['heal']];
  for (const kinds of order) {
    const options = affordableByKinds(state, kinds);
    if (options.length > 0) {
      options.sort((a, b) => damageOf(b.def) - damageOf(a.def) || b.def.cost - a.def.cost);
      return playCard(state, options[0].id);
    }
  }
  return false;
}

/** Play one full greedy turn: cards until none are worth playing, then end the turn. */
export function playGreedyTurn(state) {
  let played = 0;
  let guard = 0;
  while (state.phase === 'player' && guard < 24) {
    guard += 1;
    if (!playGreedyCard(state)) break;
    played += 1;
  }
  if (state.phase === 'player') endTurn(state);
  return played;
}

/** Play one idle turn: nothing played, the turn simply ends. */
export function playIdleTurn(state) {
  if (state.phase === 'player') endTurn(state);
}
