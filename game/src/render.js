// Everything the player sees: the ash-wood table, the Warden's portrait and intent banner,
// both life bars, the kindling pips, the hand of cards and the title, victory and defeat
// screens. Rendering only reads the duel's state; the handlers it is given are the only way
// back in. Cards are DOM, so their costs and words stay crisp at any size, and each suit is
// drawn as its own shape in its own colour — a flame, a wave, a leaf, a rune-spire.

import { DEF_BY_ID, SUITS } from './cards.js';
import { INTENT } from './warden.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_TABLE = 'table';
export const SCREEN_WON = 'won';
export const SCREEN_LOST = 'lost';

const SUIT_PATHS = {
  embers: '<path d="M12 2c1.8 3.6-2.8 5.4-2.8 8.4a2.8 2.8 0 0 0 5.6 0c0-.9-.4-1.8-.4-1.8s2.7 1.3 2.7 4A5.2 5.2 0 0 1 12 18.3 5.2 5.2 0 0 1 6.9 13.4C6.9 8.4 10.2 5.9 12 2z"/>',
  tides: '<path d="M2 8.5c2.8-2.8 5.2-2.8 8 0s5.2 2.8 8 0" fill="none" stroke-width="2.4"/><path d="M2 14.5c2.8-2.8 5.2-2.8 8 0s5.2 2.8 8 0" fill="none" stroke-width="2.4"/>',
  thorns: '<path d="M12 2.8C7.4 7.8 5.6 11.8 12 20.4c6.4-8.6 4.6-12.6 0-17.6z"/><path d="M12 7v11" fill="none" stroke-width="1.6"/>',
  runes: '<path d="M12 2l5.2 8.6L12 22 6.8 10.6z"/><path d="M6.8 10.6h10.4M12 2v20" fill="none" stroke-width="1.4"/>',
};

export function suitIcon(suit, size) {
  const meta = SUITS[suit];
  return `<svg class="suit-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${meta.colour}" stroke="${meta.colour}">${SUIT_PATHS[suit]}</svg>`;
}

function lifeBar(label, life, maxLife, cls) {
  const pct = Math.max(0, Math.round((life / maxLife) * 100));
  return `<div class="lifebar ${cls}"><span class="lb-label">${label}</span><div class="lb-track"><div class="lb-fill" style="width:${pct}%"></div></div><span class="lb-num">${Math.max(0, life)} / ${maxLife}</span></div>`;
}

function cardHtml(state, id, index) {
  const def = DEF_BY_ID[state.cards[id].defId];
  const suit = SUITS[def.suit];
  const affordable = state.player.kindling >= def.cost && state.phase === 'player';
  return `<article class="card ${affordable ? '' : 'dim'}" data-play="${id}" style="--tilt:${(index - (state.hand.length - 1) / 2) * 2.2}deg;border-color:${suit.dark}">
    <header class="chead" style="background:${suit.dark}">
      <span class="cost">${def.cost}</span>
      <span class="cname">${def.name}</span>
      ${suitIcon(def.suit, 20)}
    </header>
    <div class="cart" style="background:radial-gradient(circle at 50% 38%, ${suit.colour}33, transparent 70%)">${suitIcon(def.suit, 64)}</div>
    <p class="ctext">${def.text}</p>
    <footer class="cfoot"><span style="color:${suit.colour}">${suit.name}</span><span class="ckey">${index + 1}</span></footer>
  </article>`;
}

function intentHtml(state) {
  if (!state.intent) return '';
  const meta = INTENT[state.intent.kind];
  const amount = state.intent.kind === 'strike'
    ? state.intent.amount + state.warden.stoke
    : state.intent.amount;
  const shown = amount > 0 ? ` ${amount}` : '';
  return `<div class="intent intent-${state.intent.kind}"><span class="intent-tag">NEXT</span><strong>${meta.name}${shown}</strong><span class="intent-blurb">${meta.blurb}</span></div>`;
}

