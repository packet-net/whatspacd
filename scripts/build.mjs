// Bundle the daemon to a single ESM file: dist/main.js.
//
// node: builtins (incl. node:sqlite, loaded via createRequire) are external by
// virtue of platform:node, so no native modules are bundled — which is what
// keeps single-binary packaging (scripts/package-sea.mjs) clean.

import { build } from "esbuild";
import { chmodSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });

await build({
  entryPoints: ["src/main.ts"],
  outfile: "dist/main.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "info",
});

chmodSync("dist/main.js", 0o755);
console.log("built dist/main.js");
