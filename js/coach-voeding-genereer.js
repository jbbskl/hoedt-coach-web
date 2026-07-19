'use strict';

// Coach-knop "Genereer ander schema" op klantdetail voeding-tab.
// Roept dezelfde endpoint aan als klant-flow: /api/klant/:id/voeding/genereer-nieuw.
// Verwacht button met [data-coach-voeding-genereer] en modal in dezelfde DOM.

(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }

  function toast(msg, type) {
    var t = document.createElement('div');
    t.className = 'voe-gen-toast' + (type === 'ok' ? ' voe-gen-toast--ok' : type === 'err' ? ' voe-gen-toast--err' : '');
    t.textContent = String(msg);
    document.body.appendChild(t);
    setTimeout(function () { try { t.remove(); } catch (_) {} }, 2800);
  }

  async function postGenereer(klantId) {
    var url = '/api/klant/' + encodeURIComponent(klantId) + '/voeding/genereer-nieuw';
    var res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    var data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    if (!res.ok) {
      var fout = (data && data.fout) || ('status ' + res.status);
      var err = new Error(fout);
      err.data = data;
      throw err;
    }
    return data;
  }

  function bind(btn) {
    if (btn._voeGenBound) return;
    btn._voeGenBound = true;
    var modal = $('#voeGenModal');
    if (!modal) return;
    var back = $('[data-coach-voeding-genereer-back]', modal);
    var ok = $('[data-coach-voeding-genereer-ok]', modal);
    var cancel = $('[data-coach-voeding-genereer-cancel]', modal);
    var lbl = btn.querySelector('.voe-gen-btn-lbl');
    var origLbl = lbl ? lbl.textContent : 'Genereer ander schema';
    var origOk = ok ? ok.textContent : 'Ja, genereer';
    var klantId = btn.getAttribute('data-klant-id') || '';
    var klantNaam = btn.getAttribute('data-klant-naam') || '';
    if (klantNaam) {
      var tekstEl = $('#voeGenModalTekst');
      if (tekstEl) tekstEl.textContent = 'Weet je zeker dat je een nieuw schema wilt voor ' + klantNaam + '? Het huidige schema wordt vervangen.';
    }

    function open() { modal.hidden = false; modal.setAttribute('aria-hidden', 'false'); }
    function close() { modal.hidden = true; modal.setAttribute('aria-hidden', 'true'); }
    btn.addEventListener('click', open);
    if (back) back.addEventListener('click', close);
    if (cancel) cancel.addEventListener('click', close);
    if (ok) ok.addEventListener('click', async function () {
      if (!klantId) { toast('Geen klant-id gevonden', 'err'); return; }
      btn.disabled = true;
      ok.disabled = true;
      if (cancel) cancel.disabled = true;
      if (lbl) lbl.textContent = 'Bezig met genereren…';
      ok.textContent = 'Bezig…';
      try {
        var res = await postGenereer(klantId);
        close();
        toast('Nieuw schema klaar', 'ok');
        console.log('[coach-voeding-gen] ok', res);
        setTimeout(function () { location.reload(); }, 700);
      } catch (err) {
        var msg = (err && err.data && err.data.fout) || (err && err.message) || 'Genereren mislukt';
        toast(msg, 'err');
        console.error('[coach-voeding-gen] fout', err);
      } finally {
        btn.disabled = false;
        ok.disabled = false;
        if (cancel) cancel.disabled = false;
        if (lbl) lbl.textContent = origLbl;
        ok.textContent = origOk;
      }
    });
  }

  function init() {
    var btns = document.querySelectorAll('[data-coach-voeding-genereer]');
    btns.forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
