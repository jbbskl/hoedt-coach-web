'use strict';

(function () {
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  var DAG_LABEL = {
    ma: 'Maandag', di: 'Dinsdag', wo: 'Woensdag', do: 'Donderdag',
    vr: 'Vrijdag', za: 'Zaterdag', zo: 'Zondag',
  };
  var MAAND_KORT = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];

  function leesDagDetails() {
    var node = document.getElementById('voe-dag-details');
    if (!node) return [];
    try { return JSON.parse(node.textContent || '[]') || []; }
    catch (e) { return []; }
  }

  function leesKlantId() {
    var node = document.getElementById('voe-dag-details');
    return (node && node.getAttribute('data-klant-id')) || '';
  }

  // Cache: één fetch per page-load voor extra-eten entries van deze klant.
  var EXTRA_ETEN_CACHE = null;
  var EXTRA_ETEN_FETCHING = null;
  async function leesExtraEten() {
    if (EXTRA_ETEN_CACHE) return EXTRA_ETEN_CACHE;
    if (EXTRA_ETEN_FETCHING) return EXTRA_ETEN_FETCHING;
    var klantId = leesKlantId();
    if (!klantId) { EXTRA_ETEN_CACHE = {}; return {}; }
    EXTRA_ETEN_FETCHING = fetch('/coach/api/klant/' + encodeURIComponent(klantId) + '/extra-eten', {
      credentials: 'same-origin',
    }).then(function (r) { return r.ok ? r.json() : { entries: {} }; })
      .then(function (d) { EXTRA_ETEN_CACHE = (d && d.entries) || {}; EXTRA_ETEN_FETCHING = null; return EXTRA_ETEN_CACHE; })
      .catch(function () { EXTRA_ETEN_CACHE = {}; EXTRA_ETEN_FETCHING = null; return {}; });
    return EXTRA_ETEN_FETCHING;
  }

  function fmtVolDatum(iso) {
    if (!iso) return '';
    var dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt.getTime())) return '';
    return dt.getDate() + ' ' + MAAND_KORT[dt.getMonth()];
  }

  function fmtGram(n) {
    var v = Number(n) || 0;
    if (v === Math.round(v)) return String(Math.round(v));
    return String(Math.round(v * 10) / 10);
  }

  function renderModal(dag) {
    var dagLabel = DAG_LABEL[dag.dagKey] || dag.dagKey || '';
    var datumStr = fmtVolDatum(dag.datum);
    var maaltijden = dag.maaltijden || [];
    var maaltijdHtml = maaltijden.length === 0
      ? '<div class="voe-modal-empty">Geen maaltijden gepland voor deze dag.</div>'
      : maaltijden.map(function (m) {
          var ingHtml = (m.ingredienten || []).map(function (ing) {
            var voor = '<span class="voe-ing-voor">Voorgeschreven: ' + escapeHtml(fmtGram(ing.voor)) + escapeHtml(ing.eenheid || 'g') + '</span>';
            var aangepast = ing.aangepast
              ? '<span class="voe-ing-eff">Aangepast: ' + escapeHtml(fmtGram(ing.eff)) + escapeHtml(ing.eenheid || 'g') + '</span>'
              : '';
            return '<div class="voe-ing-row"><div class="voe-ing-naam">' + escapeHtml(ing.naam) + '</div><div class="voe-ing-vals">' + voor + aangepast + '</div></div>';
          }).join('');
          var afvinkBadge = m.afgevinkt
            ? '<span class="voe-m-badge voe-m-badge-on">Afgevinkt</span>'
            : '<span class="voe-m-badge voe-m-badge-off">Niet afgevinkt</span>';
          var totals = '<div class="voe-m-totals">'
            + '<span><b>' + escapeHtml(String(m.eff.kcal)) + '</b> kcal</span>'
            + '<span>E ' + escapeHtml(fmtGram(m.eff.eiwit)) + 'g</span>'
            + '<span>V ' + escapeHtml(fmtGram(m.eff.vet)) + 'g</span>'
            + '<span>K ' + escapeHtml(fmtGram(m.eff.kh)) + 'g</span>'
            + '</div>';
          return '<div class="voe-m-card">'
            + '<div class="voe-m-head"><div class="voe-m-title">' + escapeHtml(m.naam || '(geen naam)') + '</div>' + afvinkBadge + '</div>'
            + totals
            + '<div class="voe-m-ings">' + ingHtml + '</div>'
            + '</div>';
        }).join('');

    var voor = dag.totVoor || { kcal: 0, eiwit: 0, vet: 0, kh: 0 };
    var eff  = dag.totEff  || { kcal: 0, eiwit: 0, vet: 0, kh: 0 };
    var totalsHtml = '<div class="voe-modal-totals">'
      + '<div class="voe-modal-totals-h">Dag-totalen</div>'
      + '<div class="voe-modal-totals-grid">'
      + '<div><div class="voe-mt-lab">Voorgeschreven</div><div class="voe-mt-val">' + escapeHtml(String(Math.round(voor.kcal))) + ' kcal</div><div class="voe-mt-mac">E ' + escapeHtml(fmtGram(voor.eiwit)) + ' · V ' + escapeHtml(fmtGram(voor.vet)) + ' · K ' + escapeHtml(fmtGram(voor.kh)) + '</div></div>'
      + '<div><div class="voe-mt-lab">Effectief</div><div class="voe-mt-val">' + escapeHtml(String(Math.round(eff.kcal))) + ' kcal</div><div class="voe-mt-mac">E ' + escapeHtml(fmtGram(eff.eiwit)) + ' · V ' + escapeHtml(fmtGram(eff.vet)) + ' · K ' + escapeHtml(fmtGram(eff.kh)) + '</div></div>'
      + '</div></div>';

    return '<div class="voe-modal-card">'
      + '<div class="voe-modal-head"><div><h3>' + escapeHtml(dagLabel) + (datumStr ? ' <span class="voe-modal-datum">' + escapeHtml(datumStr) + '</span>' : '') + '</h3></div><button type="button" class="voe-modal-x" aria-label="Sluiten">×</button></div>'
      + '<div class="voe-modal-body">'
      + maaltijdHtml
      + totalsHtml
      + '<div class="voe-modal-extra" data-extra-datum="' + escapeHtml(dag.datum || '') + '"></div>'
      + '</div>'
      + '</div>';
  }

  function renderItemTekst(it) {
    if (!it || !it.product) return '';
    var hoev = (it.hoeveelheid != null && it.hoeveelheid !== '') ? String(it.hoeveelheid) : '';
    var een = it.eenheid || '';
    var prefix = (hoev && een) ? (hoev + ' ' + een) : (hoev || een);
    var basis = prefix ? (prefix + ' ' + it.product) : it.product;
    if (it.tijdstip) basis += ' (' + it.tijdstip + ')';
    return basis;
  }

  // Backwards-compat: oude string-entry → één item met product=tekst.
  function normaliseerDayEntry(value) {
    if (value && typeof value === 'object' && Array.isArray(value.items)) return value.items;
    if (typeof value === 'string' && value.trim()) {
      return [{ hoeveelheid: null, eenheid: null, product: value.trim(), tijdstip: null }];
    }
    return [];
  }

  function renderExtraInline(entries, datum) {
    if (!datum) return '';
    var items = normaliseerDayEntry(entries && entries[datum]);
    if (!items.length) return '';
    var li = items
      .map(renderItemTekst)
      .filter(function (s) { return s && s.trim(); })
      .map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; })
      .join('');
    if (!li) return '';
    return '<div class="voe-extra-titel">Extra gegeten</div>'
      + '<div class="voe-extra-blok"><ul class="voe-extra-list">' + li + '</ul></div>';
  }

  // CSS-injectie voor de extra-eten-stijl (één keer per page).
  (function injecteerExtraStijl() {
    if (document.getElementById('voe-extra-style')) return;
    var s = document.createElement('style');
    s.id = 'voe-extra-style';
    s.textContent =
      '.voe-modal-extra:empty{display:none;}'
      + '.voe-extra-titel{font-size:11px;font-weight:700;color:#c9a84c;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:6px;padding-left:10px;}'
      + '.voe-extra-blok{font-style:italic;color:#1a1a2e;font-size:13.5px;line-height:1.55;background:#fffdf6;border-left:3px solid #c9a84c;padding:10px 12px;border-radius:0 8px 8px 0;}'
      + '.voe-extra-list{margin:0;padding-left:18px;list-style:disc;}'
      + '.voe-extra-list li{margin:2px 0;}';
    document.head.appendChild(s);
  })();

  function ensureModal() {
    var ov = document.getElementById('voe-dag-modal');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'voe-dag-modal';
    ov.className = 'voe-modal-overlay';
    ov.style.display = 'none';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (ev) {
      if (ev.target === ov || (ev.target.closest && ev.target.closest('.voe-modal-x'))) {
        ov.style.display = 'none';
        ov.innerHTML = '';
      }
    });
    return ov;
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target && ev.target.closest && ev.target.closest('button.voe-day-card[data-dag]');
    if (!btn) return;
    var dagKey = btn.getAttribute('data-dag');
    if (!dagKey) return;
    var details = leesDagDetails();
    var dag = details.find(function (x) { return x && x.dagKey === dagKey; });
    if (!dag) return;
    var ov = ensureModal();
    ov.innerHTML = renderModal(dag);
    ov.style.display = 'flex';
    // Async: laad extra-eten en vul de placeholder als er een entry is.
    leesExtraEten().then(function (entries) {
      var slot = ov.querySelector('.voe-modal-extra[data-extra-datum]');
      if (!slot) return;
      var datum = slot.getAttribute('data-extra-datum') || '';
      slot.innerHTML = renderExtraInline(entries, datum);
    }).catch(function () { /* stil falen — coach ziet gewoon geen extra-blok */ });
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    var ov = document.getElementById('voe-dag-modal');
    if (ov && ov.style.display !== 'none') { ov.style.display = 'none'; ov.innerHTML = ''; }
  });
})();
