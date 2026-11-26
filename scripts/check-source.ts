import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const excludedDirectories = new Set([
  ".git",
  ".build-tools",
  ".wrangler",
  "dist",
  "node_modules",
  "sites",
]);
const binaryExtensions = new Set([
  ".png",
  ".webp",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
]);
const scriptExtensions = new Set([".js", ".mjs", ".cjs", ".jsx"]);
const prohibited = String.fromCodePoint(0x2014);
const suppressions = [
  ["@ts", "ignore"].join("-"),
  ["@ts", "nocheck"].join("-"),
  ["eslint", "disable"].join("-"),
];
const failures: string[] = [];
let checked = 0;

async function inspect(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && !excludedDirectories.has(entry.name))
      await inspect(file);
    if (
      !entry.isFile() ||
      entry.name === ".DS_Store" ||
      entry.name === "package-lock.json"
    )
      continue;
    const extension = path.extname(file);
    if (scriptExtensions.has(extension))
      failures.push(`${file}: authored JavaScript is prohibited`);
    if (binaryExtensions.has(extension)) continue;
    const content = await readFile(file, "utf8");
    checked++;
    const brandText =
      extension === ".html"
        ? `${content}\n${content.replace(/<[^>]*>/g, "")}`
        : content;
    for (const match of brandText.matchAll(/\bvillage[\s_-]*alchemist\b/gi)) {
      if (match[0] !== "villagealchemist")
        failures.push(`${file}: the name must be exactly villagealchemist`);
    }
    if (content.includes(prohibited)) failures.push(`${file}: contains U+2014`);
    if (
      extension === ".ts" &&
      suppressions.some((text) => content.includes(text))
    )
      failures.push(`${file}: prohibited suppression`);
  }
}

await inspect(".");
const tracked = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
}).split("\0");
for (const file of tracked) {
  if (!file.startsWith("sites/") && scriptExtensions.has(path.extname(file)))
    failures.push(`${file}: tracked JavaScript is prohibited`);
}
if (failures.length) throw new Error(failures.join("\n"));
console.log(`Source policy passed for ${checked} authored text files.`);
