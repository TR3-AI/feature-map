#!/usr/bin/env node
// Renders maps/<slug>.md → <slug>.html from template.html, updates pages.json.
// Usage: node render.js <slug>   (run from repo root)
const fs = require("fs");

const slug = process.argv[2];
if (!slug) { console.error("usage: node render.js <slug>"); process.exit(1); }

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

const md = fs.readFileSync(`maps/${slug}.md`, "utf8").replace(/\r\n/g, "\n");
const lines = md.split("\n");

const title = (lines[0].match(/^# (.+?) — feature map/) || [])[1] || slug;
const srcLine = lines.find((l) => l.startsWith("Source:")) || "";
const issue = (srcLine.match(/issue #(\d+)/) || [])[1] || "";
const updated = (lines.find((l) => l.startsWith("Updated:")) || "").replace("Updated:", "").trim();
const count = (lines.find((l) => l.startsWith("Features:")) || "").replace("Features:", "").trim();

const chunks = md.split(/^## /m).slice(1);
const block = (chunk, k) => {
  const m = chunk.match(new RegExp(`^${k}:\\s*\\n([\\s\\S]*?)(?=^[A-Z][A-Za-z ]*:|\\Z)`, "m"));
  return m ? m[1].trim() : "";
};
const inline = (chunk, k) => {
  const m = chunk.match(new RegExp(`^${k}:\\s*(.+)$`, "m"));
  return m ? m[1].trim() : "";
};
const numbered = (text) => [...text.matchAll(/^\d+\.\s+(.+)$/gm)].map((x) => x[1].trim());
const bulleted = (text) => [...text.matchAll(/^-\s+(.+)$/gm)].map((x) => x[1].trim());

const features = chunks.map((chunk, idx) => {
  const name = chunk.split("\n")[0].trim();
  const fSteps = numbered(block(chunk, "Feature"));
  const beh = bulleted(block(chunk, "Behaviour"));
  const life = numbered(block(chunk, "Lifecycle"));
  const checks = numbered(block(chunk, "Verification"));
  const lifeHtml = life.map((seg, i) => {
    let cls = "fvstep", tag = `step ${i + 1}`;
    if (/^TRIGGER:/i.test(seg)) { cls += " trig"; tag = "trigger"; seg = seg.replace(/^TRIGGER:\s*/i, ""); }
    if (/^END:/i.test(seg)) { cls += " end"; tag = "end"; seg = seg.replace(/^END:\s*/i, ""); }
    return `      <div class="${cls}"><span class="tag">${tag}</span> ${rich(seg)}</div>`;
  }).join("\n");
  return `
  <section class="fbox">
    <div class="fhead"><span class="fnum">F${idx + 1}</span><h3>${esc(name)}</h3><span class="fdept">${esc(inline(chunk, "From"))}</span></div>
    <div class="fsec"><div class="flbl">The feature</div>
      <ol class="fsteps">
        ${fSteps.map((s) => `<li>${rich(s)}</li>`).join("\n        ")}
      </ol>
    </div>
    <div class="fsec"><div class="flbl">Behaviour</div>
      <ul class="fbeh">
        ${beh.map((s) => `<li>${rich(s)}</li>`).join("\n        ")}
      </ul>
    </div>
    <div class="fsec"><div class="flbl">Lifecycle</div>
      <div class="fvflow">
${lifeHtml}
      </div>
    </div>
  </section>
  <div class="vlink"><span class="vlab">verified by</span></div>
  <section class="vbox">
    <div class="flbl">Verification — from the user's side</div>
    <div class="vactor">run by the tester agent · recorded with ProofShot · Bobby witnesses</div>
    <ol class="fsteps">
      ${checks.map((s) => `<li>${rich(s)}</li>`).join("\n      ")}
    </ol>
    <div class="verdict ok"><span>Success</span> ${rich(inline(chunk, "Success"))}</div>
    <div class="verdict bad"><span>Failure</span> ${rich(inline(chunk, "Failure"))}</div>
  </section>`;
});

const tpl = fs.readFileSync("template.html", "utf8");
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
const entry = {
  file: `${slug}.html`,
  title: `${title} — feature map`,
  desc: `${count} features at their smallest useful size — feature, behaviour, lifecycle — each with user-side verification: success and failure parameters. Tracks idea-slicer${issue ? " issue #" + issue : ""}.`,
  date: updated,
  emoji: "🛠️",
  status: "open",
};
const i = manifest.findIndex((e) => e.file === entry.file);
if (i >= 0) manifest[i] = entry; else manifest.unshift(entry);
fs.writeFileSync("pages.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`rendered ${slug}.html (${features.length} features)`);
