// The screenshot scenes behind ?shot=title|duel|win|loss&seed=n. Each one plays the real
// rules forward from a fresh duel, steered by the practice bot, so the frame is what a real
// game looks like and the same seed always gives the same frame: the duel scene stops in
// the middle of turn 4 with cards already played that turn; the win scene plays the greedy
// line to the end; the loss scene plays a duelist who never answers, and falls.

import { playGreedyCard, playGreedyTurn, playIdleTurn } from './bot.js';
import { begin } from './duel.js';

/** Advance a fresh duel to the named scene. The state stays fully playable afterwards. */
export function applyShot(state, shot) {
  if (shot === 'title') return state;
  begin(state);
  if (shot === 'duel') {
    let guard = 0;
    while (state.phase === 'player' && state.turn < 4 && guard < 40) {
      playGreedyTurn(state);
      guard += 1;
    }
    // A card or two into the fourth turn, then freeze: a hand mid-decision, intent declared.
    playGreedyCard(state);
    playGreedyCard(state);
    return state;
  }
  if (shot === 'win') {
    let guard = 0;
    while (state.phase === 'player' && guard < 400) {
      playGreedyTurn(state);
      guard += 1;
    }
    return state;
  }
  if (shot === 'loss') {
    let guard = 0;
    while (state.phase === 'player' && guard < 400) {
      playIdleTurn(state);
      guard += 1;
    }
    return state;
  }
  return state;
}
