// Package whatspacd as a single self-contained executable using Node's built-in
// Single Executable Application (SEA) support — so standalone users (XRouter /
// LinBPQ, no pdn) can run one binary with no Node install.
//
// SEA runs the main as CommonJS, so this bundles a CJS variant first. node:
// builtins (incl. node:sqlite via createRequire) stay external. Requires
// `postject` (fetched via npx) and Node >= 22.
//
//   node scripts/build.mjs        # the ESM bundle (dist/main.js) for `node`/npm
//   node scripts/package-sea.mjs  # the standalone binary (dist/whatspacd)

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { platform } from "node:os";

const FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";
const out = platform() === "win32" ? "dist/whatspacd.exe" : "dist/whatspacd";

console.log("bundling CJS for SEA…");
await build({
  entryPoints: ["src/main.ts"],
  outfile: "dist/main.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  logLevel: "info",
});

writeFileSync(
  "dist/sea-config.json",
  JSON.stringify(
    { main: "dist/main.cjs", output: "dist/sea-prep.blob", disableExperimentalSEAWarning: true },
    null,
    2,
  ),
);

console.log("generating SEA blob…");
execFileSync(process.execPath, ["--experimental-sea-config", "dist/sea-config.json"], {
  stdio: "inherit",
});

console.log(`copying node runtime -> ${out}`);
copyFileSync(process.execPath, out);

console.log("injecting blob (postject)…");
const args = [
  "postject",
  out,
  "NODE_SEA_BLOB",
  "dist/sea-prep.blob",
  "--sentinel-fuse",
  FUSE,
];
if (platform() === "darwin") args.push("--macho-segment-name", "NODE_SEA");
execFileSync("npx", ["--yes", ...args], { stdio: "inherit" });

console.log(`built ${out}`);
