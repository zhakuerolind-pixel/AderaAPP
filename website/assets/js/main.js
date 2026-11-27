/* Adera Partner GmbH – Website-Skripte (ohne Bibliotheken) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Seiten unter verschachtelten Adressen (404) verwenden absolute Pfade */
  var cssLink = document.querySelector('link[rel="stylesheet"]');
  var base = cssLink && cssLink.getAttribute('href').charAt(0) === '/' ? '/' : '';
  var PHONE = '056 402 10 00';
  var TEL = 'tel:+41564021000';

  /* Header: Schatten und kompakte Höhe beim Scrollen
     (Die Klasse past-hero für die Kontaktleiste entfällt: die Leiste ist von Anfang an sichtbar, P3) */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile Navigation
     Audit: ein Ort für Öffnen/Schliessen (aria-label blieb sonst auf «Menü schliessen»),
     Inhalt hinter dem offenen Menü ist inert (Tab landete sonst unsichtbar hinter dem Menü). */
  var burger = document.querySelector('.burger');
  function setNav(open, focusBurger) {
    if (!burger) return;
    body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    document.querySelectorAll('main, .site-footer, .finale, .actionbar, .skip-link').forEach(function (el) { el.inert = open; });
    if (!open && focusBurger) burger.focus();
  }
  if (burger) {
    burger.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
    document.querySelectorAll('.mobilenav a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1180 && body.classList.contains('nav-open')) setNav(false);
    });
  }

  /* Dropdown «Angebot» (Klick für Touch und Tastatur) */
  /* Audit: aria-expanded stimmt immer, Esc schliesst auch das per Maus geöffnete Menü
     (WCAG 1.4.13), beim Verlassen per Tab schliesst es sich. CSS dazu: style-korrekturen.css */
  function closeDropdown(li, focusBtn) {
    var b = li.querySelector('button');
    li.classList.remove('is-open');
    if (b) { b.setAttribute('aria-expanded', 'false'); if (focusBtn) b.focus(); }
  }
  document.querySelectorAll('.has-dropdown > button').forEach(function (btn) {
    var li = btn.parentElement;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      li.classList.remove('is-dismissed');
      var open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    li.addEventListener('mouseleave', function () { li.classList.remove('is-dismissed'); });
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) { closeDropdown(li, false); li.classList.remove('is-dismissed'); }
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.has-dropdown.is-open').forEach(function (li) { closeDropdown(li, false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-dropdown').forEach(function (li) {
      var inside = li.contains(document.activeElement);
      if (li.classList.contains('is-open') || inside || li.matches(':hover')) {
        li.classList.add('is-dismissed');
        closeDropdown(li, inside);
      }
    });
    if (body.classList.contains('nav-open')) setNav(false, true);
  });

  /* Karte erst nach Klick laden (Datenschutz) */
  document.querySelectorAll('[data-map]').forEach(function (wrap) {
    var btn = wrap.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = wrap.getAttribute('data-map');
      f.title = 'Karte: Standort Adera Partner GmbH';
      f.loading = 'lazy';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      wrap.innerHTML = '';
      wrap.appendChild(f);
      /* Audit: der Knopf verschwindet, Fokus bleibt an dieser Stelle statt im Nichts */
      wrap.setAttribute('tabindex', '-1');
      wrap.focus();
    });
  });

  /* Formular-Felder prüfen (für Formular und Assistent) */
  function fieldOf(el) { return el.closest('.field') || el.closest('.check') || el.closest('fieldset'); }
  function isValid(el) {
    var v = el.type === 'checkbox' ? el.checked : (el.value.trim() !== '' && el.checkValidity());
    if (v && el.type === 'email') v = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
    return v;
  }
  /* Prüft alle Pflichtfelder in scope und markiert sie (Klasse, aria-invalid, Fehlertext).
     Gibt das erste fehlerhafte Feld als { el, field } zurück, sonst null. Den Fokus setzt erst
     showError (Block «Korrekturen nach Prüfung» am Ende), damit zuerst der richtige Schritt sichtbar ist. */
  function validateIn(scope) {
    var first = null, seenGroups = {};
    scope.querySelectorAll('[required]').forEach(function (el) {
      if (el.type === 'radio') {
        if (seenGroups[el.name]) return;
        seenGroups[el.name] = true;
      }
      var inputs = groupOf(el, scope), field = fieldOf(el);
      var ok = el.type === 'radio' ? inputs.some(function (r) { return r.checked; }) : isValid(el);
      markField(inputs, field, !ok);
      if (!ok && !first) first = { el: el, field: field };
    });
    return first;
  }

  /* Anfrage-Assistent: ein Formular in Schritten, ohne JavaScript ein normales Formular */
  function setupWizard(form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.wizard__step'));
    if (steps.length < 2) return null;
    var progress = form.querySelector('.wizard__progress');
    var back = form.querySelector('[data-back]');
    var next = form.querySelector('[data-next]');
    var submit = form.querySelector('[type="submit"]');
    var alertBox = form.querySelector('.wizard__alert');
    var status = form.querySelector('.form-status');
    var idx = 0;
    form.classList.add('is-wizard');
    /* Korrekturen nach Prüfung (P2): unsichtbare Live-Meldung für Fehler beim «Weiter»,
       z. B. «Bitte wählen Sie ein Thema.» (Screenreader hörten den Fehler vorher nicht) */
    var live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('role', 'status');
    form.insertBefore(live, form.firstChild);
    function announce(text) {
      live.textContent = '';
      window.setTimeout(function () { live.textContent = text; }, 80);   /* dieselbe Meldung wird so erneut angesagt */
    }

    function show(i, focus) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle('is-current', k === idx); });
      var legend = steps[idx].querySelector('legend');
      if (progress) {
        var label = progress.querySelector('[data-progress-text]');
        if (label) label.textContent = 'Schritt ' + (idx + 1) + ' von ' + steps.length + (legend ? ': ' + legend.textContent : '');
        progress.style.setProperty('--p', ((idx + 1) / steps.length * 100) + '%');
      }
      if (back) back.hidden = idx === 0;
      if (next) next.hidden = idx === steps.length - 1;
      if (submit) submit.hidden = idx !== steps.length - 1;
      fitTextareas(steps[idx]);
      if (focus && legend) { legend.setAttribute('tabindex', '-1'); legend.focus(); }
    }
    /* Beim Schrittwechsel alte Meldungen (Fehler oder Dank) unten im Formular entfernen */
    function clearStatus() {
      if (status && status.textContent) { status.className = 'form-status'; status.textContent = ''; }
    }
    /* «Weiter»: nur den aktuellen Schritt prüfen; bei einem Fehler das Feld zeigen und die Meldung ansagen */
    function goNext() {
      var f = validateIn(steps[idx]);
      if (f) { showError(f); announce(errorText(f)); return; }
      clearStatus();
      show(idx + 1, true);
    }
    if (next) next.addEventListener('click', goNext);
    if (back) back.addEventListener('click', function () { clearStatus(); show(idx - 1, true); });

    /* Störung: Telefonnummer sofort zeigen. Nach einem Klick auf eine Kachel geht es weiter
       (nicht bei Pfeiltasten, damit Tastatur-Nutzer in Ruhe auswählen können) */
    form.querySelectorAll('input[name="thema"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (alertBox) alertBox.classList.toggle('is-on', r.checked && r.value === 'Störung / Reparatur');
        /* Audit: kein automatisches Weiterspringen mehr. Eine Auswahl darf den Fokus nicht
           ungefragt verschieben (WCAG 3.2.2); VoiceOver/TalkBack lösen dabei ebenfalls pointerup aus. */
      });
    });

    /* Thema über die Adresse vorwählen, z. B. kontakt.html?thema=badumbau#formular */
    var params = new URLSearchParams(window.location.search);
    var map = { heizung: 'Heizung / Wärmepumpe', lueftung: 'Lüftung', sanitaer: 'Sanitär', badumbau: 'Badumbau', planung: 'Planung', service: 'Störung / Reparatur' };
    var q = params.get('thema');
    if (q && map[q]) {
      var pre = form.querySelector('input[name="thema"][value="' + map[q] + '"]');
      if (pre) { pre.checked = true; if (alertBox) alertBox.classList.toggle('is-on', map[q] === 'Störung / Reparatur'); }
    }
    /* Angaben aus dem Kostenrechner (Parameter «rechner», z. B. kontakt.html?thema=heizung&rechner=…#formular)
       ins Feld «nachricht» übernehmen, aber nur, wenn es leer ist. Höchstens 300 Zeichen, nur als Text. */
    var fromCalc = params.get('rechner');
    var msgField = form.querySelector('textarea[name="nachricht"]');
    if (fromCalc && msgField && !msgField.value.trim()) {
      fromCalc = fromCalc.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
      if (fromCalc) msgField.value = Array.from('Angaben aus dem Kostenrechner: ' + fromCalc).slice(0, 300).join('');
    }
    show(0, false);
    return {
      isLast: function () { return idx === steps.length - 1; },
      next: goNext,
      /* den Schritt anzeigen, in dem el steht (Fehler beim Absenden), statt ihn nur zusätzlich einzublenden */
      showStepOf: function (el) {
        var k = steps.indexOf(el.closest('.wizard__step'));
        if (k >= 0 && k !== idx) show(k, false);
      },
      reset: function () {
        form.reset();
        form.querySelectorAll('textarea').forEach(function (ta) { ta.style.height = ''; });
        if (alertBox) alertBox.classList.remove('is-on');
        show(0, false);
      }
    };
  }

  /* Formular: Prüfung und Versand an send.php */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var wizard = form.hasAttribute('data-wizard') ? setupWizard(form) : null;
    /* Audit: feste Live-Region für Meldungen */
    if (status) { status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); }
    /* Fehlertexte erhalten eine id (z. B. f-plz-fehler, bei Kacheln thema-fehler). Mit dem Feld verknüpft
       werden sie erst im Fehlerfall (markField), sonst lasen Screenreader sie schon ohne Fehler vor. */
    form.querySelectorAll('.field, .check').forEach(function (field) {
      var el = field.querySelector('input, select, textarea'), err = field.querySelector('.error');
      if (el && err && !err.id) err.id = (el.id || el.name) + '-fehler';
    });

    function setStatus(type, text) {
      if (!status) return;
      status.className = 'form-status ' + (type === 'ok' ? 'is-ok' : type === 'info' ? 'is-info' : 'is-error');
      status.textContent = text;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      /* Korrekturen nach Prüfung (P2): Enter in einem Feld oder auf einer Kachel vor dem letzten Schritt
         wirkt wie «Weiter». Vorher wurde das ganze Formular geprüft und zwei Schritte waren zu sehen. */
      if (wizard && !wizard.isLast()) { wizard.next(); return; }
      var f = validateIn(form);
      if (f) {
        if (wizard) wizard.showStepOf(f.el);
        showError(f);
        setStatus('error', 'Bitte füllen Sie die markierten Felder aus.');
        return;
      }
      var fd = new FormData(form);   /* alle Angaben, auch die Kacheln, setzt send.php in die E-Mail */
      var btn = form.querySelector('[type="submit"]');
      /* Audit: nicht "disabled" (der Fokus ginge verloren), Doppelklick über aria-disabled abfangen;
         Meldung des Servers (fehlende Angaben, zu viele Anfragen) anzeigen */
      if (btn && btn.getAttribute('aria-disabled') === 'true') return;
      if (btn) btn.setAttribute('aria-disabled', 'true');
      setStatus('info', 'Ihre Anfrage wird gesendet …');
      fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (!(res && res.ok)) { var err = new Error('send failed'); err.userMessage = res && res.error; throw err; }
          if (wizard) wizard.reset(); else form.reset();
          setStatus('ok', 'Vielen Dank. Ihre Anfrage ist bei uns angekommen. Wir melden uns so schnell wie möglich.');
          /* Korrekturen nach Prüfung (P2): Fokus auf die Meldung. Der fokussierte Senden-Knopf ist nach dem
             Zurücksetzen ausgeblendet, der Fokus fiel sonst auf die ganze Seite zurück. */
          if (status) { status.setAttribute('tabindex', '-1'); status.focus(); }
        })
        .catch(function (err) {
          setStatus('error', (err && err.userMessage) || 'Das Senden hat leider nicht geklappt. Bitte rufen Sie uns an (' + PHONE + ') oder schreiben Sie an info@aderapartner.ch.');
        })
        .then(function () { if (btn) btn.removeAttribute('aria-disabled'); });
    });

    /* Nach einer Eingabe ist der Fehler behoben: Markierung und Verknüpfung entfernen (bei Kacheln für die ganze Gruppe) */
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener(el.type === 'radio' || el.type === 'checkbox' ? 'change' : 'input', function () {
        var field = fieldOf(el);
        if (field && field.classList.contains('is-invalid')) markField(groupOf(el), field, false);
      });
    });
  });

  /* Projekte: Filter und Grossansicht */
  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var gItems = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__item'));
    /* Audit: Trefferzahl nach dem Filtern ansagen (WCAG 4.1.3) */
    var live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('role', 'status');
    gallery.parentNode.insertBefore(live, gallery);
    document.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter'), n = 0;
        document.querySelectorAll('[data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        gItems.forEach(function (it) {
          it.hidden = !(f === 'alle' || it.getAttribute('data-cat') === f);
          if (!it.hidden) n++;
          it.classList.remove('rv'); it.classList.add('is-in');
        });
        live.textContent = n + (n === 1 ? ' Foto' : ' Fotos') + ' angezeigt';
      });
    });

    var box = null, boxImg, boxAvif, boxCap, boxClose, idx = 0, shown = [], lastFocus = null, touchX = null, inerted = [];
    var small = window.matchMedia('(max-width: 640px)');
    function buildBox() {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.hidden = true;
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Foto in Grossansicht');
      box.innerHTML =
        '<button class="lightbox__close" type="button" aria-label="Schliessen">&times;</button>' +
        '<button class="lightbox__prev" type="button" aria-label="Vorheriges Foto"><span class="i i-prev" aria-hidden="true"></span></button>' +
        '<figure class="lightbox__figure"><picture><source type="image/avif"><img alt=""></picture><figcaption aria-live="polite"></figcaption></figure>' +
        '<button class="lightbox__next" type="button" aria-label="Nächstes Foto"><span class="i i-next" aria-hidden="true"></span></button>';
      body.appendChild(box);
      boxImg = box.querySelector('img');
      boxAvif = box.querySelector('source');
      boxCap = box.querySelector('figcaption');
      boxClose = box.querySelector('.lightbox__close');
      boxClose.addEventListener('click', closeBox);
      box.querySelector('.lightbox__prev').addEventListener('click', function () { show(idx - 1); });
      box.querySelector('.lightbox__next').addEventListener('click', function () { show(idx + 1); });
      box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
      box.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX; touchX = null;
        if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      });
      document.addEventListener('keydown', function (e) {
        if (box.hidden) return;
        if (e.key === 'Escape') { e.stopPropagation(); closeBox(); }
        else if (e.key === 'ArrowLeft') show(idx - 1);
        else if (e.key === 'ArrowRight') show(idx + 1);
        else if (e.key === 'Tab') {
          var f = Array.prototype.slice.call(box.querySelectorAll('button'));
          var i = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
      });
    }
    function show(i) {
      shown = gItems.filter(function (it) { return !it.hidden; });
      if (!shown.length) return;
      idx = (i + shown.length) % shown.length;
      var a = shown[idx].querySelector('a'), im = shown[idx].querySelector('img');
      /* Korrekturen nach Prüfung (P5): zuerst AVIF, wenn der Browser es kann (am Bildschirm -1200 bzw. das
         Original-AVIF, am Handy -900; etwa halb so gross wie das JPEG). Das <picture> wählt selber. */
      boxAvif.srcset = avifUpTo(shown[idx], small.matches ? 900 : 1200);
      /* Ersatz ohne AVIF wie bisher (Audit): am Handy das 900-px-JPEG, sonst das JPEG-Original aus dem Link */
      boxImg.src = small.matches && im ? im.getAttribute('src') : a.getAttribute('href');
      boxImg.alt = im ? im.alt : '';
      var cap = shown[idx].querySelector('figcaption');
      boxCap.textContent = (cap ? cap.textContent : '') + '  ·  ' + (idx + 1) + ' / ' + shown.length;
    }
    function openBox(item) {
      if (!box) buildBox();
      lastFocus = document.activeElement;
      shown = gItems.filter(function (it) { return !it.hidden; });
      show(shown.indexOf(item));
      box.hidden = false;
      body.classList.add('lb-open');
      inerted = Array.prototype.filter.call(body.children, function (el) { return el !== box && !el.inert; });
      inerted.forEach(function (el) { el.inert = true; });   /* Audit: Hintergrund für Screenreader sperren */
      boxClose.focus();
    }
    function closeBox() {
      if (!box) return;
      box.hidden = true;
      body.classList.remove('lb-open');
      inerted.forEach(function (el) { el.inert = false; });
      inerted = [];
      if (lastFocus) lastFocus.focus();
    }
    gItems.forEach(function (it) {
      var a = it.querySelector('a');
      if (a) a.addEventListener('click', function (e) { e.preventDefault(); openBox(it); });
    });
  }

  /* ==========================================================================
     Kostenrechner (kostenrechner.html), nur aktiv, wenn #rechner existiert.
     Zwei Teile, oben umschaltbar: «Reparatur und Ersatz» und «Heizungsersatz».
     Die Preise stehen in den zwei Objekten gleich hier und lassen sich dort anpassen.
     Ohne JavaScript bleibt der Rechner ausgeblendet (hidden), dann steht nur der Hinweis da.
     ========================================================================== */

  /* Teil «Reparatur und Ersatz». Alle Preise in CHF exkl. MWST.
     Vom Inhaber bestätigt: Stundenansatz, Fahrzeug, Anfahrt; Stunden und Material sind Richtwerte, vom Inhaber zu prüfen.
     Arbeit und Anfahrt = Stunden × Anzahl × Monteur + Fahrzeug + Anfahrt (Stunden × Anzahl mindestens 1)
     Material = Material pro Stück × Anzahl («Material ist schon da»: 0)
     Angezeigt wird beides mit MWST als Spanne ±10 %, auf 10 Franken gerundet. Das Total ist die Summe
     der beiden gerundeten Spannen, damit die Zahlen auf dem Bildschirm zusammenpassen. */
  var PREISE_REPARATUR = {
    monteurProStunde: 115,
    fahrzeugProEinsatz: 35,   /* Servicefahrzeug, einmal pro Einsatz; vom Inhaber bestätigt */
    /* Anfahrt, vom Inhaber bestätigt: 95 pauschal, ab 15 km 0.80 pro km; Hin- und Rückweg vom Inhaber bestätigt */
    anfahrtPauschale: 95,     /* pro Einsatz */
    kmAb: 15,                 /* ab dieser Entfernung (einfacher Weg) kommen die Kilometer dazu */
    proKm: 0.80,
    hinUndZurueck: true,      /* km zählen hin und zurück (Entfernung × 2) */
    kmMax: 100,               /* weiter weg: keine Zahl, sondern «Bitte Offerte anfragen» */
    mindestStunden: 1,
    mwst: 0.081,
    spanne: 0.10,             /* ±10 % um den Mittelwert */
    rundenAuf: 10,            /* Franken */
    /* gruppe: Überschrift in der Auswahlliste; stunden: pro Stück; standard, gehoben: Material pro Stück;
       anzahl: true = Anzahl 1 bis 5 wählbar, sonst immer 1; thema: Thema im Anfrageformular (sonst sanitaer).
       Gleiche Zahl bei Standard und Gehoben: keine Auswahl beim Material, der Betrag ist immer eingerechnet. */
    arbeiten: [
      { gruppe: 'WC', text: 'WC ersetzen (Wand-WC)', stunden: 2.5, standard: 450, gehoben: 900, anzahl: true },
      { gruppe: 'WC', text: 'WC ersetzen (Stand-WC)', stunden: 3, standard: 400, gehoben: 800, anzahl: true },
      { gruppe: 'WC', text: 'Dusch-WC einbauen (ohne Elektroanschluss)', stunden: 4, standard: 1800, gehoben: 3500, anzahl: true },
      { gruppe: 'WC', text: 'Spülkasten reparieren (Innenleben)', stunden: 1.5, standard: 120, gehoben: 180, anzahl: true },
      { gruppe: 'Waschtisch und Armaturen', text: 'Waschtisch ersetzen (mit Armatur und Siphon)', stunden: 3.5, standard: 600, gehoben: 1500, anzahl: true },
      { gruppe: 'Waschtisch und Armaturen', text: 'Waschtischarmatur ersetzen', stunden: 1, standard: 180, gehoben: 450, anzahl: true },
      { gruppe: 'Waschtisch und Armaturen', text: 'Küchenarmatur ersetzen', stunden: 1.25, standard: 250, gehoben: 600, anzahl: false },
      { gruppe: 'Waschtisch und Armaturen', text: 'Dusch- oder Badewannenarmatur ersetzen (Aufputz)', stunden: 1.5, standard: 300, gehoben: 700, anzahl: true },
      { gruppe: 'Waschtisch und Armaturen', text: 'Tropfenden Wasserhahn reparieren (Dichtung/Kartusche)', stunden: 0.75, standard: 40, gehoben: 80, anzahl: true },
      { gruppe: 'Abfluss und Anschlüsse', text: 'Verstopften Abfluss reinigen (Spirale)', stunden: 1.5, standard: 20, gehoben: 20, anzahl: true },
      { gruppe: 'Boiler', text: 'Elektroboiler ersetzen (ca. 300 l, ohne Elektriker)', stunden: 6, standard: 2200, gehoben: 3000, anzahl: false },
      { gruppe: 'Boiler', text: 'Boiler entkalken (mit Dichtung und Anode)', stunden: 2.5, standard: 120, gehoben: 120, anzahl: false },
      { gruppe: 'Heizung', text: 'Heizkörperventil oder Thermostatkopf ersetzen', stunden: 1, standard: 90, gehoben: 160, anzahl: true, thema: 'heizung' },
      { gruppe: 'Heizung', text: 'Heizung entlüften und Druck prüfen', stunden: 1, standard: 0, gehoben: 0, anzahl: false, thema: 'heizung' },
      { gruppe: 'Abfluss und Anschlüsse', text: 'Waschmaschinenanschluss erstellen', stunden: 2, standard: 120, gehoben: 120, anzahl: false }
    ]
  };

  /* Teil «Heizungsersatz»: Ersatz einer Öl- oder Gasheizung durch eine Wärmepumpe.
     Richtwerte in CHF inkl. MWST, inkl. Montage, Demontage der alten Heizung, Speicher, Warmwasser und
     Elektroanschluss. Vom Inhaber zu bestätigen bzw. durch eigene Preise zu ersetzen.
     Die Anfahrt ist in diesen Preisen enthalten. */
  var PREISE_HEIZUNG = {
    literOelProKw: 250,       /* Heizöl: Liter pro Jahr ÷ 250 = Heizleistung in kW */
    m3GasProKw: 250,          /* Gas: m³ pro Jahr ÷ 250 = Heizleistung in kW */
    wattProM2: { vor1980: 60, bis1999: 45, ab2000: 30 },   /* Fläche: m² × W/m² ÷ 1000, nach Baujahr */
    zuschlagWarmwasser: 1.1,  /* Fläche: +10 % für das Warmwasser */
    kwRunden: 0.5,            /* Heizleistung auf 0.5 kW runden */
    kwMin: 4,                 /* kleinste Heizleistung */
    kwMax: 45,                /* darüber keine Zahl, sondern Offerte nach Besichtigung */
    /* Grundpreis nach Leistungsstufe: [bis kW, CHF] */
    luftWasser: [[8, 36000], [12, 42000], [16, 48000], [22, 56000], [30, 68000], [45, 85000]],
    zuschlagInnen: 5000,      /* Luft/Wasser-Wärmepumpe innen aufgestellt */
    erdsonde: [[8, 32000], [12, 36000], [16, 41000], [22, 48000], [30, 58000], [45, 72000]],   /* Wärmepumpe ohne Sonde */
    sondeMeterProKw: 16,      /* Erdsonde: kW × 16 m … */
    sondeChfProMeter: 85,     /* … × CHF 85 pro Meter … */
    sondePauschale: 4000,     /* … + Pauschale für Bewilligung, Bohrplatz, Anschluss */
    zuschlagHeizkoerper: 3000,   /* höhere Vorlauftemperatur, evtl. einzelne Heizkörper anpassen */
    oeltank: 3500,            /* Öltank entfernen */
    spanne: 0.10,             /* ±10 % um den Mittelwert */
    rundenAuf: 500            /* Franken */
  };

  var rechner = document.getElementById('rechner');
  if (rechner) {
    var rechnerHinweis = document.querySelector('[data-calc-fallback]');
    if (rechnerHinweis) rechnerHinweis.hidden = true;
    rechner.hidden = false;

    /* Zahl aus einem Eingabefeld lesen: «2500», «2'500», «2’500», «2 500», «2.500», «12,5», «2500 l».
       Leer gibt null, keine gültige Zahl NaN. */
    function calcZahl(text) {
      var s = String(text).replace(/[\s'’‘`´]/g, '').replace(/(liter|l|m2|m²|m3|m³|km)\.?$/i, '');
      if (s === '') return null;
      if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');   /* 2.500 als 2500 lesen */
      s = s.replace(',', '.');
      return /^\d+(\.\d*)?$/.test(s) ? parseFloat(s) : NaN;
    }
    /* 1’090: Tausender wie de-CH, in allen Browsern mit dem typografischen Apostroph */
    function calcChf(x) { return x.toLocaleString('de-CH').replace(/'/g, '’'); }
    function calcDez(x) { return String(x).replace('.', ','); }         /* 2,5 */
    function calcRunden(x, schritt) { return Math.round(x / schritt) * schritt; }
    /* «ca. CHF 900 bis 1’090»; geschützte Leerzeichen, damit die Zeile nur vor «bis» umbricht */
    function calcSpanne(von, bis) { return 'ca. CHF ' + calcChf(von) + (bis !== von ? ' bis ' + calcChf(bis) : ''); }
    /* Nur ändern, was sich ändert: die Ergebnis-Box ist aria-live, so wird nur Neues angesagt */
    function calcText(el, text) { if (el && el.textContent !== text) el.textContent = text; }
    function calcZeigen(el, sichtbar) { if (el && el.hidden === sichtbar) el.hidden = !sichtbar; }
    function calcOut(teil, name) { return teil.querySelector('[data-out="' + name + '"]'); }
    /* Feld als fehlerhaft markieren; der Fehlertext ist nur dann mit dem Feld verknüpft */
    function calcFeldFehler(input, fehler) {
      var feld = input.closest('.field'), meldung = feld && feld.querySelector('.error');
      if (feld) feld.classList.toggle('is-invalid', fehler);
      if (fehler) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      if (!meldung) return;
      var ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(function (id) { return id && id !== meldung.id; });
      if (fehler) ids.push(meldung.id);
      input.setAttribute('aria-describedby', ids.join(' '));
    }
    /* Knopf «Offerte anfragen»: Thema und eine kurze Zusammenfassung fürs Anfrageformular */
    function calcLink(thema, text) {
      return base + 'kontakt.html?thema=' + thema + (text ? '&rechner=' + encodeURIComponent(text.replace(/ /g, ' ')) : '') + '#formular';
    }
    /* Live rechnen: Auswahl sofort, beim Tippen kurz warten (sonst wird jede Ziffer angesagt) */
    function calcLive(form, rechnen) {
      var warten = null;
      form.addEventListener('input', function (e) {
        window.clearTimeout(warten);
        if (e.target.type === 'text') warten = window.setTimeout(rechnen, 300); else rechnen();
      });
      form.addEventListener('change', function () { window.clearTimeout(warten); rechnen(); });
      form.addEventListener('submit', function (e) { e.preventDefault(); window.clearTimeout(warten); rechnen(); });
      rechnen();
    }

    /* Umschalten zwischen den Teilen; die Adresse zeigt den gewählten Teil (#reparatur, #heizung) */
    var calcTeile = {};
    rechner.querySelectorAll('[data-calc-part]').forEach(function (f) { calcTeile[f.getAttribute('data-calc-part')] = f; });
    var calcSchalter = rechner.querySelectorAll('input[name="calc-teil"]');
    function calcTeilZeigen(name, adresse) {
      if (!calcTeile[name]) return;
      Object.keys(calcTeile).forEach(function (k) { calcTeile[k].hidden = k !== name; });
      calcSchalter.forEach(function (r) { r.checked = r.value === name; });
      if (adresse) { try { history.replaceState(null, '', '#' + name); } catch (e) { /* z. B. lokal geöffnet */ } }
    }
    calcSchalter.forEach(function (r) {
      r.addEventListener('change', function () { if (r.checked) calcTeilZeigen(r.value, true); });
    });
    window.addEventListener('hashchange', function () { calcTeilZeigen(window.location.hash.slice(1), false); });
    var calcStart = window.location.hash.slice(1);
    if (!calcTeile[calcStart]) calcStart = (rechner.querySelector('input[name="calc-teil"]:checked') || { value: 'reparatur' }).value;
    calcTeilZeigen(calcStart, false);

    /* --- Teil «Reparatur und Ersatz» --- */
    var rep = calcTeile.reparatur;
    if (rep) {
      var R = PREISE_REPARATUR;
      var repArbeit = rep.querySelector('[name="arbeit"]');
      var repAnzahl = rep.querySelector('[name="anzahl"]');
      var repKm = rep.querySelector('[name="km"]');
      var repGruppen = {};
      /* Auswahlliste aus der Konfiguration aufbauen, nach Gruppen */
      R.arbeiten.forEach(function (a, i) {
        var g = repGruppen[a.gruppe];
        if (!g) { g = repGruppen[a.gruppe] = document.createElement('optgroup'); g.label = a.gruppe; repArbeit.appendChild(g); }
        var o = document.createElement('option');
        o.value = String(i);
        o.textContent = a.text;
        g.appendChild(o);
      });
      calcText(calcOut(rep, 'mwst'), 'MWST ' + calcDez(Math.round(R.mwst * 1000) / 10) + ' %');

      calcLive(rep, function () {
        var a = R.arbeiten[parseInt(repArbeit.value, 10)] || R.arbeiten[0];
        var anzahl = a.anzahl ? Math.min(5, Math.max(1, parseInt(repAnzahl.value, 10) || 1)) : 1;
        var mitWahl = a.standard !== a.gehoben;
        var wahl = mitWahl ? (rep.querySelector('[name="material"]:checked') || { value: 'standard' }).value : 'fest';
        var wahlText = wahl === 'gehoben' ? 'Gehoben' : 'Standard';
        var material = (wahl === 'vorhanden' ? 0 : wahl === 'gehoben' ? a.gehoben : a.standard) * anzahl;
        var km = calcZahl(repKm.value);
        var kmOk = km !== null && !isNaN(km);
        calcZeigen(rep.querySelector('[data-calc-anzahl]'), !!a.anzahl);
        calcZeigen(rep.querySelector('[data-calc-material]'), mitWahl);
        calcFeldFehler(repKm, km !== null && !kmOk);

        var meldung = '';
        if (km === null) meldung = 'Geben Sie die Entfernung ab Spreitenbach ein. Die Schätzung erscheint dann hier.';
        else if (!kmOk) meldung = 'Bitte geben Sie die Entfernung als Zahl ein.';
        else if (km > R.kmMax) meldung = 'Mehr als ' + R.kmMax + ' km: Bitte Offerte anfragen.';

        var stunden = Math.round(Math.max(R.mindestStunden, a.stunden * anzahl) * 100) / 100;
        var anfahrt = kmOk ? R.anfahrtPauschale + (km >= R.kmAb ? km * (R.hinUndZurueck ? 2 : 1) * R.proKm : 0) : 0;
        var mitMwst = 1 + R.mwst;
        var arbeit = (stunden * R.monteurProStunde + R.fahrzeugProEinsatz + anfahrt) * mitMwst;
        var arbeitVon = calcRunden(arbeit * (1 - R.spanne), R.rundenAuf), arbeitBis = calcRunden(arbeit * (1 + R.spanne), R.rundenAuf);
        var matVon = calcRunden(material * mitMwst * (1 - R.spanne), R.rundenAuf), matBis = calcRunden(material * mitMwst * (1 + R.spanne), R.rundenAuf);
        var materialTitel = mitWahl && material ? 'Material (' + wahlText + ')' : 'Material';

        calcZeigen(calcOut(rep, 'zahlen'), !meldung);
        calcZeigen(calcOut(rep, 'meldung'), !!meldung);
        calcText(calcOut(rep, 'meldung'), meldung);
        if (!meldung) {
          calcText(calcOut(rep, 'arbeit'), calcSpanne(arbeitVon, arbeitBis));
          calcText(calcOut(rep, 'material-titel'), materialTitel);
          calcText(calcOut(rep, 'material'), material ? calcSpanne(matVon, matBis) : 'keines');
          calcText(calcOut(rep, 'total'), calcSpanne(arbeitVon + matVon, arbeitBis + matBis));
        }
        calcText(calcOut(rep, 'aufwand'), 'Geschätzter Aufwand: ca. ' + calcDez(stunden) + (stunden === 1 ? ' Stunde' : ' Stunden'));
        calcZeigen(calcOut(rep, 'inkl'), !meldung);
        calcZeigen(calcOut(rep, 'material-inkl'), material > 0);
        calcText(calcOut(rep, 'material-text'), mitWahl ? 'Material (' + wahlText + ')' : 'Material');

        /* Zusammenfassung fürs Anfrageformular */
        var zus = [a.text + (anzahl > 1 ? ', ' + anzahl + ' Stück' : '')];
        if (mitWahl) zus.push(wahl === 'vorhanden' ? 'Material ist schon da' : 'Material ' + wahlText);
        if (kmOk) zus.push(calcDez(km) + ' km ab Spreitenbach');
        if (!meldung) {
          zus.push('Aufwand ca. ' + calcDez(stunden) + ' h');
          zus.push('Arbeit und Anfahrt ' + calcSpanne(arbeitVon, arbeitBis));
          zus.push('Material ' + (material ? calcSpanne(matVon, matBis) : 'keines'));
          zus.push('Total ' + calcSpanne(arbeitVon + matVon, arbeitBis + matBis) + ' inkl. MWST');
        }
        calcOut(rep, 'link').href = calcLink(a.thema || 'sanitaer', zus.join('; '));
      });
    }

    /* --- Teil «Heizungsersatz» --- */
    var hz = calcTeile.heizung;
    if (hz) {
      var H = PREISE_HEIZUNG;
      var hzMenge = hz.querySelector('[name="menge"]');
      var hzFlaeche = hz.querySelector('[name="flaeche"]');
      var hzTank = hz.querySelector('[name="oeltank"]');
      var hzTraeger = {
        oel: { titel: 'Heizöl pro Jahr', lang: ' in Litern', einheit: 'Liter', proKw: H.literOelProKw,
          hinweis: 'Durchschnitt pro Jahr, z. B. aus den Heizöl-Rechnungen', text: 'Heizöl ', nach: ' Liter pro Jahr' },
        gas: { titel: 'Gas pro Jahr', lang: ' in Kubikmetern', einheit: 'm³', proKw: H.m3GasProKw,
          hinweis: 'aus der Jahresabrechnung. Steht dort kWh, teilen Sie die Zahl durch 10.', text: 'Gas ', nach: ' m³ pro Jahr' }
      };
      var hzNamen = { 'luft-aussen': 'Luft/Wasser-Wärmepumpe, aussen aufgestellt', 'luft-innen': 'Luft/Wasser-Wärmepumpe, innen aufgestellt', erdsonde: 'Erdsonden-Wärmepumpe' };
      var hzBaujahr = { vor1980: 'Baujahr vor 1980', bis1999: 'Baujahr 1980–1999', ab2000: 'Baujahr ab 2000' };
      function hzWert(name) { var r = hz.querySelector('[name="' + name + '"]:checked'); return r ? r.value : ''; }
      function hzStufe(tabelle, kw) {
        for (var i = 0; i < tabelle.length; i++) if (kw <= tabelle[i][0]) return tabelle[i][1];
        return null;
      }

      calcLive(hz, function () {
        var wp = hzWert('wp') || 'luft-aussen', weg = hzWert('weg') || 'verbrauch', bj = hzWert('baujahr') || 'vor1980';
        var traeger = hzTraeger[hzWert('traeger')] || hzTraeger.oel;
        var heizkoerper = hzWert('verteilung') === 'heizkoerper', tank = hzTank.checked;
        hz.querySelectorAll('[data-calc-weg]').forEach(function (w) { calcZeigen(w, w.getAttribute('data-calc-weg') === weg); });
        calcText(calcOut(hz, 'menge-titel'), traeger.titel);
        calcText(calcOut(hz, 'menge-einheit-lang'), traeger.lang);
        calcText(calcOut(hz, 'menge-einheit'), traeger.einheit);
        calcText(calcOut(hz, 'menge-hinweis'), traeger.hinweis);

        var feld = weg === 'flaeche' ? hzFlaeche : hzMenge;
        var wert = calcZahl(feld.value);
        var falsch = wert !== null && (isNaN(wert) || wert <= 0);
        calcFeldFehler(weg === 'flaeche' ? hzMenge : hzFlaeche, false);
        calcFeldFehler(feld, falsch);

        var kw = null, bedarf = '', meldung = '';
        if (wert === null) meldung = weg === 'flaeche' ? 'Geben Sie die beheizte Fläche ein. Die Schätzung erscheint dann hier.' : 'Geben Sie den Verbrauch ein. Die Schätzung erscheint dann hier.';
        else if (falsch) meldung = 'Bitte geben Sie ' + (weg === 'flaeche' ? 'die Fläche' : 'den Verbrauch') + ' als Zahl ein.';
        else {
          if (weg === 'flaeche') {
            kw = wert * H.wattProM2[bj] / 1000 * H.zuschlagWarmwasser;
            bedarf = calcChf(wert) + ' m² beheizt, ' + hzBaujahr[bj];
          } else {
            kw = wert / traeger.proKw;
            bedarf = traeger.text + calcChf(wert) + traeger.nach;
          }
          kw = Math.max(H.kwMin, Math.round(kw / H.kwRunden) * H.kwRunden);
          if (kw > H.kwMax) meldung = 'Für diese Grösse machen wir eine Offerte nach Besichtigung.';
        }

        var preis = null, von = 0, bis = 0;
        if (kw !== null && !meldung) {
          preis = wp === 'erdsonde'
            ? hzStufe(H.erdsonde, kw) + kw * H.sondeMeterProKw * H.sondeChfProMeter + H.sondePauschale
            : hzStufe(H.luftWasser, kw) + (wp === 'luft-innen' ? H.zuschlagInnen : 0);
          if (heizkoerper) preis += H.zuschlagHeizkoerper;
          if (tank) preis += H.oeltank;
          von = calcRunden(preis * (1 - H.spanne), H.rundenAuf);
          bis = calcRunden(preis * (1 + H.spanne), H.rundenAuf);
        }
        var kwText = kw === null ? '' : kw > H.kwMax ? 'mehr als ' + H.kwMax + ' kW' : 'ca. ' + calcDez(kw) + ' kW';

        calcZeigen(calcOut(hz, 'preis'), preis !== null);
        if (preis !== null) calcText(calcOut(hz, 'preis'), calcSpanne(von, bis));
        calcZeigen(calcOut(hz, 'meldung'), preis === null);
        calcText(calcOut(hz, 'meldung'), meldung);
        calcZeigen(calcOut(hz, 'leistung'), kw !== null);
        calcText(calcOut(hz, 'leistung'), kw === null ? '' : 'Geschätzte Heizleistung: ' + kwText);
        calcZeigen(calcOut(hz, 'inkl'), preis !== null);
        calcZeigen(calcOut(hz, 'innen'), wp === 'luft-innen');
        calcZeigen(calcOut(hz, 'erdsonde'), wp === 'erdsonde');
        if (wp === 'erdsonde' && preis !== null) calcText(calcOut(hz, 'sonde-text'), 'Erdsonde mit rund ' + calcRunden(kw * H.sondeMeterProKw, 10) + ' m Bohrung, Bewilligung und Bohrplatz');
        calcZeigen(calcOut(hz, 'heizkoerper'), heizkoerper);
        calcZeigen(calcOut(hz, 'oeltank'), tank);

        /* Zusammenfassung fürs Anfrageformular, erst wenn eine Leistung berechnet ist */
        var zus = [];
        if (kw !== null) {
          zus = ['Heizungsersatz: ' + hzNamen[wp], bedarf, heizkoerper ? 'Heizkörper' : 'Bodenheizung'];
          if (tank) zus.push('Öltank entfernen');
          zus.push(kwText);
          if (preis !== null) zus.push(calcSpanne(von, bis) + ' inkl. MWST');
        }
        calcOut(hz, 'link').href = calcLink('heizung', zus.join('; '));
      });
    }
  }

  /* Schluss-Aufruf vor dem Footer: Telefonnummer in Riesenschrift und Knopf zum Formular
     (nicht auf Seiten mit Formular und nicht mit <body data-no-finale>, z. B. service.html) */
  var footer = document.querySelector('.site-footer');
  if (footer && !document.querySelector('.finale') && !document.querySelector('form[data-form]') && !body.hasAttribute('data-no-finale')) {
    var finale = document.createElement('section');
    finale.className = 'finale';
    finale.setAttribute('aria-label', 'Kontakt aufnehmen');
    finale.innerHTML =
      '<div class="container">' +
        '<p class="finale__intro">Für Offerten und Fragen. Bei Störungen rund um die Uhr.</p>' +
        '<a class="finale__phone" href="' + TEL + '"><span class="visually-hidden">Anrufen: </span>' + PHONE + '</a>' +
        '<div class="finale__row">' +
          '<a class="btn btn--solid" href="' + base + 'kontakt.html#formular"><span class="i i-arrow" aria-hidden="true"></span>Anfrage starten</a>' +
        '</div>' +
      '</div>';
    footer.parentNode.insertBefore(finale, footer);
  }

  /* Kontaktleiste am Handy: Anrufen und Anfrage. Sichtbar, sobald keine anderen Kontaktknöpfe im Bild sind;
     ausgeblendet über den Knöpfen im Seitenkopf, Formular, Rechner, Schluss-Aufruf und Footer (CSS: .actionbar-hide) */
  if (!document.querySelector('.actionbar')) {
    var bar = document.createElement('nav');
    bar.className = 'actionbar';
    bar.setAttribute('aria-label', 'Schnellkontakt');
    bar.innerHTML =
      '<a class="actionbar__call" href="' + TEL + '"><span class="i i-phone" aria-hidden="true"></span>Anrufen</a>' +
      '<a class="actionbar__ask" href="' + base + 'kontakt.html#formular">Anfrage starten</a>';
    if ('IntersectionObserver' in window) {
      /* Auch weg, solange die Knöpfe im Seitenkopf im Bild sind: Sie bieten dasselbe, und die Leiste würde
         sie am Handy sonst halb verdecken. Der Anfangszustand wird vor dem Einfügen gesetzt, damit die
         Leiste beim Laden nicht sichtbar wegrutscht. */
      var hideFor = Array.prototype.slice.call(document.querySelectorAll('.hero__panel .btn-stack, .hero-work__actions, form[data-form], #rechner, .site-footer, .finale'));
      var vh0 = window.innerHeight;
      var visibleSet = new Set(hideFor.filter(function (el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < vh0; }));
      body.classList.toggle('actionbar-hide', visibleSet.size > 0);
      var hio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) visibleSet.add(en.target); else visibleSet.delete(en.target); });
        body.classList.toggle('actionbar-hide', visibleSet.size > 0);
      }, { threshold: 0.05 });
      hideFor.forEach(function (el) { hio.observe(el); });
    }
    body.appendChild(bar);
  }

  /* Einblenden beim Scrollen: nur Titel, Karten und Bilder */
  if (!reduce && 'IntersectionObserver' in window) {
    var revealSel = ['.section-head', '.gallery__item', '.showcase__item', '.value', '.team__text', '.feature > div:not(.feature__media)'];
    var imgSel = ['.feature__media', '.split__media', '.band__media', '.team__media'];
    var vh = window.innerHeight, targets = [];
    function stagger(el) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(sib, 5) * 0.08 + 's');
    }
    document.querySelectorAll(revealSel.join(',')).forEach(function (el) {
      if (el.closest('.hero') || el.closest('.hero-work') || el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add('rv'); stagger(el); targets.push(el);
    });
    document.querySelectorAll(imgSel.join(',')).forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add('rv-img'); targets.push(el);
    });
    function done(el) {
      var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
      window.setTimeout(function () {
        el.classList.remove('rv', 'rv-img', 'is-in');
        el.style.removeProperty('--d');
      }, (d + 1.5) * 1000);
    }
    window.addEventListener('beforeprint', function () { targets.forEach(function (el) { el.classList.add('is-in'); }); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        done(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Startseite, Angebotsliste: das Foto rechts zeigt die Zeile unter der Maus oder mit dem
     Tastaturfokus. Es bleibt stehen, wenn die Maus die Liste verlässt (kein Zurückspringen).
     Ohne JavaScript zeigt es das Foto der ersten Zeile (class="offer is-active" im HTML). */
  var offerLists = document.querySelectorAll('[data-offers]');
  if (offerLists.length) {
    /* Wer mit der Tastatur arbeitet, behält das Foto der fokussierten Zeile, auch wenn beim
       Scrollen eine andere Zeile unter den ruhenden Mauszeiger rutscht */
    var viaKeyboard = false;
    document.addEventListener('keydown', function (e) { if (e.key === 'Tab') viaKeyboard = true; });
    document.addEventListener('mousemove', function (e) { if (e.movementX || e.movementY) viaKeyboard = false; });
    offerLists.forEach(function (list) {
      var offers = Array.prototype.slice.call(list.querySelectorAll('.offer'));
      function activate(item) {
        offers.forEach(function (it) { it.classList.toggle('is-active', it === item); });
      }
      offers.forEach(function (it) {
        it.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !viaKeyboard) activate(it); });
        it.addEventListener('focusin', function () { activate(it); });
      });
    });
  }

  /* Jahr im Footer */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ==========================================================================
     Korrekturen nach Prüfung (27.11.2026)
     Hilfsfunktionen für Formular, Anfrage-Assistent und Grossansicht. Die Stellen, die sie benutzen,
     sind weiter oben mit «Korrekturen nach Prüfung» und der Nummer aus der Auftragsliste (P2, P5) markiert.
     Als Funktionsdeklarationen gelten sie im ganzen Skript, auch wenn sie erst hier stehen.
     ========================================================================== */

  /* aria-describedby um eine id ergänzen (add) oder sie daraus entfernen; andere ids bleiben erhalten */
  function describedBy(el, id, add) {
    var ids = (el.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x !== id; });
    if (add) ids.push(id);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
  }
  /* Feld bzw. Kachelgruppe als fehlerhaft markieren oder die Markierung entfernen: Klasse is-invalid
     (macht den Fehlertext sichtbar und die Kacheln rot), aria-invalid an jedem Eingabefeld und die
     Verknüpfung mit dem Fehlertext, aber nur solange er sichtbar ist (WCAG 1.3.1, 3.3.1) */
  function markField(inputs, field, invalid) {
    var err = field && field.querySelector('.error');
    if (field) field.classList.toggle('is-invalid', invalid);
    inputs.forEach(function (el) {
      if (invalid) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      if (err && err.id) describedBy(el, err.id, invalid);
    });
  }
  /* Alle Kacheln einer Gruppe (Radio-Knöpfe mit demselben Namen), sonst nur das Feld selber */
  function groupOf(el, scope) {
    if (el.type !== 'radio') return [el];
    return Array.prototype.slice.call((scope || el.form || document).querySelectorAll('input[type="radio"][name="' + el.name + '"]'));
  }
  /* Erstes fehlerhaftes Feld zeigen: Fokus aufs Feld (Screenreader hören Name und Fehlertext), dann
     Feld und Meldung in den sichtbaren Bereich scrollen, auch bei 320 px. Bei Kacheln steht die Meldung
     direkt unter der Frage, darum kommt die Frage nach oben. */
  function showError(f) {
    if (!f) return;
    f.el.focus({ preventScroll: true });
    var how = { behavior: reduce ? 'auto' : 'smooth' };
    var legend = f.el.type === 'radio' && f.field ? f.field.querySelector('legend') : null;
    if (!legend) { how.block = 'nearest'; (f.field || f.el).scrollIntoView(how); return; }   /* scrollt nur, wenn nötig */
    /* Kacheln: nur scrollen, wenn Frage oder Meldung nicht ganz zu sehen sind (unter dem klebenden Kopf) */
    var err = f.field.querySelector('.error') || legend;
    var top = header ? header.getBoundingClientRect().bottom : 0;
    if (legend.getBoundingClientRect().top < top + 8 || err.getBoundingClientRect().bottom > window.innerHeight - 8) {
      how.block = 'start'; legend.scrollIntoView(how);
    }
  }
  /* Text der Fehlermeldung eines Felds, für die Live-Meldung */
  function errorText(f) {
    var err = f && f.field && f.field.querySelector('.error');
    return err ? err.textContent : 'Bitte füllen Sie die markierten Felder aus.';
  }
  /* Nachrichtenfeld an den Inhalt anpassen (z. B. Angaben aus dem Kostenrechner), in Browsern ohne
     field-sizing: content. Erst wenn der Schritt sichtbar ist, vorher lässt sich das Feld nicht messen. */
  function fitTextareas(scope) {
    scope.querySelectorAll('textarea').forEach(function (ta) {
      if (ta.value && ta.scrollHeight > ta.clientHeight) ta.style.height = (ta.scrollHeight + ta.offsetHeight - ta.clientHeight) + 'px';
    });
  }
  /* Grossansicht: aus dem AVIF-srcset eines Galeriefotos die grösste Datei bis max Pixel Breite
     (-1200 bzw. das kleinere Original, am Handy -900); ohne passende Datei die kleinste */
  function avifUpTo(item, max) {
    var src = item.querySelector('source[type="image/avif"]'), best = null, smallest = null;
    if (!src) return '';
    src.getAttribute('srcset').split(',').forEach(function (part) {
      var bits = part.trim().split(/\s+/), w = parseInt(bits[1], 10) || 0;
      if (w <= max && (!best || w > best.w)) best = { url: bits[0], w: w };
      if (!smallest || w < smallest.w) smallest = { url: bits[0], w: w };
    });
    return (best || smallest).url;
  }

  doc.classList.add('js');
})();
