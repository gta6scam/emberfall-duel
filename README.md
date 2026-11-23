[![make.fun - best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/gta6scam/emberfall-duel/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/gta6scam/emberfall-duel/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# EMBERFALL DUEL — topple the Ashen Warden

An original duel card game for the make.fun **Best Card Game** bounty. You face the Ashen
Warden across an ash-wood table: 20 Life against its 48, a 24-card deck of your own, and a
Warden that never hides its hand — its **next intent** (a Strike for a named amount, a Ward,
a Stoke, a Sap, a Mend) hangs over its portrait while you plan, so every move it makes can be
read and countered.

Four suits of the Ashen Court, told apart by colour and shape, never by text alone:

- **Embers** (flame) burn — damage and a Scorch that ticks through shields.
- **Tides** (wave) guard and mend — shields, healing, a free step that draws.
- **Thorns** (leaf) bite harder behind a shield, and snare the Warden's Strikes to half.
- **Runes** (spire) feed your hand and your Kindling, the flame that pays for cards.

Kindling refills each turn to a cap that grows as the duel runs. Click a card or press its
number to play it; Space ends the turn. Drop the Warden to 0 Life before it drops you.

## Layout

- `game/` — the game itself: static files, no build step. `game/index.html` opens in a
  desktop browser and plays offline.
  - `game/src/cards.js` — the card pool as data, with the power budget.
  - `game/src/deck.js` — zones and drawing; every card instance lives in exactly one zone.
  - `game/src/duel.js` — the duel's state, effect interpreter and turn flow.
  - `game/src/warden.js` — the Ashen Warden: its intent table and how intents resolve.
  - `game/src/bot.js` — a greedy practice bot that plays the real rules.
  - `game/src/render.js` + `table.css` — the table, the cards and the three screens.
  - `game/src/shots.js` — the `?shot=` screenshot scenes, played forward by the bot.
  - `game/src/main.js` — boot and input.
- `screenshots/` — four renders of the game itself: title, a duel mid-decision, victory,
  defeat.
- `main.ts` — the hand-in: copies `game/` and `screenshots/` to the output directory and
  writes `dossier.json` with the vendored library in `vendor/`.

## Run it

Serve `game/` with any static HTTP server and open `index.html`, or run the hand-in first
and serve the copy:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
