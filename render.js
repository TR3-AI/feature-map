#!/usr/bin/env node
// Renders maps/<slug>.md → <slug>.html from template.html, updates pages.json.
// Usage: node render.js <slug>   (run from repo root)
const fs = require("fs");

const slug = process.argv[2];
if (!slug) { console.error("usage: node render.js <slug>"); process.exit(1); }

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`(.+?)`/g, "<code>$1</code>");

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

// blueprint page is written after the kit block so {{KIT_BANNER}} can be filled
// ── tester kit page (pstack recipes → <slug>-kit.html) ──
const kitDir = `verify-${slug}/features`;
let kitBanner = "";
if (fs.existsSync(kitDir)) {
  const sec = (text, name) => {
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = text.match(new RegExp(`## ${safe}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`));
    return m ? m[1].trim() : "";
  };
  const li = (text) => [...text.matchAll(/^- (.+)$/gm)].map((x) => x[1].trim());
  const files = fs.readdirSync(kitDir).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
  const recipes = files.map((f, i) => {
    const text = fs.readFileSync(`${kitDir}/${f}`, "utf8").replace(/\r\n/g, "\n");
    const name = (text.match(/^# (.+)$/m) || [])[1] || f;
    const intro = text.split(/^## /m)[0].split("\n").slice(1).map((l) => l.trim()).filter(Boolean).join(" ");
    const subs = li(sec(text, "Sub-features")).map((s) => {
      const m = s.match(/^`([^`]+)`\s*(.*)$/);
      return `<span class="sub"><b>${esc(m ? m[1] : "")}</b> ${rich(m ? m[2] : s)}</span>`;
    }).join("\n        ");
    const reach = li(sec(text, "How to get to it (user POV)")).map((s) => `<li>${rich(s)}</li>`).join("\n        ");
    const drive = sec(text, "Driving it with the harness");
    const afterPre = (drive.split(/^Preconditions:\s*$/m)[1] || drive);
    const firstStep = afterPre.search(/^- \*\*/m);
    const preText = firstStep >= 0 ? afterPre.slice(0, firstStep) : afterPre;
    const stepText = firstStep >= 0 ? afterPre.slice(firstStep) : afterPre;
    const pre = li(preText).map((s) => esc(s)).join(" · ");
    const driveItems = li(stepText).map((s) => `<li>${rich(s)}</li>`).join("\n        ");
    const gotchas = li(sec(text, "Gotchas")).map((s) => `<div class="gotcha">${rich(s)}</div>`).join("\n      ");
    return `
  <div class="recipe">
    <div class="rhead"><span class="rnum">R${i + 1}</span><h3>${esc(name)}</h3></div>
    <p class="rintro">${rich(intro)}</p>
    <div class="rsec"><div class="rlbl">Sub-features</div>
      <div class="subs">
        ${subs}
      </div>
    </div>
    <div class="rsec"><div class="rlbl">How to get to it (user POV)</div>
      <ul class="rlist">
        ${reach}
      </ul>
    </div>
    <div class="rsec"><div class="rlbl">Driving it with the harness</div>
      <div class="pre">${pre}</div>
      <ul class="rlist">
        ${driveItems}
      </ul>
    </div>
    <div class="rsec"><div class="rlbl">Gotchas</div>
      ${gotchas}
    </div>
  </div>`;
  }).join("\n");
  const kitTpl = fs.readFileSync("kit-template.html", "utf8");
  const kitHtml = kitTpl
    .replaceAll("{{TITLE}}", esc(title))
    .replaceAll("{{BLUEPRINT_URL}}", `${slug}.html`)
    .replaceAll("{{SOURCE_URL}}", srcUrl)
    .replaceAll("{{SOURCE_LABEL}}", esc(`idea-slicer${issue ? " · issue #" + issue : ""}`))
    .replaceAll("{{COUNT}}", esc(String(files.length)))
    .replaceAll("{{UPDATED}}", esc(updated))
    .replaceAll("{{KIT_URL}}", `https://github.com/TR3-AI/feature-map/tree/main/verify-${slug}`)
    .replaceAll("{{SLUG}}", esc(slug))
    .replace("{{RECIPES}}", recipes);
  fs.writeFileSync(`${slug}-kit.html`, kitHtml);
  kitBanner = `<div class="kitbanner">🧰 <b>Tester kit — the P-Stack side:</b> these ${files.length} features as driving recipes for the tester agent, recorded with ProofShot. <a href="${slug}-kit.html">Open the kit →</a></div>`;
  console.log(`rendered ${slug}-kit.html (${files.length} recipes)`);
}

fs.writeFileSync(`${slug}.html`, html.replace("{{KIT_BANNER}}", kitBanner));

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
