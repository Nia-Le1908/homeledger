// HomeLedger entrypoint (Node 22, standard library only).
//
// The site is plain static files under app/ next to this file, with its
// screenshots under screenshots/. Handing it in means: copy both folders
// into the output directory and write dossier.json there with the vendored
// make.fun library, which is the summary the judge reads. The grader runs
// this twice and both runs must write byte-identical output, so there is no
// timestamp, randomness or environment input anywhere in what it writes.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The repository root is the directory holding this file.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));

// The grader gives us /output; local runs use MAKEFUN_OUTPUT_DIR.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function copyTree(sourceDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  cpSync(sourceDir, destDir, { recursive: true });
}

function main() {
  mkdirSync(outputDir, { recursive: true });
  copyTree(join(repoRoot, "app"), join(outputDir, "app"));
  if (existsSync(join(repoRoot, "screenshots"))) {
    copyTree(join(repoRoot, "screenshots"), join(outputDir, "screenshots"));
  }
  // The scorer's own caps, as the kit's reference/gate.json states them:
  // at most 4 screenshots of 256 KiB, app/ at most 993 files and 16 MiB,
  // dossier text at most 160 KiB.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
  writeFileSync(join(outputDir, "dossier.json"), dossier);
}

main();
