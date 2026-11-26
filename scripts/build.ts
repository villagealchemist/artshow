import path from "node:path";
import { buildSite, publicFiles, verifySite } from "./site.js";

if (process.argv[2] === "verify") {
  await verifySite(path.join(process.cwd(), "dist"));
} else if (process.argv[2] === undefined) {
  await buildSite(process.cwd());
} else {
  throw new Error("Usage: build [verify]");
}
console.log(
  `Verified ${publicFiles.length} allowlisted assets, five original comic pages, and all internal links.`,
);
