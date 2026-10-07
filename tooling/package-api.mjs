import { readFile, readdir, mkdir, rm, cp, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, relative, isAbsolute } from "node:path";

const repo = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(repo, "apps/api/dist/esm");
const target = resolve(repo, "apps/api/dist/firebase");
const allowed = relative(resolve(repo, "apps/api/dist"), target);
if (!allowed || allowed.startsWith("..") || isAbsolute(allowed)) throw new Error("Artifact destination is outside API dist");
const manifest = JSON.parse(await readFile(resolve(repo, "apps/api/package.json"), "utf8"));
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await check(path);
    else if (entry.name.endsWith(".js") && (await readFile(path, "utf8")).includes("@taskify/api-contracts")) {
      throw new Error("A runtime contract import cannot be omitted from the standalone Functions artifact");
    }
  }
}
await check(source);
await readFile(resolve(source, "index.js"), "utf8");
const dependencies = { ...manifest.dependencies };
delete dependencies["@taskify/api-contracts"];
if (Object.values(dependencies).some((version) => /^(workspace:|file:|link:)/.test(version))) {
  throw new Error("Standalone artifact still contains a local/workspace runtime dependency");
}
const generated = {
  name: "taskify-api-functions", private: true, version: manifest.version, type: "module", main: "index.js",
  engines: { node: "22", pnpm: "10.34.6" }, packageManager: "pnpm@10.34.6", dependencies,
};
let lockfile;
try {
  const previous = JSON.parse(await readFile(resolve(target, "package.json"), "utf8"));
  if (JSON.stringify(previous) === JSON.stringify(generated)) {
    lockfile = await readFile(resolve(target, "pnpm-lock.yaml"), "utf8");
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
// Recreate only the checked generated artifact; preserve its lock when inputs match.
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await writeFile(resolve(target, "package.json"), JSON.stringify(generated, null, 2) + "\n");
if (lockfile) await writeFile(resolve(target, "pnpm-lock.yaml"), lockfile);
console.log("Prepared apps/api/dist/firebase; install its isolated production dependencies before emulation/deployment.");
