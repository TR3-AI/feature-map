/* Shared idea-slicer nav: injects a floating "Home + search" bar into any map page.
   Add to a page with:  <script src="nav.js" defer></script>  */
(function () {
  var OVERVIEW = './'; // the all-ideas index

  var style = document.createElement('style');
  style.textContent =
    '.slicenav{position:sticky;top:10px;z-index:50;display:flex;align-items:center;gap:10px;' +
    'max-width:560px;margin:0 auto 18px;padding:8px 8px 8px 12px;' +
    'background:rgba(255,255,255,.9);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);' +
    'border-radius:16px;box-shadow:0 8px 24px rgba(70,50,120,.14)}' +
    '.slicenav-home{flex:0 0 auto;text-decoration:none;font-weight:800;font-size:15px;color:#6b4fd0;' +
    'background:#f3f0ff;padding:10px 13px;border-radius:12px;white-space:nowrap}' +
    '.slicenav-home:active{transform:scale(.98)}' +
    '.slicenav-search{position:relative;flex:1 1 auto}' +
    '#slicenav-q{width:100%;font-size:16px;padding:10px 12px;border-radius:12px;border:2px solid #e7e0f5;' +
    'background:#fff;color:#2b2140;outline:none;font-family:inherit}' +
    '#slicenav-q:focus{border-color:#bfa8f0}' +
    '.slicenav-results{position:absolute;left:0;right:0;top:calc(100% + 6px);background:#fff;' +
    'border-radius:14px;box-shadow:0 12px 30px rgba(70,50,120,.18);padding:6px;max-height:62vh;overflow:auto}' +
    '.slicenav-results a{display:flex;align-items:center;gap:10px;text-decoration:none;color:#2b2140;' +
    'padding:11px 12px;border-radius:10px;font-size:15px}' +
    '.slicenav-results a:active{background:#f3f0ff}' +
    '.slicenav-results .ic{font-size:22px;flex:0 0 auto}' +
    '.slicenav-empty{color:#6b6580;text-align:center;padding:12px;margin:0;font-size:14px}';
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.className = 'slicenav';
  bar.innerHTML =
    '<a class="slicenav-home" href="' + OVERVIEW + '">&#129504; All ideas</a>' +
    '<div class="slicenav-search">' +
      '<input type="search" id="slicenav-q" placeholder="Search ideas\u2026" autocomplete="off" aria-label="Search idea maps">' +
      '<div class="slicenav-results" id="slicenav-results" hidden></div>' +
    '</div>';
  document.body.insertBefore(bar, document.body.firstChild);

  var q = document.getElementById('slicenav-q');
  var results = document.getElementById('slicenav-results');
  var pages = [];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function draw(items) {
    if (!items.length) { results.innerHTML = '<p class="slicenav-empty">No matches</p>'; return; }
    results.innerHTML = items.map(function (p) {
      return '<a href="' + encodeURI(p.file) + '"><span class="ic">' + (p.emoji || '\uD83E\uDDE0') +
        '</span><span>' + esc(p.title) + '</span></a>';
    }).join('');
  }

  function onInput() {
    var v = q.value.trim().toLowerCase();
    if (!v) { results.hidden = true; return; }
    draw(pages.filter(function (p) {
      return (p.title + ' ' + (p.desc || '')).toLowerCase().indexOf(v) !== -1;
    }));
    results.hidden = false;
  }

  fetch('pages.json', {cache:'no-store'}).then(function (r) { return r.json(); })
    .then(function (d) { pages = d; }).catch(function () {});

  q.addEventListener('input', onInput);
  q.addEventListener('focus', function () { if (q.value.trim()) results.hidden = false; });
  q.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var a = results.querySelector('a'); if (a) { location.href = a.getAttribute('href'); } }
  });
  document.addEventListener('click', function (e) { if (!bar.contains(e.target)) results.hidden = true; });
})();
