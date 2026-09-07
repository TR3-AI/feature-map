// Pure markdown → HTML renderer for the AGENTS.md rulebook page.
// No fs, no process, no Date: renderRulebook(markdown, options) is a plain string-in,
// string-out function. options.stampDate supplies the "updated <date>" header text.

// ---------- inline markdown (escape → links → bold → italic → code; same esc/rich pattern as render.js) ----------
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const inlineFormat = (s) => {
  let h = esc(s);
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  h = h.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  h = h.replace(/\*([^*]+)\*/g, "<i>$1</i>");
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  return h;
};

// ---------- split the doc into its 8 top-level "## " sections, in document order ----------
// AGENTS.md also uses "##"/"###" as sub-headings *inside* the P-stack principle/skill
// bodies (e.g. "## Vary the rhythm"), so a blind "every ## line" split over-splits.
// The 8 real section titles are the stable anchors; matching them by exact text finds
// only the true top-level boundaries and leaves nested headings inside each body.
const TOP_LEVEL_TITLES = [
  "Layout",
  "The connection (the whole point)",
  "The rules",
  "P-stack principles (governing every map)",
  "P-stack skills (governing every map)",
  "The standard flow (every idea, every time)",
  "The page — structure and identity (Bobby's rulings)",
  "Publish rhythm",
];
function splitSections(md) {
  const positions = TOP_LEVEL_TITLES.map((title) => {
    const re = new RegExp(`^## ${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m");
    const m = md.match(re);
    if (!m) throw new Error(`AGENTS.md section heading not found: "## ${title}"`);
    return { title, start: m.index, end: m.index + m[0].length };
  });
  return positions.map((p, i) => ({
    title: p.title,
    body: md.slice(p.end, i + 1 < positions.length ? positions[i + 1].start : md.length).trim(),
  }));
}

// ---------- card rendering: Layout, The connection, The rules, standard flow, page, publish ----------
// Each unit is a bullet ("- "), a numbered item ("N. "), or a bare paragraph.
function splitUnits(text) {
  const units = [];
  let buf = null, marker = null, num = null;
  const push = () => { if (buf) { units.push({ marker, num, text: buf.join(" ").trim() }); buf = null; marker = null; num = null; } };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "") { push(); continue; }
    let m;
    if ((m = line.match(/^-\s+(.*)$/))) { push(); buf = [m[1]]; marker = "-"; }
    else if ((m = line.match(/^(\d+)\.\s+(.*)$/))) { push(); buf = [m[2]]; marker = "N"; num = m[1]; }
    else if (!buf) { buf = [line]; }
    else { buf.push(line); }
  }
  push();
  return units;
}

// Title/why split: a leading **bold** marker always wins. Otherwise, only a list item
// (never a bare paragraph — prose em dashes are punctuation, not a label/definition split)
// may split on its first " — ". Anything else renders as one plain card.
function renderCard(unit, extraCls) {
  const { marker, num, text } = unit;
  const prefix = num ? `${num}. ` : "";
  const cls = `item${extraCls ? " " + extraCls : ""}`;
  const bold = text.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
  if (bold && bold[2].trim()) {
    return `  <div class="${cls}"><b>${prefix}${inlineFormat(bold[1])}</b><span class="why">${inlineFormat(bold[2])}</span></div>`;
  }
  if (marker !== null) {
    const dashIdx = text.indexOf(" — ");
    if (dashIdx > 0) {
      return `  <div class="${cls}"><b>${prefix}${inlineFormat(text.slice(0, dashIdx))}</b><span class="why">${inlineFormat(text.slice(dashIdx + 3))}</span></div>`;
    }
  }
  return `  <div class="${cls}">${prefix}${inlineFormat(text)}</div>`;
}

const renderCardList = (body, extraCls) => splitUnits(body).map((u) => renderCard(u, extraCls)).join("\n");

// ---------- prose rendering: P-stack principles / P-stack skills (full bodies, no excerpts) ----------
// Block converter for one chunk of markdown: # / ## / ### headings, "- "/"N. " lists,
// "> " blockquotes, and paragraphs. Heading levels shift by 2 (h1->h3 ... h3->h5) since
// h1/h2 are reserved for the page title and section headers.
function mdBlockToHtml(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  let list = null;
  const flush = () => {
    if (list) {
      const startAttr = list.tag === "ol" && list.start !== "1" ? ` start="${list.start}"` : "";
      out.push(`<${list.tag}${startAttr}>${list.items.map((it) => `<li>${inlineFormat(it)}</li>`).join("")}</${list.tag}>`);
      list = null;
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    // A blank line alone never ends a list: markdown "loose lists" (blank line between
    // items) are still one list. Only a genuinely different block flushes it.
    if (line.trim() === "") { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.+)$/))) {
      flush();
      out.push(`<h${m[1].length + 2}>${inlineFormat(m[2])}</h${m[1].length + 2}>`);
      i++; continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      flush();
      const buf = [m[1]];
      i++;
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${buf.map(inlineFormat).join("<br>")}</blockquote>`);
      continue;
    }
    if ((m = line.match(/^-\s+(.+)$/))) {
      if (!list || list.tag !== "ul") { flush(); list = { tag: "ul", items: [] }; }
      list.items.push(m[1]); i++; continue;
    }
    if ((m = line.match(/^(\d+)\.\s+(.+)$/))) {
      if (!list || list.tag !== "ol") { flush(); list = { tag: "ol", items: [], start: m[1] }; }
      list.items.push(m[2]); i++; continue;
    }
    flush();
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" &&
      !/^(#{1,3})\s/.test(lines[i]) && !/^-\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) && !/^>\s?/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    out.push(`<p>${inlineFormat(buf.join(" "))}</p>`);
  }
  flush();
  return out.join("\n");
}

// A P-stack section is a run of "# Name" bodies separated by "---" rules (one boxed
// .pstack card per body, so every principle/skill reads as its own unit on the page).
function renderPstack(body) {
  return body.split(/^---$/m).map((c) => c.trim()).filter(Boolean)
    .map((c) => `  <div class="pstack">\n${mdBlockToHtml(c)}\n  </div>`).join("\n");
}

const RENDERERS = {
  "Layout": (b) => renderCardList(b, ""),
  "The connection (the whole point)": (b) => renderCardList(b, "teal"),
  "The rules": (b) => renderCardList(b, ""),
  "P-stack principles (governing every map)": (b) => renderPstack(b),
  "P-stack skills (governing every map)": (b) => renderPstack(b),
  "The standard flow (every idea, every time)": (b) => renderCardList(b, "teal"),
  "The page — structure and identity (Bobby's rulings)": (b) => renderCardList(b, ""),
  "Publish rhythm": (b) => renderCardList(b, "teal"),
};

// ---------- assemble ----------
function renderRulebook(markdown, options = {}) {
  const { stampDate } = options;
  const md = markdown.replace(/\r\n/g, "\n");
  const preamble = md.slice(0, md.indexOf("\n## ")).split("\n");
  const intro = preamble.slice(1).find((l) => l.trim() !== "").trim(); // AGENTS.md line 3: the stance paragraph
  const sections = splitSections(md);

  const sectionsHtml = sections.map(({ title, body }) => {
    const render = RENDERERS[title] || renderPstack; // unknown future section: never drop content
    return `  <h2>${inlineFormat(title)}</h2>\n${render(body)}`;
  }).join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Feature-map rulebook</title>
<style>
  :root {
    --ink: #17202b; --soft: #51606f; --faint: #8fa0b3; --paper: #eef2f6; --box: #ffffff;
    --blue: #2456a6; --blue-soft: #dbe7f8; --teal: #0f766e; --teal-soft: #e0f2ef;
    --red: #c2374a; --line: #c8d4e0; --amber: #9a6a00;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    margin: 0; padding: 24px 14px 64px;
    font-family: "Segoe UI", system-ui, sans-serif; color: var(--ink);
    background:
      linear-gradient(var(--paper), var(--paper)),
      repeating-linear-gradient(0deg, transparent 0 23px, rgba(36,86,166,.06) 23px 24px),
      repeating-linear-gradient(90deg, transparent 0 23px, rgba(36,86,166,.06) 23px 24px);
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  header { text-align: center; margin-bottom: 26px; }
  h1 { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 26px; font-weight: 800; letter-spacing: -.5px; }
  .sub { color: var(--soft); margin-top: 6px; font-size: 15px; }
  .stamp {
    display: inline-block; margin-top: 10px; font-family: ui-monospace, Menlo, monospace;
    font-size: 11.5px; color: var(--faint); border: 1px solid var(--line);
    padding: 4px 12px; border-radius: 4px; background: var(--box);
  }
  h2 {
    font-family: ui-monospace, Menlo, monospace; font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 2px; color: var(--soft);
    margin: 30px 0 10px; text-align: center;
  }
  .item {
    background: var(--box); border: 2px solid var(--blue); border-left-width: 5px;
    border-radius: 8px; padding: 13px 17px; margin: 8px 0;
    font-size: 14.5px; line-height: 1.55; box-shadow: 0 6px 18px rgba(23, 32, 43, .06);
  }
  .item b { color: var(--blue); }
  .item.teal { border-color: var(--teal); }
  .item.teal b { color: var(--teal); }
  .item .why { display: block; color: var(--soft); font-size: 13.5px; margin-top: 3px; }
  .back { display: block; text-align: center; margin-top: 28px; color: var(--blue); font-weight: 700; text-decoration: none; }
  footer { text-align: center; color: var(--soft); font-size: 13px; margin-top: 40px; }
  footer a { color: var(--blue); font-weight: 700; text-decoration: none; }
  code {
    background: var(--paper); padding: 1px 5px; border-radius: 3px;
    font-family: ui-monospace, Menlo, monospace; font-size: 13px;
  }
  a { color: var(--blue); }
  .pstack {
    background: var(--box); border: 2px solid var(--blue); border-left-width: 5px;
    border-radius: 8px; padding: 16px 19px; margin: 10px 0;
    font-size: 14.5px; line-height: 1.6; box-shadow: 0 6px 18px rgba(23, 32, 43, .06);
  }
  .pstack h3 { font-family: ui-monospace, Menlo, monospace; font-size: 16px; color: var(--blue); margin: 0 0 8px; }
  .pstack h4 { font-family: ui-monospace, Menlo, monospace; font-size: 13px; letter-spacing: .5px; text-transform: uppercase; color: var(--teal); margin: 16px 0 6px; }
  .pstack h5 { font-size: 13.5px; color: var(--soft); margin: 12px 0 4px; font-weight: 700; }
  .pstack p { margin: 8px 0; }
  .pstack ul, .pstack ol { margin: 8px 0 8px 22px; }
  .pstack li { margin: 4px 0; }
  .pstack blockquote { border-left: 3px solid var(--line); padding-left: 12px; margin: 8px 0; color: var(--soft); font-style: italic; }
  .pstack hr { border: none; border-top: 1px solid var(--line); margin: 14px 0; }
  .pstack b { color: var(--ink); }
</style>
</head>
<body>
<div class="wrap">

  <header>
    <h1>\u{1F4D6} Feature-map rulebook</h1>
    <div class="sub">${inlineFormat(intro)}</div>
    <div class="stamp">updated ${stampDate} · mirrors AGENTS.md in the repo</div>
  </header>

${sectionsHtml}

  <a class="back" href="index.html">← all feature maps</a>
  <footer>Binding copy: <a href="https://github.com/TR3-AI/feature-map/blob/main/AGENTS.md">AGENTS.md</a> · skill: featuremap</footer>

</div>
<script src="nav.js" defer></script>
</body>
</html>
`;
}

module.exports = { renderRulebook };
