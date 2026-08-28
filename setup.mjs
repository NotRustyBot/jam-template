#!/usr/bin/env node
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

const raw = (process.argv[2] ?? "").trim();
const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

if (!slug) {
    console.error("usage: npm run setup -- <game-name>");
    process.exit(1);
}

const pkgPath = "package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.name = slug;
pkg.scripts.upload = pkg.scripts.upload.replace("__GAME_NAME__", slug);
delete pkg.scripts.setup;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const htmlPath = "index.html";
let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/__GAME_NAME__/g, slug);
fs.writeFileSync(htmlPath, html);

execSync("git init", { stdio: "inherit" });

fs.rmSync(fileURLToPath(import.meta.url));

console.log(`scaffolded ${slug}`);
console.log(`next: gh repo create NotRustyBot/${slug} --source=. --push`);
