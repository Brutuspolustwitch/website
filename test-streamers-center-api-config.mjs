import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set([".git", ".next", "node_modules"]);
const searchableExtensions = new Set([
  ".env",
  ".example",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);
const allowedLegacyReferenceFiles = new Set([
  "src/lib/streamers-center-api.ts",
  "test-streamers-center-api-config.mjs",
]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function isSearchableFile(path) {
  return searchableExtensions.has(path.slice(path.lastIndexOf(".")));
}

const syncRoute = read("src/app/api/bonus-hunt/sync/route.ts");
const helper = read("src/lib/streamers-center-api.ts");
const envExample = read(".env.example");
const envLocalExample = read(".env.local.example");

assert.match(syncRoute, /buildStreamersCenterApiUrl/);
assert.match(syncRoute, /\/api\/streamer-data/);
assert.doesNotMatch(syncRoute, /SECAADEGAS_API_URL|DEFAULT_SECAADEGAS_API_URL/);

assert.match(helper, /STREAMERS_CENTER_API_URL/);
assert.match(helper, /STREAMERS_CENTER_API_KEY/);
assert.match(helper, /not the old domain/);

for (const envFile of [envExample, envLocalExample]) {
  assert.match(envFile, /STREAMERS_CENTER_API_URL=https:\/\/streamerscenter\.com/);
  assert.match(envFile, /STREAMERS_CENTER_API_KEY=/);
  assert.doesNotMatch(envFile, /SECAADEGAS_API_URL|https:\/\/osecaadegas\.pt/);
}

const legacyDomainHits = walk(root)
  .map((path) => [path, relative(root, path).replaceAll("\\", "/")])
  .filter(([path]) => isSearchableFile(path))
  .filter(([, rel]) => !allowedLegacyReferenceFiles.has(rel))
  .filter(([path]) => /https:\/\/osecaadegas\.pt|www\.osecaadegas\.pt|osecaadegas\.pt/.test(readFileSync(path, "utf8")))
  .map(([, rel]) => rel);

assert.deepEqual(legacyDomainHits, [], `Unexpected old API domain references: ${legacyDomainHits.join(", ")}`);

console.log("Streamers Center API config checks passed.");
