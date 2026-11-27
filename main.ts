// HomeLedger hand-in (Node 22, standard library only).
//
// The site is app/: plain static files a browser opens at app/index.html,
// nothing loaded over the network. This program copies app/ and
// screenshots/ from beside itself into /output (or MAKEFUN_OUTPUT_DIR
// outside the grader) and writes /output/dossier.json with the vendored
// make.fun library. vendor/makefun-frontend.ts is the kit's copy,
// unchanged: the scorer requires dossier.json to be byte for byte what
// its own copy of the library writes.
//
// Run it:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyShots() {
  const from = join(repoRoot, 'screenshots');
  const to = join(outDir, 'screenshots');
  mkdirSync(to, { recursive: true });
  if (!existsSync(from)) return;
  for (const name of readdirSync(from)) {
    cpSync(join(from, name), join(to, name));
  }
}

function handIn() {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
  copyShots();
  // The gate's caps, from the kit's reference/gate.json.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

handIn();
