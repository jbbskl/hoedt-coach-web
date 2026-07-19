'use strict';

(function () {
  document.addEventListener('click', async function (ev) {
    var btn = ev.target && ev.target.closest && ev.target.closest('[data-klantschema-activeer]');
    if (!btn) return;
    if (btn.disabled) return;
    var klantId = btn.getAttribute('data-klant-id');
    if (!klantId) return;
    var schemaType = btn.getAttribute('data-schema-type') || 'voeding';
    var typeLabel = schemaType === 'training' ? 'trainingsschema' : 'voedingsschema';
    if (!confirm('Schema voor vandaag klaarzetten? De klant ziet het ' + typeLabel + ' dan vanaf vandaag.')) return;
    var origLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Bezig...';
    try {
      var r1 = await fetch('/coach/api/klant/' + encodeURIComponent(klantId) + '/klantschemas', { credentials: 'same-origin' });
      var lst = r1.ok ? await r1.json() : { klantschemas: [] };
      var koppel = (lst.klantschemas || []).find(function (x) {
        return x.schema_type === schemaType && x.status === 'actief';
      });
      if (!koppel) {
        alert('Geen actief ' + typeLabel + ' gevonden voor deze klant.');
        btn.disabled = false;
        btn.textContent = origLabel;
        return;
      }
      var datum = new Date().toISOString().slice(0, 10);
      var r2 = await fetch('/coach/api/klantschema/' + encodeURIComponent(koppel.id) + '/activeer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ datum: datum }),
      });
      var j = await r2.json();
      if (!r2.ok) throw new Error(j.fout || 'Mislukt');
      alert('Schema klaargezet vanaf ' + (j.schema_actief_op || datum) + '.');
      btn.textContent = 'Klaargezet';
    } catch (e) {
      alert('Klaarzetten mislukt: ' + (e.message || 'onbekend'));
      btn.disabled = false;
      btn.textContent = origLabel;
    }
  });
})();
