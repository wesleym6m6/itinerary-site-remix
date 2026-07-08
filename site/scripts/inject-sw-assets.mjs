import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const swPath = path.join(dist, "sw.js");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = path.join(dir, name);
    const relativePath = path.relative(dist, fullPath).split(path.sep).join("/");
    if (statSync(fullPath).isDirectory()) return walk(fullPath);
    if (relativePath === "sw.js") return [];
    return [`./${relativePath}`];
  });
}

const appShell = ["./", ...walk(dist)].sort((a, b) => a.localeCompare(b));
const sw = readFileSync(swPath, "utf8");
const next = sw.replace(
  /const APP_SHELL = \[[\s\S]*?\];/,
  `const APP_SHELL = ${JSON.stringify(appShell, null, 2)};`,
);

if (next === sw) {
  throw new Error("Could not inject app shell assets into service worker.");
}

writeFileSync(swPath, next, "utf8");
console.log(`Injected ${appShell.length} app shell files into dist/sw.js`);
