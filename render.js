#!/usr/bin/env node
// Renders maps/<slug>.md → <slug>.html from template.html, updates pages.json.
// Usage: node render.js <slug>   (run from repo root)
const fs = require("fs");

const slug = process.argv[2];
if (!slug) { console.error("usage: node render.js <slug>"); process.exit(1); }

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const md = fs.readFileSync(`maps/${slug}.md`, "utf8").replace(/\r\n/g, "\n");
const lines = md.split("\n");

const title = (lines[0].match(/^# (.+?) — feature map/) || [])[1] || slug;
const srcLine = lines.find((l) => l.startsWith("Source:")) || "";
const issue = (srcLine.match(/issue #(\d+)/) || [])[1] || "";
const updated = (lines.find((l) => l.startsWith("Updated:")) || "").replace("Updated:", "").trim();
const count = (lines.find((l) => l.startsWith("Features:")) || "").replace("Features:", "").trim();

const chunks = md.split(/^## /m).slice(1);
const features = chunks.map((chunk) => {
  const name = chunk.split("\n")[0].trim();
  const field = (k) => {
    const m = chunk.match(new RegExp(`^${k}:\\s*(.+)$`, "m"));
    return m ? m[1].trim() : "";
  };
  const vMatch = chunk.match(/^Verification:\s*\n((?:\d+\..*\n?)+)/m);
  const steps = vMatch ? [...vMatch[1].matchAll(/^\d+\.\s+(.+)$/gm)].map((x) => x[1].trim()) : [];
  const life = field("Lifecycle").split(/\s+→\s+/).filter(Boolean);
  const lifeHtml = life.map((seg, i) => {
    const cls = i === 0 ? "pill trig" : i === life.length - 1 ? "pill end" : "pill";
    return `${i ? '<span class="arr">→</span> ' : ""}<span class="${cls}">${esc(seg)}</span>`;
  }).join("\n      ");
  return `
  <div class="feat">
    <h3>🧩 <span>${esc(name)}</span> <span class="from">${esc(field("From"))}</span></h3>
    <div class="lbl">The feature</div>
    <p class="kv">${esc(field("Feature"))}</p>
    <div class="lbl">Behaviour</div>
    <p class="kv">${esc(field("Behaviour"))}</p>
    <div class="lbl">Lifecycle</div>
    <div class="life">
      ${lifeHtml}
    </div>
    <div class="lbl">Verification — from the user's side</div>
    <ol class="steps">
      ${steps.map((s) => `<li>${esc(s)}</li>`).join("\n      ")}
    </ol>
    <div class="verdict ok"><span>Success</span> ${esc(field("Success"))}</div>
    <div class="verdict bad"><span>Failure</span> ${esc(field("Failure"))}</div>
  </div>`;
});

const tpl = fs.readFileSync("template.html", "utf8").replace(/\n<!-- Per-feature card markup[\s\S]*?-->\s*$/, "\n");
const srcUrl = `https://tr3-ai.github.io/idea-slicer/${slug}.html`;
const html = tpl
  .replaceAll("{{TITLE}}", esc(title))
  .replaceAll("{{SOURCE_URL}}", srcUrl)
  .replaceAll("{{SOURCE_LABEL}}", esc(`idea-slicer${issue ? " · issue #" + issue : ""}`))
  .replaceAll("{{COUNT}}", esc(`${count} features`))
  .replaceAll("{{UPDATED}}", esc(updated))
  .replace("{{FEATURES}}", features.join("\n"));

fs.writeFileSync(`${slug}.html`, html);

const manifest = JSON.parse(fs.readFileSync("pages.json", "utf8"));
const first = chunks[0] || "";
const entry = {
  file: `${slug}.html`,
  title: `${title} — feature map`,
  desc: `${count} features at their smallest useful size, each with user-side verification: success and failure parameters. Tracks idea-slicer${issue ? " issue #" + issue : ""}.`,
  date: updated,
  emoji: "🛠️",
  status: "open",
};
const i = manifest.findIndex((e) => e.file === entry.file);
if (i >= 0) manifest[i] = entry; else manifest.unshift(entry);
fs.writeFileSync("pages.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`rendered ${slug}.html (${features.length} features)`);
