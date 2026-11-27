// Gobble Dash — the entry program (Node 22, standard library only).
//
// Copies the game's static files and its screenshots into the output
// directory and writes the dossier the gate expects, using the kit's
// buildDossier from vendor/makefun-game.ts. The output is deterministic:
// the same repository always writes the same bytes.

import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function entryRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

function main(): void {
  const root = entryRoot();
  const out = resolve(OUTPUT_DIR);

  // Start from a clean output directory so stale files can never leak in.
  if (existsSync(out)) rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  // Copy the playable game and the screenshots beside the dossier.
  cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
  cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

  // Write the dossier buildDossier derives from exactly those files.
  const dossier = buildDossier(out, CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);

  // Summarize what was handed in, so a run's output is easy to eyeball.
  const gameFiles = readdirSync(join(out, 'game'), { recursive: true });
  const shotFiles = readdirSync(join(out, 'screenshots'));
  console.log(
    `Gobble Dash -> ${out}: ${gameFiles.length} game entries, ` +
      `${shotFiles.length} screenshots, dossier.json (${statSync(join(out, 'dossier.json')).size} bytes)`,
  );
}

main();
