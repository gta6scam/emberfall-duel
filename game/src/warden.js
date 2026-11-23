// The Ashen Warden, the duel's opponent. It never hides its hand: at the end of each of its
// turns it declares the next intent — a Strike for a named amount, a Ward, a Stoke that
// feeds its next Strike, a Sap on the player's kindling, or a Mend — and the banner over its
// portrait shows that intent while the player plans, so every Warden move can be read and
// countered (shield the big Strikes, snare them, or race them).

import { nextInt } from './random.js';

export const INTENT = {
  strike: { name: 'Strike', blurb: 'attacks for the shown amount' },
  ward: { name: 'Ward', blurb: 'gains Shield' },
  stoke: { name: 'Stoke', blurb: 'its next Strike grows by 3' },
  sap: { name: 'Sap', blurb: 'you start next turn with 1 less Kindling' },
  mend: { name: 'Mend', blurb: 'restores its own Life' },
};

/** The Warden's weighted intent table; Mend only enters it while the Warden is hurt. */
function intentPool(state) {
  const pool = ['strike', 'strike', 'strike', 'strike', 'strike', 'ward', 'ward', 'ward', 'stoke', 'stoke', 'sap'];
  if (state.warden.life <= state.warden.maxLife - 4) pool.push('mend', 'mend');
  return pool;
}

/** Declare the Warden's next intent. Strike amounts grow slowly as the duel runs long. */
export function chooseIntent(state) {
  const pool = intentPool(state);
  const kind = pool[nextInt(state.rng, pool.length)];
  const growth = Math.min(6, Math.floor(state.turn / 2));
  const amount = kind === 'strike' ? 5 + nextInt(state.rng, 3) + growth : kind === 'ward' ? 6 : kind === 'mend' ? 5 : 0;
  state.intent = { kind, amount };
}

/** Damage the player, shield first; returns the life actually lost. */
function hitPlayer(state, amount) {
  const blocked = Math.min(state.player.shield, amount);
  state.player.shield -= blocked;
  const through = amount - blocked;
  state.player.life -= through;
  return through;
}

/**
 * Carry out the declared intent, then declare the next one. Scorch ticks first, before the
 * Warden acts, and burns through its shield. Returns nothing; the duel checks for the end.
 */
export function runWardenTurn(state) {
  const warden = state.warden;
  if (warden.scorchTurns > 0) {
    warden.life -= warden.scorchAmount;
    warden.scorchTurns -= 1;
    state.log.push(`Scorch burns the Warden for ${warden.scorchAmount}.`);
    if (warden.life <= 0) return;
  }
  const intent = state.intent;
  if (intent) {
    if (intent.kind === 'strike') {
      let amount = intent.amount + warden.stoke;
      warden.stoke = 0;
      if (warden.weakened) {
        amount = Math.ceil(amount / 2);
        warden.weakened = false;
        state.log.push('The Snare halves the Warden\u2019s Strike.');
      }
      const lost = hitPlayer(state, amount);
      state.log.push(`The Warden strikes for ${amount}${lost < amount ? ` — ${lost} Life lost` : ''}.`);
    } else if (intent.kind === 'ward') {
      warden.shield += intent.amount;
      state.log.push(`The Warden wards itself for ${intent.amount} Shield.`);
    } else if (intent.kind === 'stoke') {
      warden.stoke += 3;
      state.log.push('The Warden stokes its flame — the next Strike grows.');
    } else if (intent.kind === 'sap') {
      state.player.sap = 1;
      state.log.push('Ash clogs your kindling — 1 less next turn.');
    } else if (intent.kind === 'mend') {
      warden.life = Math.min(warden.maxLife, warden.life + intent.amount);
      state.log.push(`The Warden mends itself for ${intent.amount} Life.`);
    }
  }
  chooseIntent(state);
}
