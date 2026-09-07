#!/usr/bin/env node
// Usage: node render-rulebook.js (run from repo root) — regenerates rulebook.html from AGENTS.md, never hand-edit rulebook.html.
const fs = require("fs");
const { renderRulebook } = require("./rulebook-renderer");

const markdown = fs.readFileSync("AGENTS.md", "utf8");
const html = renderRulebook(markdown, { stampDate: new Date().toISOString().slice(0, 10) });
fs.writeFileSync("rulebook.html", html);
console.log("rendered rulebook.html");
