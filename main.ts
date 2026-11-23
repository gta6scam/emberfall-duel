// Emberfall Duel — hand-in program (Node 22, standard library only).
//
// The game itself is the static files under game/: plain HTML, CSS and ES modules a desktop
// browser loads offline, no build step and no network request. This program hands it in: it
// copies game/ and screenshots/ from beside this file into the output directory and writes
// dossier.json there with the vendored make.fun library, byte for byte what the scorer
// rebuilds to compare. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the game locally with any static server rooted at game/, then open index.html.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps, passed to the dossier builder so the bytes it writes here are the
// bytes it writes there: the judge's text cap, at most 4 screenshots of 256 KiB, and game/
// within its file-count, total-size and path-length limits.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
