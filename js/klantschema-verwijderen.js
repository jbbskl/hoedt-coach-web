'use strict';

(function () {
  document.addEventListener('click', async function (ev) {
    var btn = ev.target && ev.target.closest && ev.target.closest('[data-klantschema-verwijderen]');
    if (!btn || btn.disabled) return;
    var schemaId = btn.getAttribute('data-schema-id');
    var klantNaam = btn.getAttribute('data-klant-naam') || 'deze klant';
    if (!schemaId) return;
    var schemaType = btn.getAttribute('data-schema-type') || 'voeding';
    var typeLabel = schemaType === 'training' ? 'trainingsschema' : 'voedingsschema';
    var endpointBase = schemaType === 'training' ? '/coach/training/schema/' : '/coach/voeding/schema/';
    if (!confirm('Weet je zeker dat je het ' + typeLabel + ' van ' + klantNaam + ' wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) return;
    var origLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Verwijderen...';
    try {
      var r = await fetch(endpointBase + encodeURIComponent(schemaId), {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!r.ok) {
        var err = await r.json().catch(function () { return {}; });
        throw new Error(err.error || ('HTTP ' + r.status));
      }
      alert('Schema verwijderd');
      var redirect = btn.getAttribute('data-redirect');
      if (redirect) window.location.href = redirect;
      else window.location.reload();
    } catch (e) {
      alert('Verwijderen mislukt: ' + (e.message || 'onbekend'));
      btn.disabled = false;
      btn.textContent = origLabel;
    }
  });
})();
