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
import { buildSite, publicFiles, verifySite } from "./site.js";

async function fixture(t: TestContext): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "artshow-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const file of publicFiles) {
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
    path.join(dist, "hereeesjohnnyson/assets/page-01.webp"),
    "changed",
  );
  await assert.rejects(verifySite(dist), /Original comic artwork changed/);
});

await test("rejects missing or reordered comic pages", async (t) => {
  const dist = await fixture(t);
  const file = path.join(dist, "hereeesjohnnyson/issue-01/index.html");
  const html = await readFile(file, "utf8");
  await writeFile(
    file,
    html.replace(
      'src="/hereeesjohnnyson/assets/page-01.webp"',
      'src="/hereeesjohnnyson/assets/page-02.webp"',
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
    html.replace('href="/hereeesjohnnyson/"', 'href="/not-built/"'),
  );
  await assert.rejects(verifySite(dist), /Broken internal link/);
  await writeFile(file, html.replace('href="#main"', 'href="#missing"'));
  await assert.rejects(verifySite(dist), /Missing anchor/);
});
