import assert from "node:assert/strict";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { buildSite, sourceFiles, verifySite } from "./site.js";

async function fixture(t: TestContext): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "artshow-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const file of sourceFiles) {
    const target = path.join(root, file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(file, target);
  }
  await buildSite(root);
  return path.join(root, "dist");
}

await test("build admits exactly the public files and cleans stale output", async (t) => {
  const dist = await fixture(t);
  await writeFile(path.join(dist, "private-notes.txt"), "not public");
  await assert.rejects(verifySite(dist), /Unexpected dist contents/);
  await buildSite(path.dirname(dist));
  await verifySite(dist);
});

await test("rejects modified artwork", async (t) => {
  const dist = await fixture(t);
  await writeFile(
    path.join(dist, "heresjohnnyson/assets/page-01.webp"),
    "changed",
  );
  await assert.rejects(verifySite(dist), /Original comic artwork changed/);
});

await test("rejects missing or reordered comic pages", async (t) => {
  const dist = await fixture(t);
  const file = path.join(dist, "heresjohnnyson/index.html");
  const html = await readFile(file, "utf8");
  await writeFile(
    file,
    html.replace(
      'src="/heresjohnnyson/assets/page-01.webp"',
      'src="/heresjohnnyson/assets/page-02.webp"',
    ),
  );
  await assert.rejects(verifySite(dist), /all five comic pages in order/);
});

await test("rejects broken internal links and anchors", async (t) => {
  const dist = await fixture(t);
  const file = path.join(dist, "index.html");
  const html = await readFile(file, "utf8");
  await writeFile(
    file,
    html.replace('href="/heresjohnnyson/"', 'href="/not-built/"'),
  );
  await assert.rejects(verifySite(dist), /Broken internal link/);
  await writeFile(file, html.replace('href="#main"', 'href="#missing"'));
  await assert.rejects(verifySite(dist), /Missing anchor/);
});

await test("rejects unapproved scripts on every reader address", async (t) => {
  const dist = await fixture(t);
  const file = path.join(dist, "heeeresjohnnyson/index.html");
  const html = await readFile(file, "utf8");
  await writeFile(
    file,
    html.replace(
      "</body>",
      '<script src="https://example.com/tracker.js"></script></body>',
    ),
  );
  await assert.rejects(verifySite(dist), /Unapproved browser script/);
});
