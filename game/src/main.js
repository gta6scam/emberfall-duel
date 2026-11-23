// Emberfall Duel's boot and input. It builds the table in #app, starts a fresh duel behind
// the title screen, and wires the mouse and keyboard: click a card (or press its number) to
// play it, click End Turn or press Space to hand the table to the Warden. Behind ?shot= it
// instead deals one of the screenshot scenes from shots.js and leaves the table untouched.

import { begin, createGame, endTurn, playCard } from './duel.js';
import { screenHtml } from './render.js';
import { applyShot } from './shots.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '20261122') >>> 0;

const root = document.getElementById('app');
const status = document.getElementById('status');
let state = createGame(seed);
if (shot) {
  applyShot(state, shot);
}

function announce() {
  const last = state.log[state.log.length - 1] ?? '';
  if (status) status.textContent = `Turn ${state.turn}. You ${Math.max(0, state.player.life)} life, Warden ${Math.max(0, state.warden.life)} life. ${last}`;
}

function draw() {
  root.innerHTML = screenHtml(state);
  announce();
}

function act(action) {
  if (action === 'begin') {
    if (state.phase === 'title') begin(state);
  } else if (action === 'again') {
    state = createGame((seed + state.stats.turns + 1) >>> 0);
    begin(state);
  } else if (action === 'end') {
    endTurn(state);
  }
  draw();
}

root.addEventListener('click', (event) => {
  const play = event.target.closest('[data-play]');
  if (play) {
    playCard(state, play.getAttribute('data-play'));
    draw();
    return;
  }
  const button = event.target.closest('[data-action]');
  if (button) act(button.getAttribute('data-action'));
});

document.addEventListener('keydown', (event) => {
  if (shot) return;
  if (event.key >= '1' && event.key <= '8') {
    const id = state.hand[Number(event.key) - 1];
    if (id) {
      playCard(state, id);
      draw();
    }
  } else if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault();
    act(state.phase === 'title' ? 'begin' : state.phase === 'player' ? 'end' : 'again');
  }
});

draw();
