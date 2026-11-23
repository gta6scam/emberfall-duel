// Zones and drawing. Every card instance has a unique id and lives in exactly one zone —
// deck, hand, limbo (while its effects resolve), discard or exhaust. Moving a card is always
// remove-then-add by id, never by value, so two copies of a card can never merge or vanish.

import { shuffle } from './random.js';

export const HAND_CAP = 8;

/** Build the instance table for a fresh duel: id -> { id, defId }, from the deck list. */
export function makeInstances(list) {
  const cards = {};
  list.forEach((defId, index) => {
    const id = `c${index}`;
    cards[id] = { id, defId };
  });
  return cards;
}

/** Take an id out of a zone list; returns true when it was there. */
export function removeFrom(zone, id) {
  const at = zone.indexOf(id);
  if (at < 0) return false;
  zone.splice(at, 1);
  return true;
}

/** Move an id from one zone to another, keeping the one-zone invariant. */
export function moveCard(state, id, from, to) {
  if (removeFrom(state[from], id)) state[to].push(id);
}

/**
 * Draw n cards for the player. An empty deck reshuffles the discard; a card that would pass
 * the hand cap burns to the discard; a draw with nothing left anywhere costs 1 Life each
 * (the duel's fatigue), which the caller checks for a loss afterwards.
 */
export function drawCards(state, n) {
  for (let i = 0; i < n; i += 1) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) {
        state.player.life -= 1;
        state.log.push('The deck is ash — drawing costs 1 Life.');
        continue;
      }
      state.deck = shuffle(state.discard, state.rng);
      state.discard = [];
      state.log.push('The discard is shuffled back into the deck.');
    }
    const id = state.deck.pop();
    if (state.hand.length >= HAND_CAP) {
      state.discard.push(id);
      state.log.push('Hand full — a card burns to the discard.');
    } else {
      state.hand.push(id);
    }
  }
}

/** Every instance id across all zones, for the invariant check the tests lean on. */
export function allZoneIds(state) {
  return [...state.deck, ...state.hand, ...state.limbo, ...state.discard, ...state.exhaust];
}
