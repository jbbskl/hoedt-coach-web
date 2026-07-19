'use strict';

// Terug-naar-takenlijst knop voor test-klanten (is_test=true). Test-klanten
// starten elke taak vanaf /test-takenlijst en landen daarna in het dashboard
// (bv. #training, #voeding, #checkin) om de taak te doen. Zonder terugweg
// blijven ze in het dashboard hangen en maken ze de overige taken niet af.
// Deze drijvende pill brengt ze terug naar de takenlijst. Alleen zichtbaar
// voor is_test-klanten — check via /api/klant/mij (zelfde patroon als bug-fab).

(function () {
  if (window.__TT_FAB_INIT) return;
  window.__TT_FAB_INIT = true;

  function injectStyles() {
    if (document.getElementById('tt-fab-style')) return;
    var css = ''
      + '.tt-fab{position:fixed;left:16px;bottom:96px;z-index:200;display:inline-flex;'
      + 'align-items:center;gap:7px;padding:10px 16px;border-radius:99px;text-decoration:none;'
      + 'background:#0f0f1a;color:#f5f0e8;font-family:"DM Sans",sans-serif;font-size:13.5px;'
      + 'font-weight:700;box-shadow:0 4px 14px rgba(15,15,26,0.28);'
      + 'border:1px solid rgba(201,168,76,0.5);'
      + 'transition:transform 160ms ease,filter 160ms ease;}'
      + '.tt-fab:hover,.tt-fab:active{transform:scale(1.04);filter:brightness(1.08);}'
      + '.tt-fab svg{width:16px;height:16px;color:#c9a84c;flex:0 0 auto;}'
      + '@media(max-width:480px){.tt-fab{bottom:104px;}}';
    var s = document.createElement('style');
    s.id = 'tt-fab-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function bouwPill() {
    if (document.getElementById('tt-fab')) return;
    var a = document.createElement('a');
    a.id = 'tt-fab';
    a.className = 'tt-fab';
    a.href = '/test-takenlijst';
    a.setAttribute('aria-label', 'Terug naar takenlijst');
    a.innerHTML = ''
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M9 11l3 3L22 4"/>'
      + '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
      + '</svg>Takenlijst';
    document.body.appendChild(a);
  }

  async function init() {
    try {
      var r = await fetch('/api/klant/mij', { credentials: 'same-origin' });
      if (!r.ok) return;
      var d = await r.json();
      if (!d || d.is_test !== true) return;
      injectStyles();
      bouwPill();
    } catch (_) { /* geen test-klant / niet ingelogd / fetch faalt — stil */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
