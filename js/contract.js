'use strict';

// Contract-formulier voor /onboarding/contract.
// Handtekening via canvas, per-veld inline validatie, submit via fetch.
(function () {
  var telefoon = document.getElementById('telefoon');
  var akkoord = document.getElementById('akkoordChk');
  var submit = document.getElementById('cnSubmit');
  var sigCanvas = document.getElementById('sigCanvas');
  var sigClear = document.getElementById('sigClear');
  var sigInput = document.getElementById('handtekeningInput');
  var topErrEl = document.getElementById('cnError');
  var form = document.getElementById('contractForm');
  if (!form || !sigCanvas) return;

  // Canvas HiDPI setup
  var ctx = sigCanvas.getContext('2d');
  var drawing = false;
  var hasSignature = false;
  function resizeCanvas() {
    var rect = sigCanvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    // Alleen dimensies aanpassen als ze écht veranderd zijn — anders
    // wist setting .width/.height ook de bestaande tekening (browser-gedrag).
    var targetW = Math.round(rect.width * dpr);
    var targetH = Math.round(rect.height * dpr);
    if (sigCanvas.width !== targetW || sigCanvas.height !== targetH) {
      sigCanvas.width = targetW;
      sigCanvas.height = targetH;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f0f1a';
  }
  resizeCanvas();
  // Resize-events (bv. mobiele keyboard open/dicht) niet de handtekening
  // laten clearen. We laten de canvas zoals 'ie is totdat klant expliciet
  // Wissen klikt. Dit voorkomt 'knop doet niks' na typen in telefoonveld.
  function pointFromEvent(e) {
    var rect = sigCanvas.getBoundingClientRect();
    var x, y;
    if (e.touches && e.touches[0]) { x = e.touches[0].clientX - rect.left; y = e.touches[0].clientY - rect.top; }
    else { x = e.clientX - rect.left; y = e.clientY - rect.top; }
    return { x: x, y: y };
  }
  function startDraw(e) {
    e.preventDefault();
    drawing = true;
    var p = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function moveDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    var p = pointFromEvent(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasSignature = true;
    // Eerdere handtekening-fout weghalen zodra klant begint te tekenen
    clearErr('handtekening');
  }
  function endDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
  }
  sigCanvas.addEventListener('mousedown', startDraw);
  sigCanvas.addEventListener('mousemove', moveDraw);
  sigCanvas.addEventListener('mouseup', endDraw);
  sigCanvas.addEventListener('mouseleave', endDraw);
  sigCanvas.addEventListener('touchstart', startDraw, { passive: false });
  sigCanvas.addEventListener('touchmove', moveDraw, { passive: false });
  sigCanvas.addEventListener('touchend', endDraw);

  sigClear.addEventListener('click', function () {
    ctx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    hasSignature = false;
  });

  // ===== Per-veld validatie-helpers =====
  // setErr(veld, msg): toont inline foutmelding + rode rand op het veld
  // clearErr(veld): haalt fout weg
  // validate(): returnt array van velden met fouten (in volgorde)
  function errEl(veld) { return document.querySelector('[data-err-for="' + veld + '"]'); }
  function setErr(veld, msg) {
    var el = errEl(veld);
    if (el) { el.textContent = msg; el.hidden = false; }
    var container = getFieldContainer(veld);
    if (container) container.classList.add('cn-has-err');
  }
  function clearErr(veld) {
    var el = errEl(veld);
    if (el) { el.hidden = true; el.textContent = ''; }
    var container = getFieldContainer(veld);
    if (container) container.classList.remove('cn-has-err');
  }
  function clearAllErrors() {
    ['telefoon','handtekening','akkoord'].forEach(clearErr);
  }
  function getFieldContainer(veld) {
    if (veld === 'telefoon') return telefoon && telefoon.closest('.cn-field');
    if (veld === 'handtekening') return document.querySelector('.cn-sig-wrap');
    if (veld === 'akkoord') return document.getElementById('akkoordRow');
    return null;
  }
  function validate() {
    var fouten = [];
    var tel = (telefoon && telefoon.value || '').trim();
    var telOk = tel.replace(/[^0-9]/g, '').length >= 8;
    if (!telOk) fouten.push({ veld: 'telefoon', msg: 'Vul je telefoonnummer in' });
    if (!hasSignature) fouten.push({ veld: 'handtekening', msg: 'Plaats je handtekening' });
    if (!akkoord.checked) fouten.push({ veld: 'akkoord', msg: 'Vink het akkoord aan om door te gaan' });
    return fouten;
  }

  // Fouten verdwijnen weer zodra gebruiker iets corrigeert
  if (telefoon) telefoon.addEventListener('input', function () { clearErr('telefoon'); });
  akkoord.addEventListener('change', function () { clearErr('akkoord'); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllErrors();
    var fouten = validate();
    if (fouten.length) {
      for (var i = 0; i < fouten.length; i++) setErr(fouten[i].veld, fouten[i].msg);
      var eerste = getFieldContainer(fouten[0].veld);
      if (eerste) {
        eerste.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus het invoerveld als het een input is
        try {
          var inp = eerste.querySelector('input:not([type=hidden]):not([readonly])');
          if (inp) setTimeout(function () { inp.focus({ preventScroll: true }); }, 350);
        } catch (_) {}
      }
      return;
    }
    try {
      var dataUrl = sigCanvas.toDataURL('image/png');
      sigInput.value = dataUrl;
    } catch (err) {
      topErrEl.textContent = 'Handtekening kon niet verwerkt worden: ' + err.message;
      topErrEl.hidden = false;
      return;
    }
    topErrEl.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Bezig met verwerken…';
    var fd = new FormData(form);
    var body = {};
    fd.forEach(function (v, k) { body[k] = v; });
    body.akkoord = akkoord.checked ? 'true' : '';
    fetch('/onboarding/contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, body: d }; });
    }).then(function (res) {
      if (!res.ok || !res.body || !res.body.ok) {
        throw new Error((res.body && res.body.fout) || 'Kon contract niet verwerken');
      }
      // Redirect naar succes-pagina met download-link
      location.href = res.body.redirect || '/onboarding/contract/succes';
    }).catch(function (err) {
      topErrEl.textContent = err.message;
      topErrEl.hidden = false;
      submit.disabled = false;
      submit.textContent = 'Akkoord en ondertekenen';
    });
  });
})();
