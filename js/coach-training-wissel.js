'use strict';

// Coach UI: oefening wisselen in het schema van één klant.
// Werkt op data-attributen die renderTrainingTab uitspuwt — geen inline JS.
//
// Buttons:
//   [data-wissel-oefening] data-klant-id data-schema-id data-dag data-oefening-id data-oefening-naam
//   [data-reset-override]  data-klant-id data-override-id data-oefening-naam-origineel
//
// Modal-container in DOM: #trainingWisselModal (gerenderd door tabs-schema).

(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function showModal() { var m = $('#trainingWisselModal'); if (m) m.style.display = 'flex'; }
  function hideModal() { var m = $('#trainingWisselModal'); if (m) m.style.display = 'none'; }
  function setModalBusy(busy) {
    var m = $('#trainingWisselModal');
    if (!m) return;
    m.querySelectorAll('button,input,textarea').forEach(function (el) { el.disabled = !!busy; });
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function openWisselModal(btn) {
    var klantId = btn.getAttribute('data-klant-id');
    var schemaId = btn.getAttribute('data-schema-id');
    var dag = btn.getAttribute('data-dag');
    var oefId = btn.getAttribute('data-oefening-id');
    var oefNaam = btn.getAttribute('data-oefening-naam') || 'Oefening';
    if (!klantId || !schemaId || !dag || !oefId) {
      alert('Mist data-attribuut op wissel-knop.');
      return;
    }

    var modal = $('#trainingWisselModal');
    if (!modal) { alert('Modal-container ontbreekt in DOM.'); return; }
    modal.setAttribute('data-context', JSON.stringify({ klantId: klantId, schemaId: schemaId, dag: dag, oefeningIdOrigineel: oefId }));

    var titel = $('#trainingWisselTitel');
    if (titel) titel.textContent = 'Wissel ' + oefNaam;
    var reden = $('#trainingWisselReden');
    if (reden) reden.value = '';
    var lijst = $('#trainingWisselAlternatieven');
    if (lijst) lijst.innerHTML = '<div style="padding:16px;color:#9b9baa;text-align:center;font-size:13px;">Alternatieven laden...</div>';
    showModal();

    try {
      var r = await fetch('/coach/api/training/alternatieven/' + encodeURIComponent(oefId) +
                         '?schema_id=' + encodeURIComponent(schemaId), { credentials: 'same-origin' });
      var data = await r.json();
      if (!r.ok) throw new Error((data && data.fout) || ('HTTP ' + r.status));
      var alts = (data && data.alternatieven) || [];
      if (!alts.length) {
        lijst.innerHTML = '<div style="padding:24px;color:#1a1a2e;text-align:center;font-size:13px;">' +
          escapeHtml(data.message || 'Geen alternatieven gevonden voor deze oefening') + '</div>';
        return;
      }
      lijst.innerHTML = alts.map(function (a) {
        var equipBadge = a.equipment ? '<span class="tw-badge tw-badge-equip">' + escapeHtml(a.equipment) + '</span>' : '';
        var spierBadge = a.spiergroep ? '<span class="tw-badge tw-badge-spier">' + escapeHtml(a.spiergroep) + '</span>' : '';
        var videoLink = a.video_url ? '<a href="' + escapeHtml(a.video_url) + '" target="_blank" rel="noopener" style="color:#c9a84c;text-decoration:none;font-size:12px;margin-right:8px;">▶ video</a>' : '';
        var beschrijving = a.beschrijving ? '<div style="font-size:12px;color:#5a5a6e;margin-top:4px;">' + escapeHtml(a.beschrijving) + '</div>' : '';
        return '<div class="tw-alt-row" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid #e2dccf;border-radius:8px;margin-bottom:8px;background:#fff;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-weight:600;color:#1a1a2e;font-size:14px;">' + escapeHtml(a.naam) + '</div>' +
            '<div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;">' + spierBadge + equipBadge + '</div>' +
            beschrijving +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:12px;">' + videoLink +
            '<button type="button" data-kies-alternatief data-alt-id="' + escapeHtml(a.id) + '" style="background:#0f0f1a;color:#c9a84c;border:none;border-radius:8px;padding:8px 14px;font-family:inherit;font-weight:600;cursor:pointer;font-size:12.5px;">Selecteer</button>' +
          '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      lijst.innerHTML = '<div style="padding:16px;color:#ef4444;text-align:center;font-size:13px;">Fout bij laden alternatieven: ' + escapeHtml(e.message || 'onbekend') + '</div>';
    }
  }

  async function kiesAlternatief(altId) {
    var modal = $('#trainingWisselModal');
    if (!modal) return;
    var ctxRaw = modal.getAttribute('data-context');
    var ctx;
    try { ctx = JSON.parse(ctxRaw); } catch (_) { ctx = null; }
    if (!ctx || !ctx.klantId || !ctx.schemaId || !ctx.dag || !ctx.oefeningIdOrigineel) {
      alert('Context-data verloren — sluit modal en probeer opnieuw.');
      return;
    }
    var reden = ($('#trainingWisselReden') && $('#trainingWisselReden').value) || '';
    setModalBusy(true);
    try {
      var r = await fetch('/coach/api/klant/' + encodeURIComponent(ctx.klantId) + '/training/override', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema_id: ctx.schemaId,
          dag: ctx.dag,
          oefening_id_origineel: ctx.oefeningIdOrigineel,
          oefening_id_nieuw: altId,
          reden: reden,
        }),
      });
      var data = await r.json();
      if (!r.ok) throw new Error((data && data.fout) || ('HTTP ' + r.status));
      hideModal();
      // Reload zodat de coach-tab de Aangepast-badge + Reset-knop ziet.
      window.location.reload();
    } catch (e) {
      alert('Wissel mislukt: ' + (e.message || 'onbekend'));
      setModalBusy(false);
    }
  }

  async function resetOverride(btn) {
    var klantId = btn.getAttribute('data-klant-id');
    var overrideId = btn.getAttribute('data-override-id');
    var oefNaam = btn.getAttribute('data-oefening-naam-origineel') || 'de originele oefening';
    if (!klantId || !overrideId) { alert('Mist data-attribuut op reset-knop.'); return; }
    if (!confirm('Schema voor deze klant terugzetten naar ' + oefNaam + '?')) return;
    var orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Terugzetten...';
    try {
      var r = await fetch('/coach/api/klant/' + encodeURIComponent(klantId) +
                         '/training/override/' + encodeURIComponent(overrideId), {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      var data = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(data.fout || ('HTTP ' + r.status));
      window.location.reload();
    } catch (e) {
      alert('Terugzetten mislukt: ' + (e.message || 'onbekend'));
      btn.disabled = false;
      btn.textContent = orig;
    }
  }

  document.addEventListener('click', function (ev) {
    var target = ev.target;
    if (!target || !target.closest) return;
    var wisselBtn = target.closest('[data-wissel-oefening]');
    if (wisselBtn && !wisselBtn.disabled) { ev.preventDefault(); openWisselModal(wisselBtn); return; }
    var resetBtn = target.closest('[data-reset-override]');
    if (resetBtn && !resetBtn.disabled) { ev.preventDefault(); resetOverride(resetBtn); return; }
    var altBtn = target.closest('[data-kies-alternatief]');
    if (altBtn && !altBtn.disabled) { ev.preventDefault(); kiesAlternatief(altBtn.getAttribute('data-alt-id')); return; }
    var sluitBtn = target.closest('[data-wissel-modal-sluit]');
    if (sluitBtn) { ev.preventDefault(); hideModal(); return; }
  });
})();