function wardenHtml(state) {
  const w = state.warden;
  const chips = [
    w.shield > 0 ? `<span class="chip shield">Shield ${w.shield}</span>` : '',
    w.scorchTurns > 0 ? `<span class="chip scorch">Scorching ${w.scorchAmount} × ${w.scorchTurns}</span>` : '',
    w.weakened ? '<span class="chip snare">Snared</span>' : '',
    w.stoke > 0 ? `<span class="chip stoke">Stoked +${w.stoke}</span>` : '',
  ].join('');
  return `<section class="warden">
    <div class="portrait">${suitIcon('embers', 92)}<div class="wname">THE ASHEN WARDEN</div><div class="wsub">Keeper of the cold hearth</div></div>
    <div class="wside">${lifeBar('WARDEN', w.life, w.maxLife, 'enemy')}<div class="chips">${chips}</div>${intentHtml(state)}</div>
  </section>`;
}

function playerHtml(state) {
  const p = state.player;
  const pips = Array.from({ length: p.maxKindling }, (_, i) => `<span class="pip ${i < p.kindling ? 'lit' : ''}"></span>`).join('');
  return `<section class="playerbar">
    ${lifeBar('YOU', p.life, p.maxLife, 'ally')}
    <span class="chip shield">Shield ${p.shield}</span>
    <span class="kindling" title="Kindling">${pips}</span>
    <span class="piles">Deck ${state.deck.length} · Discard ${state.discard.length}</span>
    <span class="turn">Turn ${state.turn}</span>
    <button class="endturn" data-action="end" ${state.phase === 'player' ? '' : 'disabled'}>End Turn ⏎</button>
  </section>`;
}

function overlayHtml(state) {
  if (state.phase === 'title') {
    return `<div class="overlay"><div class="panel title-panel">
      <div class="logo">EMBERFALL<span>DUEL</span></div>
      <p class="tagline">Topple the Ashen Warden in a duel of living cards.</p>
      <div class="howto">
        <p><strong>Kindling</strong> refills every turn and pays for cards. The Warden shows its <strong>next intent</strong> over its portrait — shield the big Strikes, snare them, or race them.</p>
        <p>Four suits, four tempers: <span class="s-embers">Embers</span> burn, <span class="s-tides">Tides</span> guard and mend, <span class="s-thorns">Thorns</span> bite harder behind a shield, <span class="s-runes">Runes</span> feed your hand and your flame.</p>
        <p>Click a card or press its number. Space ends the turn. Drop the Warden to 0 Life before it drops you.</p>
      </div>
      <button class="bigbtn" data-action="begin">Begin the Duel</button>
    </div></div>`;
  }
  if (state.phase === 'won' || state.phase === 'lost') {
    const won = state.phase === 'won';
    const s = state.stats;
    return `<div class="overlay"><div class="panel ${won ? 'win-panel' : 'loss-panel'}">
      <div class="verdict">${won ? 'THE WARDEN FALLS' : 'THE EMBERS TAKE YOU'}</div>
      <p class="tagline">${won ? 'Its flame gutters out; the hearth is yours again.' : 'Your fire is spent — but embers remember the way back.'}</p>
      <div class="stats">
        <div><strong>${s.turns}</strong><span>turns</span></div>
        <div><strong>${s.played}</strong><span>cards played</span></div>
        <div><strong>${s.dealt}</strong><span>damage dealt</span></div>
        <div><strong>${Math.max(0, state.player.life)}</strong><span>your Life left</span></div>
      </div>
      <button class="bigbtn" data-action="again">Duel Again</button>
    </div></div>`;
  }
  return '';
}

/** The full screen for a state: table first, then any overlay the phase calls for. */
export function screenHtml(state) {
  const log = state.log.slice(-2).map((line) => `<div>${line}</div>`).join('');
  return `<div class="stage">
    ${wardenHtml(state)}
    <div class="logstrip">${log}</div>
    <section class="hand">${state.hand.map((id, i) => cardHtml(state, id, i)).join('')}</section>
    ${playerHtml(state)}
    ${overlayHtml(state)}
  </div>`;
}
