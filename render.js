#!/usr/bin/env node
// Renders maps/<slug>.md + verify-<slug>/features/ → <slug>.html (one merged page),
// updates pages.json. Usage: node render.js <slug>   (run from repo root)
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

// ── pstack tester kit → name-keyed merge data (sub-features, reach, drive, gotchas)
const kitDir = `verify-${slug}/features`;
const kit = new Map();
if (fs.existsSync(kitDir)) {
  const sec = (text, name) => {
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = text.match(new RegExp(`## ${safe}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`));
    return m ? m[1].trim() : "";
  };
  const li = (text) => [...text.matchAll(/^- (.+)$/gm)].map((x) => x[1].trim());
  for (const f of fs.readdirSync(kitDir).filter((f) => f.endsWith(".md") && f !== "README.md")) {
    const text = fs.readFileSync(`${kitDir}/${f}`, "utf8").replace(/\r\n/g, "\n");
    const name = ((text.match(/^# (.+)$/m) || [])[1] || f).trim();
    const subs = li(sec(text, "Sub-features")).map((s) => {
      const m = s.match(/^`([^`]+)`\s*(.*)$/);
      return `<span class="sub"><b>${esc(m ? m[1] : "")}</b> ${rich(m ? m[2] : s)}</span>`;
    });
    const reach = li(sec(text, "How to get to it (user POV)"));
    const knowhow = li(sec(text, "How it works in practice"));
    const stream = sec(text, "Test stream");
    const afterPre = stream.split(/^Preconditions:\s*$/m)[1] || stream;
    const firstUnit = afterPre.search(/^\d+\.\s+\*\*/m);
    const preText = firstUnit >= 0 ? afterPre.slice(0, firstUnit) : afterPre;
    const unitText = firstUnit >= 0 ? afterPre.slice(firstUnit) : "";
    const grab = (u, k) => {
      const m = u.match(new RegExp(`^[ \\t]*${k}:[ \\t]*(.+)$`, "m"));
      return m ? m[1].trim() : "";
    };
    const units = unitText.split(/^(?=\d+\.\s+\*\*)/m).filter((u) => u.trim()).map((u) => {
      const head = u.match(/^\d+\.\s+\*\*(.+?)\*\*\.?[ \t]*(.*)/);
      return {
        title: head ? head[1].trim() : "",
        body: head ? head[2].trim() : "",
        ok: grab(u, "Success"),
        bad: grab(u, "Failure"),
      };
    });
    kit.set(name, {
      subs,
      reach,
      knowhow,
      pre: li(preText).map((s) => esc(s)).join(" · "),
      units,
      gotchas: li(sec(text, "Gotchas")),
    });
  }
}

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
  const k = kit.get(name);
  const lifeHtml = life.map((seg, i) => {
    let cls = "fvstep", tag = `step ${i + 1}`;
    if (/^TRIGGER:/i.test(seg)) { cls += " trig"; tag = "trigger"; seg = seg.replace(/^TRIGGER:\s*/i, ""); }
    if (/^END:/i.test(seg)) { cls += " end"; tag = "end"; seg = seg.replace(/^END:\s*/i, ""); }
    return `      <div class="${cls}"><span class="tag">${tag}</span> ${rich(seg)}</div>`;
  }).join("\n");
  const subSec = k && k.subs.length ? `
    <div class="fsec"><div class="flbl">Sub-features</div>
      <div class="subs">
        ${k.subs.join("\n        ")}
      </div>
    </div>` : "";
  const vDetail = k ? `
    <div class="flbl">How to get to it (user POV)</div>
    <ul class="vreach">
      ${k.reach.map((s) => `<li>${rich(s)}</li>`).join("\n      ")}
    </ul>${k.knowhow && k.knowhow.length ? `
    <div class="flbl">How it works in practice (external research)</div>
    <ul class="vreach">
      ${k.knowhow.map((s) => `<li>${rich(s)}</li>`).join("\n      ")}
    </ul>` : ""}
    <div class="flbl">Test stream</div>
    <div class="pre">${k.pre}</div>
    ${k.units.map((u, i) => `
    <div class="tunit">
      <div class="thead"><span class="tnum">${i + 1}</span> ${rich(u.title)}</div>
      ${u.body ? `<div class="tbody">${rich(u.body)}</div>` : ""}
      <div class="verdict ok"><span>Success</span> ${rich(u.ok)}</div>
      <div class="verdict bad"><span>Failure</span> ${rich(u.bad)}</div>
    </div>`).join("\n    ")}
    <div class="flbl">Gotchas</div>
    ${k.gotchas.map((s) => `<div class="gotcha">${rich(s)}</div>`).join("\n    ")}` : "";
  return `
  <section class="fbox">
    <div class="fhead"><span class="fnum">F${idx + 1}</span><h3>${esc(name)}</h3><span class="fdept">${esc(inline(chunk, "From"))}</span></div>
    <div class="fsec"><div class="flbl">The feature</div>
      <ol class="fsteps">
        ${fSteps.map((s) => `<li>${rich(s)}</li>`).join("\n        ")}
      </ol>
    </div>${subSec}
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
    <div class="vactor">run by the tester agent · recorded with ProofShot · Bobby witnesses</div>${vDetail}
    <div class="verdict ok"><span>Success</span> ${rich(inline(chunk, "Success"))}</div>
    <div class="verdict bad"><span>Failure</span> ${rich(inline(chunk, "Failure"))}</div>
  </section>`;
});

const tpl = fs.readFileSync("template.html", "utf8");
const srcUrl = `https://tr3-ai.github.io/idea-slicer/${slug}.html`;
const kitFoot = kit.size ? ` · <a href="https://github.com/TR3-AI/feature-map/tree/main/verify-${slug}">raw tester kit</a>` : "";
const subTotal = [...kit.values()].reduce((n, k) => n + k.subs.length, 0);
const stats = `<div class="stats">
    <div class="stat"><span class="snum">${esc(count)}</span><span class="slbl">features found</span></div>${kit.size ? `
    <div class="stat"><span class="snum">${subTotal}</span><span class="slbl">sub-features</span></div>
    <div class="stat"><span class="snum">${kit.size}</span><span class="slbl">verification recipes</span></div>` : ""}
  </div>`;
const rnotes = [];
for (const [fname, k] of kit) {
  for (const g of k.gotchas) {
    if (/^Research note:/i.test(g)) rnotes.push({ fname, note: g.replace(/^Research note:\s*/i, "") });
  }
}
const research = rnotes.length ? `<section class="rnotes">
    <div class="rnhead">⚠️ ${rnotes.length} research disagreement${rnotes.length > 1 ? "s" : ""} — broadcast, not buried</div>
    <div class="rnsub">These elements specify behaviour that differs from the standard implementation found in external research. The tester tests the map's version knowingly — never by habit. Keep or drop each element is Bobby's call.</div>
    ${rnotes.map((r) => `<div class="rnote"><b>${esc(r.fname)}</b> — ${rich(r.note)}</div>`).join("\n    ")}
  </section>` : "";
const html = tpl
  .replaceAll("{{TITLE}}", esc(title))
  .replaceAll("{{SOURCE_URL}}", srcUrl)
  .replaceAll("{{SOURCE_LABEL}}", esc(`idea-slicer${issue ? " · issue #" + issue : ""}`))
  .replaceAll("{{COUNT}}", esc(`${count} features`))
  .replaceAll("{{UPDATED}}", esc(updated))
  .replaceAll("{{KIT_FOOT}}", kitFoot)
  .replace("{{STATS}}", stats)
  .replace("{{RESEARCH}}", () => research)
  .replace("{{FEATURES}}", features.join("\n"));

fs.writeFileSync(`${slug}.html`, html);

const manifest = JSON.parse(fs.readFileSync("pages.json", "utf8"));
const entry = {
  file: `${slug}.html`,
  title: `${title} — feature map`,
  desc: `${count} features at their smallest useful size — feature, behaviour, lifecycle, sub-features — each with user-side driving recipes and success/failure parameters. Tracks idea-slicer${issue ? " issue #" + issue : ""}.`,
  date: updated,
  emoji: "🛠️",
  status: "open",
};
const i = manifest.findIndex((e) => e.file === entry.file);
if (i >= 0) manifest[i] = entry; else manifest.unshift(entry);
fs.writeFileSync("pages.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`rendered ${slug}.html (${features.length} features, ${kit.size} with kit recipes)`);
