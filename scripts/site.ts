import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

// SHA-256 values of the five approved images, preserved from the supplied ZIP.
export const comicPages = [
  [
    "heresjohnnyson/assets/page-01.webp",
    "d302eac69a5a5e2cc3ce72b0c77faaa98d119df820f10234317dfa91ed0c6aa5",
  ],
  [
    "heresjohnnyson/assets/page-02.webp",
    "1b756ab78f15e8f79c8ce4eb3eb2857cbd56dbf81c4fd793f541c7ded5db4ce2",
  ],
  [
    "heresjohnnyson/assets/page-03.webp",
    "e7d1cfc3457040bfd00a92871887ee1b4421c80ff4c1e638fcd6ea12e037ac62",
  ],
  [
    "heresjohnnyson/assets/page-04.webp",
    "d89938e13a926d6cdb1cd3a17ade437a43ef8e458e8f75bd9f08e09456046620",
  ],
  [
    "heresjohnnyson/assets/page-05.webp",
    "2e03b2853818b7a5d1cf601325a5f6d2047a074152f9452f6204b435422e4fba",
  ],
] as const;

export const copiedFiles = [
  "index.html",
  "404.html",
  "_redirects",
  "styles.css",
  "heresjohnnyson/index.html",
  "heresjohnnyson/about/index.html",
  ...comicPages.map(([file]) => file),
] as const;

export const readerFiles = comicPages.map(
  (_, index) => `h${"e".repeat(index + 1)}resjohnnyson/index.html`,
);
export const sourceFiles = [...copiedFiles, "src/reader.ts"];
export const publicFiles = [
  ...new Set([...copiedFiles, ...readerFiles, "reader.js"]),
];
const readerScript = '<script type="module" src="/reader.js"></script>';

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative)),
      );
    } else if (entry.isFile()) {
      files.push(relative);
    } else {
      throw new Error(`Non-regular deployment asset: ${relative}`);
    }
  }
  return files.sort();
}

export async function verifySite(dist: string): Promise<void> {
  const actual = await listFiles(dist);
  if (JSON.stringify(actual) !== JSON.stringify([...publicFiles].sort())) {
    throw new Error(`Unexpected dist contents:\n${actual.join("\n")}`);
  }

  for (const [file, expectedHash] of comicPages) {
    const content = await readFile(path.join(dist, file));
    if (createHash("sha256").update(content).digest("hex") !== expectedHash) {
      throw new Error(`Original comic artwork changed: ${file}`);
    }
  }

  const documents = new Map<string, string>();
  for (const file of actual.filter((file) => file.endsWith(".html"))) {
    const html = await readFile(path.join(dist, file), "utf8");
    const withoutReaderScript = readerFiles.includes(file)
      ? html.replace(readerScript, "")
      : html;
    if (/<script\b|\bon\w+\s*=|javascript:/i.test(withoutReaderScript)) {
      throw new Error(`Unapproved browser script or inline handler: ${file}`);
    }
    documents.set(file, html);
  }

  for (const file of readerFiles) {
    const reader = documents.get(file);
    if (!reader?.includes(readerScript))
      throw new Error(`Missing issue reader enhancement: ${file}`);
    const pageSources = [...reader.matchAll(/<img\s[^>]*src="([^"]+)"/g)].map(
      (match) => match[1],
    );
    if (
      JSON.stringify(pageSources) !==
      JSON.stringify(comicPages.map(([file]) => `/${file}`))
    ) {
      throw new Error("The issue must contain all five comic pages in order.");
    }
  }

  // Check local links, image/style references, and navigation anchors in every page.
  for (const [file, html] of documents) {
    const route = file.endsWith("index.html")
      ? `/${file.slice(0, -10)}`
      : `/${file}`;
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const reference = match[1];
      if (!reference) continue;
      const url = new URL(reference, `https://artshow.invalid${route}`);
      if (url.origin !== "https://artshow.invalid") continue;
      const target =
        decodeURIComponent(url.pathname.slice(1)) +
        (url.pathname.endsWith("/") ? "index.html" : "");
      if (!actual.includes(target))
        throw new Error(`Broken internal link in ${file}: ${reference}`);
      if (url.hash) {
        const targetHtml = documents.get(target);
        const id = decodeURIComponent(url.hash.slice(1));
        if (!targetHtml?.includes(`id="${id}"`))
          throw new Error(`Missing anchor in ${file}: ${reference}`);
      }
    }
  }
}

export async function buildSite(root: string): Promise<void> {
  const dist = path.join(root, "dist");
  await rm(dist, { recursive: true, force: true });
  for (const file of copiedFiles) {
    const source = path.join(root, file);
    if (!(await lstat(source)).isFile())
      throw new Error(`Non-regular source asset: ${file}`);
    const target = path.join(dist, file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
  for (const file of readerFiles.slice(1)) {
    const target = path.join(dist, file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(dist, "heresjohnnyson/index.html"), target);
  }
  const reader = ts.transpileModule(
    await readFile(path.join(root, "src/reader.ts"), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
      reportDiagnostics: true,
    },
  );
  if (reader.diagnostics?.length)
    throw new Error("Reader TypeScript compilation failed.");
  await writeFile(path.join(dist, "reader.js"), reader.outputText);
  await verifySite(dist);
}
