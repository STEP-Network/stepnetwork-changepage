#!/usr/bin/env node
/**
 * The only check this repo has, and the only one it needs before M3.
 *
 * 1. Contract version sync — CLAUDE.md requires CONTRACT_VERSION in src/stub.js and the version
 *    line in docs/02-contract.md to move together. Nothing else can catch a drift between them:
 *    both files stay syntactically valid while publishers build against the wrong number.
 * 2. Relative link integrity — the docs are the product and they are heavily cross-linked. A dead
 *    link in docs/10-publisher-integration.md ships to a publisher's developers.
 *
 * Zero dependencies. Exit 1 on any failure.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const fail = (file, msg) => failures.push(`${file}: ${msg}`);

/* ---------------------------------------------------------------- 1. contract version */

const STUB = "src/stub.js";
const CONTRACT = "docs/02-contract.md";

const stubMatch = read(STUB).match(/CONTRACT_VERSION\s*=\s*(\d+)/);
const contractMatch = read(CONTRACT).match(/\*\*Version:\s*(\d+)/);

if (!stubMatch) {
  fail(STUB, "no `CONTRACT_VERSION = <n>` found");
} else if (!contractMatch) {
  fail(CONTRACT, "no `**Version: <n>` line found");
} else if (stubMatch[1] !== contractMatch[1]) {
  fail(
    "contract version",
    `${STUB} says v${stubMatch[1]}, ${CONTRACT} says v${contractMatch[1]} — ` +
      "they are one atomic edit (CLAUDE.md, hard rules)"
  );
}

/* ---------------------------------------------------------------- 2. relative links */

function markdownFiles(dir) {
  const out = [];
  for (const entry of readdirSync(join(ROOT, dir === "." ? "" : dir))) {
    if (entry === "node_modules" || entry === ".git") continue;
    const rel = dir === "." ? entry : `${dir}/${entry}`;
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...markdownFiles(rel));
    else if (entry.endsWith(".md")) out.push(rel);
  }
  return out;
}

// Inline links only — `](target)`. Skips fenced code blocks so documented snippets don't false-positive.
const LINK = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

for (const file of markdownFiles(".")) {
  const body = read(file).replace(/^```[\s\S]*?^```/gm, "");
  for (const [, target] of body.matchAll(LINK)) {
    if (/^(https?:|mailto:|#|\/\/)/.test(target)) continue;
    const path = target.split("#")[0];
    if (!path) continue;
    const resolved = resolve(join(ROOT, dirname(file)), decodeURIComponent(path));
    if (!existsSync(resolved)) fail(file, `dead link → ${target}`);
    else if (!resolved.startsWith(ROOT)) fail(file, `link escapes the repo → ${target}`);
    else {
      // Case-sensitivity: macOS resolves `DOCS/` to `docs/`, Linux CI does not.
      const onDisk = relative(ROOT, resolved);
      const parts = onDisk.split("/");
      let cursor = ROOT;
      for (const part of parts) {
        if (!readdirSync(cursor).includes(part)) {
          fail(file, `case mismatch on disk → ${target}`);
          break;
        }
        cursor = join(cursor, part);
      }
    }
  }
}

/* ---------------------------------------------------------------- report */

if (failures.length) {
  console.error(`check-docs: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log("check-docs: ok — contract version in sync, all relative links resolve");
